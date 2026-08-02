from datetime import date, datetime
from decimal import Decimal
from typing import List, Dict, Any, Optional

from sqlmodel import Session, select
from sqlalchemy import or_

from app.models import (
    Student, SppSetting, Payment, AcademicYear, StudentStatus, PaymentStatus, Bill, BillType, BillStatus,
)
from app.services.ay import get_current_academic_year, period_to_calendar, ay_months

MONTH_NAMES = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]


def _resolve_spp_setting(session: Session, ay: AcademicYear) -> SppSetting:
    """Nominal SPP untuk AY tertentu; fallback ke setting terbaru bila AY belum punya."""
    setting = session.exec(
        select(SppSetting).where(SppSetting.academic_year_id == ay.id).order_by(SppSetting.id.desc())
    ).first()
    if not setting:
        setting = session.exec(select(SppSetting).order_by(SppSetting.id.desc())).first()
    return setting


def get_active_spp_setting(session: Session, ay: Optional[AcademicYear] = None) -> SppSetting:
    """Ambil SppSetting aktif (buat default bila belum ada)."""
    if ay is None:
        ay = get_current_academic_year(session)
    if not ay:
        raise RuntimeError("Tahun ajaran belum tersedia.")

    setting = _resolve_spp_setting(session, ay)
    if not setting:
        setting = SppSetting(
            monthly_nominal=Decimal("500000"),
            due_day=10,
            academic_year=ay.name,
            academic_year_id=ay.id,
            is_active=True,
            notes="Nominal default awal.",
        )
        session.add(setting)
        session.commit()
        session.refresh(setting)
    return setting


def _spp_active_students(session: Session, ay: AcademicYear) -> List[Student]:
    """Siswa aktif: milik AY ini, atau legacy yang belum punya AY (academic_year_id kosong)."""
    return session.exec(
        select(Student).where(
            Student.is_active == True,  # noqa: E712
            Student.status == StudentStatus.active,
            or_(Student.academic_year_id == ay.id, Student.academic_year_id.is_(None)),
        ).order_by(Student.full_name)
    ).all()


def _ay_month_range(ay: AcademicYear, up_to: Optional[date] = None) -> List[tuple]:
    """
    Daftar (bulan, tahun) kalender dari awal AY hingga `up_to` (default: hari ini).
    Mencerminkan prinsip: setiap awal bulan sistem membuat tagihan SPP untuk santri aktif.
    """
    from app.services.ay import _resolve_start_date

    if ay.start_date:
        start_year, start_month = ay.start_date.year, ay.start_date.month
    else:
        start_year, start_month = _resolve_start_date(ay)

    if up_to is None:
        up_to = datetime.utcnow().date()

    start = date(start_year, start_month, 1)
    if start > up_to:
        return []

    months = []
    cursor = start
    while cursor <= up_to:
        months.append((cursor.month, cursor.year))
        y, m = (cursor.year + 1, 1) if cursor.month == 12 else (cursor.year, cursor.month + 1)
        cursor = date(y, m, 1)
    return months


def ensure_spp_bills(session: Session, academic_year_id: Optional[int] = None) -> List[Bill]:
    """
    MATERIALISASI tagihan SPP bulanan untuk seluruh santri aktif.

    Idempotent: hanya membuat Bill baru untuk kombinasi (santri, bulan, tahun)
    yang belum ada. Bulan yang dibuat dimulai dari awal tahun ajaran sampai bulan berjalan.
    Nominal diambil dari SppSetting aktif; jika nominal berubah di tengah tahun,
    tagihan bulan berikutnya otomatis memakai nominal terbaru (tagihan lama tidak diubah).
    """
    ay = session.get(AcademicYear, academic_year_id) if academic_year_id else get_current_academic_year(session)
    if not ay:
        return []

    spp_setting = get_active_spp_setting(session, ay)
    nominal = Decimal(str(spp_setting.monthly_nominal))

    students = _spp_active_students(session, ay)
    months = _ay_month_range(ay)
    if not months or not students:
        return []

    years = {y for _, y in months}
    months_nums = {m for m, _ in months}

    existing = session.exec(
        select(Bill).where(
            Bill.bill_type == BillType.spp,
            Bill.academic_year_id == ay.id,
            Bill.spp_year.in_(years),
            Bill.spp_month.in_(months_nums),
        )
    ).all()
    existing_keys = {(b.student_id, b.spp_month, b.spp_year) for b in existing}

    created = []
    now = datetime.utcnow()
    for student in students:
        for month, year in months:
            if (student.id, month, year) in existing_keys:
                continue
            bill = Bill(
                student_id=student.id,
                bill_type=BillType.spp,
                academic_year_id=ay.id,
                spp_month=month,
                spp_year=year,
                label=f"SPP Bulan {MONTH_NAMES[month]} {year}",
                description=f"Tagihan SPP bulanan {MONTH_NAMES[month]} {year} ({ay.name})",
                amount=nominal,
                status=BillStatus.unpaid,
                notes=f"Auto-generated: SPP {MONTH_NAMES[month]} {year}",
                created_at=now,
                updated_at=now,
            )
            session.add(bill)
            created.append(bill)

    if created:
        session.commit()
        for b in created:
            session.refresh(b)
    return created


def get_student_spp_status(session: Session, student_id: int, academic_year_id: int) -> List[Dict[str, Any]]:
    """
    Menghitung status SPP bulanan (periode 1-12 relatif ke AY) per siswa.
    Memastikan tagihan SPP dibuat otomatis lalu mencocokkan total pembayaran SPP
    sukses per bulan kalender dengan nominal SppSetting AY tersebut.
    """
    student = session.get(Student, student_id)
    if not student:
        return []

    ay = session.get(AcademicYear, academic_year_id)
    if not ay:
        ay = get_current_academic_year(session)
    if not ay:
        return []

    ensure_spp_bills(session, ay.id)

    spp_setting = get_active_spp_setting(session, ay)
    nominal = float(spp_setting.monthly_nominal)

    # Ambil semua pembayaran SPP yang SUKSES/PAID untuk siswa ini dalam rentang kalender AY
    months_of_ay = [period_to_calendar(ay, p) for p in range(1, 13)]
    years_in_ay = {y for _, y in months_of_ay}

    payments = session.exec(
        select(Payment).where(
            Payment.student_id == student_id,
            Payment.payment_type == "spp",
            Payment.spp_year.in_(years_in_ay),
            Payment.status == PaymentStatus.paid,
        )
    ).all()

    paid_by_calendar: Dict[tuple, float] = {}
    for p in payments:
        if p.spp_month and 1 <= p.spp_month <= 12 and p.spp_year:
            key = (p.spp_month, p.spp_year)
            paid_by_calendar[key] = paid_by_calendar.get(key, 0.0) + float(p.amount)

    status_list = []
    for period in range(1, 13):
        month, year = period_to_calendar(ay, period)
        total_paid = paid_by_calendar.get((month, year), 0.0)
        if total_paid >= nominal:
            status = "paid"
        elif total_paid > 0:
            status = "partial"
        else:
            status = "unpaid"

        status_list.append({
            "period": period,
            "month": month,
            "year": year,
            "nominal": nominal,
            "total_paid": total_paid,
            "status": status,
        })

    return status_list


def get_spp_grid(session: Session, academic_year_id: int, semester: int) -> List[Dict[str, Any]]:
    """
    Menghasilkan grid status SPP untuk seluruh siswa aktif dalam 1 semester pada AY tertentu.
    Semester 1 = 6 bulan pertama AY, Semester 2 = 6 bulan terakhir AY.
    """
    ay = session.get(AcademicYear, academic_year_id)
    if not ay:
        ay = get_current_academic_year(session)
    if not ay:
        return []

    # Pastikan tagihan SPP bulanan sudah dibuat otomatis
    ensure_spp_bills(session, ay.id)

    months = ay_months(ay, semester)
    months_in_sem = [(m, y) for m, y in months]

    spp_setting = get_active_spp_setting(session, ay)
    nominal = float(spp_setting.monthly_nominal)

    students = _spp_active_students(session, ay)

    years_in_sem = {y for _, y in months_in_sem}
    month_numbers = {m for m, _ in months_in_sem}

    payments = session.exec(
        select(Payment).where(
            Payment.payment_type == "spp",
            Payment.spp_year.in_(years_in_sem),
            Payment.status == PaymentStatus.paid,
        )
    ).all()

    paid_lookup: Dict[tuple, float] = {}
    for p in payments:
        if p.student_id and p.spp_month and p.spp_month in month_numbers and p.spp_year:
            key = (p.student_id, p.spp_month, p.spp_year)
            paid_lookup[key] = paid_lookup.get(key, 0.0) + float(p.amount)

    grid_data = []
    for student in students:
        months_data = []
        for month, year in months_in_sem:
            amount_paid = paid_lookup.get((student.id, month, year), 0.0)
            if amount_paid >= nominal:
                status = "paid"
            elif amount_paid > 0:
                status = "partial"
            else:
                status = "unpaid"

            months_data.append({
                "month": month,
                "year": year,
                "status": status,
                "amount_paid": amount_paid,
            })

        grid_data.append({
            "student_id": student.id,
            "student_name": student.full_name,
            "nis": student.nis,
            "academic_year": ay.name,
            "months": months_data,
        })

    return grid_data
