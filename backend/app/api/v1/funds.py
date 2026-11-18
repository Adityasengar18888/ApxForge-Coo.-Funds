from fastapi import APIRouter

router = APIRouter(prefix="/funds", tags=["Funds"])

@router.get("/")
def list_funds():
    return {"funds": ["SPY", "QQQ", "IWM", "VTI", "ARKK"]}
