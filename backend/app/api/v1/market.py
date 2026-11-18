from fastapi import APIRouter

router = APIRouter(prefix="/market", tags=["Market"])

@router.get("/status")
def get_market_status():
    return {"status": "open", "exchange": "US Equities & Options"}
