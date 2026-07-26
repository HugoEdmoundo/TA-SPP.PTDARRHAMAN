from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.database import get_session
from app.models import User, AuditLog
from app.schemas.auth import Token, LoginRequest, RefreshTokenRequest
from app.utils.auth import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.dependencies import get_current_user

router = APIRouter()


def _authenticate_user(session: Session, username: str, password_str: str) -> User:
    """Helper internal untuk mencocokkan user dan password."""
    user = session.exec(select(User).where(User.username == username)).first()

    if not user or not verify_password(password_str, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun ini telah dinonaktifkan.",
        )
    return user


def _generate_token_response(user: User) -> Token:
    """Helper untuk membentuk response token JWT."""
    token_data = {"sub": user.username, "role": user.role, "user_id": user.id}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        role=user.role,
        username=user.username,
        full_name=user.full_name,
        user_id=user.id if user.id else 0,
    )


@router.post("/login", response_model=Token)
def login_json(
    payload: LoginRequest, session: Session = Depends(get_session)
):
    """Login dengan JSON body (username & password) untuk aplikasi frontend React/Vite."""
    user = _authenticate_user(session, payload.username, payload.password)
    
    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="LOGIN",
        entity_type="user",
        entity_id=user.id,
        detail=f"User {user.username} login via JSON.",
    )
    session.add(audit)
    session.commit()
    
    return _generate_token_response(user)


@router.post("/token", response_model=Token)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)
):
    """Login dengan OAuth2 form-urlencoded (untuk Swagger UI Authorize button)."""
    user = _authenticate_user(session, form_data.username, form_data.password)
    return _generate_token_response(user)


@router.post("/refresh", response_model=Dict[str, str])
def refresh_token(
    payload: RefreshTokenRequest, session: Session = Depends(get_session)
):
    """Memperbarui access token menggunakan refresh token yang masih aktif."""
    decoded = decode_token(payload.refresh_token, expected_type="refresh")
    username: str = decoded.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token tidak valid.")
    
    user = session.exec(select(User).where(User.username == username)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User tidak ditemukan atau tidak aktif.")
    
    token_data = {"sub": user.username, "role": user.role, "user_id": user.id}
    new_access = create_access_token(data=token_data)
    return {"access_token": new_access, "token_type": "bearer"}


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Logout user dari sesi aktif dan mencatat audit log."""
    audit = AuditLog(
        user_id=current_user.id,
        action="LOGOUT",
        entity_type="user",
        entity_id=current_user.id,
        detail=f"User {current_user.username} logout.",
    )
    session.add(audit)
    session.commit()
    return {"status": "ok", "message": "Logout berhasil."}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Mendapatkan profil user yang sedang login."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
    }
