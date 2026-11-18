from fastapi import APIRouter

router = APIRouter(prefix="/backtest", tags=["Backtesting"])

@router.get("/")
def list_backtests():
    return {"backtests": []}
