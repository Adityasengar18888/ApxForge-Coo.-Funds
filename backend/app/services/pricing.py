import numpy as np
import pandas as pd
from scipy.stats import norm
from typing import Dict, Tuple, Optional

def black_scholes_call(S: float, K: float, T: float, r: float, sigma: float) -> float:
    """Analytical Black-Scholes call option price."""
    if T <= 0 or sigma <= 0:
        return max(0.0, S - K)
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return float(S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2))

def black_scholes_put(S: float, K: float, T: float, r: float, sigma: float) -> float:
    """Analytical Black-Scholes put option price via put-call parity."""
    call = black_scholes_call(S, K, T, r, sigma)
    return float(call + K * np.exp(-r * T) - S)

# Aliases for exact legacy parity
call_price = black_scholes_call
put_price = black_scholes_put

def calculate_greeks(S: float, K: float, T: float, r: float, sigma: float, option_type: str = "call") -> Dict[str, float]:
    """Calculate all standard Greeks for risk analysis."""
    if T <= 0 or sigma <= 0:
        return {
            'delta': 1.0 if (option_type.lower() == "call" and S > K) else 0.0,
            'gamma': 0.0,
            'theta': 0.0,
            'vega': 0.0,
            'rho': 0.0
        }

    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    pdf_d1 = norm.pdf(d1)

    if option_type.lower() == "call":
        delta = norm.cdf(d1)
        gamma = pdf_d1 / (S * sigma * np.sqrt(T))
        vega = S * pdf_d1 * np.sqrt(T) / 100.0  # per 1% vol change (matches app.py)
        theta = (-S * pdf_d1 * sigma / (2.0 * np.sqrt(T)) - r * K * np.exp(-r * T) * norm.cdf(d2)) / 365.0
        rho = K * T * np.exp(-r * T) * norm.cdf(d2) / 100.0
    else:
        delta = norm.cdf(d1) - 1.0
        gamma = pdf_d1 / (S * sigma * np.sqrt(T))
        vega = S * pdf_d1 * np.sqrt(T) / 100.0
        theta = (-S * pdf_d1 * sigma / (2.0 * np.sqrt(T)) + r * K * np.exp(-r * T) * norm.cdf(-d2)) / 365.0
        rho = -K * T * np.exp(-r * T) * norm.cdf(-d2) / 100.0

    return {
        'delta': float(delta),
        'gamma': float(gamma),
        'theta': float(theta),
        'vega': float(vega),
        'rho': float(rho)
    }

def delta_hedge(delta: float) -> float:
    """Number of shares to hold per option contract to maintain delta neutrality."""
    return float(-delta)

def approximate_vol_surface(option_df: pd.DataFrame) -> pd.DataFrame:
    """Returns implied volatility grouped by moneyness and maturity."""
    if option_df.empty or "strike" not in option_df.columns or "lastPrice" not in option_df.columns:
        return pd.DataFrame()
    df = option_df.copy()
    df["moneyness"] = df["strike"] / df["lastPrice"]
    try:
        surface = (
            df.groupby(["expiry"])
            .apply(lambda x: x.groupby(pd.cut(x["moneyness"], 5))["impliedVolatility"].mean(), include_groups=False)
        )
        return surface
    except Exception:
        return pd.DataFrame()

