from datetime import datetime
from typing import Optional, List
from sqlmodel import Session, select
from app.models import AuditLog


def log_action(
    session: Session,
    user_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    detail: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """
    Mencatat aktivitas penting ke dalam audit_logs untuk keperluan keamanan dan tracking (B-25).
    """
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        detail=detail,
        ip_address=ip_address,
        created_at=datetime.utcnow(),
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    return log
