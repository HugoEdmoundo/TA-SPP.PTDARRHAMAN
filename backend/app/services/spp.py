from typing import List, Dict, Any

from sqlmodel import Session, select
from sqlalchemy import or_

from app.models import Student, SppSetting, Payment, AcademicYear, StudentStatus, PaymentStatus
from app.services.ay import get_current_academic_year, period_to_calendar, ay_months


def _resolve_spp_setting(session: Session, ay: AcademicYear) -> SppSetting:
    """Nominal SPP untuk AY tertentu; fallback ke setting terbaru bila AY belum punya."""
    setting = session.exec(
        select(SppSetting).where(SppSetting.academic_year_id == ay.id).order_by(SppSetting.id.desc())
    ).first()
    if not setting:
        setting = session.exec(select(SppSetting).order_by(SppSetting.id.desc())).first()
    return setting


def get_student_spp_status(session: Session, student_id: int, academic_year_id: int) -> List[Dict[str, Any]]:
    """
    Menghitung status SPP bulanan (periode 1-12 relatif ke AY) per siswa secara virtual.
    Mencocokkan total pembayaran SPP sukses per bulan kalender dengan nominal SppSetting AY tersebut.
    """
    student = session.get(Student, student_id)
    if not student:
        return []

    ay = session.get(AcademicYear, academic_year_id)
    if not ay:
        ay = get_current_academic_year(session)
    if not ay:
        return []

    spp_setting = _resolve_spp_setting(session, ay)
    nominal = float(spp_setting.monthly_nominal) if spp_setting else 500000.0

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

    months = ay_months(ay, semester)
    months_in_sem = [(m, y) for m, y in months]

    spp_setting = _resolve_spp_setting(session, ay)
    nominal = float(spp_setting.monthly_nominal) if spp_setting else 500000.0

    # Siswa aktif: milik AY ini, atau legacy yang belum punya AY (academic_year_id kosong)
    students = session.exec(
        select(Student).where(
            Student.is_active == True,  # noqa: E712
            Student.status == StudentStatus.active,
            or_(Student.academic_year_id == ay.id, Student.academic_year_id.is_(None)),
        ).order_by(Student.full_name)
    ).all()

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
            "grade": student.grade,
            "academic_year": ay.name,
            "months": months_data,
        })

    return grid_data
