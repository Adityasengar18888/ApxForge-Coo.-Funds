from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.app.models.user import User

class Portfolio(SQLModel, table=True):
    __tablename__ = "portfolios"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    symbol: str = Field(index=True, max_length=20)
    asset_type: str = Field(default="stock", max_length=20)  # stock, fund, option
    shares: float = Field(default=0.0)
    avg_cost: float = Field(default=0.0)
    target_allocation_pct: float = Field(default=0.0)
    notes: Optional[str] = Field(default=None)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: Optional["User"] = Relationship(back_populates="portfolios")

