from fastapi import APIRouter
from typing import List, Dict, Any
from backend.app.services.data_provider import data_provider
from backend.app.core.config import settings

router = APIRouter(prefix="/stocks", tags=["Stocks"])

@router.get("/")
def get_featured_stocks():
    symbols = settings.DEFAULT_TICKERS
    quotes = []
    for s in symbols:
        try:
            q = data_provider.get_quote(s)
            quotes.append(q)
        except Exception:
            pass
    return quotes

@router.get("/{symbol}")
def get_stock_detail(symbol: str):
    symbol = symbol.upper()
    quote = data_provider.get_quote(symbol)
    fundamentals = data_provider.get_fundamentals(symbol)
    return {
        "quote": quote,
        "fundamentals": fundamentals
    }
