from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.app.models.user import User

class Watchlist(SQLModel, table=True):
    __tablename__ = "watchlists"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    symbol: str = Field(index=True, max_length=20)
    name: Optional[str] = Field(default=None, max_length=100)
    asset_type: str = Field(default="stock", max_length=20)  # stock, fund, option
    notes: Optional[str] = Field(default=None)
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: Optional["User"] = Relationship(back_populates="watchlists")

