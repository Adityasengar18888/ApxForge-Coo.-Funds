from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field

class Prediction(SQLModel, table=True):
    __tablename__ = "predictions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    symbol: str = Field(index=True, max_length=20)
    model_name: str = Field(max_length=100)
    task_type: str = Field(default="regression", max_length=50)  # regression, classification, options_pricing
    target_date: Optional[str] = Field(default=None)  # YYYY-MM-DD
    predicted_value: float = Field(...)
    actual_value: Optional[float] = Field(default=None)
    confidence: Optional[float] = Field(default=None)
    features_json: Optional[str] = Field(default=None)
    status: str = Field(default="pending", max_length=20)  # pending, verified, correct, incorrect
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

