from fastapi import APIRouter

router = APIRouter(prefix="/stocks", tags=["Stocks"])

@router.get("/")
def list_stocks():
    return {"symbols": ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL"]}
