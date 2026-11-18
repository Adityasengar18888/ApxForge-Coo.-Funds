from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship

class UserBase(SQLModel):
    username: str = Field(index=True, unique=True, max_length=50)
    email: str = Field(index=True, unique=True, max_length=100)
    full_name: Optional[str] = Field(default=None, max_length=100)
    role: str = Field(default="user", max_length=20)  # "admin" or "user"
    is_active: bool = Field(default=True)
    must_change_password: bool = Field(default=False)

class User(UserBase, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = Field(default=None)

    watchlists: List["Watchlist"] = Relationship(back_populates="user")
    portfolios: List["Portfolio"] = Relationship(back_populates="user")
    backtests: List["Backtest"] = Relationship(back_populates="user")
    alerts: List["Alert"] = Relationship(back_populates="user")
