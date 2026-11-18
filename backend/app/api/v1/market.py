from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from backend.app.services.data_provider import data_provider, get_data_provider
from backend.app.services.pricing import black_scholes_call, black_scholes_put, calculate_greeks, delta_hedge, approximate_vol_surface
from backend.app.services.indicators import historical_volatility, compute_all_indicators
from backend.app.services.scoring import calculate_ml_risk_score

router = APIRouter(prefix="/market", tags=["Market"])

@router.get("/status")
def get_market_status():
    return {
        "status": "open",
        "market": "US Equities & Options",
        "benchmark": "SPY",
        "risk_free_rate": 0.05
    }

@router.get("/quote/{symbol}")
def get_quote(symbol: str, refresh: bool = False):
    try:
        quote = data_provider.get_quote(symbol)
        return quote
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quote: {str(e)}")

@router.get("/history/{symbol}")
def get_history(symbol: str, period: str = "1y", refresh: bool = False):
    try:
        df = data_provider.get_history(symbol, period=period)
        if df.empty:
            raise HTTPException(status_code=404, detail="No historical data found")

        df_indicators = compute_all_indicators(df)
        hist_vol = historical_volatility(df["returns"])

        # Format rows for JSON
        records = []
        for idx, row in df_indicators.iterrows():
            date_str = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)
            records.append({
                "date": date_str,
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row.get("Volume", 0)),
                "rsi": round(float(row.get("RSI", 50.0)), 2) if not pd.isna(row.get("RSI")) else 50.0,
                "macd": round(float(row.get("MACD", 0.0)), 3) if not pd.isna(row.get("MACD")) else 0.0,
                "macd_signal": round(float(row.get("MACD_signal", 0.0)), 3) if not pd.isna(row.get("MACD_signal")) else 0.0,
                "macd_hist": round(float(row.get("MACD_hist", 0.0)), 3) if not pd.isna(row.get("MACD_hist")) else 0.0,
                "bb_upper": round(float(row.get("BB_upper", 0.0)), 2) if not pd.isna(row.get("BB_upper")) else 0.0,
                "bb_middle": round(float(row.get("BB_middle", 0.0)), 2) if not pd.isna(row.get("BB_middle")) else 0.0,
                "bb_lower": round(float(row.get("BB_lower", 0.0)), 2) if not pd.isna(row.get("BB_lower")) else 0.0,
                "sma_20": round(float(row.get("SMA_20", 0.0)), 2) if not pd.isna(row.get("SMA_20")) else 0.0,
                "sma_50": round(float(row.get("SMA_50", 0.0)), 2) if not pd.isna(row.get("SMA_50")) else 0.0,
            })

        return {
            "symbol": symbol.upper(),
            "period": period,
            "historical_volatility": round(float(hist_vol), 4),
            "data": records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

@router.get("/fundamentals/{symbol}")
def get_fundamentals(symbol: str):
    try:
        return data_provider.get_fundamentals(symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/options/{symbol}")
def get_option_chain(symbol: str):
    try:
        df = data_provider.get_option_chain(symbol)
        if df.empty:
            return {"symbol": symbol.upper(), "expiries": [], "options": []}

        expiries = sorted(list(df["expiry"].unique())) if "expiry" in df.columns else []
        options = df.to_dict(orient="records")

        return {
            "symbol": symbol.upper(),
            "expiries": expiries,
            "options": options[:100]  # top 100 contracts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/price-option")
def calculate_option(
    spot: float,
    strike: float,
    maturity_days: int,
    volatility: float,
    risk_free_rate: float = 0.05,
    option_type: str = "call",
    sensitivity: float = 1.0
):
    T = maturity_days / 365.0
    if option_type.lower() == "call":
        bs_price = black_scholes_call(spot, strike, T, risk_free_rate, volatility)
    else:
        bs_price = black_scholes_put(spot, strike, T, risk_free_rate, volatility)

    greeks = calculate_greeks(spot, strike, T, risk_free_rate, volatility, option_type=option_type)
    hedge = delta_hedge(greeks["delta"])

    risk_score, risk_factors = calculate_ml_risk_score(
        spot, strike, T, volatility, greeks, option_type=option_type, sensitivity=sensitivity
    )

    # Payoff curve simulation
    price_range = np.linspace(spot * 0.7, spot * 1.3, 50)
    payoffs = []
    for p in price_range:
        val = max(p - strike, 0) - bs_price if option_type.lower() == "call" else max(strike - p, 0) - bs_price
        payoffs.append({"price": round(float(p), 2), "pnl": round(float(val), 2)})

    return {
        "theoretical_price": round(float(bs_price), 4),
        "greeks": {k: round(float(v), 5) for k, v in greeks.items()},
        "delta_hedge_shares": round(float(hedge), 4),
        "risk_score": round(float(risk_score), 1),
        "risk_level": "HIGH" if risk_score >= 70 else ("MEDIUM" if risk_score >= 40 else "LOW"),
        "risk_factors": {k: round(float(v), 1) for k, v in risk_factors.items()},
        "payoff_curve": payoffs
    }
