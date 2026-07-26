from typing import List, Dict, Any
from sqlmodel import Session, select
from app.models import Student, SppSetting, Payment, StudentStatus, PaymentStatus


def get_student_spp_status(session: Session, student_id: int, year: int) -> List[Dict[str, Any]]:
    """
    Menghitung status SPP bulanan (bulan 1-12) per siswa untuk tahun tertentu secara virtual.
    Tidak menyimpan record tagihan statis, melainkan mencocokkan total pembayaran sukses dengan nominal SppSetting.
    """
    student = session.get(Student, student_id)
    if not student:
        return []

    # Cari nominal SPP berdasarkan tahun ajaran siswa atau tahun yang diminta
    # Coba cari persis berdasarkan academic_year siswa, atau string tahun
    spp_setting = session.exec(
        select(SppSetting).where(
            (SppSetting.academic_year == student.academic_year) |
            (SppSetting.academic_year.ilike(f"%{year}%"))
        ).order_by(SppSetting.id.desc())
    ).first()

    # Jika tidak ada setting spesifik, ambil setting terbaru atau fallback default 500.000
    if not spp_setting:
        spp_setting = session.exec(select(SppSetting).order_by(SppSetting.id.desc())).first()
    
    nominal = float(spp_setting.monthly_nominal) if spp_setting else 500000.0

    # Ambil semua pembayaran SPP yang SUKSES/PAID untuk siswa ini di tahun tersebut
    payments = session.exec(
        select(Payment).where(
            Payment.student_id == student_id,
            Payment.payment_type == "spp",
            Payment.spp_year == year,
            Payment.status == PaymentStatus.paid,
        )
    ).all()

    # Group pembayaran per bulan
    paid_by_month: Dict[int, float] = {m: 0.0 for m in range(1, 13)}
    for p in payments:
        if p.spp_month and 1 <= p.spp_month <= 12:
            paid_by_month[p.spp_month] += float(p.amount)

    status_list = []
    for m in range(1, 13):
        total_paid = paid_by_month[m]
        if total_paid >= nominal:
            status = "paid"
        elif total_paid > 0:
            status = "partial"
        else:
            status = "unpaid"

        status_list.append({
            "month": m,
            "year": year,
            "nominal": nominal,
            "total_paid": total_paid,
            "status": status,
        })

    return status_list


def get_spp_grid(session: Session, year: int, semester: int) -> List[Dict[str, Any]]:
    """
    Menghasilkan grid status SPP untuk seluruh siswa aktif dalam 1 semester (6 bulan).
    Semester 1 = Juli - Desember (bulan 7 - 12).
    Semester 2 = Januari - Juni (bulan 1 - 6).
    """
    months_range = range(7, 13) if semester == 1 else range(1, 7)
    students = session.exec(select(Student).where(Student.is_active == True, Student.status == 'active').order_by(Student.full_name)).all()

    # Query semua pembayaran SPP yang SUKSES/PAID di tahun & bulan dalam range semester ini
    payments = session.exec(
        select(Payment).where(
            Payment.payment_type == "spp",
            Payment.spp_year == year,
            Payment.status == PaymentStatus.paid,
        )
    ).all()

    # Lookup dict: (student_id, month) -> total_paid
    paid_lookup: Dict[tuple, float] = {}
    for p in payments:
        if p.student_id and p.spp_month and p.spp_month in months_range:
            key = (p.student_id, p.spp_month)
            paid_lookup[key] = paid_lookup.get(key, 0.0) + float(p.amount)

    # Lookup setting nominal SPP default
    latest_setting = session.exec(select(SppSetting).order_by(SppSetting.id.desc())).first()
    default_nominal = float(latest_setting.monthly_nominal) if latest_setting else 500000.0

    grid_data = []
    for student in students:
        months_data = []
        for m in months_range:
            amount_paid = paid_lookup.get((student.id, m), 0.0)
            if amount_paid >= default_nominal:
                status = "paid"
            elif amount_paid > 0:
                status = "partial"
            else:
                status = "unpaid"

            months_data.append({
                "month": m,
                "status": status,
                "amount_paid": amount_paid,
            })

        grid_data.append({
            "student_id": student.id,
            "student_name": student.full_name,
            "nis": student.nis,
            "months": months_data,
        })

    return grid_data
