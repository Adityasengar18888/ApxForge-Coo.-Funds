import numpy as np
import pandas as pd
from typing import Dict, Tuple, Optional, List

def calculate_ml_risk_score(
    S: float,
    K: float,
    T: float,
    vol: float,
    greeks: Dict[str, float],
    option_type: str = "call",
    chain_data: Optional[pd.DataFrame] = None,
    sensitivity: float = 1.0
) -> Tuple[float, Dict[str, float]]:
    """
    100% legacy parity with app.py calculate_ml_risk_score.
    Calculates ML-adjusted risk score (0-100) and component risk factors.
    """
    risk_factors: Dict[str, float] = {}

    # 1. Moneyness risk
    moneyness = S / K if option_type.lower() == "call" else K / S
    if 0.9 <= moneyness <= 1.1:  # ATM
        moneyness_risk = 70.0
    elif moneyness > 1.1:  # ITM for calls
        moneyness_risk = 40.0 if option_type.lower() == "call" else 80.0
    else:  # OTM
        moneyness_risk = 80.0 if option_type.lower() == "call" else 40.0
    risk_factors['moneyness'] = moneyness_risk

    # 2. Time decay risk
    theta_risk = min(100.0, max(0.0, (abs(greeks.get('theta', 0.0)) * 365.0) * 100.0))
    risk_factors['time_decay'] = theta_risk

    # 3. Volatility risk
    if chain_data is not None and 'impliedVolatility' in chain_data.columns and not chain_data.empty:
        chain_vol = chain_data['impliedVolatility'].median()
        vol_ratio = vol / chain_vol if chain_vol > 0 else 1.0
        vol_risk = min(100.0, max(0.0, (vol_ratio - 0.5) * 200.0))
    else:
        vol_risk = min(100.0, max(0.0, greeks.get('vega', 0.0) * 100.0))
    risk_factors['volatility'] = vol_risk

    # 4. Gamma risk
    gamma_risk = min(100.0, max(0.0, greeks.get('gamma', 0.0) * 10000.0))
    risk_factors['gamma'] = gamma_risk

    # 5. Liquidity risk
    if chain_data is not None and 'volume' in chain_data.columns and not chain_data.empty:
        avg_volume = chain_data['volume'].median()
        liquidity_risk = 100.0 - min(100.0, (avg_volume / 1000.0) * 10.0)
    else:
        liquidity_risk = 50.0
    risk_factors['liquidity'] = liquidity_risk

    # 6. Delta exposure risk
    delta_exp = abs(greeks.get('delta', 0.0))
    delta_risk = min(100.0, delta_exp * 100.0)
    risk_factors['delta_exposure'] = delta_risk

    # Weighted average
    weights = {
        'moneyness': 0.25,
        'time_decay': 0.20,
        'volatility': 0.20,
        'gamma': 0.15,
        'liquidity': 0.10,
        'delta_exposure': 0.10
    }

    base_score = sum(risk_factors[factor] * weights[factor] for factor in weights)
    raw_total = min(100.0, base_score)

    adjusted_score = min(100.0, raw_total * sensitivity)
    adjusted_factors = {k: min(100.0, v * sensitivity) for k, v in risk_factors.items()}

    return adjusted_score, adjusted_factors

def calculate_sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.05, trading_days: int = 252) -> float:
    """Annualized Sharpe Ratio."""
    if len(returns) < 2 or returns.std() == 0:
        return 0.0
    excess_returns = returns - (risk_free_rate / trading_days)
    return float(np.sqrt(trading_days) * excess_returns.mean() / (returns.std() + 1e-9))

def calculate_sortino_ratio(returns: pd.Series, risk_free_rate: float = 0.05, trading_days: int = 252) -> float:
    """Annualized Sortino Ratio using downside deviation."""
    if len(returns) < 2:
        return 0.0
    excess_returns = returns - (risk_free_rate / trading_days)
    downside_returns = returns[returns < 0]
    if len(downside_returns) < 1 or downside_returns.std() == 0:
        return 0.0
    downside_dev = np.sqrt(np.mean(downside_returns**2))
    return float(np.sqrt(trading_days) * excess_returns.mean() / (downside_dev + 1e-9))

def calculate_max_drawdown(prices: pd.Series) -> Tuple[float, float, float]:
    """Computes max drawdown percentage, peak price, trough price."""
    if len(prices) < 2:
        return 0.0, 0.0, 0.0
    cum_max = prices.cummax()
    drawdowns = (prices - cum_max) / cum_max
    max_dd = float(drawdowns.min())  # negative float
    return max_dd, float(cum_max.max()), float(prices.min())

def calculate_beta(asset_returns: pd.Series, benchmark_returns: pd.Series) -> float:
    """Beta of asset relative to benchmark."""
    aligned = pd.concat([asset_returns, benchmark_returns], axis=1).dropna()
    if len(aligned) < 2:
        return 1.0
    cov = np.cov(aligned.iloc[:, 0], aligned.iloc[:, 1])[0, 1]
    var_bench = np.var(aligned.iloc[:, 1])
    if var_bench == 0:
        return 1.0
    return float(cov / var_bench)

def calculate_var_95(returns: pd.Series, portfolio_value: float = 10000.0) -> Dict[str, float]:
    """Value at Risk (95% confidence) Parametric and Historical."""
    if len(returns) < 5:
        return {"parametric_var": 0.0, "historical_var": 0.0}
    # Parametric (assuming normal distribution Z = 1.645)
    mean = returns.mean()
    std = returns.std()
    parametric_var_pct = float(1.645 * std - mean)
    # Historical
    historical_var_pct = float(-np.percentile(returns, 5))

    return {
        "parametric_var_pct": max(0.0, parametric_var_pct),
        "historical_var_pct": max(0.0, historical_var_pct),
        "parametric_var_amount": max(0.0, parametric_var_pct * portfolio_value),
        "historical_var_amount": max(0.0, historical_var_pct * portfolio_value)
    }

def calculate_correlation_matrix(price_dict: Dict[str, pd.Series]) -> pd.DataFrame:
    """Correlation matrix of daily returns across symbols."""
    returns_df = pd.DataFrame()
    for sym, prices in price_dict.items():
        returns_df[sym] = np.log(prices / prices.shift(1))
    return returns_df.dropna().corr()

def calculate_risk_metrics(returns: np.ndarray | pd.Series) -> Dict[str, float]:
    """Calculates standardized risk summary metrics."""
    s = pd.Series(returns) if isinstance(returns, np.ndarray) else returns
    prices = (1.0 + s).cumprod()
    sharpe = calculate_sharpe_ratio(s)
    sortino = calculate_sortino_ratio(s)
    max_dd, _, _ = calculate_max_drawdown(prices)
    var = calculate_var_95(s)

    return {
        "sharpe_ratio": round(sharpe, 2),
        "sortino_ratio": round(sortino, 2),
        "max_drawdown_pct": round(abs(max_dd) * 100, 2),
        "var_95_pct": round(var["parametric_var_pct"] * 100, 2),
        "volatility_annualized_pct": round(float(s.std() * np.sqrt(252) * 100), 2) if len(s) > 1 else 0.0,
    }

