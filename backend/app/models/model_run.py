from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field

class ModelRun(SQLModel, table=True):
    __tablename__ = "model_runs"

    id: Optional[int] = Field(default=None, primary_key=True)
    model_name: str = Field(index=True, max_length=100)
    version: str = Field(default="1.0.0", max_length=20)
    task_type: str = Field(max_length=50)  # regression, classification, clustering, time_series
    dataset_name: str = Field(max_length=100)
    metrics_json: str = Field(default="{}")  # RMSE, MAE, R2, Accuracy, etc.
    hyperparameters_json: str = Field(default="{}")
    artifact_path: Optional[str] = Field(default=None, max_length=255)
    trained_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = Field(default="ready", max_length=20)  # training, ready, failed

