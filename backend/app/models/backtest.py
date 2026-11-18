from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.app.models.user import User

class Backtest(SQLModel, table=True):
    __tablename__ = "backtests"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    strategy_name: str = Field(max_length=100)
    symbol: str = Field(index=True, max_length=20)
    start_date: str = Field(max_length=20)
    end_date: str = Field(max_length=20)
    initial_capital: float = Field(default=10000.0)
    final_value: float = Field(default=10000.0)
    cagr: float = Field(default=0.0)
    sharpe_ratio: float = Field(default=0.0)
    sortino_ratio: float = Field(default=0.0)
    max_drawdown: float = Field(default=0.0)
    win_rate: float = Field(default=0.0)
    total_trades: int = Field(default=0)
    trades_json: str = Field(default="[]")
    equity_curve_json: str = Field(default="[]")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: Optional["User"] = Relationship(back_populates="backtests")

