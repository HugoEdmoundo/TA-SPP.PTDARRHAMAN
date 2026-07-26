from decimal import Decimal
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select

from app.database import get_session
from app.models import User, Student, Bill, Payment, ParentStudent
from app.dependencies import require_wali
from app.services.spp import get_student_spp_status
from app.services.payment import create_gateway_checkout_session
from app.schemas.bills import BillRead
from app.schemas.payments import GatewayCreateRequest, GatewayCreateResponse

router = APIRouter()


@router.get("/children", response_model=List[Dict[str, Any]])
def get_my_children(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_wali),
):
    """
    Mengambil daftar anak/siswa yang terhubug dengan akun Wali Siswa yang sedang login (B-16).
    """
    students_list = []
    for s in current_user.students:
        if s.is_active:
            students_list.append({
                "id": s.id,
                "name": s.full_name,
                "nis": s.nis,
                "grade": s.academic_year or "Umum",
            })
    return students_list


@router.get("/bills", response_model=Dict[str, Any])
def get_my_child_bills(
    child_id: int = Query(..., description="ID siswa/anak yang ingin dilihat tagihannya"),
    year: int = Query(2025, description="Tahun SPP bulanan yang dicek"),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_wali),
):
    """
    Portal tagihan Wali Siswa (B-17): Merangkum seluruh tagihan belum lunas (SPP, Non-SPP, dan Event)
    serta ringkasan total outstanding dan riwayat total yang sudah dibayar.
    """
    student = session.get(Student, child_id)
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")

    # Verifikasi parent-student linking (wajib terhubung untuk role wali)
    if current_user.role == "wali":
        linked_ids = [s.id for s in current_user.students]
        if child_id not in linked_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akses ditolak: Siswa ini bukan anak yang terhubung dengan akun Wali Anda.",
            )

    # 1. SPP virtual bills (unpaid / partial)
    spp_status = get_student_spp_status(session, child_id, year)
    spp_bills = []
    for item in spp_status:
        if item["status"] in ["unpaid", "partial"]:
            rem = Decimal(str(item["nominal"])) - Decimal(str(item["total_paid"]))
            spp_bills.append({
                "id": 0,  # Virtual ID
                "student_id": child_id,
                "bill_type": "spp",
                "label": f"SPP Bulan {item['month']} ({item['year']})",
                "description": f"Tagihan SPP bulan ke-{item['month']} tahun {item['year']}",
                "amount": Decimal(str(item["nominal"])),
                "remaining_amount": rem,
                "status": item["status"],
                "month": item["month"],
                "year": item["year"],
            })

    # 2. Non-SPP bills (unpaid / partial)
    non_spp_db = session.exec(
        select(Bill).where(
            Bill.student_id == child_id,
            Bill.bill_type == "non_spp",
            Bill.status.in_(["unpaid", "partial"]),
        ).order_by(Bill.id.desc())
    ).all()
    non_spp_bills = [BillRead.model_validate(b) for b in non_spp_db]

    # 3. Event bills (unpaid / partial)
    event_db = session.exec(
        select(Bill).where(
            Bill.student_id == child_id,
            Bill.bill_type == "event",
            Bill.status.in_(["unpaid", "partial"]),
        ).order_by(Bill.id.desc())
    ).all()
    event_bills = [BillRead.model_validate(b) for b in event_db]

    # 4. Summary outstanding vs paid all time
    total_spp_out = sum(b["remaining_amount"] for b in spp_bills)
    total_non_spp_out = sum(b.remaining_amount for b in non_spp_bills)
    total_event_out = sum(b.remaining_amount for b in event_bills)
    total_outstanding = total_spp_out + total_non_spp_out + total_event_out

    # Total all-time payments for this child
    all_payments = session.exec(
        select(Payment).where(
            Payment.student_id == child_id,
        )
    ).all()
    total_paid_all_time = sum(p.amount for p in all_payments)

    return {
        "child_id": child_id,
        "student_name": student.full_name,
        "nis": student.nis,
        "spp_bills": spp_bills,
        "non_spp_bills": non_spp_bills,
        "event_bills": event_bills,
        "summary": {
            "total_outstanding": total_outstanding,
            "total_paid_all_time": total_paid_all_time,
            "unpaid_bills_count": len(spp_bills) + len(non_spp_bills) + len(event_bills),
        },
    }


@router.get("/payments", response_model=List[Dict[str, Any]])
def get_my_child_payments(
    child_id: int = Query(..., description="ID siswa/anak yang ingin dilihat riwayat pembayarannya"),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_wali),
):
    """
    Mengambil riwayat pembayaran untuk siswa/anak tertentu (Wali Only / Admin).
    """
    if current_user.role == "wali":
        linked_ids = [s.id for s in current_user.students]
        if child_id not in linked_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akses ditolak: Siswa ini bukan anak yang terhubung dengan akun Wali Anda.",
            )

    payments = session.exec(
        select(Payment).where(Payment.student_id == child_id).order_by(Payment.id.desc())
    ).all()

    result = []
    for p in payments:
        r_num = p.receipt.receipt_number if p.receipt else f"PAY-{p.id}"
        is_void = p.receipt.is_void if p.receipt else False
        ver_code = p.receipt.verification_code if p.receipt else f"PTD-VER-{p.id}"
        result.append({
            "id": p.id,
            "invoice_number": p.invoice_number,
            "receipt_number": r_num,
            "verification_code": ver_code,
            "payment_type": p.payment_type,
            "amount": float(p.amount),
            "infaq_amount": float(p.infaq_amount),
            "total_amount": float(p.total_amount),
            "method": p.channel or "transfer",
            "status": "VOID" if is_void else "PAID",
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })
    return result


# ─── B-22: Wali Checkout Flow Integration ────────────────────

@router.post("/checkout", response_model=GatewayCreateResponse)
def wali_checkout_flow(
    payload: GatewayCreateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_wali),
):
    """
    Wali Checkout Flow (B-22): Memvalidasi kepemilikan anak dan membuat sesi pembayaran online.
    """
    link = session.exec(
        select(ParentStudent).where(
            ParentStudent.parent_id == current_user.id,
            ParentStudent.student_id == payload.student_id,
        )
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses untuk melakukan pembayaran atas siswa ini.")

    return create_gateway_checkout_session(session, payload)
