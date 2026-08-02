from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from app.database import get_session
from app.models import User, Role
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


def is_admin_role(role) -> bool:
    """Cek apakah sebuah role termasuk admin/superadmin."""
    return (role or "").lower() in [Role.admin.value, Role.superadmin.value]


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency: Mengizinkan role 'admin' atau 'superadmin'."""
    return require_roles(Role.admin, Role.superadmin)(current_user)


def require_wali(current_user: User = Depends(get_current_user)) -> User:
    """Dependency: Mengizinkan role 'wali', 'admin', atau 'superadmin'."""
    return require_roles(Role.wali, Role.admin, Role.superadmin)(current_user)


def require_roles(*allowed_roles: Role):
    """Dependency factory: Mengizinkan user dengan salah satu dari allowed_roles."""
    allowed = {r.value for r in allowed_roles}

    def checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = (current_user.role or "").lower()
        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akses ditolak: Role Anda tidak memiliki izin untuk fitur ini.",
            )
        return current_user

    return checker
