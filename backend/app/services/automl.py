import time
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from backend.app.services.preprocessing import handle_missing_values, scale_features
from backend.app.services.predictor import get_regressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def run_mini_automl(
    X: pd.DataFrame,
    y: pd.Series,
    time_budget_seconds: int = 15
) -> Dict[str, Any]:
    """
    Built-in mini AutoML iterating through model architectures and preprocessing variants.
    Returns ranked leaderboard with metrics.
    """
    start_time = time.time()

    candidate_models = [
        ("Linear Regression", "linear", {}),
        ("Ridge Regularization", "ridge", {"alpha": 1.0}),
        ("Lasso L1", "lasso", {"alpha": 0.1}),
        ("Random Forest", "random_forest", {"n_estimators": 60, "max_depth": 8}),
        ("Gradient Boosting", "gradient_boosting", {"n_estimators": 60, "learning_rate": 0.08}),
        ("XGBoost", "xgboost", {"n_estimators": 60, "learning_rate": 0.08}),
        ("LightGBM", "lightgbm", {"n_estimators": 60, "learning_rate": 0.08}),
    ]

    preprocessing_variants = ["standard", "minmax", "robust"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    leaderboard = []

    for name, model_key, params in candidate_models:
        for scaler_type in preprocessing_variants:
            if time.time() - start_time > time_budget_seconds:
                break

            try:
                # Preprocess
                X_tr_scaled, scaler = scale_features(X_train, scaler_type=scaler_type)
                X_te_scaled = scaler.transform(X_test)

                # Train
                model = get_regressor(model_key, **params)
                t0 = time.time()
                model.fit(X_tr_scaled, y_train)
                fit_duration = time.time() - t0

                # Evaluate
                preds = model.predict(X_te_scaled)
                rmse = np.sqrt(mean_squared_error(y_test, preds))
                mae = mean_absolute_error(y_test, preds)
                r2 = r2_score(y_test, preds)

                leaderboard.append({
                    "model_name": name,
                    "scaler": scaler_type,
                    "rmse": round(float(rmse), 4),
                    "mae": round(float(mae), 4),
                    "r2": round(float(r2), 4),
                    "train_time_ms": round(float(fit_duration * 1000.0), 1)
                })
            except Exception:
                continue

    # Rank by RMSE ascending
    leaderboard.sort(key=lambda x: x["rmse"])
    for rank, entry in enumerate(leaderboard, 1):
        entry["rank"] = rank

    best_entry = leaderboard[0] if leaderboard else None

    return {
        "status": "completed",
        "total_evaluated": len(leaderboard),
        "elapsed_seconds": round(time.time() - start_time, 2),
        "best_model": best_entry,
        "leaderboard": leaderboard
    }
