import json
import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models import (
    Student, Bill, Payment, Receipt, GatewayTransaction, AuditLog, SchoolSetting
)
from app.schemas.payments import PaymentItemRequest, GatewayCreateRequest, GatewayCreateResponse
from app.routes.sse import manager
from app.services.payment_gateway import create_external_checkout
from app.services.notification import send_payment_success_notification


def generate_receipt_number(session: Session, year: int, month: int) -> str:
    """
    Generate nomor kuitansi unik format: KWT/{year}/{month:02d}/{sequence:04d}.
    Menggunakan pencarian max sequence dan verifikasi keberadaan agar tahan terhadap delesi & konkurensi.
    """
    prefix = f"KWT/{year}/{month:02d}/"
    receipts = session.exec(
        select(Receipt).where(Receipt.receipt_number.startswith(prefix))
    ).all()
    max_seq = 0
    for r in receipts:
        try:
            seq_str = r.receipt_number.split("/")[-1]
            seq_val = int(seq_str)
            if seq_val > max_seq:
                max_seq = seq_val
        except (ValueError, IndexError):
            pass
    next_seq = max_seq + 1
    while True:
        candidate = f"{prefix}{next_seq:04d}"
        existing = session.exec(select(Receipt).where(Receipt.receipt_number == candidate)).first()
        if not existing:
            return candidate
        next_seq += 1


def create_gateway_checkout_session(
    session: Session,
    payload: GatewayCreateRequest,
) -> GatewayCreateResponse:
    """
    Membuat sesi checkout pembayaran online (Midtrans / Xendit / Simulator) - B-18, B-22.
    """
    student = session.get(Student, payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")

    total_items_amount = sum(item.amount for item in payload.items)
    total_amount = total_items_amount + payload.infaq_amount

    if total_amount <= 0:
        raise HTTPException(status_code=400, detail="Total pembayaran harus lebih besar dari 0.")

    now = datetime.utcnow()
    timestamp_str = now.strftime("%Y%m%d%H%M%S")
    trx_id = f"TRX-{timestamp_str}-{payload.student_id}-{uuid.uuid4().hex[:4]}"

    items_json_str = json.dumps([item.model_dump(mode="json") for item in payload.items])

    redirect_url, external_id = create_external_checkout(
        session=session,
        trx_id=trx_id,
        student_id=payload.student_id,
        total_amount=total_amount,
        gateway_name=payload.gateway_name,
        student_name=student.full_name,
        student_email=f"{student.nis}@ptdarrahman.sch.id",
    )

    gw_tx = GatewayTransaction(
        transaction_id=trx_id,
        student_id=payload.student_id,
        gateway_name=payload.gateway_name,
        checkout_url=redirect_url,
        total_amount=total_amount,
        infaq_amount=payload.infaq_amount,
        items_json=items_json_str,
        status="pending",
        created_at=now,
        updated_at=now,
    )
    session.add(gw_tx)
    session.commit()
    session.refresh(gw_tx)

    return GatewayCreateResponse(
        transaction_id=gw_tx.transaction_id,
        redirect_url=redirect_url,
        total_amount=gw_tx.total_amount,
        infaq_amount=gw_tx.infaq_amount,
        status=gw_tx.status,
    )


def process_payment_items(
    session: Session,
    student_id: int,
    items: List[PaymentItemRequest],
    infaq_amount: Decimal,
    method: str,
    channel: str,
    gateway_trx_id: Optional[str] = None,
    created_by: Optional[int] = None,
    notes: Optional[str] = None,
) -> List[Payment]:
    """
    Memproses daftar item tagihan yang dibayar (manual atau dari callback gateway).
    Membuat record Payment & Receipt, mengupdate status Bill jika non-spp/event,
    dan memicu broadcast SSE real-time (B-18, B-19, B-21, B-22).
    """
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")

    created_payments = []
    remaining_infaq = infaq_amount
    total_paid_in_tx = Decimal("0")

    now = datetime.utcnow()
    year = now.year
    month = now.month

    for idx, item in enumerate(items):
        item_infaq = remaining_infaq if idx == 0 else Decimal("0")
        item_total = item.amount + item_infaq
        total_paid_in_tx += item_total

        if item.type == "spp":
            if not item.month or not item.year:
                raise HTTPException(status_code=400, detail="Bulan dan tahun wajib diisi untuk pembayaran SPP.")
            
            # Cek apakah SPP bulan ini sudah dibayar sebelumnya
            existing_spp = session.exec(
                select(Payment).where(
                    Payment.student_id == student_id,
                    Payment.payment_type == "spp",
                    Payment.spp_month == item.month,
                    Payment.spp_year == item.year,
                )
            ).all()
            paid_spp = sum(p.amount for p in existing_spp)
            
            # Ambil nominal SPP sekolah
            setting = session.exec(select(SchoolSetting).where(SchoolSetting.key == "spp_nominal")).first()
            nominal_spp = Decimal(setting.value) if setting else Decimal("500000")
            
            if paid_spp + item.amount > nominal_spp and paid_spp >= nominal_spp:
                raise HTTPException(
                    status_code=400,
                    detail=f"SPP untuk periode {item.month}/{item.year} sudah lunas."
                )

            payment = Payment(
                student_id=student_id,
                bill_id=None,
                payment_type="spp",
                spp_month=item.month,
                spp_year=item.year,
                amount=item.amount,
                infaq_amount=item_infaq,
                total_amount=item_total,
                method=method,
                channel=channel,
                gateway_transaction_id=gateway_trx_id,
                notes=notes or f"Pembayaran SPP Bulan {item.month} Tahun {item.year}",
                created_by=created_by,
                created_at=now,
            )
            session.add(payment)
            session.flush()

        elif item.type in ("non_spp", "event"):
            if not item.bill_id:
                raise HTTPException(status_code=400, detail=f"bill_id wajib diisi untuk pembayaran {item.type}.")
            
            bill = session.get(Bill, item.bill_id)
            if not bill or bill.student_id != student_id:
                raise HTTPException(status_code=404, detail=f"Tagihan ID {item.bill_id} tidak ditemukan untuk siswa ini.")
            
            if bill.status == "paid":
                raise HTTPException(status_code=400, detail=f"Tagihan '{bill.label}' sudah lunas.")

            if item.amount > bill.remaining_amount:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Nominal bayar melebihi sisa tagihan '{bill.label}'. Sisa: Rp {bill.remaining_amount:,.2f}"
                )

            bill.total_paid += item.amount
            if bill.total_paid >= bill.amount:
                bill.status = "paid"
            elif bill.total_paid > 0:
                bill.status = "partial"
            
            bill.updated_at = now
            session.add(bill)

            payment = Payment(
                student_id=student_id,
                bill_id=bill.id,
                payment_type=item.type,
                amount=item.amount,
                infaq_amount=item_infaq,
                total_amount=item_total,
                method=method,
                channel=channel,
                gateway_transaction_id=gateway_trx_id,
                notes=notes or f"Pembayaran {bill.label}",
                created_by=created_by,
                created_at=now,
            )
            session.add(payment)
            session.flush()
        else:
            raise HTTPException(status_code=400, detail=f"Tipe pembayaran '{item.type}' tidak valid.")

        # Generate Kuitansi untuk setiap payment
        receipt_num = generate_receipt_number(session, year, month)
        receipt = Receipt(
            payment_id=payment.id,
            receipt_number=receipt_num,
            created_at=now,
        )
        session.add(receipt)
        created_payments.append(payment)

    session.commit()
    for p in created_payments:
        session.refresh(p)

    # Broadcast SSE Real-Time Event (B-18)
    manager.broadcast_sync("payment_success", {
        "type": "payment_success",
        "student_id": student_id,
        "total_amount": float(total_paid_in_tx),
        "infaq_amount": float(infaq_amount),
        "channel": channel,
        "transaction_id": gateway_trx_id,
        "timestamp": now.isoformat(),
    })

    # Kirim notifikasi eksternal (WhatsApp / Audit Log)
    if created_payments:
        first_receipt = session.exec(select(Receipt).where(Receipt.payment_id == created_payments[0].id)).first()
        receipt_num = first_receipt.receipt_number if first_receipt else "KWT/ONLINE"
        send_payment_success_notification(
            session=session,
            student_id=student_id,
            total_amount=total_paid_in_tx + infaq_amount,
            receipt_number=receipt_num,
            channel=channel,
            notes=notes,
        )

    return created_payments
