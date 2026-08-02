from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from sqlalchemy import or_

from app.database import get_session
from app.models import User, Role, AuditLog
from app.schemas.users import UserCreate, UserUpdate, UserRead, UserResetPassword
from app.utils.auth import get_password_hash
from app.dependencies import require_admin

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/", response_model=List[UserRead])
def list_users(
    role: Optional[str] = Query(None, description="Filter berdasarkan role (admin/wali)"),
    search: Optional[str] = Query(None, description="Cari berdasarkan username atau nama lengkap"),
    session: Session = Depends(get_session),
):
    """Menampilkan daftar pengguna (admin & wali) dengan filter dan pencarian."""
    query = select(User).order_by(User.id.desc())
    
    if role:
        query = query.where(User.role == role)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                User.username.ilike(search_pattern),
                User.full_name.ilike(search_pattern),
            )
        )
    
    return session.exec(query).all()


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Admin membuat akun baru (wali siswa atau admin lain)."""
    # Check duplicate username
    existing = session.exec(select(User).where(User.username == payload.username)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{payload.username}' sudah digunakan.",
        )

    user_data = payload.model_dump(exclude={"password"})
    user_data["hashed_password"] = get_password_hash(payload.password)
    
    user = User(**user_data)
    session.add(user)
    session.commit()
    session.refresh(user)

    # Audit Log
    audit = AuditLog(
        user_id=admin.id,
        action="CREATE_USER",
        entity_type="user",
        entity_id=user.id,
        detail=f"Admin membuat akun {user.role} '{user.username}'.",
    )
    session.add(audit)
    session.commit()

    return user


@router.put("/{id}", response_model=UserRead)
def update_user(
    id: int,
    payload: UserUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Admin memperbarui profil atau status aktif pengguna."""
    user = session.get(User, id)
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")
    
    if user.id == admin.id:
        if payload.is_active is False:
            raise HTTPException(status_code=400, detail="Admin tidak dapat menonaktifkan akun sendiri.")
        if payload.role and payload.role not in [r.value for r in Role]:
            raise HTTPException(status_code=400, detail="Role tidak valid.")

    if payload.username is not None:
        new_username = payload.username.strip().lower()
        if not new_username:
            raise HTTPException(status_code=400, detail="Username tidak boleh kosong.")
        existing = session.exec(
            select(User).where(User.username == new_username, User.id != id)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Username '{new_username}' sudah digunakan.")
        payload.username = new_username

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(user, key, val)
    user.updated_at = datetime.utcnow()

    session.add(user)
    session.commit()
    session.refresh(user)

    # Audit Log
    audit = AuditLog(
        user_id=admin.id,
        action="UPDATE_USER",
        entity_type="user",
        entity_id=user.id,
        detail=f"Admin memperbarui data user '{user.username}'.",
    )
    session.add(audit)
    session.commit()

    return user


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_user(
    id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Admin menonaktifkan pengguna (soft delete / is_active=False)."""
    user = session.get(User, id)
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")
    
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Admin tidak dapat menonaktifkan akun sendiri.")

    user.is_active = False
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()

    # Audit Log
    audit = AuditLog(
        user_id=admin.id,
        action="DEACTIVATE_USER",
        entity_type="user",
        entity_id=user.id,
        detail=f"Admin menonaktifkan user '{user.username}'.",
    )
    session.add(audit)
    session.commit()

    return {"status": "ok", "message": f"Pengguna '{user.username}' berhasil dinonaktifkan."}


@router.post("/{id}/reset-password", status_code=status.HTTP_200_OK)
def reset_user_password(
    id: int,
    payload: UserResetPassword,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Admin mereset password pengguna lain."""
    user = session.get(User, id)
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")
    
    user.hashed_password = get_password_hash(payload.new_password)
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()

    # Audit Log
    audit = AuditLog(
        user_id=admin.id,
        action="RESET_PASSWORD",
        entity_type="user",
        entity_id=user.id,
        detail=f"Admin mereset password user '{user.username}'.",
    )
    session.add(audit)
    session.commit()

    return {"status": "ok", "message": f"Password untuk '{user.username}' berhasil direset."}
