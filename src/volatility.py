import numpy as np
from src.config import TRADING_DAYS

def historical_volatility(returns):
    return returns.std() * np.sqrt(TRADING_DAYS)
