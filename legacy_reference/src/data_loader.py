import yfinance as yf
import numpy as np

def load_stock_data(ticker, period="1y"):
    stock = yf.Ticker(ticker)
    data = stock.history(period=period)
    data["returns"] = np.log(data["Close"] / data["Close"].shift(1))
    return data.dropna()
