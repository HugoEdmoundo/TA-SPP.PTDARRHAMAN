"""
CLI Seed Command — Membuat akun admin/wali perdana secara aman.

Usage:
    python -m app.seed_admin                          # Seed admin default
    python -m app.seed_admin --username admin --password securepass123
    python -m app.seed_admin --role wali --username wali_test --password wali123

Jalankan sekali saat pertama kali deploy ke Supabase/PostgreSQL.
"""

import argparse
import sys
from sqlmodel import Session, select
from app.database import engine
from app.models import User
from app.utils.auth import get_password_hash


def seed_user(username: str, password: str, full_name: str, role: str):
    """Membuat user baru jika belum ada."""
    with Session(engine) as session:
        existing = session.exec(select(User).where(User.username == username)).first()
        if existing:
            print(f"[SKIP] User '{username}' sudah ada (ID: {existing.id}, role: {existing.role}).")
            return

        user = User(
            username=username,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            role=role,
            is_active=True,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"[OK] User '{username}' berhasil dibuat (ID: {user.id}, role: {role}).")


def main():
    parser = argparse.ArgumentParser(description="Seed akun admin/wali pertama ke database.")
    parser.add_argument("--username", default="admin", help="Username (default: admin)")
    parser.add_argument("--password", default="admin123", help="Password (default: admin123)")
    parser.add_argument("--full-name", default="Administrator PTDARRAHMAN", help="Nama lengkap")
    parser.add_argument("--role", default="admin", choices=["admin", "wali"], help="Role user")
    args = parser.parse_args()

    if args.password == "admin123":
        print("[WARN] Anda menggunakan password default 'admin123'. Ganti segera di production!")

    seed_user(args.username, args.password, args.full_name, args.role)


if __name__ == "__main__":
    main()
