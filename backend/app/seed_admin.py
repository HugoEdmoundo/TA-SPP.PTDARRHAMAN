"""
CLI Seed Command — Membuat akun superadmin, admin, dan wali perdana secara aman.

Usage:
    python -m app.seed_admin                          # Seed seluruh 3 akun default (superadmin, admin, wali)
    python -m app.seed_admin --role superadmin --username superadmin --password superpass123
    python -m app.seed_admin --role admin --username admin --password securepass123
    python -m app.seed_admin --role wali --username wali_test --password wali123

Jalankan sekali saat pertama kali deploy ke Supabase/PostgreSQL.
"""

import argparse
import sys
from sqlmodel import Session, select
from app.database import engine
from app.models import User, Role
from app.utils.auth import get_password_hash


def seed_user(username: str, password: str, full_name: str, role: Role):
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
        print(f"[OK] User '{username}' berhasil dibuat (ID: {user.id}, role: {role.value}).")


def seed_all_defaults():
    """Seed 3 role utama sistem PTDARRAHMAN: Superadmin, Admin, dan Wali."""
    print("=== Memulai Seeding Akun Default PTDARRAHMAN ===")
    seed_user("superadmin", "superadmin123", "Superadmin PTDARRAHMAN", Role.superadmin)
    seed_user("admin", "admin123", "Administrator PTDARRAHMAN", Role.admin)
    seed_user("wali_demo", "wali123", "H. Ahmad Syafi'i (Wali Santri)", Role.wali)
    print("=== Seeding Selesai ===")


def main():
    parser = argparse.ArgumentParser(description="Seed akun superadmin, admin, dan wali ke database.")
    parser.add_argument("--all", action="store_true", help="Seed seluruh 3 akun default sekaligus")
    parser.add_argument("--username", default=None, help="Username kustom")
    parser.add_argument("--password", default="admin123", help="Password kustom")
    parser.add_argument("--full-name", default="Administrator PTDARRAHMAN", help="Nama lengkap")
    parser.add_argument("--role", default="admin", choices=["admin", "superadmin", "SUPERADMIN", "wali", "WALI"], help="Role user")
    args = parser.parse_args()

    if args.all or args.username is None:
        seed_all_defaults()
    else:
        if args.password == "admin123":
            print("[WARN] Anda menggunakan password default 'admin123'. Ganti segera di production!")
        seed_user(args.username, args.password, args.full_name, Role(args.role.lower()))


if __name__ == "__main__":
    main()
