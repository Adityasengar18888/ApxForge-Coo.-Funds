from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from backend.app.core.deps import get_current_active_admin
from backend.app.db.session import get_session
from backend.app.models.user import User
from backend.app.models.audit import AuditLog

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users")
def get_all_users(
    current_admin: User = Depends(get_current_active_admin),
    session: Session = Depends(get_session)
):
    users = session.exec(select(User)).all()
    return [{
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "role": u.role,
        "is_active": u.is_active,
        "must_change_password": u.must_change_password
    } for u in users]

@router.get("/audit-logs")
def get_audit_logs(
    current_admin: User = Depends(get_current_active_admin),
    session: Session = Depends(get_session)
):
    logs = session.exec(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(100)).all()
    return logs
