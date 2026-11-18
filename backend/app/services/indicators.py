import numpy as np
import pandas as pd
from typing import Dict, List, Optional

def historical_volatility(returns: pd.Series, trading_days: int = 252) -> float:
    """Annualized historical volatility."""
    if len(returns) < 2:
        return 0.0
    return float(returns.std() * np.sqrt(trading_days))

def calculate_sma(series: pd.Series, periods: List[int] = [20, 50, 100, 200]) -> Dict[str, pd.Series]:
    res = {}
    for p in periods:
        res[f"SMA_{p}"] = series.rolling(window=p, min_periods=1).mean()
    return res

def calculate_ema(series: pd.Series, periods: List[int] = [20, 50, 100, 200]) -> Dict[str, pd.Series]:
    res = {}
    for p in periods:
        res[f"EMA_{p}"] = series.ewm(span=p, adjust=False).mean()
    return res

def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    rs = avg_gain / (avg_loss + 1e-9)
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return rsi.fillna(50.0)

def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, pd.Series]:
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return {
        "macd": macd_line,
        "signal": signal_line,
        "histogram": histogram
    }

def calculate_bollinger_bands(series: pd.Series, period: int = 20, num_std: float = 2.0) -> Dict[str, pd.Series]:
    middle = series.rolling(window=period, min_periods=1).mean()
    std = series.rolling(window=period, min_periods=1).std().fillna(0.0)
    upper = middle + (std * num_std)
    lower = middle - (std * num_std)
    return {
        "bb_middle": middle,
        "bb_upper": upper,
        "bb_lower": lower
    }

def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    prev_close = close.shift(1)
    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period, min_periods=1).mean()

def calculate_adx(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    up_move = high.diff()
    down_move = -low.diff()
    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)

    atr = calculate_atr(high, low, close, period=period)
    plus_di = 100 * (pd.Series(plus_dm, index=high.index).rolling(period, min_periods=1).mean() / (atr + 1e-9))
    minus_di = 100 * (pd.Series(minus_dm, index=low.index).rolling(period, min_periods=1).mean() / (atr + 1e-9))
    dx = 100 * ((plus_di - minus_di).abs() / (plus_di + minus_di + 1e-9))
    return dx.rolling(period, min_periods=1).mean().fillna(20.0)

def calculate_stochastic(high: pd.Series, low: pd.Series, close: pd.Series, k_period: int = 14, d_period: int = 3) -> Dict[str, pd.Series]:
    low_min = low.rolling(window=k_period, min_periods=1).min()
    high_max = high.rolling(window=k_period, min_periods=1).max()
    fast_k = 100.0 * ((close - low_min) / (high_max - low_min + 1e-9))
    slow_d = fast_k.rolling(window=d_period, min_periods=1).mean()
    return {
        "stoch_k": fast_k,
        "stoch_d": slow_d
    }

def calculate_vwap(high: pd.Series, low: pd.Series, close: pd.Series, volume: pd.Series) -> pd.Series:
    typical_price = (high + low + close) / 3.0
    cum_vol_price = (typical_price * volume).cumsum()
    cum_vol = volume.cumsum()
    return (cum_vol_price / (cum_vol + 1e-9)).fillna(typical_price)

def calculate_obv(close: pd.Series, volume: pd.Series) -> pd.Series:
    change = close.diff()
    direction = pd.Series(0, index=close.index)
    direction[change > 0] = 1
    direction[change < 0] = -1
    return (direction * volume).cumsum()

def calculate_ichimoku(high: pd.Series, low: pd.Series, close: pd.Series) -> Dict[str, pd.Series]:
    tenkan_sen = (high.rolling(9, min_periods=1).max() + low.rolling(9, min_periods=1).min()) / 2.0
    kijun_sen = (high.rolling(26, min_periods=1).max() + low.rolling(26, min_periods=1).min()) / 2.0
    senkou_span_a = ((tenkan_sen + kijun_sen) / 2.0).shift(26)
    senkou_span_b = ((high.rolling(52, min_periods=1).max() + low.rolling(52, min_periods=1).min()) / 2.0).shift(26)
    chikou_span = close.shift(-26)
    return {
        "tenkan_sen": tenkan_sen,
        "kijun_sen": kijun_sen,
        "senkou_span_a": senkou_span_a,
        "senkou_span_b": senkou_span_b,
        "chikou_span": chikou_span
    }

def compute_all_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Computes all technical indicators on a DataFrame containing Open, High, Low, Close, Volume."""
    data = df.copy()
    close = data["Close"]
    high = data["High"] if "High" in data.columns else close
    low = data["Low"] if "Low" in data.columns else close
    vol = data["Volume"] if "Volume" in data.columns else pd.Series(1000000, index=data.index)

    # Returns
    data["returns"] = np.log(close / close.shift(1)).fillna(0.0)

    # Moving Averages
    smas = calculate_sma(close)
    for k, v in smas.items():
        data[k] = v
    emas = calculate_ema(close)
    for k, v in emas.items():
        data[k] = v

    # Oscillators & Bands
    data["RSI"] = calculate_rsi(close)
    macd_res = calculate_macd(close)
    data["MACD"] = macd_res["macd"]
    data["MACD_signal"] = macd_res["signal"]
    data["MACD_hist"] = macd_res["histogram"]

    bb_res = calculate_bollinger_bands(close)
    data["BB_middle"] = bb_res["bb_middle"]
    data["BB_upper"] = bb_res["bb_upper"]
    data["BB_lower"] = bb_res["bb_lower"]

    data["ATR"] = calculate_atr(high, low, close)
    data["ADX"] = calculate_adx(high, low, close)

    stoch = calculate_stochastic(high, low, close)
    data["Stoch_K"] = stoch["stoch_k"]
    data["Stoch_D"] = stoch["stoch_d"]

    data["VWAP"] = calculate_vwap(high, low, close, vol)
    data["OBV"] = calculate_obv(close, vol)

    ichimoku = calculate_ichimoku(high, low, close)
    for k, v in ichimoku.items():
        data[f"Ichimoku_{k}"] = v

    return data

# Aliases for interoperability
compute_technical_indicators = compute_all_indicators
compute_historical_volatility = historical_volatility

