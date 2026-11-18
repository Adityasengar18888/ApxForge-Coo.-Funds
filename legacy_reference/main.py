import os

from src.config import TICKERS, RISK_FREE_RATE
from src.data_loader import load_stock_data
from src.volatility import historical_volatility
from src.feature_engineering import generate_option_samples
from src.ml_model import train_model
from src.black_scholes import call_price
from src.greeks import calculate_greeks
from src.hedge import delta_hedge


def analyze_stock(ticker: str):
    print(f"\n================ {ticker} =================")

    # -------------------------------
    # 1. LOAD DATA
    # -------------------------------
    data = load_stock_data(ticker)

    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("data/processed", exist_ok=True)

    raw_path = f"data/raw/{ticker.lower()}_price.csv"
    data.to_csv(raw_path)

    # -------------------------------
    # 2. MARKET PARAMETERS
    # -------------------------------
    S = data["Close"].iloc[-1]
    vol = historical_volatility(data["returns"])

    K = round(S)          # ATM strike
    T = 30 / 365          # 30 days

    print(f"Spot Price: {S:.2f}")
    print(f"Volatility: {vol:.4f}")

    # -------------------------------
    # 3. DATASET GENERATION
    # -------------------------------
    df = generate_option_samples(
        S=S,
        K=K,
        r=RISK_FREE_RATE,
        base_vol=vol,
        n=1000
    )

    processed_path = f"data/processed/{ticker.lower()}_options_dataset.csv"
    df.to_csv(processed_path, index=False)

    # -------------------------------
    # 4. ML TRAINING
    # -------------------------------
    model, scaler, mae = train_model(df)

    # -------------------------------
    # 5. OPTION PRICING
    # -------------------------------
    bs_price = call_price(S, K, T, RISK_FREE_RATE, vol)
    delta, theta, vega = calculate_greeks(S, K, T, RISK_FREE_RATE, vol)
    hedge = delta_hedge(delta)

    # -------------------------------
    # 6. OUTPUT
    # -------------------------------
    print("--- Black–Scholes ---")
    print(f"Call Price: {bs_price:.4f}")

    print("--- Greeks ---")
    print(f"Delta: {delta:.4f}")
    print(f"Theta: {theta:.4f}")
    print(f"Vega:  {vega:.4f}")

    print("--- Hedging ---")
    print(f"Delta Hedge: {hedge:.4f} shares")

    print("--- ML ---")
    print(f"Model MAE: {mae:.4f}")


def main():
    for ticker in TICKERS:
        try:
            analyze_stock(ticker)
        except Exception as e:
            print(f"[ERROR] {ticker}: {e}")


if __name__ == "__main__":
    main()
