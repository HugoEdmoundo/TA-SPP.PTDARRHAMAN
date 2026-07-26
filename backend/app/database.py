from sqlmodel import create_engine, Session, SQLModel
from app.config import get_settings
import subprocess
import sys

settings = get_settings()

connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args,
)


def init_db():
    """
    Inisialisasi database saat startup.
    - PostgreSQL (production): jalankan Alembic migrations (`alembic upgrade head`).
    - SQLite (local dev): fallback ke create_all() untuk kemudahan development.
    """
    import app.models  # noqa: F401 — register semua model ke metadata

    if settings.database_url.startswith("sqlite"):
        # Local development: create_all() agar tidak perlu manual migrate
        SQLModel.metadata.create_all(engine)
    else:
        # Production (PostgreSQL/Supabase): andalkan Alembic migrations
        try:
            subprocess.run(
                [sys.executable, "-m", "alembic", "upgrade", "head"],
                check=True,
                capture_output=True,
                text=True,
            )
        except Exception as e:
            # Fallback jika alembic gagal (e.g., serverless environment)
            print(f"[WARN] Alembic migration gagal, fallback ke create_all(): {e}", file=sys.stderr)
            SQLModel.metadata.create_all(engine)


def get_session():
    """FastAPI dependency — yields a DB session per request."""
    with Session(engine) as session:
        yield session

