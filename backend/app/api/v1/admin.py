import os
import sys
import psutil
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select

from backend.app.core.deps import get_current_active_admin
from backend.app.core.config import settings
from backend.app.core.scheduler import scheduler
from backend.app.db.session import get_session
from backend.app.models.user import User
from backend.app.models.audit import AuditLog
from backend.app.ml.train import train_and_register_all

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
        "must_change_password": u.must_change_password,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    } for u in users]

@router.post("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    current_admin: User = Depends(get_current_active_admin),
    session: Session = Depends(get_session)
):
    target = session.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrative account")

    target.is_active = not target.is_active
    session.add(target)

    audit = AuditLog(
        user_id=current_admin.id,
        action="USER_STATUS_TOGGLE",
        details=f"User {target.username} active status set to {target.is_active}",
        ip_address="127.0.0.1"
    )
    session.add(audit)
    session.commit()
    return {"status": "success", "user_id": user_id, "is_active": target.is_active}

@router.post("/users/{user_id}/reset-password-flag")
def reset_password_flag(
    user_id: int,
    current_admin: User = Depends(get_current_active_admin),
    session: Session = Depends(get_session)
):
    target = session.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.must_change_password = True
    session.add(target)

    audit = AuditLog(
        user_id=current_admin.id,
        action="FORCE_PASSWORD_CHANGE",
        details=f"Flagged must_change_password for user {target.username}",
        ip_address="127.0.0.1"
    )
    session.add(audit)
    session.commit()
    return {"status": "success", "user_id": user_id, "must_change_password": True}

@router.post("/models/retrain")
def trigger_retraining(
    background_tasks: BackgroundTasks,
    current_admin: User = Depends(get_current_active_admin),
    session: Session = Depends(get_session)
):
    def run_training_job():
        try:
            train_and_register_all()
        except Exception as e:
            print(f"Retraining error: {e}")

    background_tasks.add_task(run_training_job)

    audit = AuditLog(
        user_id=current_admin.id,
        action="MODEL_RETRAINING_TRIGGERED",
        details="Triggered asynchronous training pipeline for pricing & classification models",
        ip_address="127.0.0.1"
    )
    session.add(audit)
    session.commit()

    return {
        "status": "triggered",
        "message": "Retraining job queued successfully. Check Model Lab for updated registry artifacts.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/audit-logs")
def get_audit_logs(
    current_admin: User = Depends(get_current_active_admin),
    session: Session = Depends(get_session)
):
    logs = session.exec(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(100)).all()
    return [{
        "id": l.id,
        "user_id": l.user_id,
        "action": l.action,
        "details": l.details,
        "ip_address": l.ip_address,
        "created_at": l.created_at.isoformat() if l.created_at else None,
    } for l in logs]

@router.get("/diagnostics")
def get_system_diagnostics(
    current_admin: User = Depends(get_current_active_admin)
):
    try:
        proc = psutil.Process()
        mem_info = proc.memory_info()
        cpu_pct = psutil.cpu_percent(interval=None)
        mem_pct = psutil.virtual_memory().percent
    except Exception:
        mem_info = None
        cpu_pct = 0.0
        mem_pct = 0.0

    # DB file size
    db_path = "apxforge.db"
    db_size_kb = round(os.path.getsize(db_path) / 1024, 2) if os.path.exists(db_path) else 0.0

    # APScheduler active jobs
    jobs = []
    if scheduler.running:
        for j in scheduler.get_jobs():
            jobs.append({
                "id": j.id,
                "name": j.name,
                "next_run_time": j.next_run_time.isoformat() if j.next_run_time else None
            })

    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "python_version": sys.version.split(" ")[0],
        "database": {
            "type": "SQLite / SQLModel",
            "file": db_path,
            "size_kb": db_size_kb,
        },
        "system_metrics": {
            "process_rss_mb": round(mem_info.rss / (1024 * 1024), 2) if mem_info else 0.0,
            "cpu_usage_pct": cpu_pct,
            "system_ram_pct": mem_pct,
        },
        "scheduler": {
            "is_running": scheduler.running,
            "jobs_count": len(jobs),
            "jobs": jobs,
        }
    }
