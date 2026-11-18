from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.app.models.user import User

class Alert(SQLModel, table=True):
    __tablename__ = "alerts"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    symbol: str = Field(index=True, max_length=20)
    alert_type: str = Field(max_length=50)  # price_above, price_below, rsi_overbought, rsi_oversold, confidence_threshold
    condition: str = Field(max_length=20)  # >, <, >=, <=, cross_above, cross_below
    threshold: float = Field(...)
    is_triggered: bool = Field(default=False)
    triggered_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: Optional["User"] = Relationship(back_populates="alerts")

