import pytest
import numpy as np
import pandas as pd

# Legacy functions
import src.black_scholes as legacy_bs
import src.greeks as legacy_greeks
import src.hedge as legacy_hedge
import src.volatility as legacy_vol

# Ported modern services
from backend.app.services.pricing import (
    black_scholes_call,
    black_scholes_put,
    calculate_greeks,
    delta_hedge
)
from backend.app.services.indicators import historical_volatility
from backend.app.services.scoring import calculate_ml_risk_score

def test_black_scholes_call_parity():
    test_cases = [
        {"S": 100.0, "K": 100.0, "T": 30/365, "r": 0.05, "sigma": 0.20},
        {"S": 150.0, "K": 140.0, "T": 60/365, "r": 0.04, "sigma": 0.35},
        {"S": 80.0, "K": 95.0, "T": 90/365, "r": 0.02, "sigma": 0.15},
        {"S": 220.5, "K": 220.0, "T": 15/365, "r": 0.05, "sigma": 0.28},
    ]

    for tc in test_cases:
        legacy_price = legacy_bs.call_price(tc["S"], tc["K"], tc["T"], tc["r"], tc["sigma"])
        modern_price = black_scholes_call(tc["S"], tc["K"], tc["T"], tc["r"], tc["sigma"])
        assert np.isclose(legacy_price, modern_price, atol=1e-10), f"Mismatch for {tc}"

def test_put_call_parity():
    # app.py line 677: return call + K * np.exp(-r * T) - S
    S, K, T, r, sigma = 100.0, 100.0, 30/365, 0.05, 0.20
    call = black_scholes_call(S, K, T, r, sigma)
    expected_put = call + K * np.exp(-r * T) - S
    actual_put = black_scholes_put(S, K, T, r, sigma)
    assert np.isclose(expected_put, actual_put, atol=1e-10)

def test_greeks_parity():
    S, K, T, r, sigma = 185.0, 180.0, 45/365, 0.05, 0.25
    leg_delta, leg_theta, leg_vega = legacy_greeks.calculate_greeks(S, K, T, r, sigma)

    modern_greeks = calculate_greeks(S, K, T, r, sigma, option_type="call")

    # Delta parity
    assert np.isclose(leg_delta, modern_greeks["delta"], atol=1e-10)

    # Note: legacy greeks.py theta was annual, app.py theta was divided by 365
    assert np.isclose(leg_theta / 365.0, modern_greeks["theta"], atol=1e-10)

    # Note: legacy greeks.py vega was raw, app.py divided by 100 (1% vol)
    assert np.isclose(leg_vega / 100.0, modern_greeks["vega"], atol=1e-10)

def test_hedge_parity():
    deltas = [0.15, 0.50, 0.85, -0.30]
    for d in deltas:
        assert legacy_hedge.delta_hedge(d) == delta_hedge(d)

def test_volatility_parity():
    np.random.seed(42)
    fake_returns = pd.Series(np.random.normal(0, 0.015, 252))
    legacy_v = legacy_vol.historical_volatility(fake_returns)
    modern_v = historical_volatility(fake_returns)
    assert np.isclose(legacy_v, modern_v, atol=1e-10)

def test_ml_risk_score_parity():
    # Test ATM call
    S, K, T, vol = 100.0, 100.0, 30/365, 0.20
    greeks = calculate_greeks(S, K, T, 0.05, vol, option_type="call")
    score, factors = calculate_ml_risk_score(S, K, T, vol, greeks, option_type="call")

    assert 0 <= score <= 100
    assert factors["moneyness"] == 70.0  # ATM is 70
    assert "time_decay" in factors
    assert "volatility" in factors
    assert "gamma" in factors
    assert "liquidity" in factors
    assert "delta_exposure" in factors
