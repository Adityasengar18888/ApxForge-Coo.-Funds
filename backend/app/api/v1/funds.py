from fastapi import APIRouter
from typing import List, Dict, Any
from backend.app.services.data_provider import data_provider

router = APIRouter(prefix="/funds", tags=["Funds"])

FUND_SYMBOLS = ["SPY", "QQQ", "IWM", "VTI", "ARKK", "XLK", "XLF", "XLE", "XLV"]

@router.get("/")
def get_funds_list():
    funds = []
    for sym in FUND_SYMBOLS:
        try:
            q = data_provider.get_quote(sym)
            funds.append({
                "symbol": sym,
                "name": f"{sym} Exchange Traded Fund",
                "price": q["price"],
                "change": q["change"],
                "change_pct": q["change_pct"],
                "volume": q["volume"]
            })
        except Exception:
            pass
    return funds
