import io
import csv
from datetime import datetime
from typing import List, Optional, Dict, Any
import openpyxl
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlmodel import Session, select
from sqlalchemy import or_

from app.database import get_session
from app.models import Student, User, ParentStudent, AuditLog
from app.schemas.students import (
    StudentCreate,
    StudentUpdate,
    StudentRead,
    ParentRead,
    StudentImportRow,
    StudentImportPreviewResponse,
    StudentImportConfirmRequest,
    ParentLinkRequest,
)
from app.utils.upload import save_upload
from app.dependencies import require_admin, require_wali, get_current_user

router = APIRouter()


# ─── Wali Siswa Endpoints ────────────────────────────────────
# NOTE: diletakkan di atas sebelum rute berparameter /{id} agar tidak tercapture sebagai id "my"

@router.get("/my/children", response_model=List[StudentRead])
def get_my_children(
    current_user: User = Depends(require_wali),
    session: Session = Depends(get_session),
):
    """Wali siswa melihat daftar anak (siswa) yang terhubung dengan akunnya."""
    session.refresh(current_user)
    return current_user.students


# ─── Admin Student CRUD ──────────────────────────────────────

@router.get("/", response_model=List[StudentRead])
def list_students(
    is_active: Optional[bool] = Query(None, description="Filter status aktif"),
    search: Optional[str] = Query(None, description="Cari nama atau NIS"),
    academic_year: Optional[str] = Query(None, description="Filter tahun ajaran"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Menampilkan daftar siswa dengan filter, pencarian, dan paginasi (Admin only)."""
    query = select(Student).order_by(Student.id.desc())
    
    if is_active is not None:
        query = query.where(Student.is_active == is_active)
    if academic_year:
        query = query.where(Student.academic_year == academic_year)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Student.nis.ilike(search_pattern),
                Student.full_name.ilike(search_pattern),
            )
        )
        
    query = query.offset(skip).limit(limit)
    students = session.exec(query).all()
    return students


@router.post("/", response_model=StudentRead, status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Menambahkan data siswa baru."""
    existing = session.exec(select(Student).where(Student.nis == payload.nis)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"NIS '{payload.nis}' sudah terdaftar.",
        )
        
    student = Student.model_validate(payload)
    session.add(student)
    session.commit()
    session.refresh(student)

    # Audit Log
    audit = AuditLog(
        user_id=admin.id,
        action="CREATE_STUDENT",
        entity_type="student",
        entity_id=student.id,
        detail=f"Admin menambahkan siswa NIS {student.nis} - '{student.full_name}'.",
    )
    session.add(audit)
    session.commit()

    return student


# ─── Import Siswa (CSV / Excel) ──────────────────────────────

@router.post("/import/preview", response_model=StudentImportPreviewResponse)
async def preview_import_students(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Membaca file CSV/Excel siswa, melakukan validasi NIS duplikat & format, lalu mengembalikan preview."""
    filename = file.filename or ""
    content = await file.read()
    
    rows_data: List[Dict[str, Any]] = []
    
    if filename.endswith(".csv"):
        text_stream = io.StringIO(content.decode("utf-8-sig", errors="ignore"))
        reader = csv.DictReader(text_stream)
        for row in reader:
            # normalize keys
            clean_row = {k.strip().lower(): (v.strip() if v else None) for k, v in row.items() if k}
            rows_data.append(clean_row)
    elif filename.endswith(".xlsx") or filename.endswith(".xls"):
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        sheet = wb.active
        headers = [str(cell.value).strip().lower() if cell.value else f"col_{i}" for i, cell in enumerate(sheet[1])]
        for row in sheet.iter_rows(min_row=2, values_only=True):
            if not any(row):
                continue
            row_dict = {}
            for i, val in enumerate(row):
                if i < len(headers):
                    row_dict[headers[i]] = str(val).strip() if val is not None else None
            rows_data.append(row_dict)
    else:
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Gunakan .csv, .xls, atau .xlsx.")

    # Fetch existing NIS from DB
    existing_nis_set = {s for s in session.exec(select(Student.nis)).all()}
    seen_in_file_nis = set()

    preview_rows: List[StudentImportRow] = []
    valid_count = 0
    error_count = 0

    for idx, row in enumerate(rows_data, start=2):
        nis = row.get("nis") or row.get("no_induk") or ""
        full_name = row.get("full_name") or row.get("nama") or row.get("nama_lengkap") or ""
        gender = row.get("gender") or row.get("jk") or row.get("jenis_kelamin")
        birth_place = row.get("birth_place") or row.get("tempat_lahir")
        birth_date = row.get("birth_date") or row.get("tanggal_lahir")
        address = row.get("address") or row.get("alamat")
        phone = row.get("phone") or row.get("no_hp") or row.get("telp")
        academic_year = row.get("academic_year") or row.get("tahun_masuk") or row.get("tahun_ajaran")

        errors = []
        if not nis:
            errors.append("NIS tidak boleh kosong.")
        else:
            if nis in existing_nis_set:
                errors.append(f"NIS '{nis}' sudah terdaftar di database.")
            elif nis in seen_in_file_nis:
                errors.append(f"NIS '{nis}' duplikat dalam file impor.")
            else:
                seen_in_file_nis.add(nis)

        if not full_name:
            errors.append("Nama lengkap tidak boleh kosong.")

        is_valid = len(errors) == 0
        if is_valid:
            valid_count += 1
        else:
            error_count += 1

        preview_rows.append(
            StudentImportRow(
                row_index=idx,
                nis=nis,
                full_name=full_name,
                gender=gender,
                birth_place=birth_place,
                birth_date=str(birth_date) if birth_date else None,
                address=address,
                phone=phone,
                academic_year=academic_year,
                is_valid=is_valid,
                errors=errors,
            )
        )

    return StudentImportPreviewResponse(
        total_rows=len(preview_rows),
        valid_rows=valid_count,
        error_rows=error_count,
        data=preview_rows,
    )


@router.post("/import/confirm", response_model=Dict[str, Any])
def confirm_import_students(
    payload: StudentImportConfirmRequest,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Menyimpan data siswa yang valid hasil konfirmasi preview impor ke database."""
    imported_count = 0
    errors = []

    for item in payload.data:
        existing = session.exec(select(Student).where(Student.nis == item.nis)).first()
        if existing:
            errors.append(f"NIS {item.nis} dilewati karena sudah terdaftar.")
            continue

        student = Student.model_validate(item)
        session.add(student)
        imported_count += 1

    session.commit()

    # Audit Log
    if imported_count > 0:
        audit = AuditLog(
            user_id=admin.id,
            action="IMPORT_STUDENTS",
            entity_type="student",
            entity_id=None,
            detail=f"Admin mengimpor {imported_count} siswa secara masal.",
        )
        session.add(audit)
        session.commit()

    return {
        "status": "ok",
        "imported_count": imported_count,
        "errors": errors,
        "message": f"Berhasil mengimpor {imported_count} siswa baru.",
    }


# ─── Student Detail & Update ─────────────────────────────────

@router.get("/{id}", response_model=StudentRead)
def get_student_detail(
    id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Melihat detail informasi siswa beserta data wali yang terhubung."""
    student = session.get(Student, id)
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")
    return student


@router.put("/{id}", response_model=StudentRead)
def update_student(
    id: int,
    payload: StudentUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Memperbarui data informasi siswa."""
    student = session.get(Student, id)
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")

    if payload.nis and payload.nis != student.nis:
        existing = session.exec(select(Student).where(Student.nis == payload.nis)).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"NIS '{payload.nis}' sudah digunakan siswa lain.")

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(student, key, val)
    student.updated_at = datetime.utcnow()

    session.add(student)
    session.commit()
    session.refresh(student)

    # Audit Log
    audit = AuditLog(
        user_id=admin.id,
        action="UPDATE_STUDENT",
        entity_type="student",
        entity_id=student.id,
        detail=f"Admin memperbarui data siswa NIS {student.nis}.",
    )
    session.add(audit)
    session.commit()

    return student


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_student(
    id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Menonaktifkan siswa (soft delete / is_active=False)."""
    student = session.get(Student, id)
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")

    student.is_active = False
    student.updated_at = datetime.utcnow()
    session.add(student)
    session.commit()

    # Audit Log
    audit = AuditLog(
        user_id=admin.id,
        action="DEACTIVATE_STUDENT",
        entity_type="student",
        entity_id=student.id,
        detail=f"Admin menonaktifkan siswa NIS {student.nis}.",
    )
    session.add(audit)
    session.commit()

    return {"status": "ok", "message": f"Siswa NIS '{student.nis}' berhasil dinonaktifkan."}


@router.post("/{id}/photo", response_model=Dict[str, str])
def upload_student_photo(
    id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Upload foto siswa."""
    student = session.get(Student, id)
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")

    photo_url = save_upload(file, subfolder="students")
    student.photo_url = photo_url
    student.updated_at = datetime.utcnow()
    session.add(student)
    session.commit()

    return {"photo_url": photo_url, "message": "Foto siswa berhasil disimpan."}


# ─── Parent - Student Linking (B-10) ─────────────────────────

@router.post("/{id}/parents", status_code=status.HTTP_201_CREATED)
def link_parent_to_student(
    id: int,
    payload: ParentLinkRequest,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Menghubungkan akun wali siswa dengan siswa tertentu."""
    student = session.get(Student, id)
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")

    parent = session.get(User, payload.parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Akun parent/wali tidak ditemukan.")

    existing_link = session.exec(
        select(ParentStudent).where(
            ParentStudent.student_id == id,
            ParentStudent.parent_id == payload.parent_id,
        )
    ).first()

    if existing_link:
        raise HTTPException(status_code=400, detail="Akun wali tersebut sudah terhubung dengan siswa ini.")

    link = ParentStudent(student_id=id, parent_id=payload.parent_id)
    session.add(link)
    session.commit()

    # Audit Log
    audit = AuditLog(
        user_id=admin.id,
        action="LINK_PARENT_STUDENT",
        entity_type="student",
        entity_id=student.id,
        detail=f"Admin menghubungkan wali '{parent.username}' ke siswa NIS {student.nis}.",
    )
    session.add(audit)
    session.commit()

    return {"status": "ok", "message": f"Wali '{parent.full_name}' berhasil dihubungkan ke siswa '{student.full_name}'."}


@router.delete("/{id}/parents/{parent_id}", status_code=status.HTTP_200_OK)
def unlink_parent_from_student(
    id: int,
    parent_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Memutuskan hubungan akun wali dari siswa tertentu."""
    link = session.exec(
        select(ParentStudent).where(
            ParentStudent.student_id == id,
            ParentStudent.parent_id == parent_id,
        )
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Hubungan wali dan siswa tidak ditemukan.")

    session.delete(link)
    session.commit()

    # Audit Log
    audit = AuditLog(
        user_id=admin.id,
        action="UNLINK_PARENT_STUDENT",
        entity_type="student",
        entity_id=id,
        detail=f"Admin memutuskan hubungan wali ID {parent_id} dari siswa ID {id}.",
    )
    session.add(audit)
    session.commit()

    return {"status": "ok", "message": "Hubungan wali dan siswa berhasil diputuskan."}


@router.get("/{id}/parents", response_model=List[ParentRead])
def list_student_parents(
    id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Melihat daftar akun wali yang terhubung dengan siswa ini."""
    student = session.get(Student, id)
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")
    return student.parents
