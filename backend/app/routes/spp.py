from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.database import get_session
from app.models import User, Student, Role
from app.dependencies import require_admin, require_wali
from app.services.ay import get_current_academic_year
from app.services.spp import get_student_spp_status, get_spp_grid

router = APIRouter()


@router.get("/status/{student_id}", response_model=List[Dict[str, Any]])
def get_spp_status(
    student_id: int,
    academic_year_id: int = Query(None, description="ID tahun ajaran. Default: tahun ajaran aktif."),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_wali),
):
    """
    Melihat status pembayaran SPP bulanan (periode 1-12) siswa pada tahun ajaran tertentu.
    Wali hanya dapat melihat status anak angkatnya sendiri; Admin dapat melihat seluruh siswa.
    """
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")

    if current_user.role == Role.wali:
        linked_ids = [s.id for s in current_user.students]
        if student_id not in linked_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akses ditolak: Siswa ini bukan anak yang terhubung dengan akun Anda.",
            )

    if not academic_year_id:
        ay = get_current_academic_year(session)
        academic_year_id = ay.id if ay else None
    if not academic_year_id:
        raise HTTPException(status_code=404, detail="Tahun ajaran belum tersedia.")

    return get_student_spp_status(session, student_id, academic_year_id)


@router.get("/grid", response_model=List[Dict[str, Any]])
def get_semester_grid(
    academic_year_id: int = Query(None, description="ID tahun ajaran. Default: tahun ajaran aktif."),
    semester: int = Query(1, ge=1, le=2, description="Semester 1 (6 bulan pertama AY) atau 2 (6 bulan terakhir AY)"),
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Menampilkan tabel matriks/grid SPP seluruh siswa untuk 1 semester pada tahun ajaran tertentu (Admin only).
    Sangat efisien untuk memantau ratusan siswa sekaligus.
    """
    if not academic_year_id:
        ay = get_current_academic_year(session)
        academic_year_id = ay.id if ay else None
    if not academic_year_id:
        raise HTTPException(status_code=404, detail="Tahun ajaran belum tersedia.")

    return get_spp_grid(session, academic_year_id, semester)
