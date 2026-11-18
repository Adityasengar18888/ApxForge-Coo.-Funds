import pytest
import numpy as np
import pandas as pd
from backend.app.services.pricing import black_scholes_call, black_scholes_put, calculate_greeks, delta_hedge
from backend.app.services.indicators import (
    historical_volatility,
    calculate_sma,
    calculate_rsi,
    calculate_macd,
    calculate_bollinger_bands,
    compute_all_indicators
)
from backend.app.services.scoring import (
    calculate_ml_risk_score,
    calculate_sharpe_ratio,
    calculate_sortino_ratio,
    calculate_max_drawdown,
    calculate_var_95
)

def test_pricing_deep():
    # ITM call
    price_itm = black_scholes_call(120, 100, 0.5, 0.05, 0.2)
    assert price_itm > 20.0

    # OTM call
    price_otm = black_scholes_call(80, 100, 0.5, 0.05, 0.2)
    assert price_otm < 5.0

    # Put pricing
    put_itm = black_scholes_put(80, 100, 0.5, 0.05, 0.2)
    assert put_itm > 15.0

    # Greeks
    greeks = calculate_greeks(100, 100, 0.5, 0.05, 0.2, "call")
    assert 0.5 <= greeks["delta"] <= 0.8
    assert greeks["gamma"] > 0
    assert greeks["vega"] > 0
    assert greeks["theta"] < 0

def test_indicators_computation():
    dates = pd.date_range("2025-01-01", periods=100)
    prices = pd.Series(np.linspace(100, 150, 100) + np.random.normal(0, 1, 100), index=dates)
    df = pd.DataFrame({
        "Open": prices * 0.99,
        "High": prices * 1.01,
        "Low": prices * 0.98,
        "Close": prices,
        "Volume": np.random.randint(1000, 5000, 100)
    }, index=dates)

    computed = compute_all_indicators(df)
    assert "SMA_20" in computed.columns
    assert "RSI" in computed.columns
    assert "MACD" in computed.columns
    assert "BB_upper" in computed.columns
    assert "ATR" in computed.columns
    assert "ADX" in computed.columns
    assert "VWAP" in computed.columns

def test_risk_metrics():
    returns = pd.Series(np.random.normal(0.001, 0.015, 252))
    sharpe = calculate_sharpe_ratio(returns)
    sortino = calculate_sortino_ratio(returns)
    var = calculate_var_95(returns, 10000.0)

    assert isinstance(sharpe, float)
    assert isinstance(sortino, float)
    assert "parametric_var_amount" in var
    assert var["parametric_var_amount"] >= 0
