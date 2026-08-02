from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select

from app.database import get_session
from app.models import User, ParentStudent
from app.dependencies import get_current_user, is_admin_role
from app.services.receipt import generate_receipt_pdf, generate_receipt_image, get_payment_and_receipt_data

router = APIRouter()


def verify_receipt_access(session: Session, user: User, identifier: str):
    """Memvalidasi akses user terhadap kuitansi (Admin / Wali terkait)."""
    try:
        receipt, payment, student, _, _ = get_payment_and_receipt_data(session, identifier)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if not is_admin_role(user.role):
        link = session.exec(
            select(ParentStudent).where(
                ParentStudent.parent_id == user.id,
                ParentStudent.student_id == payment.student_id,
            )
        ).first()
        if not link:
            raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke kuitansi ini.")
    
    return receipt


@router.get("/{identifier:path}/pdf")
def serve_receipt_pdf(
    identifier: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """
    Mengunduh kuitansi dalam format PDF formal untuk arsip - B-23.
    """
    receipt = verify_receipt_access(session, user, identifier)
    try:
        pdf_bytes = generate_receipt_pdf(session, identifier)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal generate PDF: {str(e)}")

    safe_num = receipt.receipt_number.replace("/", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=Kuitansi_{safe_num}.pdf"},
    )


@router.get("/{identifier:path}/image")
def serve_receipt_image(
    identifier: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """
    Mengunduh kuitansi dalam format gambar PNG (WhatsApp-friendly & mobile card) - B-23.
    """
    receipt = verify_receipt_access(session, user, identifier)
    try:
        png_bytes = generate_receipt_image(session, identifier)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal generate PNG image: {str(e)}")

    safe_num = receipt.receipt_number.replace("/", "_")
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=Kuitansi_{safe_num}.png"},
    )
