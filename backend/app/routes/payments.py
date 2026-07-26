import json
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select

from app.database import get_session
from app.models import (
    User, Student, Bill, Payment, Receipt, GatewayTransaction, AuditLog, ParentStudent, Event, PaymentStatus
)
from app.routes.sse import manager
from app.dependencies import get_current_user, require_admin
from app.schemas.payments import (
    PaymentItemRequest,
    GatewayCreateRequest,
    GatewayCreateResponse,
    GatewayCallbackRequest,
    ManualPaymentRequest,
    PaymentRead,
    ReceiptRead,
    InfaqSummaryRead,
)
from app.services.payment import process_payment_items, create_gateway_checkout_session
from app.services.payment_gateway import verify_webhook_signature

router = APIRouter()


# ─── B-18 & B-22: Gateway Checkout Initiation ────────────────

@router.post("/gateway/create", response_model=GatewayCreateResponse)
def create_gateway_checkout(
    payload: GatewayCreateRequest,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """
    Inisiasi pembayaran online (Midtrans / Xendit / Simulator) - B-18.
    """
    if user.role != "admin":
        # Jika bukan admin, pastikan siswa adalah anak dari wali ini
        link = session.exec(
            select(ParentStudent).where(
                ParentStudent.parent_id == user.id,
                ParentStudent.student_id == payload.student_id,
            )
        ).first()
        if not link:
            raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke data siswa ini.")

    return create_gateway_checkout_session(session, payload)


# ─── B-18: Gateway Webhook Callback ──────────────────────────

@router.post("/gateway/callback")
def gateway_webhook_callback(
    payload: GatewayCallbackRequest,
    session: Session = Depends(get_session),
):
    """
    Endpoint webhook dari payment gateway (Midtrans / Xendit / Simulator)
    untuk konfirmasi otomatis & broadcast SSE - B-18.
    """
    gw_tx = session.exec(
        select(GatewayTransaction).where(GatewayTransaction.transaction_id == payload.transaction_id)
    ).first()

    if not gw_tx:
        raise HTTPException(status_code=404, detail="Transaction ID tidak ditemukan.")

    if gw_tx.status == "success":
        return {"status": "success", "message": "Transaksi sudah berhasil diproses sebelumnya (idempotent)."}

    # 1. Verifikasi Keamanan Webhook Signature (Midtrans SHA512 / Xendit Token)
    verify_webhook_signature(
        session=session,
        gateway_name=gw_tx.gateway_name,
        transaction_id=payload.transaction_id,
        status_code=payload.status_code,
        gross_amount=str(int(gw_tx.total_amount)),
        signature_key=payload.signature_key,
    )

    # 2. Anggap settlement / success jika transaction_status settlement/capture/success atau status_code 200
    is_success = (
        payload.status_code == "200"
        or payload.transaction_status in ("settlement", "capture", "success")
    )

    now = datetime.utcnow()
    if is_success:
        gw_tx.status = "success"
        gw_tx.paid_at = now
        gw_tx.updated_at = now
        session.add(gw_tx)

        # Parse items JSON kembali menjadi list objek
        items_raw = json.loads(gw_tx.items_json)
        items = [PaymentItemRequest(**item) for item in items_raw]

        # Proses pembuatan Payment, Receipt, update Bill, dan broadcast SSE
        process_payment_items(
            session=session,
            student_id=gw_tx.student_id,
            items=items,
            infaq_amount=gw_tx.infaq_amount,
            method="transfer",
            channel="gateway",
            gateway_trx_id=gw_tx.transaction_id,
            notes=f"Pembayaran online via {gw_tx.gateway_name.upper()} ({gw_tx.transaction_id})",
        )

        return {"status": "success", "message": "Pembayaran berhasil dikonfirmasi dan dicatat."}
    else:
        gw_tx.status = "failed"
        gw_tx.updated_at = now
        session.add(gw_tx)
        session.commit()
        return {"status": "failed", "message": f"Status transaksi gateway: {payload.transaction_status or payload.status_code}"}


# ─── B-19: Pembayaran Manual oleh Admin ──────────────────────

@router.post("/manual", response_model=Dict[str, Any])
def create_manual_payment(
    payload: ManualPaymentRequest,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Input pembayaran manual oleh Admin / Kasir Sekolah (cash atau transfer manual) - B-19.
    """
    payments = process_payment_items(
        session=session,
        student_id=payload.student_id,
        items=payload.items,
        infaq_amount=payload.infaq_amount,
        method=payload.payment_method,
        channel="manual",
        created_by=admin.id,
        notes=payload.notes or "Pembayaran manual di kasir",
    )

    # Catat ke Audit Log
    audit = AuditLog(
        user_id=admin.id,
        action="CREATE_MANUAL_PAYMENT",
        entity_type="payment",
        entity_id=payments[0].id if payments else None,
        detail=f"Input manual {len(payments)} item untuk siswa ID {payload.student_id}. Total: {sum(p.total_amount for p in payments)}",
    )
    session.add(audit)
    session.commit()

    return {
        "status": "success",
        "message": f"Berhasil mencatat {len(payments)} pembayaran manual.",
        "payments": [PaymentRead.model_validate(p) for p in payments],
    }


# ─── B-20: Kuitansi Digital (Receipts) ───────────────────────

@router.get("/receipts/{receipt_number:path}", response_model=Dict[str, Any])
def get_receipt_detail(
    receipt_number: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """
    Mengambil detail kuitansi digital berdasarkan nomor kuitansi - B-20.
    """
    receipt = session.exec(
        select(Receipt).where(Receipt.receipt_number == receipt_number)
    ).first()

    if not receipt:
        raise HTTPException(status_code=404, detail="Kuitansi tidak ditemukan.")

    payment = session.get(Payment, receipt.payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Data pembayaran untuk kuitansi ini tidak ditemukan.")

    if user.role != "admin":
        link = session.exec(
            select(ParentStudent).where(
                ParentStudent.parent_id == user.id,
                ParentStudent.student_id == payment.student_id,
            )
        ).first()
        if not link:
            raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke kuitansi ini.")

    student = session.get(Student, payment.student_id)
    bill_label = "SPP"
    if payment.bill_id:
        bill = session.get(Bill, payment.bill_id)
        if bill:
            bill_label = bill.label
    elif payment.payment_type == "spp":
        bill_label = f"SPP Bulan {payment.spp_month} Tahun {payment.spp_year}"

    return {
        "receipt": ReceiptRead.model_validate(receipt),
        "payment": PaymentRead.model_validate(payment),
        "student": {
            "id": student.id if student else None,
            "full_name": student.full_name if student else "Unknown",
            "nis": student.nis if student else "-",
        },
        "item_label": bill_label,
    }


@router.post("/receipts/{receipt_number:path}/void", response_model=ReceiptRead)
def void_receipt(
    receipt_number: str,
    payload: Dict[str, str],
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Pembatalan kuitansi (Void) oleh admin jika terjadi kesalahan input - B-20.
    """
    receipt = session.exec(
        select(Receipt).where(Receipt.receipt_number == receipt_number)
    ).first()

    if not receipt:
        raise HTTPException(status_code=404, detail="Kuitansi tidak ditemukan.")
    
    if receipt.is_void:
        raise HTTPException(status_code=400, detail="Kuitansi ini sudah berstatus VOID sebelumnya.")

    reason = payload.get("reason", "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Alasan pembatalan (reason) wajib diisi.")

    payment = session.get(Payment, receipt.payment_id)
    if payment and payment.bill_id:
        bill = session.get(Bill, payment.bill_id)
        if bill:
            bill.total_paid = max(Decimal("0"), bill.total_paid - payment.amount)
            if bill.total_paid == 0:
                bill.status = "unpaid"
            elif bill.total_paid < bill.amount:
                bill.status = "partial"
            bill.updated_at = datetime.utcnow()
            session.add(bill)

            if payment.payment_type == "event" and bill.event_id:
                ev = session.get(Event, bill.event_id)
                if ev:
                    ev.total_collected = max(Decimal("0"), ev.total_collected - payment.amount)
                    ev.updated_at = datetime.utcnow()
                    session.add(ev)

    now = datetime.utcnow()
    receipt.is_void = True
    receipt.void_reason = reason
    receipt.voided_by = admin.id
    receipt.voided_at = now
    session.add(receipt)
    if payment:
        payment.status = PaymentStatus.refunded
        session.add(payment)

    audit = AuditLog(
        user_id=admin.id,
        action="VOID_RECEIPT",
        entity_type="receipt",
        entity_id=receipt.id,
        detail=f"Void kuitansi {receipt_number}. Alasan: {reason}",
    )
    session.add(audit)
    session.commit()
    session.refresh(receipt)

    # Broadcast SSE real-time notification
    if payment:
        manager.broadcast_sync("payment_voided", {
            "type": "payment_voided",
            "payment_id": payment.id,
            "receipt_number": receipt.receipt_number,
            "reason": reason,
            "timestamp": now.isoformat(),
        })

    return ReceiptRead.model_validate(receipt)


# ─── B-21: Cicilan & Infaq Tracking ──────────────────────────

@router.get("/infaq/summary", response_model=InfaqSummaryRead)
def get_infaq_summary(
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Tracking total infaq/sedekah yang terkumpul (all-time & bulan ini) - B-21.
    """
    now = datetime.utcnow()
    all_infaq_payments = session.exec(
        select(Payment).where(Payment.infaq_amount > 0).order_by(Payment.created_at.desc())
    ).all()

    total_all_time = sum(p.infaq_amount for p in all_infaq_payments)
    
    this_month_payments = [
        p for p in all_infaq_payments 
        if p.created_at.year == now.year and p.created_at.month == now.month
    ]
    total_this_month = sum(p.infaq_amount for p in this_month_payments)

    recent = [PaymentRead.model_validate(p) for p in all_infaq_payments[:10]]

    return InfaqSummaryRead(
        total_collected_all_time=total_all_time,
        total_collected_this_month=total_this_month,
        transactions_count=len(all_infaq_payments),
        recent_transactions=recent,
    )


@router.get("/student/{student_id}/history", response_model=List[PaymentRead])
def get_student_payment_history(
    student_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """
    Riwayat lengkap pembayaran seorang siswa (SPP, Non-SPP, Event, & Infaq) - B-21.
    """
    if user.role != "admin":
        link = session.exec(
            select(ParentStudent).where(
                ParentStudent.parent_id == user.id,
                ParentStudent.student_id == student_id,
            )
        ).first()
        if not link:
            raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke riwayat siswa ini.")

    payments = session.exec(
        select(Payment).where(Payment.student_id == student_id).order_by(Payment.created_at.desc())
    ).all()

    return [PaymentRead.model_validate(p) for p in payments]


@router.post("/{id}/void", response_model=Dict[str, Any])
def void_payment_by_id(
    id: int,
    payload: Dict[str, str],
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Pembatalan pembayaran (Void) oleh admin berdasarkan ID payment - B-27.
    Otomatis mengubah status kuitansi menjadi void, merekalkulasi sisa tagihan & progres event,
    mencatat audit trail, serta menyiarkan update real-time via SSE.
    """
    payment = session.get(Payment, id)
    if not payment:
        raise HTTPException(status_code=404, detail="Pembayaran tidak ditemukan.")

    receipt = session.exec(select(Receipt).where(Receipt.payment_id == id)).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Kuitansi untuk pembayaran ini tidak ditemukan.")

    if receipt.is_void:
        raise HTTPException(status_code=400, detail="Pembayaran / Kuitansi ini sudah berstatus VOID sebelumnya.")

    reason = payload.get("reason", "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Alasan pembatalan (reason) wajib diisi.")

    now = datetime.utcnow()

    # 1. Update Receipt & Payment Status
    receipt.is_void = True
    receipt.void_reason = reason
    receipt.voided_by = admin.id
    receipt.voided_at = now
    payment.status = PaymentStatus.refunded
    session.add(receipt)
    session.add(payment)

    # 2. Recalculate Bill Status if applicable
    if payment.bill_id:
        bill = session.get(Bill, payment.bill_id)
        if bill:
            bill.total_paid = max(Decimal("0"), bill.total_paid - payment.amount)
            if bill.total_paid == 0:
                bill.status = "unpaid"
            elif bill.total_paid < bill.amount:
                bill.status = "partial"
            bill.updated_at = now
            session.add(bill)

            # 3. Recalculate Event tracking if this was an event bill
            if payment.payment_type == "event" and bill.event_id:
                ev = session.get(Event, bill.event_id)
                if ev:
                    ev.total_collected = max(Decimal("0"), ev.total_collected - payment.amount)
                    ev.updated_at = now
                    session.add(ev)

    # 4. Audit Log
    audit = AuditLog(
        user_id=admin.id,
        action="VOID_PAYMENT",
        entity_type="payment",
        entity_id=payment.id,
        detail=f"Void pembayaran ID {payment.id} (Rp {payment.total_amount:,.2f}). Alasan: {reason}",
    )
    session.add(audit)

    session.commit()
    session.refresh(payment)
    session.refresh(receipt)

    # 5. Broadcast SSE real-time notification
    manager.broadcast_sync("payment_voided", {
        "type": "payment_voided",
        "payment_id": payment.id,
        "receipt_number": receipt.receipt_number,
        "reason": reason,
        "timestamp": now.isoformat(),
    })

    return {
        "status": "success",
        "message": f"Pembayaran ID {payment.id} (Kuitansi {receipt.receipt_number}) berhasil divoid.",
        "payment": PaymentRead.model_validate(payment),
        "receipt": ReceiptRead.model_validate(receipt),
    }


@router.get("", response_model=List[PaymentRead])
@router.get("/", response_model=List[PaymentRead])
def list_all_payments(
    student_id: Optional[int] = None,
    payment_type: Optional[str] = None,
    method: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Menampilkan daftar seluruh pembayaran untuk Admin."""
    query = select(Payment).order_by(Payment.created_at.desc())
    if student_id:
        query = query.where(Payment.student_id == student_id)
    if payment_type:
        query = query.where(Payment.payment_type == payment_type)
    if method:
        query = query.where(Payment.method == method)
    query = query.offset(skip).limit(limit)
    return session.exec(query).all()
