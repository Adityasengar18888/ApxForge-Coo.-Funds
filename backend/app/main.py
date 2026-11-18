from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.core.scheduler import start_scheduler, shutdown_scheduler
from backend.app.db.init_db import init_db
from backend.app.api.v1 import (
    auth,
    market,
    stocks,
    funds,
    screener,
    compare,
    portfolio,
    predict,
    model_lab,
    stats_lab,
    backtest,
    news,
    alerts,
    admin,
    reports
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing ApxForge Funds backend database...")
    init_db()
    start_scheduler()
    logger.info("ApxForge Funds backend startup complete.")
    yield
    # Shutdown
    logger.info("Shutting down ApxForge Funds backend...")
    shutdown_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-performance Quantitative Options Analytics, Risk Engine & ML Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

# Include API v1 routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(market.router, prefix=settings.API_V1_STR)
app.include_router(stocks.router, prefix=settings.API_V1_STR)
app.include_router(funds.router, prefix=settings.API_V1_STR)
app.include_router(screener.router, prefix=settings.API_V1_STR)
app.include_router(compare.router, prefix=settings.API_V1_STR)
app.include_router(portfolio.router, prefix=settings.API_V1_STR)
app.include_router(predict.router, prefix=settings.API_V1_STR)
app.include_router(model_lab.router, prefix=settings.API_V1_STR)
app.include_router(stats_lab.router, prefix=settings.API_V1_STR)
app.include_router(backtest.router, prefix=settings.API_V1_STR)
app.include_router(news.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
