from datetime import datetime
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session
from app.models import User, AuditLog
from app.dependencies import require_admin

router = APIRouter()


class AuditLogRead(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    detail: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any])
def get_audit_logs(
    user_id: Optional[int] = Query(None, description="Filter by User ID"),
    action: Optional[str] = Query(None, description="Filter by Action Type"),
    entity_type: Optional[str] = Query(None, description="Filter by Entity Type (payment, receipt, bill, etc)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Mengambil daftar audit logs untuk pengawasan keamanan (Admin Only) - B-25.
    Mendukung filter berdasarkan user_id, action, entity_type, dan rentang tanggal serta paginasi.
    Read-only (tidak ada endpoint edit/delete).
    """
    query = select(AuditLog)

    if user_id is not None:
        query = query.where(AuditLog.user_id == user_id)
    if action:
        query = query.where(AuditLog.action == action)
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    if start_date:
        try:
            dt_start = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.where(AuditLog.created_at >= dt_start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Format start_date tidak valid (harus YYYY-MM-DD)")
    if end_date:
        try:
            # Set to end of day 23:59:59
            dt_end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            query = query.where(AuditLog.created_at <= dt_end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Format end_date tidak valid (harus YYYY-MM-DD)")

    # Hitung total untuk pagination info
    all_logs = session.exec(query).all()
    total_count = len(all_logs)

    # Apply order and pagination
    query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    logs = session.exec(query).all()

    return {
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "data": [AuditLogRead.model_validate(l) for l in logs],
    }
