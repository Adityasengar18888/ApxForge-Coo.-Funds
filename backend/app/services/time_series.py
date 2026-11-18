import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from statsmodels.tsa.stattools import adfuller, kpss, acf, pacf
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.arima.model import ARIMA
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error

def test_stationarity(series: pd.Series) -> Dict[str, Any]:
    """
    Stationarity tests: Augmented Dickey-Fuller (ADF) & KPSS tests.
    """
    clean = series.dropna()

    # 1. ADF Test
    adf_res = adfuller(clean, autolag="AIC")
    adf_stat = float(adf_res[0])
    adf_pvalue = float(adf_res[1])
    is_adf_stationary = bool(adf_pvalue < 0.05)

    # 2. KPSS Test
    try:
        kpss_res = kpss(clean, regression="c", nlags="auto")
        kpss_stat = float(kpss_res[0])
        kpss_pvalue = float(kpss_res[1])
        is_kpss_stationary = bool(kpss_pvalue >= 0.05)
    except Exception:
        kpss_stat = 0.0
        kpss_pvalue = 1.0
        is_kpss_stationary = True

    return {
        "adf": {
            "statistic": round(adf_stat, 4),
            "p_value": round(adf_pvalue, 6),
            "is_stationary": is_adf_stationary,
            "interpretation": "Stationary (Reject H0 unit root)" if is_adf_stationary else "Non-stationary (Has unit root)"
        },
        "kpss": {
            "statistic": round(kpss_stat, 4),
            "p_value": round(kpss_pvalue, 6),
            "is_stationary": is_kpss_stationary,
            "interpretation": "Stationary (Fail to reject H0 stationarity)" if is_kpss_stationary else "Non-stationary"
        },
        "conclusion": "Stationary" if (is_adf_stationary and is_kpss_stationary) else "Differencing recommended"
    }

def calculate_acf_pacf(series: pd.Series, nlags: int = 20) -> Dict[str, List[float]]:
    """Autocorrelation and Partial Autocorrelation."""
    clean = series.dropna()
    actual_lags = min(nlags, len(clean) // 2 - 1)
    acf_vals = acf(clean, nlags=actual_lags)
    pacf_vals = pacf(clean, nlags=actual_lags)

    return {
        "lags": list(range(len(acf_vals))),
        "acf": [round(float(v), 4) for v in acf_vals],
        "pacf": [round(float(v), 4) for v in pacf_vals]
    }

def perform_decomposition(series: pd.Series, period: int = 21) -> Dict[str, Any]:
    """Seasonal decomposition into trend, seasonal, and residual."""
    clean = series.dropna()
    if len(clean) < 2 * period:
        period = max(2, len(clean) // 4)

    decomp = seasonal_decompose(clean, model="additive", period=period, extrapolate_trend="freq")
    dates = [idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx) for idx in clean.index]

    return {
        "dates": dates,
        "observed": [round(float(v), 2) for v in decomp.observed],
        "trend": [round(float(v), 2) for v in decomp.trend],
        "seasonal": [round(float(v), 2) for v in decomp.seasonal],
        "residual": [round(float(v), 2) for v in decomp.resid.fillna(0.0)]
    }

def fit_arima_forecast(
    series: pd.Series,
    order: Tuple[int, int, int] = (1, 1, 1),
    forecast_steps: int = 10
) -> Dict[str, Any]:
    """
    Fits ARIMA model and forecasts next N steps with confidence intervals.
    """
    clean = series.dropna()
    model = ARIMA(clean, order=order)
    model_fit = model.fit()

    forecast_res = model_fit.get_forecast(steps=forecast_steps)
    mean_forecast = forecast_res.predicted_mean
    conf_int = forecast_res.conf_int(alpha=0.05)

    last_date = clean.index[-1] if hasattr(clean.index[-1], "strftime") else pd.Timestamp.now()
    future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=forecast_steps, freq="B")

    forecast_list = []
    for idx, (mean_val, (_, ci_row)) in enumerate(zip(mean_forecast, conf_int.iterrows())):
        forecast_list.append({
            "step": idx + 1,
            "date": future_dates[idx].strftime("%Y-%m-%d"),
            "predicted": round(float(mean_val), 2),
            "lower_95": round(float(ci_row.iloc[0]), 2),
            "upper_95": round(float(ci_row.iloc[1]), 2),
        })

    return {
        "order": order,
        "aic": round(float(model_fit.aic), 2),
        "bic": round(float(model_fit.bic), 2),
        "forecast": forecast_list
    }

def fit_neural_lag_predictor(
    series: pd.Series,
    window_size: int = 10,
    forecast_steps: int = 5
) -> Dict[str, Any]:
    """
    MLP neural network with sliding lag windows (LSTM equivalent fallback for fast portable CPU inference).
    """
    clean = series.values
    X, y = [], []
    for i in range(len(clean) - window_size):
        X.append(clean[i : i + window_size])
        y.append(clean[i + window_size])

    X_arr, y_arr = np.array(X), np.array(y)
    split = int(0.8 * len(X_arr))
    X_train, X_test = X_arr[:split], X_arr[split:]
    y_train, y_test = y_arr[:split], y_arr[split:]

    mlp = MLPRegressor(hidden_layer_sizes=(64, 32), max_iter=300, random_state=42)
    mlp.fit(X_train, y_train)

    preds = mlp.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mae = mean_absolute_error(y_test, preds)

    # Multi-step autoregressive rollout
    current_window = list(clean[-window_size:])
    future_preds = []
    for step in range(forecast_steps):
        next_val = float(mlp.predict([current_window])[0])
        future_preds.append(round(next_val, 2))
        current_window = current_window[1:] + [next_val]

    return {
        "model": "MLPRegressor (Deep Lag Window)",
        "window_size": window_size,
        "test_rmse": round(float(rmse), 4),
        "test_mae": round(float(mae), 4),
        "forecast": future_preds
    }

