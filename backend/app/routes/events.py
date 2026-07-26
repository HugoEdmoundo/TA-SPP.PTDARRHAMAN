from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select

from app.database import get_session
from app.models import Event, Bill, Student, Payment, User, AuditLog, PaymentStatus
from app.schemas.events import (
    EventCreate,
    EventUpdate,
    EventRead,
    StudentTrackingItem,
    EventTrackingResponse,
    InstallmentSummary,
    StudentHistoryItem,
    EventHistoryResponse,
)
from app.dependencies import require_admin

router = APIRouter(dependencies=[Depends(require_admin)])


# ─── Event History (B-16) ────────────────────────────────────
# NOTE: Harus di atas sebelum rute berparameter /{id} agar "/history" tidak dianggap id

@router.get("/history", response_model=List[EventRead])
def list_completed_events(session: Session = Depends(get_session)):
    """Menampilkan daftar seluruh event yang sudah selesai (completed) - B-16."""
    return session.exec(select(Event).where(Event.status == "completed").order_by(Event.id.desc())).all()


@router.get("/{id}/history", response_model=EventHistoryResponse)
def get_event_history_detail(id: int, session: Session = Depends(get_session)):
    """
    Melihat detail event yang selesai beserta ringkasan cicilan/pembayaran per siswa (B-16).
    """
    event = session.get(Event, id)
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan.")

    bills = session.exec(select(Bill).where(Bill.event_id == id)).all()
    students_history = []

    for bill in bills:
        student = session.get(Student, bill.student_id)
        if not student:
            continue

        payments = session.exec(
            select(Payment).where(
                Payment.bill_id == bill.id,
                Payment.status == PaymentStatus.paid,
            ).order_by(Payment.created_at.desc())
        ).all()

        installments = [
            InstallmentSummary(
                payment_id=p.id,
                date=p.created_at,
                amount=p.amount,
                method=p.method,
            )
            for p in payments
        ]

        total_paid = sum(p.amount for p in payments)

        students_history.append(
            StudentHistoryItem(
                student_id=student.id,
                name=student.full_name,
                nis=student.nis,
                total_paid=total_paid,
                total_installments=len(installments),
                installments=installments,
            )
        )

    return EventHistoryResponse(event=EventRead.model_validate(event), students=students_history)


# ─── Event Tracking & Complete (B-15) ────────────────────────

@router.get("/{id}/tracking", response_model=EventTrackingResponse)
def track_event_progress(id: int, session: Session = Depends(get_session)):
    """
    Melacak progres pengumpulan dana event per siswa (target, terkumpul, sisa, jumlah cicilan) - B-15.
    """
    event = session.get(Event, id)
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan.")

    bills = session.exec(select(Bill).where(Bill.event_id == id)).all()
    students_tracking = []
    total_collected = Decimal(0)

    for bill in bills:
        student = session.get(Student, bill.student_id)
        if not student:
            continue

        # Hitung jumlah cicilan dari tabel Payment yang valid/paid
        payment_count = session.exec(
            select(Payment).where(
                Payment.bill_id == bill.id,
                Payment.status == PaymentStatus.paid,
            )
        ).all()

        paid = bill.amount - bill.remaining_amount
        total_collected += paid

        students_tracking.append(
            StudentTrackingItem(
                student_id=student.id,
                name=student.full_name,
                nis=student.nis,
                target=bill.amount,
                paid=paid,
                remaining=bill.remaining_amount,
                installment_count=len(payment_count),
                status=bill.status,
            )
        )

    progress_pct = float(total_collected / event.total_target * 100) if event.total_target > 0 else 0.0

    return EventTrackingResponse(
        event=EventRead.model_validate(event),
        total_target=event.total_target,
        total_collected=total_collected,
        progress_pct=round(progress_pct, 2),
        students=students_tracking,
    )


@router.post("/{id}/complete", response_model=EventRead)
def complete_event(
    id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Menandai event yang sedang aktif menjadi selesai ('completed') - B-15.
    Catatan: Event dengan status 'draft' tidak dapat langsung diselesaikan.
    """
    event = session.get(Event, id)
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan.")

    if event.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hanya event dengan status 'active' yang dapat diselesaikan. Status saat ini: '{event.status}'.",
        )

    event.status = "completed"
    event.updated_at = datetime.utcnow()
    session.add(event)
    session.commit()
    session.refresh(event)

    audit = AuditLog(
        user_id=admin.id,
        action="COMPLETE_EVENT",
        entity_type="event",
        entity_id=event.id,
        detail=f"Admin menyelesaikan event ID {event.id} ('{event.name}').",
    )
    session.add(audit)
    session.commit()

    return event


# ─── Event CRUD (B-14) ───────────────────────────────────────

@router.get("/", response_model=List[EventRead])
def list_events(
    status: Optional[str] = Query(None, description="Filter status ('draft', 'active', 'completed')"),
    session: Session = Depends(get_session),
):
    """Menampilkan daftar kegiatan/event patungan sekolah."""
    query = select(Event).order_by(Event.id.desc())
    if status:
        query = query.where(Event.status == status)
    return session.exec(query).all()


@router.post("/", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Membuat event patungan baru dan otomatis menghasilkan tagihan (bill_type='event') 
    untuk seluruh siswa yang terdaftar dalam student_ids - B-14.
    """
    total_target = payload.per_student_amount * len(payload.student_ids)

    event = Event(
        name=payload.name,
        description=payload.description,
        per_student_amount=payload.per_student_amount,
        total_target=total_target,
        deadline=payload.deadline,
        allow_installment=payload.allow_installment,
        min_installment_amount=payload.min_installment_amount,
        status="active",
    )
    session.add(event)
    session.commit()
    session.refresh(event)

    created_bills = 0
    for sid in payload.student_ids:
        student = session.get(Student, sid)
        if not student:
            continue
        bill = Bill(
            student_id=sid,
            event_id=event.id,
            bill_type="event",
            label=event.name,
            description=event.description,
            amount=event.per_student_amount,
            due_date=event.deadline,
            status="unpaid",
        )
        session.add(bill)
        created_bills += 1

    session.commit()

    audit = AuditLog(
        user_id=admin.id,
        action="CREATE_EVENT",
        entity_type="event",
        entity_id=event.id,
        detail=f"Admin membuat event '{event.name}' dengan {created_bills} tagihan siswa.",
    )
    session.add(audit)
    session.commit()

    return event


@router.get("/{id}", response_model=EventRead)
def get_event_detail(id: int, session: Session = Depends(get_session)):
    """Melihat detail satu event."""
    event = session.get(Event, id)
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan.")
    return event


@router.put("/{id}", response_model=EventRead)
def update_event(
    id: int,
    payload: EventUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Memperbarui informasi event.
    Catatan: Hanya event dengan status 'draft' atau 'active' yang dapat diperbarui.
    """
    event = session.get(Event, id)
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan.")

    if event.status not in ["draft", "active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Event dengan status '{event.status}' tidak dapat diubah.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(event, key, val)

    event.updated_at = datetime.utcnow()
    session.add(event)

    # Jika nama atau deadline berubah, update juga bill terkait yang belum lunas
    if payload.name or payload.deadline:
        bills = session.exec(select(Bill).where(Bill.event_id == id, Bill.status != "paid")).all()
        for b in bills:
            if payload.name:
                b.label = payload.name
            if payload.deadline:
                b.due_date = payload.deadline
            b.updated_at = datetime.utcnow()
            session.add(b)

    session.commit()
    session.refresh(event)

    audit = AuditLog(
        user_id=admin.id,
        action="UPDATE_EVENT",
        entity_type="event",
        entity_id=event.id,
        detail=f"Admin memperbarui event ID {event.id} ('{event.name}').",
    )
    session.add(audit)
    session.commit()

    return event


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_event(
    id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Menghapus event beserta seluruh tagihan siswanya.
    Catatan: Hanya event dengan status 'draft' yang dapat dihapus. Event aktif harus dibatalkan/diselesaikan.
    """
    event = session.get(Event, id)
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan.")

    if event.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hanya event dengan status 'draft' yang dapat dihapus. Event aktif atau selesai tidak dapat dihapus.",
        )

    name_bkp = event.name
    bills = session.exec(select(Bill).where(Bill.event_id == id)).all()
    for b in bills:
        session.delete(b)
        
    session.delete(event)
    session.commit()

    audit = AuditLog(
        user_id=admin.id,
        action="DELETE_EVENT",
        entity_type="event",
        entity_id=id,
        detail=f"Admin menghapus event draft ID {id} ('{name_bkp}').",
    )
    session.add(audit)
    session.commit()

    return {"status": "ok", "message": f"Event '{name_bkp}' dan seluruh tagihan terkait berhasil dihapus."}
