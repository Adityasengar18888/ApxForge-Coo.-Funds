import numpy as np
import pandas as pd

def approximate_vol_surface(option_df):
    """
    Returns implied vol as function of moneyness & maturity
    """
    option_df = option_df.copy()
    option_df["moneyness"] = option_df["strike"] / option_df["lastPrice"]

    surface = (
        option_df
        .groupby(["expiry"])
        .apply(lambda x: x.groupby(pd.cut(x["moneyness"], 5))["impliedVolatility"].mean())
    )

    return surface
