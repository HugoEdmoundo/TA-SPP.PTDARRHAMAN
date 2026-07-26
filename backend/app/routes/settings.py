import os
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlmodel import Session, select

from app.database import get_session
from app.models import SchoolSetting, BankAccount, SppSetting, User, AcademicYear, BillCategory
from app.schemas.settings import (
    SchoolSettingItem,
    SchoolSettingUpdate,
    BankAccountCreate,
    BankAccountUpdate,
    BankAccountRead,
    SppSettingCreate,
    SppSettingUpdate,
    SppSettingRead,
    AcademicYearCreate,
    AcademicYearUpdate,
    AcademicYearRead,
    BillCategoryCreate,
    BillCategoryUpdate,
    BillCategoryRead,
)
from app.utils.upload import save_upload
from app.dependencies import require_admin
from app.routes.sse import manager

router = APIRouter()

DEFAULT_LOGO_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads", "default-logo.png")


@router.get("/settings/logo/default")
def get_default_logo():
    """Serve default school logo as PNG."""
    import io
    from fastapi.responses import Response

    if os.path.exists(DEFAULT_LOGO_PATH):
        with open(DEFAULT_LOGO_PATH, "rb") as f:
            return Response(content=f.read(), media_type="image/png")

    # Generate a simple placeholder logo using Pillow
    try:
        from PIL import Image, ImageDraw, ImageFont
        img = Image.new("RGBA", (200, 200), (26, 107, 71, 255))
        draw = ImageDraw.Draw(img)
        draw.ellipse([20, 20, 180, 180], fill=(255, 255, 255, 255))
        draw.ellipse([40, 40, 160, 160], fill=(26, 107, 71, 255))
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
        except Exception:
            font = ImageFont.load_default()
        draw.text((100, 100), "PT", fill=(255, 255, 255, 255), anchor="mm", font=font)

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return Response(content=buf.read(), media_type="image/png")
    except Exception:
        return Response(content=b"", media_type="image/png", status_code=404)


DEFAULT_SCHOOL_SETTINGS = {
    "school_name": "SMA Islam Darrahman",
    "school_address": "Jl. Raya Darrahman No. 1, Jakarta",
    "school_phone": "081234567890",
    "school_logo": "",
    "receipt_format": "KWT/{YEAR}/{MONTH}/{ID}",
}


# ─── Academic Years Endpoints ────────────────────────────────

@router.get("/academic-years", response_model=List[AcademicYearRead])
@router.get("/settings/academic-years", response_model=List[AcademicYearRead])
def list_academic_years(session: Session = Depends(get_session)):
    """Menampilkan daftar tahun ajaran."""
    return session.exec(select(AcademicYear).order_by(AcademicYear.name.desc())).all()


@router.post("/academic-years", response_model=AcademicYearRead, status_code=status.HTTP_201_CREATED)
@router.post("/settings/academic-years", response_model=AcademicYearRead, status_code=status.HTTP_201_CREATED)
def create_academic_year(
    payload: AcademicYearCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Membuat tahun ajaran baru."""
    existing = session.exec(select(AcademicYear).where(AcademicYear.name == payload.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tahun ajaran dengan nama tersebut sudah ada.")
    ay = AcademicYear.model_validate(payload)
    session.add(ay)
    session.commit()
    session.refresh(ay)
    return ay


@router.put("/academic-years/{id}", response_model=AcademicYearRead)
@router.put("/settings/academic-years/{id}", response_model=AcademicYearRead)
def update_academic_year(
    id: int,
    payload: AcademicYearUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Memperbarui status atau data tahun ajaran."""
    ay = session.get(AcademicYear, id)
    if not ay:
        raise HTTPException(status_code=404, detail="Tahun ajaran tidak ditemukan.")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ay, key, value)
    
    session.add(ay)
    session.commit()
    session.refresh(ay)
    return ay


@router.delete("/academic-years/{id}", status_code=status.HTTP_200_OK)
@router.delete("/settings/academic-years/{id}", status_code=status.HTTP_200_OK)
def delete_academic_year(
    id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Menghapus atau nonaktifkan tahun ajaran."""
    ay = session.get(AcademicYear, id)
    if not ay:
        raise HTTPException(status_code=404, detail="Tahun ajaran tidak ditemukan.")
    ay.is_active = False
    session.add(ay)
    session.commit()
    return {"status": "ok", "message": "Tahun ajaran berhasil dinonaktifkan."}


# ─── Bill Categories Endpoints ───────────────────────────────

@router.get("/bill-categories", response_model=List[BillCategoryRead])
@router.get("/settings/bill-categories", response_model=List[BillCategoryRead])
def list_bill_categories(session: Session = Depends(get_session)):
    """Menampilkan daftar kategori tagihan."""
    return session.exec(select(BillCategory).order_by(BillCategory.name.asc())).all()


@router.post("/bill-categories", response_model=BillCategoryRead, status_code=status.HTTP_201_CREATED)
@router.post("/settings/bill-categories", response_model=BillCategoryRead, status_code=status.HTTP_201_CREATED)
def create_bill_category(
    payload: BillCategoryCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Membuat kategori tagihan baru."""
    existing = session.exec(select(BillCategory).where(BillCategory.code == payload.code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kategori tagihan dengan kode tersebut sudah ada.")
    bc = BillCategory.model_validate(payload)
    session.add(bc)
    session.commit()
    session.refresh(bc)
    return bc


@router.put("/bill-categories/{id}", response_model=BillCategoryRead)
@router.put("/settings/bill-categories/{id}", response_model=BillCategoryRead)
def update_bill_category(
    id: int,
    payload: BillCategoryUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Memperbarui kategori tagihan."""
    bc = session.get(BillCategory, id)
    if not bc:
        raise HTTPException(status_code=404, detail="Kategori tagihan tidak ditemukan.")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(bc, key, value)
    bc.updated_at = datetime.utcnow()
    
    session.add(bc)
    session.commit()
    session.refresh(bc)
    return bc


@router.delete("/bill-categories/{id}", status_code=status.HTTP_200_OK)
@router.delete("/settings/bill-categories/{id}", status_code=status.HTTP_200_OK)
def delete_bill_category(
    id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Menghapus atau nonaktifkan kategori tagihan."""
    bc = session.get(BillCategory, id)
    if not bc:
        raise HTTPException(status_code=404, detail="Kategori tagihan tidak ditemukan.")
    bc.is_active = False
    bc.updated_at = datetime.utcnow()
    session.add(bc)
    session.commit()
    return {"status": "ok", "message": "Kategori tagihan berhasil dinonaktifkan."}


# ─── School Settings Endpoints ───────────────────────────────

@router.get("/settings", response_model=Dict[str, str])
def get_all_settings(session: Session = Depends(get_session)):
    """Mengambil semua konfigurasi sekolah dalam bentuk key-value object."""
    settings_db = session.exec(select(SchoolSetting)).all()
    result = DEFAULT_SCHOOL_SETTINGS.copy()
    for item in settings_db:
        result[item.key] = item.value
    return result


@router.get("/settings/{key}", response_model=SchoolSettingItem)
def get_setting_by_key(key: str, session: Session = Depends(get_session)):
    """Mengambil konfigurasi sekolah berdasarkan key tertentu."""
    setting = session.exec(select(SchoolSetting).where(SchoolSetting.key == key)).first()
    if not setting:
        if key in DEFAULT_SCHOOL_SETTINGS:
            return SchoolSettingItem(key=key, value=DEFAULT_SCHOOL_SETTINGS[key])
        raise HTTPException(status_code=404, detail=f"Konfigurasi dengan key '{key}' tidak ditemukan.")
    return SchoolSettingItem(key=setting.key, value=setting.value)


@router.put("/settings/logo", response_model=SchoolSettingItem)
async def update_school_logo(
    request: Request,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Flexible Logo Input (B-04): Menerima file upload (multipart/form-data) 
    ATAU direct URL string (application/json body {value: 'https://...'}).
    """
    content_type = request.headers.get("content-type", "")
    logo_url = ""

    if "multipart/form-data" in content_type:
        form = await request.form()
        file = form.get("file") or form.get("logo")
        if isinstance(file, UploadFile):
            logo_url = save_upload(file, subfolder="logo")
        elif form.get("value"):
            logo_url = str(form.get("value"))
    elif "application/json" in content_type:
        body = await request.json()
        logo_url = body.get("value", "")
        if not (logo_url.startswith("http://") or logo_url.startswith("https://") or logo_url.startswith("/uploads/")):
            raise HTTPException(status_code=400, detail="URL logo tidak valid. Harap gunakan URL http(s) atau upload file.")
    else:
        raise HTTPException(status_code=400, detail="Content-Type tidak didukung. Gunakan multipart/form-data atau application/json.")

    if not logo_url:
        raise HTTPException(status_code=400, detail="File atau URL logo tidak ditemukan dalam request.")

    setting = session.exec(select(SchoolSetting).where(SchoolSetting.key == "school_logo")).first()
    if setting:
        setting.value = logo_url
        setting.updated_at = datetime.utcnow()
    else:
        setting = SchoolSetting(key="school_logo", value=logo_url)
        session.add(setting)
    session.commit()
    session.refresh(setting)

    # Broadcast SSE Real-Time Event
    manager.broadcast_sync("settings_changed", {"type": "settings_changed", "key": "school_logo", "value": logo_url})

    return SchoolSettingItem(key="school_logo", value=logo_url)


@router.put("/settings/{key}", response_model=SchoolSettingItem)
def update_setting_by_key(
    key: str, 
    payload: SchoolSettingUpdate, 
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Memperbarui atau membuat konfigurasi sekolah berdasarkan key."""
    if key == "logo":
        raise HTTPException(status_code=400, detail="Gunakan endpoint PUT /settings/logo untuk memperbarui logo.")
        
    setting = session.exec(select(SchoolSetting).where(SchoolSetting.key == key)).first()
    if setting:
        setting.value = payload.value
        setting.updated_at = datetime.utcnow()
    else:
        setting = SchoolSetting(key=key, value=payload.value)
        session.add(setting)
    session.commit()
    session.refresh(setting)

    # Broadcast SSE Real-Time Event
    manager.broadcast_sync("settings_changed", {"type": "settings_changed", "key": key, "value": payload.value})

    return SchoolSettingItem(key=setting.key, value=setting.value)


@router.put("/settings", response_model=Dict[str, str])
def bulk_update_settings(
    payload: Dict[str, str], 
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Memperbarui beberapa konfigurasi sekolah sekaligus (bulk update)."""
    for key, val in payload.items():
        setting = session.exec(select(SchoolSetting).where(SchoolSetting.key == key)).first()
        if setting:
            setting.value = str(val)
            setting.updated_at = datetime.utcnow()
        else:
            setting = SchoolSetting(key=key, value=str(val))
            session.add(setting)
        
        # Broadcast SSE per key
        manager.broadcast_sync("settings_changed", {"type": "settings_changed", "key": key, "value": str(val)})

    session.commit()
    return get_all_settings(session)


@router.post("/settings/upload-logo", response_model=Dict[str, str])
def upload_school_logo(
    file: UploadFile = File(...), 
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Upload logo sekolah (kompatibilitas lama) dan simpan URL ke konfigurasi 'school_logo'."""
    logo_url = save_upload(file, subfolder="logo")
    setting = session.exec(select(SchoolSetting).where(SchoolSetting.key == "school_logo")).first()
    if setting:
        setting.value = logo_url
        setting.updated_at = datetime.utcnow()
    else:
        setting = SchoolSetting(key="school_logo", value=logo_url)
        session.add(setting)
    session.commit()

    # Broadcast SSE Real-Time Event
    manager.broadcast_sync("settings_changed", {"type": "settings_changed", "key": "school_logo", "value": logo_url})

    return {"logo_url": logo_url, "message": "Logo berhasil diupload dan disimpan."}


# ─── Bank Accounts Endpoints ─────────────────────────────────

@router.get("/bank-accounts", response_model=List[BankAccountRead])
def list_bank_accounts(session: Session = Depends(get_session)):
    """Menampilkan daftar rekening bank sekolah."""
    return session.exec(select(BankAccount).order_by(BankAccount.id)).all()


@router.post("/bank-accounts", response_model=BankAccountRead, status_code=status.HTTP_201_CREATED)
def create_bank_account(
    payload: BankAccountCreate, 
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Menambahkan rekening bank sekolah baru."""
    bank_acc = BankAccount.model_validate(payload)
    session.add(bank_acc)
    session.commit()
    session.refresh(bank_acc)
    return bank_acc


@router.put("/bank-accounts/{id}", response_model=BankAccountRead)
def update_bank_account(
    id: int, 
    payload: BankAccountUpdate, 
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Memperbarui data rekening bank sekolah."""
    bank_acc = session.get(BankAccount, id)
    if not bank_acc:
        raise HTTPException(status_code=404, detail="Rekening bank tidak ditemukan.")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(bank_acc, key, value)
    bank_acc.updated_at = datetime.utcnow()
    
    session.add(bank_acc)
    session.commit()
    session.refresh(bank_acc)
    return bank_acc


@router.delete("/bank-accounts/{id}", status_code=status.HTTP_200_OK)
def delete_bank_account(
    id: int, 
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Menghapus rekening bank sekolah."""
    bank_acc = session.get(BankAccount, id)
    if not bank_acc:
        raise HTTPException(status_code=404, detail="Rekening bank tidak ditemukan.")
    session.delete(bank_acc)
    session.commit()
    return {"status": "ok", "message": "Rekening bank berhasil dihapus."}


# ─── SPP Settings Endpoints ──────────────────────────────────

@router.get("/spp-settings", response_model=List[SppSettingRead])
def list_spp_settings(session: Session = Depends(get_session)):
    """Menampilkan daftar pengaturan SPP per tahun ajaran."""
    return session.exec(select(SppSetting).order_by(SppSetting.academic_year.desc())).all()


@router.post("/spp-settings", response_model=SppSettingRead, status_code=status.HTTP_201_CREATED)
def create_spp_setting(
    payload: SppSettingCreate, 
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Membuat pengaturan SPP baru untuk tahun ajaran tertentu."""
    spp_set = SppSetting.model_validate(payload)
    session.add(spp_set)
    session.commit()
    session.refresh(spp_set)
    return spp_set


@router.put("/spp-settings/{id}", response_model=SppSettingRead)
def update_spp_setting(
    id: int, 
    payload: SppSettingUpdate, 
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Memperbarui pengaturan nominal SPP atau tanggal jatuh tempo."""
    spp_set = session.get(SppSetting, id)
    if not spp_set:
        raise HTTPException(status_code=404, detail="Pengaturan SPP tidak ditemukan.")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(spp_set, key, value)
    spp_set.updated_at = datetime.utcnow()
    
    session.add(spp_set)
    session.commit()
    session.refresh(spp_set)
    return spp_set
