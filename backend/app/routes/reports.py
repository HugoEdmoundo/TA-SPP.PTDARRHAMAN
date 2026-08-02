from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, HTTPException, Response
from sqlmodel import Session, select

from app.database import get_session
from app.models import User, Student, Bill, Payment, Receipt, Event, SchoolSetting, ParentStudent, StudentStatus, PaymentStatus, SppSetting, AcademicYear
from app.dependencies import require_admin, get_current_user, is_admin_role
from app.services.ay import get_current_academic_year, ay_months
from app.services.report_generator import export_to_excel, export_to_pdf

router = APIRouter()


def serve_report(
    format_type: str,
    title: str,
    subtitle: str,
    headers: List[str],
    rows: List[List[Any]],
    summary_data: Dict[str, Any],
    filename_prefix: str,
    is_landscape: bool = False
):
    """Helper untuk mengembalikan format JSON, PDF, atau Excel sesuai request - B-24."""
    fmt = format_type.lower()
    if fmt == "json":
        # Konversi rows array menjadi list of dicts agar JSON lebih deskriptif
        data_dicts = []
        for r in rows:
            row_dict = {}
            for i, h in enumerate(headers):
                row_dict[h] = r[i] if i < len(r) else None
            data_dicts.append(row_dict)
        return {
            "title": title,
            "subtitle": subtitle,
            "summary": summary_data,
            "data": data_dicts,
            "total_rows": len(rows)
        }
    elif fmt == "pdf":
        try:
            pdf_bytes = export_to_pdf(title, subtitle, headers, rows, summary_data, is_landscape)
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f"inline; filename={filename_prefix}.pdf"}
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gagal generate PDF report: {str(e)}")
    elif fmt == "excel":
        try:
            excel_bytes = export_to_excel(title, headers, rows, summary_data)
            return Response(
                content=excel_bytes,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={filename_prefix}.xlsx"}
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gagal generate Excel report: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Format laporan harus 'json', 'pdf', atau 'excel'.")


# ─── 1. SPP Semester Report ──────────────────────────────────

@router.get("/spp-semester")
def get_spp_semester_report(
    academic_year_id: int = Query(None, description="ID tahun ajaran. Default: tahun ajaran aktif."),
    semester: int = Query(1, ge=1, le=2, description="Semester 1 (6 bulan pertama AY) atau 2 (6 bulan terakhir AY)"),
    format: str = Query("json", description="Format output: json | pdf | excel"),
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Laporan tagihan & koleksi SPP per semester (6 bulan) pada tahun ajaran tertentu - B-24.
    """
    ay = session.get(AcademicYear, academic_year_id) if academic_year_id else None
    if not ay:
        ay = get_current_academic_year(session)
    if not ay:
        raise HTTPException(status_code=404, detail="Tahun ajaran belum tersedia.")

    months = ay_months(ay, semester)  # list of (month, year)
    month_numbers = [m for m, _ in months]
    years = {y for _, y in months}

    # Ambil nominal SPP dari tabel master SppSetting milik AY ini
    spp_set = session.exec(select(SppSetting).where(SppSetting.academic_year_id == ay.id).order_by(SppSetting.id.desc())).first()
    if not spp_set:
        spp_set = session.exec(select(SppSetting).order_by(SppSetting.id.desc())).first()
    nominal_spp = Decimal(str(spp_set.monthly_nominal)) if spp_set else Decimal("500000")
    target_per_student = nominal_spp * 6

    students = session.exec(
        select(Student).where(Student.is_active == True, Student.status == StudentStatus.active)
    ).all()
    all_spp_pmts = session.exec(
        select(Payment).where(Payment.payment_type == "spp", Payment.spp_year.in_(years), Payment.spp_month.in_(month_numbers), Payment.status == PaymentStatus.paid)
    ).all()

    pmt_map: Dict[int, Decimal] = {}
    for p in all_spp_pmts:
        pmt_map[p.student_id] = pmt_map.get(p.student_id, Decimal("0")) + p.amount

    rows = []
    total_target = Decimal("0")
    total_collected = Decimal("0")

    for idx, st in enumerate(students, start=1):
        paid = pmt_map.get(st.id, Decimal("0"))
        rem = max(Decimal("0"), target_per_student - paid)
        status_txt = "LUNAS" if paid >= target_per_student else "SEBAGIAN" if paid > 0 else "BELUM BAYAR"
        
        rows.append([
            idx,
            st.nis,
            st.full_name,
            st.academic_year or ay.name,
            float(target_per_student),
            float(paid),
            float(rem),
            status_txt
        ])
        total_target += target_per_student
        total_collected += paid

    total_rem = max(Decimal("0"), total_target - total_collected)
    pct = (total_collected / total_target * 100) if total_target > 0 else Decimal("0")

    headers = ["No", "NIS", "Nama Siswa", "Tahun Ajaran", "Target SPP (Rp)", "Dibayar (Rp)", "Tunggakan (Rp)", "Status"]
    period_label = f"{months[0][1]}-{months[-1][0]}-{months[-1][1]}" if months else "-"
    summary = {
        "Tahun Ajaran / Semester": f"{ay.name} / Semester {semester}",
        "Total Siswa Aktif": len(students),
        "Total Target SPP (Rp)": float(total_target),
        "Total Terkumpul (Rp)": float(total_collected),
        "Total Tunggakan (Rp)": float(total_rem),
        "Persentase Koleksi": f"{pct:.2f}%",
    }

    return serve_report(
        format,
        f"Laporan SPP Semester {semester} - {ay.name}",
        f"Periode Bulan {period_label}",
        headers,
        rows,
        summary,
        f"Laporan_SPP_Sem{semester}_{ay.name.replace('/', '')}",
        is_landscape=True
    )


# ─── 2. Monthly Report ───────────────────────────────────────

@router.get("/monthly")
def get_monthly_report(
    month: int = Query(7, ge=1, le=12, description="Bulan (1-12)"),
    year: int = Query(2025, description="Tahun"),
    format: str = Query("json", description="Format output: json | pdf | excel"),
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Laporan penerimaan kas bulanan dari seluruh jenis pembayaran - B-24.
    """
    all_pmts = session.exec(select(Payment).where(Payment.status == PaymentStatus.paid).order_by(Payment.created_at.desc())).all()
    
    # Filter by month and year in Python (database agnostic)
    filtered = [p for p in all_pmts if p.created_at.year == year and p.created_at.month == month]

    students_map = {s.id: s for s in session.exec(select(Student)).all()}
    receipts_map = {r.payment_id: r for r in session.exec(select(Receipt)).all()}

    rows = []
    tot_spp = Decimal("0")
    tot_nonspp = Decimal("0")
    tot_event = Decimal("0")
    tot_infaq = Decimal("0")
    tot_grand = Decimal("0")

    for idx, p in enumerate(filtered, start=1):
        st = students_map.get(p.student_id)
        st_txt = f"{st.nis} - {st.full_name}" if st else f"ID {p.student_id}"
        rec = receipts_map.get(p.id)
        rec_num = rec.receipt_number if rec else "-"
        
        type_label = p.payment_type.upper()
        if p.payment_type == "spp":
            type_label = f"SPP ({p.spp_month}/{p.spp_year})"
        elif p.bill_id:
            bill = session.get(Bill, p.bill_id)
            if bill:
                type_label = f"{p.payment_type.upper()}: {bill.label}"

        rows.append([
            idx,
            p.created_at.strftime("%d-%m-%Y %H:%M"),
            rec_num,
            st_txt,
            type_label,
            f"{p.method.upper()} ({p.channel})",
            float(p.amount),
            float(p.infaq_amount),
            float(p.total_amount)
        ])

        if p.payment_type == "spp":
            tot_spp += p.amount
        elif p.payment_type == "non_spp":
            tot_nonspp += p.amount
        elif p.payment_type == "event":
            tot_event += p.amount
        
        tot_infaq += p.infaq_amount
        tot_grand += p.total_amount

    headers = ["No", "Tanggal", "No. Kuitansi", "Siswa", "Tagihan / Keterangan", "Metode", "Nominal Bayar (Rp)", "Infaq (Rp)", "Total Bayar (Rp)"]
    summary = {
        "Periode Bulan / Tahun": f"{month:02d} / {year}",
        "Total Transaksi": len(filtered),
        "Penerimaan SPP (Rp)": float(tot_spp),
        "Penerimaan Non-SPP (Rp)": float(tot_nonspp),
        "Penerimaan Event (Rp)": float(tot_event),
        "Penerimaan Infaq (Rp)": float(tot_infaq),
        "GRAND TOTAL PENERIMAAN (Rp)": float(tot_grand),
    }

    return serve_report(
        format,
        f"Laporan Penerimaan Bulanan - {month:02d}/{year}",
        f"Rekapitulasi Kas Masuk Bulan ke-{month} Tahun {year}",
        headers,
        rows,
        summary,
        f"Laporan_Bulanan_{month:02d}_{year}",
        is_landscape=True
    )


# ─── 3. Student Report ───────────────────────────────────────

@router.get("/student/{student_id}")
def get_student_report(
    student_id: int,
    format: str = Query("json", description="Format output: json | pdf | excel"),
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """
    Laporan riwayat & status kewajiban tagihan seorang siswa - B-24.
    Dapat diakses oleh Admin atau Wali dari siswa tersebut.
    """
    if not is_admin_role(user.role):
        link = session.exec(
            select(ParentStudent).where(
                ParentStudent.parent_id == user.id,
                ParentStudent.student_id == student_id,
            )
        ).first()
        if not link:
            raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke laporan siswa ini.")

    st = session.get(Student, student_id)
    if not st:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")

    pmts = session.exec(select(Payment).where(Payment.student_id == student_id, Payment.status == PaymentStatus.paid).order_by(Payment.created_at.desc())).all()
    receipts_map = {r.payment_id: r for r in session.exec(select(Receipt)).all()}

    rows = []
    tot_paid = Decimal("0")
    tot_infaq = Decimal("0")
    tot_grand = Decimal("0")

    for idx, p in enumerate(pmts, start=1):
        rec = receipts_map.get(p.id)
        rec_num = rec.receipt_number if rec else "-"
        
        desc = p.notes or p.payment_type.upper()
        if p.bill_id:
            bill = session.get(Bill, p.bill_id)
            if bill:
                desc = bill.label

        rows.append([
            idx,
            p.created_at.strftime("%d-%m-%Y %H:%M"),
            rec_num,
            p.payment_type.upper(),
            desc,
            f"{p.method.upper()} ({p.channel})",
            float(p.amount),
            float(p.infaq_amount),
            float(p.total_amount)
        ])
        tot_paid += p.amount
        tot_infaq += p.infaq_amount
        tot_grand += p.total_amount

    headers = ["No", "Tanggal", "No. Kuitansi", "Tipe", "Keterangan", "Metode / Channel", "Nominal Bayar (Rp)", "Infaq (Rp)", "Total Bayar (Rp)"]
    summary = {
        "NIS / Nama Siswa": f"{st.nis} / {st.full_name}",
        "Tahun Ajaran": f"{st.academic_year or '-'}",
        "Status Siswa": st.status.value.upper() if st.status else ("AKTIF" if st.is_active else "TIDAK AKTIF"),
        "Total Transaksi": len(pmts),
        "Total Tagihan Dibayar (Rp)": float(tot_paid),
        "Total Infaq / Sedekah (Rp)": float(tot_infaq),
        "GRAND TOTAL DIBAYARKAN (Rp)": float(tot_grand),
    }

    return serve_report(
        format,
        f"Laporan Pembayaran Siswa: {st.full_name}",
        f"NIS: {st.nis} | Thn Ajaran: {st.academic_year or '-'}",
        headers,
        rows,
        summary,
        f"Laporan_Siswa_{st.nis}",
        is_landscape=True
    )


# ─── 4. Infaq Report ─────────────────────────────────────────

@router.get("/infaq")
def get_infaq_report(
    year: Optional[int] = Query(None, description="Filter tahun (opsional)"),
    format: str = Query("json", description="Format output: json | pdf | excel"),
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Laporan khusus transaksi infaq & sedekah yang terkumpul - B-24.
    """
    query = select(Payment).where(Payment.infaq_amount > 0, Payment.status == PaymentStatus.paid).order_by(Payment.created_at.desc())
    pmts = session.exec(query).all()
    
    if year:
        pmts = [p for p in pmts if p.created_at.year == year]

    students_map = {s.id: s for s in session.exec(select(Student)).all()}
    receipts_map = {r.payment_id: r for r in session.exec(select(Receipt)).all()}

    rows = []
    tot_infaq = Decimal("0")

    for idx, p in enumerate(pmts, start=1):
        st = students_map.get(p.student_id)
        st_txt = f"{st.nis} - {st.full_name}" if st else f"ID {p.student_id}"
        rec = receipts_map.get(p.id)
        rec_num = rec.receipt_number if rec else "-"
        
        main_desc = p.payment_type.upper()
        if p.bill_id:
            bill = session.get(Bill, p.bill_id)
            if bill:
                main_desc = bill.label

        rows.append([
            idx,
            p.created_at.strftime("%d-%m-%Y %H:%M"),
            rec_num,
            st_txt,
            main_desc,
            f"{p.method.upper()} ({p.channel})",
            float(p.infaq_amount)
        ])
        tot_infaq += p.infaq_amount

    avg_infaq = (tot_infaq / len(pmts)) if pmts else Decimal("0")

    headers = ["No", "Tanggal", "No. Kuitansi", "Siswa Donatur", "Tagihan Utama", "Metode / Channel", "Nominal Infaq (Rp)"]
    summary = {
        "Filter Tahun": str(year) if year else "Semua Tahun (All-Time)",
        "Total Transaksi Infaq": len(pmts),
        "Total Infaq Terkumpul (Rp)": float(tot_infaq),
        "Rata-rata Infaq Per Transaksi (Rp)": float(avg_infaq),
    }

    return serve_report(
        format,
        "Laporan Rekapitulasi Infaq & Sedekah",
        f"Periode: {year if year else 'Sepanjang Masa (All-Time)'}",
        headers,
        rows,
        summary,
        f"Laporan_Infaq_{year or 'All'}",
        is_landscape=False
    )


# ─── 5. Events Report ────────────────────────────────────────

@router.get("/events")
def get_events_report(
    format: str = Query("json", description="Format output: json | pdf | excel"),
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Laporan patungan & kegiatan sekolah (Event CRUD & Tracking) - B-24.
    """
    events = session.exec(select(Event).order_by(Event.created_at.desc())).all()
    all_bills = session.exec(select(Bill).where(Bill.event_id != None)).all()
    
    # Map event_id -> bills
    event_bills_map: Dict[int, List[Bill]] = {}
    for b in all_bills:
        if b.event_id:
            event_bills_map.setdefault(b.event_id, []).append(b)

    rows = []
    tot_target_all = Decimal("0")
    tot_collected_all = Decimal("0")

    for idx, ev in enumerate(events, start=1):
        ev_bills = event_bills_map.get(ev.id, [])
        target_sum = sum(b.amount for b in ev_bills)
        collected_sum = sum(b.total_paid for b in ev_bills)
        rem_sum = max(Decimal("0"), target_sum - collected_sum)
        pct = (collected_sum / target_sum * 100) if target_sum > 0 else Decimal("0")
        
        status_txt = "LUNAS / SELESAI" if (target_sum > 0 and collected_sum >= target_sum) else "BERJALAN" if collected_sum > 0 else "BELUM ADA DANA"

        rows.append([
            idx,
            ev.name,
            ev.deadline.strftime("%d-%m-%Y") if ev.deadline else "-",
            float(target_sum),
            float(collected_sum),
            float(rem_sum),
            f"{pct:.1f}%",
            status_txt
        ])
        tot_target_all += target_sum
        tot_collected_all += collected_sum

    tot_rem_all = max(Decimal("0"), tot_target_all - tot_collected_all)
    overall_pct = (tot_collected_all / tot_target_all * 100) if tot_target_all > 0 else Decimal("0")

    headers = ["No", "Nama Kegiatan / Event", "Tanggal Acara", "Target Dana (Rp)", "Terkumpul (Rp)", "Kekurangan (Rp)", "Progres", "Status"]
    summary = {
        "Total Kegiatan / Event": len(events),
        "Total Target Dana Seluruh Event (Rp)": float(tot_target_all),
        "Total Dana Terkumpul (Rp)": float(tot_collected_all),
        "Total Kekurangan Dana (Rp)": float(tot_rem_all),
        "Persentase Progres Keseluruhan": f"{overall_pct:.2f}%",
    }

    return serve_report(
        format,
        "Laporan Rekapitulasi Kegiatan & Patungan Sekolah (Events)",
        "Progres Pengumpulan Dana Kegiatan Siswa",
        headers,
        rows,
        summary,
        "Laporan_Events_Patungan",
        is_landscape=True
    )
