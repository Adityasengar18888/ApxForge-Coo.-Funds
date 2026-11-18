from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    username: Optional[str] = Field(default=None, max_length=50)
    action: str = Field(max_length=100)
    details: Optional[str] = Field(default=None)
    ip_address: Optional[str] = Field(default=None, max_length=45)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
