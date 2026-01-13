import numpy as np
from scipy.stats import norm

def calculate_greeks(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))

    delta = norm.cdf(d1)
    theta = (
        -S * norm.pdf(d1) * sigma / (2 * np.sqrt(T))
        - r * K * np.exp(-r * T) * norm.cdf(d1 - sigma * np.sqrt(T))
    )
    vega = S * norm.pdf(d1) * np.sqrt(T)

    return delta, theta, vega
