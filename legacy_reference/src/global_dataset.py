import numpy as np
import pandas as pd
from src.greeks import calculate_greeks

def build_global_option_dataset(option_df, risk_free_rate):
    rows = []

    for _, row in option_df.iterrows():
        try:
            S = row["lastPrice"] + row["strike"]  # proxy spot (rough but ok)
            K = row["strike"]
            T = pd.to_datetime(row["expiry"])
            today = pd.Timestamp.today()
            T = max((T - today).days / 365, 1/365)

            sigma = row["impliedVolatility"]

            delta, theta, vega = calculate_greeks(S, K, T, risk_free_rate, sigma)

            rows.append([
                row["ticker"],
                S, K, T, sigma,
                delta, theta, vega,
                row["lastPrice"]
            ])
        except:
            continue

    return pd.DataFrame(rows, columns=[
        "Ticker", "Spot", "Strike", "T", "IV",
        "Delta", "Theta", "Vega",
        "MarketPrice"
    ])
