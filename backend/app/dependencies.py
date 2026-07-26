from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from app.database import get_session
from app.models import User
from app.utils.auth import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    """Mengambil user yang sedang login berdasarkan JWT Access Token."""
    payload = decode_token(token, expected_type="access")
    username: str = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kredensial tidak valid: sub tidak ditemukan di token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User tidak ditemukan di sistem.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun user telah dinonaktifkan.",
        )
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency: Hanya mengizinkan role 'admin'."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Fitur ini hanya untuk Administrator.",
        )
    return current_user


def require_wali(current_user: User = Depends(get_current_user)) -> User:
    """Dependency: Mengizinkan role 'wali' atau 'admin'."""
    if current_user.role not in ["wali", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Fitur ini hanya untuk Wali Siswa atau Administrator.",
        )
    return current_user
