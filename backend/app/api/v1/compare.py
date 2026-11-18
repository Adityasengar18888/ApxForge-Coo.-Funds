from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
import pandas as pd
import numpy as np
from backend.app.services.data_provider import data_provider

router = APIRouter(prefix="/compare", tags=["Compare"])

@router.get("/")
def compare_symbols(symbols: str = Query(..., description="Comma-separated symbols, up to 5")):
    sym_list = [s.strip().upper() for s in symbols.split(",") if s.strip()][:5]
    if not sym_list:
        raise HTTPException(status_code=400, detail="No symbols provided")

    normalized_data = []
    series_map: Dict[str, pd.Series] = {}

    for sym in sym_list:
        try:
            df = data_provider.get_history(sym, period="1y")
            if not df.empty:
                close = df["Close"]
                # Normalize starting at 100
                first_val = close.iloc[0]
                norm_series = (close / first_val) * 100.0
                series_map[sym] = norm_series
        except Exception:
            pass

    if not series_map:
        raise HTTPException(status_code=404, detail="No data available for provided symbols")

    combined_df = pd.DataFrame(series_map).dropna()

    for idx, row in combined_df.iterrows():
        date_str = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)
        entry: Dict[str, Any] = {"date": date_str}
        for sym in sym_list:
            if sym in row:
                entry[sym] = round(float(row[sym]), 2)
        normalized_data.append(entry)

    # Summary metrics per symbol
    summaries = []
    for sym in sym_list:
        if sym in series_map:
            s = series_map[sym]
            cagr = ((s.iloc[-1] / s.iloc[0]) ** (252 / max(1, len(s))) - 1) * 100.0
            summaries.append({
                "symbol": sym,
                "current_normalized": round(float(s.iloc[-1]), 2),
                "total_return_pct": round(float(s.iloc[-1] - 100.0), 2),
                "annualized_return_pct": round(float(cagr), 2)
            })

    return {
        "symbols": sym_list,
        "timeline": normalized_data,
        "summaries": summaries
    }
