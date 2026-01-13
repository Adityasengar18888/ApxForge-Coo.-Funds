from fastapi import APIRouter
from src.black_scholes import call_price
from src.greeks import calculate_greeks
from src.hedge import delta_hedge

router = APIRouter()

@router.get("/price")
def price_option(
    spot: float,
    strike: float,
    maturity_days: int,
    volatility: float,
    risk_free_rate: float
):
    T = maturity_days / 365

    bs_price = call_price(spot, strike, T, risk_free_rate, volatility)
    delta, theta, vega = calculate_greeks(
        spot, strike, T, risk_free_rate, volatility
    )

    return {
        "black_scholes_price": round(bs_price, 4),
        "greeks": {
            "delta": round(delta, 4),
            "theta": round(theta, 4),
            "vega": round(vega, 4)
        },
        "delta_hedge_shares": round(delta_hedge(delta), 4)
    }
