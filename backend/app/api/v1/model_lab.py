from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import pandas as pd
import numpy as np

from backend.app.services.data_provider import data_provider
from backend.app.services.features import extract_time_series_features
from backend.app.services.preprocessing import handle_missing_values, scale_features, generate_data_quality_report
from backend.app.services.feature_selection import select_features
from backend.app.services.predictor import train_regression_model, train_classification_model
from backend.app.services.clustering import perform_clustering
from backend.app.services.dim_reduction import perform_pca, perform_tsne
from backend.app.services.time_series import test_stationarity, calculate_acf_pacf, perform_decomposition, fit_arima_forecast
from backend.app.services.tuning import run_hyperparameter_tuning
from backend.app.services.interpret import explain_with_shap, explain_with_permutation_importance
from backend.app.services.automl import run_mini_automl
from backend.app.ml.registry import model_registry

router = APIRouter(prefix="/model-lab", tags=["Model Lab"])

class TrainRequest(BaseModel):
    symbol: str = "AAPL"
    task_type: str = "regression"  # "regression" or "classification"
    model_name: str = "random_forest"
    features: Optional[List[str]] = None
    imbalanced_strategy: Optional[str] = None
    scaler_type: str = "standard"

@router.get("/registry")
def list_registry_models():
    return model_registry.list_models()

@router.post("/retrain/{model_name}")
def retrain_model(model_name: str):
    from backend.app.ml.train import train_options_pricing_model, train_directional_classifier
    if "options" in model_name:
        train_options_pricing_model()
    else:
        train_directional_classifier()
    meta = model_registry.get_model_metadata(model_name)
    return {"message": f"Retrained {model_name} successfully", "metadata": meta}

@router.post("/train")
def train_model_endpoint(req: TrainRequest):
    df = data_provider.get_history(req.symbol, period="2y")
    if df.empty:
        raise HTTPException(status_code=400, detail="Insufficient historical data")

    df_feat, catalog = extract_time_series_features(df)
    features = req.features or ["return_1d", "return_5d", "rolling_std_20", "volatility_20d", "momentum_10"]

    available_feats = [f for f in features if f in df_feat.columns]
    if not available_feats:
        available_feats = ["return_1d", "return_5d"]

    X = df_feat[available_feats]

    if req.task_type == "classification":
        y = (df_feat["Close"].shift(-1) > df_feat["Close"]).astype(int)[:-1]
        X = X.iloc[:-1]
        res = train_classification_model(
            X, y,
            model_name=req.model_name,
            imbalanced_strategy=req.imbalanced_strategy
        )
    else:
        y = df_feat["Close"]
        res = train_regression_model(
            X, y,
            model_name=req.model_name
        )

    # Compute interpretability
    importance = explain_with_permutation_importance(res["model_artifact"], res["scaler"].transform(X), y)
    shap_res = explain_with_shap(res["model_artifact"], pd.DataFrame(res["scaler"].transform(X), columns=available_feats))

    return {
        "model_name": req.model_name,
        "task_type": req.task_type,
        "features": available_feats,
        "metrics": res["metrics"],
        "sample_predictions": res.get("sample_predictions", []),
        "confusion_matrix": res.get("confusion_matrix"),
        "class_distribution": res.get("class_distribution"),
        "feature_importance": importance,
        "shap_summary": shap_res["global_summary"],
        "shap_waterfall": shap_res["local_waterfall"][:8]
    }

@router.get("/automl")
def run_automl_search(symbol: str = "AAPL", budget_seconds: int = 10):
    df = data_provider.get_history(symbol, period="1y")
    df_feat, _ = extract_time_series_features(df)
    X = df_feat[["return_1d", "return_5d", "rolling_std_20", "volatility_20d"]]
    y = df_feat["Close"]

    return run_mini_automl(X, y, time_budget_seconds=budget_seconds)

@router.get("/clustering")
def run_clustering_endpoint(symbol: str = "AAPL", algorithm: str = "kmeans", n_clusters: int = 3):
    df = data_provider.get_history(symbol, period="1y")
    df_feat, _ = extract_time_series_features(df)
    features = ["return_1d", "volatility_20d", "momentum_10"]
    return perform_clustering(df_feat, features, algorithm=algorithm, n_clusters=n_clusters)

@router.get("/dim-reduction")
def run_dim_reduction(symbol: str = "AAPL", method: str = "pca", n_components: int = 3):
    df = data_provider.get_history(symbol, period="1y")
    df_feat, _ = extract_time_series_features(df)
    features = ["return_1d", "return_5d", "rolling_std_5", "rolling_std_20", "volatility_20d", "momentum_10"]

    if method == "tsne":
        return perform_tsne(df_feat, features, n_components=n_components)
    return perform_pca(df_feat, features, n_components=n_components)

@router.get("/time-series")
def run_time_series_analysis(symbol: str = "AAPL"):
    df = data_provider.get_history(symbol, period="1y")
    close = df["Close"]

    stationarity = test_stationarity(close)
    acf_pacf = calculate_acf_pacf(close)
    decomp = perform_decomposition(close)
    arima = fit_arima_forecast(close, order=(1, 1, 1), forecast_steps=10)

    return {
        "symbol": symbol.upper(),
        "stationarity": stationarity,
        "acf_pacf": acf_pacf,
        "decomposition": decomp,
        "arima_forecast": arima
    }

@router.get("/tuning")
def run_tuning(symbol: str = "AAPL", strategy: str = "optuna", n_trials: int = 10):
    df = data_provider.get_history(symbol, period="1y")
    df_feat, _ = extract_time_series_features(df)
    X = df_feat[["return_1d", "return_5d", "rolling_std_20"]]
    y = df_feat["Close"]

    return run_hyperparameter_tuning(X, y, strategy=strategy, n_trials=n_trials)
