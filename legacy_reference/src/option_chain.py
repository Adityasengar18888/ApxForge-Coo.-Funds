import yfinance as yf
import pandas as pd

def load_option_chain(ticker):
    stock = yf.Ticker(ticker)
    expiries = stock.options

    all_options = []

    for expiry in expiries:
        chain = stock.option_chain(expiry)

        for opt_type, df in zip(["call", "put"], [chain.calls, chain.puts]):
            df = df.copy()
            df["option_type"] = opt_type
            df["expiry"] = expiry
            df["ticker"] = ticker
            all_options.append(df)

    options_df = pd.concat(all_options, ignore_index=True)
    return options_df
