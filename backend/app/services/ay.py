"""
Academic Year helper services.

Prinsip: Tahun Ajaran (AY) adalah master periode. SPP dibayar per bulan
kalender dalam rentang AY (mulai dari `start_date`), dan setiap baris data
(payment, bill, event, spp_setting) dikunci ke `academic_year_id`.
"""
from datetime import date, datetime
from typing import List, Optional, Tuple

from sqlmodel import Session, select

from app.models import AcademicYear


def get_current_academic_year(session: Session) -> Optional[AcademicYear]:
    """Ambil tahun ajaran aktif; fallback ke yang terbaru jika tidak ada yang aktif."""
    ay = session.exec(
        select(AcademicYear).where(AcademicYear.is_active == True).order_by(AcademicYear.id.desc())  # noqa: E712
    ).first()
    if ay:
        return ay
    return session.exec(select(AcademicYear).order_by(AcademicYear.id.desc())).first()


def seed_default_academic_year(session: Session) -> AcademicYear:
    """Buat tahun ajaran default jika tabel kosong. AY mengikuti kalender Indonesia (Jul-Jun)."""
    existing = session.exec(select(AcademicYear).order_by(AcademicYear.id.asc())).first()
    if existing:
        return existing

    now = datetime.utcnow()
    start_year = now.year if now.month >= 7 else now.year - 1
    ay = AcademicYear(
        name=f"{start_year}/{start_year + 1}",
        start_date=date(start_year, 7, 1),
        end_date=date(start_year + 1, 6, 30),
        is_active=True,
    )
    session.add(ay)
    session.commit()
    session.refresh(ay)
    return ay


def _resolve_start_date(ay: AcademicYear) -> Tuple[int, int]:
    """Kembalikan (tahun, bulan) bulan pertama AY. Fallback ke Juli bila start_date kosong."""
    if ay.start_date:
        return ay.start_date.year, ay.start_date.month
    # Parse dari nama "YYYY/YYYY+1" -> asumsikan mulai Juli
    try:
        start_year = int(ay.name.split("/")[0].strip())
    except (ValueError, IndexError):
        start_year = datetime.utcnow().year
    return start_year, 7


def ay_months(ay: AcademicYear, semester: int) -> List[Tuple[int, int]]:
    """
    Daftar bulan kalender milik satu semester pada AY.
    Semester 1 = 6 bulan pertama (dari start_date), Semester 2 = 6 bulan terakhir.
    Kembalikan list (bulan, tahun) kalender.
    """
    start_year, start_month = _resolve_start_date(ay)
    month_idx = range(0, 6) if semester == 1 else range(6, 12)
    months = []
    for i in month_idx:
        total = start_year * 12 + (start_month - 1) + i
        year, month = divmod(total, 12)
        months.append((month + 1, year))
    return months


def period_to_calendar(ay: AcademicYear, period: int) -> Tuple[int, int]:
    """Konversi periode (1-12 relatif ke start AY) menjadi (bulan, tahun) kalender."""
    start_year, start_month = _resolve_start_date(ay)
    total = start_year * 12 + (start_month - 1) + (period - 1)
    year, month = divmod(total, 12)
    return month + 1, year
