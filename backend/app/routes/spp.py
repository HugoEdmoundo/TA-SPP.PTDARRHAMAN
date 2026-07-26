from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.database import get_session
from app.models import User, Student
from app.dependencies import require_admin, require_wali
from app.services.spp import get_student_spp_status, get_spp_grid

router = APIRouter()


@router.get("/status/{student_id}", response_model=List[Dict[str, Any]])
def get_spp_status(
    student_id: int,
    year: int = Query(2025, description="Tahun SPP yang ingin dicek (misal: 2025)"),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_wali),
):
    """
    Melihat status pembayaran SPP virtual bulanan (1-12) siswa pada tahun tertentu.
    Wali hanya dapat melihat status anak angkatnya sendiri; Admin dapat melihat seluruh siswa.
    """
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")

    if current_user.role == "wali":
        linked_ids = [s.id for s in current_user.students]
        if student_id not in linked_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akses ditolak: Siswa ini bukan anak yang terhubung dengan akun Anda.",
            )

    return get_student_spp_status(session, student_id, year)


@router.get("/grid", response_model=List[Dict[str, Any]])
def get_semester_grid(
    year: int = Query(2025, description="Tahun ajaran/SPP"),
    semester: int = Query(1, ge=1, le=2, description="Semester 1 (Jul-Des) atau 2 (Jan-Jun)"),
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Menampilkan tabel matriks/grid SPP seluruh siswa untuk 1 semester (Admin only).
    Sangat efisien untuk memantau ratusan siswa sekaligus.
    """
    return get_spp_grid(session, year, semester)
