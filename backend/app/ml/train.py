import os
import sys
from pathlib import Path

# Add project root to path
root_dir = Path(__file__).resolve().parent.parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.services.features import generate_option_samples
from backend.app.services.data_provider import MockDataProvider
from backend.app.services.predictor import train_regression_model, train_classification_model
from backend.app.ml.registry import model_registry
from backend.app.core.logging import logger

def train_options_pricing_model():
    logger.info("Training Black-Scholes ML Option Pricing Model...")
    df = generate_option_samples(S=150.0, K=150.0, r=0.05, base_vol=0.25, n=2000)
    X = df.drop("MarketPrice", axis=1)
    y = df["MarketPrice"]

    res = train_regression_model(X, y, model_name="random_forest", n_estimators=100, max_depth=10)

    model_registry.register_model(
        model_name="options_pricing_rf",
        version="1.0.0",
        task_type="regression",
        artifact={"model": res["model_artifact"], "scaler": res["scaler"]},
        features=list(X.columns),
        metrics=res["metrics"],
        dataset_snapshot="synthetic_options_2000"
    )
    logger.info(f"Options Pricing Model trained with MAE: {res['metrics']['mae']}")

def train_directional_classifier():
    logger.info("Training Stock Direction Classifier (Up/Down)...")
    mock = MockDataProvider()
    df = mock.get_history("AAPL", period="1y")

    # Features: past returns, RSI, MACD
    df["target"] = (df["Close"].shift(-1) > df["Close"]).astype(int)
    df["return_1d"] = df["Close"].pct_change(1)
    df["return_5d"] = df["Close"].pct_change(5)
    df = df.dropna()

    X = df[["return_1d", "return_5d", "Volume"]]
    y = df["target"]

    res = train_classification_model(X, y, model_name="random_forest", imbalanced_strategy="smote")

    model_registry.register_model(
        model_name="directional_classifier_rf",
        version="1.0.0",
        task_type="classification",
        artifact={"model": res["model_artifact"], "scaler": res["scaler"]},
        features=list(X.columns),
        metrics=res["metrics"],
        dataset_snapshot="aapl_daily_1y"
    )
    logger.info(f"Directional Classifier trained with Accuracy: {res['metrics']['accuracy']}, F1: {res['metrics']['f1']}")

def main():
    logger.info("Starting complete model training pipeline...")
    train_options_pricing_model()
    train_directional_classifier()
    logger.info("All model registry artifacts trained successfully.")

train_and_register_all = main

if __name__ == "__main__":
    main()
