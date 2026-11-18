from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional
from backend.app.services.data_provider import data_provider
from backend.app.core.config import settings

router = APIRouter(prefix="/screener", tags=["Screener"])

@router.get("/")
def screen_stocks(
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_volume: Optional[int] = None,
    min_pe: Optional[float] = None,
    max_pe: Optional[float] = None,
    sector: Optional[str] = None
):
    symbols = settings.DEFAULT_TICKERS + ["SPY", "QQQ", "IWM"]
    results = []

    for sym in symbols:
        try:
            quote = data_provider.get_quote(sym)
            fund = data_provider.get_fundamentals(sym)

            price = quote["price"]
            vol = quote["volume"]
            pe = fund.get("pe_ratio", 20.0)
            sec = fund.get("sector", "General")

            # SQL-safe in-memory parameter filtering
            if min_price is not None and price < min_price:
                continue
            if max_price is not None and price > max_price:
                continue
            if min_volume is not None and vol < min_volume:
                continue
            if min_pe is not None and pe < min_pe:
                continue
            if max_pe is not None and pe > max_pe:
                continue
            if sector and sector.lower() not in sec.lower():
                continue

            results.append({
                "symbol": sym,
                "price": price,
                "change": quote["change"],
                "change_pct": quote["change_pct"],
                "volume": vol,
                "pe_ratio": pe,
                "market_cap": fund.get("market_cap"),
                "sector": sec
            })
        except Exception:
            pass

    return {
        "total": len(results),
        "results": results
    }

@router.get("/presets")
def get_presets():
    return [
        {"name": "Mega-Cap Tech", "filters": {"sector": "Technology", "min_price": 100}},
        {"name": "High Volume Movers", "filters": {"min_volume": 5000000}},
        {"name": "Value Stocks (Low P/E)", "filters": {"max_pe": 25.0}},
        {"name": "Sub-$200 Opportunities", "filters": {"max_price": 200.0}},
    ]
