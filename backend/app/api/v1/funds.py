from fastapi import APIRouter
from typing import List, Dict, Any
from backend.app.services.data_provider import data_provider

router = APIRouter(prefix="/funds", tags=["Funds"])

FUND_SYMBOLS = ["SPY", "QQQ", "IWM", "VTI", "ARKK", "XLK", "XLF", "XLE", "XLV"]

DEFAULT_FUNDS = {
    "SPY": {"name": "SPDR S&P 500 ETF Trust", "price": 585.40, "change": 2.15, "change_pct": 0.37, "volume": 68420000},
    "QQQ": {"name": "Invesco QQQ Trust Series 1", "price": 492.20, "change": 3.40, "change_pct": 0.70, "volume": 42150000},
    "IWM": {"name": "iShares Russell 2000 ETF", "price": 224.80, "change": -0.85, "change_pct": -0.38, "volume": 28900000},
    "VTI": {"name": "Vanguard Total Stock Market ETF", "price": 286.10, "change": 1.10, "change_pct": 0.39, "volume": 3120000},
    "ARKK": {"name": "ARK Innovation ETF", "price": 54.30, "change": 0.95, "change_pct": 1.78, "volume": 12850000},
    "XLK": {"name": "Technology Select Sector SPDR", "price": 228.60, "change": 1.80, "change_pct": 0.79, "volume": 8450000},
    "XLF": {"name": "Financial Select Sector SPDR", "price": 48.20, "change": -0.15, "change_pct": -0.31, "volume": 34100000},
    "XLE": {"name": "Energy Select Sector SPDR", "price": 91.50, "change": -0.45, "change_pct": -0.49, "volume": 16200000},
    "XLV": {"name": "Health Care Select Sector SPDR", "price": 146.90, "change": 0.30, "change_pct": 0.20, "volume": 7890000},
}

@router.get("")
@router.get("/")
def get_funds_list():
    funds = []
    for sym in FUND_SYMBOLS:
        default_info = DEFAULT_FUNDS.get(sym, {
            "name": f"{sym} Exchange Traded Fund",
            "price": 100.0,
            "change": 0.5,
            "change_pct": 0.5,
            "volume": 1000000
        })
        try:
            q = data_provider.get_quote(sym)
            funds.append({
                "symbol": sym,
                "name": default_info["name"],
                "price": round(float(q.get("price", default_info["price"])), 2),
                "change": round(float(q.get("change", default_info["change"])), 2),
                "change_pct": round(float(q.get("change_pct", default_info["change_pct"])), 2),
                "volume": int(q.get("volume", default_info["volume"]))
            })
        except Exception:
            funds.append({
                "symbol": sym,
                "name": default_info["name"],
                "price": default_info["price"],
                "change": default_info["change"],
                "change_pct": default_info["change_pct"],
                "volume": default_info["volume"]
            })
    return funds
