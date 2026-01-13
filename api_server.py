from fastapi import FastAPI
from src.api.routes import router

app = FastAPI(
    title="Option Pricing & Risk Engine",
    description="Live Black–Scholes pricing with Greeks and hedging",
    version="1.0"
)

app.include_router(router)
