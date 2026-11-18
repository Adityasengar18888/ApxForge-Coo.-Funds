from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "ApxForge Funds Analytics & Risk Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # Security & Auth
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Seed Admin Defaults
    DEFAULT_ADMIN_USER: str = "admin"
    DEFAULT_ADMIN_PASSWORD: str = "admin123"
    DEFAULT_ADMIN_EMAIL: str = "admin@apxforge.local"

    # Database
    DATABASE_URL: str = "sqlite:///./apxforge.db"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    # Data & Market
    USE_MOCK_DATA: bool = False
    RISK_FREE_RATE: float = 0.05
    TRADING_DAYS: int = 252
    DEFAULT_TICKERS: List[str] = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL"]

    # AI & External APIs
    GEMINI_API_KEY: Optional[str] = None
    REDIS_URL: Optional[str] = None


settings = Settings()
