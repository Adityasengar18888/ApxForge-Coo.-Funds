import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from backend.app.services.pricing import black_scholes_call, calculate_greeks
from backend.app.services.indicators import compute_all_indicators

def generate_option_samples(
    S: float,
    K: float,
    r: float,
    base_vol: float,
    n: int = 1000
) -> pd.DataFrame:
    """
    100% exact legacy feature_engineering.py generator.
    Simulates Spot, Strike, Expiry, Vol, computes Greeks and noisy MarketPrice.
    """
    rows = []
    for _ in range(n):
        S_ = S * np.random.uniform(0.9, 1.1)
        K_ = K * np.random.uniform(0.9, 1.1)
        T_ = np.random.uniform(0.01, 0.5)
        sigma_ = base_vol * np.random.uniform(0.7, 1.3)

        price = black_scholes_call(S_, K_, T_, r, sigma_)
        greeks = calculate_greeks(S_, K_, T_, r, sigma_, option_type="call")
        delta = greeks["delta"]
        # Legacy greeks.py theta was annual:
        from scipy.stats import norm
        d1 = (np.log(S_ / K_) + (r + 0.5 * sigma_**2) * T_) / (sigma_ * np.sqrt(T_))
        d2 = d1 - sigma_ * np.sqrt(T_)
        legacy_theta = -S_ * norm.pdf(d1) * sigma_ / (2 * np.sqrt(T_)) - r * K_ * np.exp(-r * T_) * norm.cdf(d2)
        legacy_vega = S_ * norm.pdf(d1) * np.sqrt(T_)

        market_price = price + np.random.normal(0, 0.5)
        rows.append([S_, K_, T_, sigma_, delta, legacy_theta, legacy_vega, market_price])

    return pd.DataFrame(
        rows,
        columns=["Spot", "Strike", "T", "Vol", "Delta", "Theta", "Vega", "MarketPrice"]
    )

def extract_time_series_features(
    df: pd.DataFrame,
    lags: List[int] = [1, 2, 3, 5, 10, 21],
    rolling_windows: List[int] = [5, 10, 20, 50]
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Generate momentum, returns, volatility, calendar flags, and lag features.
    """
    data = df.copy()
    close = data["Close"]

    # 1. Returns and Log Returns
    data["return_1d"] = close.pct_change(1)
    data["log_return_1d"] = np.log(close / close.shift(1))
    data["return_5d"] = close.pct_change(5)
    data["return_21d"] = close.pct_change(21)

    # 2. Rolling statistics
    for w in rolling_windows:
        data[f"rolling_mean_{w}"] = close.rolling(w).mean()
        data[f"rolling_std_{w}"] = close.rolling(w).std()
        data[f"rolling_min_{w}"] = close.rolling(w).min()
        data[f"rolling_max_{w}"] = close.rolling(w).max()
        data[f"volatility_{w}d"] = data["log_return_1d"].rolling(w).std() * np.sqrt(252)

    # 3. Lag features
    for lag in lags:
        data[f"close_lag_{lag}"] = close.shift(lag)
        data[f"return_lag_{lag}"] = data["return_1d"].shift(lag)

    # 4. Momentum and Rate of Change
    data["momentum_10"] = close - close.shift(10)
    data["roc_10"] = (close - close.shift(10)) / (close.shift(10) + 1e-9)

    # 5. Calendar features
    if isinstance(data.index, pd.DatetimeIndex):
        data["day_of_week"] = data.index.dayofweek
        data["day_of_month"] = data.index.day
        data["month"] = data.index.month
        data["is_quarter_end"] = data.index.is_quarter_end.astype(int)
        data["is_month_end"] = data.index.is_month_end.astype(int)

    # Clean missing values introduced by lags
    data = data.dropna()

    # Feature catalog
    feature_catalog = {
        col: {
            "type": "numeric" if np.issubdtype(data[col].dtype, np.number) else "categorical",
            "mean": float(data[col].mean()) if np.issubdtype(data[col].dtype, np.number) else None,
            "std": float(data[col].std()) if np.issubdtype(data[col].dtype, np.number) else None,
        }
        for col in data.columns
    }

    return data, feature_catalog

