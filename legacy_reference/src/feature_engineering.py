import numpy as np
import pandas as pd
from src.black_scholes import call_price
from src.greeks import calculate_greeks

def generate_option_samples(S, K, r, base_vol, n=1000):
    rows = []

    for _ in range(n):
        S_ = S * np.random.uniform(0.9, 1.1)
        K_ = K * np.random.uniform(0.9, 1.1)
        T_ = np.random.uniform(0.01, 0.5)
        sigma_ = base_vol * np.random.uniform(0.7, 1.3)

        price = call_price(S_, K_, T_, r, sigma_)
        delta, theta, vega = calculate_greeks(S_, K_, T_, r, sigma_)

        market_price = price + np.random.normal(0, 0.5)

        rows.append([S_, K_, T_, sigma_, delta, theta, vega, market_price])

    return pd.DataFrame(
        rows,
        columns=["Spot", "Strike", "T", "Vol", "Delta", "Theta", "Vega", "MarketPrice"]
    )
