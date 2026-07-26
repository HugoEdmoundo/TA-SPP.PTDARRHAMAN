from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from sqlalchemy import or_

from app.database import get_session
from app.models import Bill, Student, User, AuditLog
from app.schemas.bills import NonSppBillCreate, BillUpdate, BillRead
from app.dependencies import require_admin

router = APIRouter(dependencies=[Depends(require_admin)])


@router.post("/non-spp", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_non_spp_bills(
    payload: NonSppBillCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Admin membuat tagihan Non-SPP (seragam, denda, buku, kegiatan) untuk satu atau banyak siswa sekaligus.
    """
    created_bills = []
    skipped_ids = []

    for sid in payload.student_ids:
        student = session.get(Student, sid)
        if not student:
            skipped_ids.append(sid)
            continue

        bill = Bill(
            student_id=sid,
            bill_type="non_spp",
            category=payload.category,
            label=payload.label,
            description=payload.description,
            amount=payload.amount,
            due_date=payload.due_date,
            attachment_url=payload.attachment_url,
            status="unpaid",
        )
        session.add(bill)
        created_bills.append(bill)

    session.commit()
    for b in created_bills:
        session.refresh(b)

    if len(created_bills) > 0:
        audit = AuditLog(
            user_id=admin.id,
            action="CREATE_NON_SPP_BILLS",
            entity_type="bill",
            entity_id=None,
            detail=f"Admin membuat {len(created_bills)} tagihan Non-SPP ('{payload.label}').",
        )
        session.add(audit)
        session.commit()

    return {
        "status": "ok",
        "created_count": len(created_bills),
        "skipped_ids": skipped_ids,
        "message": f"Berhasil membuat {len(created_bills)} tagihan Non-SPP.",
        "bills": [BillRead.model_validate(b) for b in created_bills],
    }


@router.get("/non-spp", response_model=List[BillRead])
def list_non_spp_bills(
    status: Optional[str] = Query(None, description="Filter status (unpaid/partial/paid)"),
    student_id: Optional[int] = Query(None, description="Filter berdasarkan ID siswa"),
    category: Optional[str] = Query(None, description="Filter berdasarkan kategori (Seragam, Denda, dll)"),
    search: Optional[str] = Query(None, description="Cari label atau deskripsi tagihan"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: Session = Depends(get_session),
):
    """Menampilkan daftar seluruh tagihan Non-SPP dengan filter dan pencarian."""
    query = select(Bill).where(Bill.bill_type == "non_spp").order_by(Bill.id.desc())

    if status:
        query = query.where(Bill.status == status)
    if student_id:
        query = query.where(Bill.student_id == student_id)
    if category:
        query = query.where(Bill.category == category)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                Bill.label.ilike(pattern),
                Bill.description.ilike(pattern),
            )
        )

    query = query.offset(skip).limit(limit)
    bills = session.exec(query).all()
    return bills


@router.get("/non-spp/{id}", response_model=BillRead)
def get_non_spp_bill_detail(id: int, session: Session = Depends(get_session)):
    """Melihat detail satu tagihan Non-SPP."""
    bill = session.exec(select(Bill).where(Bill.id == id, Bill.bill_type == "non_spp")).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Tagihan Non-SPP tidak ditemukan.")
    return bill


@router.put("/non-spp/{id}", response_model=BillRead)
def update_non_spp_bill(
    id: int,
    payload: BillUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Memperbarui tagihan Non-SPP. 
    Catatan: Tagihan yang sudah dibayar (baik lunas maupun sebagian/cicilan) TIDAK dapat diubah.
    """
    bill = session.exec(select(Bill).where(Bill.id == id, Bill.bill_type == "non_spp")).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Tagihan Non-SPP tidak ditemukan.")

    if bill.status != "unpaid" or bill.remaining_amount != bill.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tagihan ini tidak dapat diubah karena sudah ada pembayaran masuk.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(bill, key, val)

    bill.updated_at = datetime.utcnow()
    session.add(bill)
    session.commit()
    session.refresh(bill)

    audit = AuditLog(
        user_id=admin.id,
        action="UPDATE_NON_SPP_BILL",
        entity_type="bill",
        entity_id=bill.id,
        detail=f"Admin memperbarui tagihan Non-SPP ID {bill.id} ('{bill.label}').",
    )
    session.add(audit)
    session.commit()

    return bill


@router.delete("/non-spp/{id}", status_code=status.HTTP_200_OK)
def delete_non_spp_bill(
    id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Menghapus tagihan Non-SPP.
    Catatan: Tagihan yang sudah dibayar (baik lunas maupun sebagian/cicilan) TIDAK dapat dihapus.
    """
    bill = session.exec(select(Bill).where(Bill.id == id, Bill.bill_type == "non_spp")).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Tagihan Non-SPP tidak ditemukan.")

    if bill.status != "unpaid" or bill.remaining_amount != bill.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tagihan ini tidak dapat dihapus karena sudah ada pembayaran masuk.",
        )

    label_bkp = bill.label
    session.delete(bill)
    session.commit()

    audit = AuditLog(
        user_id=admin.id,
        action="DELETE_NON_SPP_BILL",
        entity_type="bill",
        entity_id=id,
        detail=f"Admin menghapus tagihan Non-SPP ID {id} ('{label_bkp}').",
    )
    session.add(audit)
    session.commit()

    return {"status": "ok", "message": f"Tagihan Non-SPP '{label_bkp}' berhasil dihapus."}
