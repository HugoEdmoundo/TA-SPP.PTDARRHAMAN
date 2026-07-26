from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

import os
import sys
import traceback


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from app.database import init_db
        init_db()
    except Exception as e:
        print(f"[WARN] init_db failed: {e}", file=sys.stderr)
    yield


app = FastAPI(
    title="TA - SPP Payment System",
    description="Sistem pembayaran SPP, tagihan non-SPP, dan event tracking untuk Tugas Akhir.",
    version="0.1.0",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://ta-frontend-hugoedmoundo.vercel.app",
    "https://ta-frontend.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://ta-frontend.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "app": "TA SPP Payment System", "version": "0.1.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


try:
    from scalar_fastapi import get_scalar_api_reference

    @app.get("/scalar", include_in_schema=False)
    async def scalar_html():
        return get_scalar_api_reference(
            openapi_url=app.openapi_url,
            title=f"{app.title} - Scalar API Reference",
        )
except ImportError:
    pass

try:
    from fastapi.staticfiles import StaticFiles
    from app.config import get_settings
    settings_cfg = get_settings()
    os.makedirs(settings_cfg.upload_dir, exist_ok=True)
    app.mount(f"/{settings_cfg.upload_dir}", StaticFiles(directory=settings_cfg.upload_dir), name="uploads")
except Exception:
    pass

try:
    from app.routes import auth, users, students, sse, spp, bills, events, my, payments, receipts, reports, audit, dashboard, settings

    app.include_router(settings.router, tags=["Settings"])
    app.include_router(sse.router, prefix="/sse", tags=["SSE / Real-Time"])
    app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    app.include_router(users.router, prefix="/users", tags=["Users"])
    app.include_router(students.router, prefix="/students", tags=["Students"])
    app.include_router(spp.router, prefix="/spp", tags=["SPP"])
    app.include_router(bills.router, prefix="/bills", tags=["Bills (Non-SPP)"])
    app.include_router(events.router, prefix="/events", tags=["Events (Patungan)"])
    app.include_router(my.router, prefix="/my", tags=["Wali Portal"])
    app.include_router(payments.router, prefix="/payments", tags=["Payments (Fase 4)"])
    app.include_router(receipts.router, prefix="/receipts", tags=["Receipts (PDF/PNG - Fase 5)"])
    app.include_router(reports.router, prefix="/reports", tags=["Reports (Fase 5)"])
    app.include_router(audit.router, prefix="/audit-logs", tags=["Audit Trail (Fase 5)"])
    app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard Stats (Fase 6 - B-26)"])
except Exception as e:
    traceback.print_exc(file=sys.stderr)
