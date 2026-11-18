import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.model_selection import KFold, StratifiedKFold, TimeSeriesSplit, learning_curve
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error

def run_cross_validation_comparison(
    X: pd.DataFrame,
    y: pd.Series,
    n_splits: int = 5
) -> Dict[str, Any]:
    """
    Side-by-side comparison of K-Fold vs TimeSeriesSplit cross-validation.
    """
    splits_kfold = KFold(n_splits=n_splits, shuffle=True, random_state=42)
    splits_ts = TimeSeriesSplit(n_splits=n_splits)

    kfold_scores = []
    ts_scores = []

    rf = RandomForestRegressor(n_estimators=40, random_state=42)

    # 1. K-Fold
    for fold, (train_idx, val_idx) in enumerate(splits_kfold.split(X)):
        rf.fit(X.iloc[train_idx], y.iloc[train_idx])
        preds = rf.predict(X.iloc[val_idx])
        rmse = float(np.sqrt(mean_squared_error(y.iloc[val_idx], preds)))
        kfold_scores.append({"fold": fold + 1, "rmse": round(rmse, 4)})

    # 2. TimeSeriesSplit
    for fold, (train_idx, val_idx) in enumerate(splits_ts.split(X)):
        rf.fit(X.iloc[train_idx], y.iloc[train_idx])
        preds = rf.predict(X.iloc[val_idx])
        rmse = float(np.sqrt(mean_squared_error(y.iloc[val_idx], preds)))
        ts_scores.append({"fold": fold + 1, "rmse": round(rmse, 4)})

    kf_vals = [s["rmse"] for s in kfold_scores]
    ts_vals = [s["rmse"] for s in ts_scores]

    return {
        "k_fold": {
            "folds": kfold_scores,
            "mean_rmse": round(float(np.mean(kf_vals)), 4),
            "std_rmse": round(float(np.std(kf_vals)), 4)
        },
        "time_series_split": {
            "folds": ts_scores,
            "mean_rmse": round(float(np.mean(ts_vals)), 4),
            "std_rmse": round(float(np.std(ts_vals)), 4)
        }
    }

def compute_learning_curve(
    X: pd.DataFrame,
    y: pd.Series
) -> Dict[str, Any]:
    """
    Computes train vs validation error bands across varying dataset sizes (Bias-Variance tradeoff).
    """
    rf = RandomForestRegressor(n_estimators=30, random_state=42)
    train_sizes, train_scores, test_scores = learning_curve(
        rf,
        X,
        y,
        train_sizes=np.linspace(0.2, 1.0, 5),
        cv=3,
        scoring="neg_root_mean_squared_error",
        n_jobs=-1
    )

    curve_data = []
    for size, tr_s, te_s in zip(train_sizes, train_scores, test_scores):
        tr_rmse = float(-np.mean(tr_s))
        te_rmse = float(-np.mean(te_s))
        tr_std = float(np.std(tr_s))
        te_std = float(np.std(te_s))

        curve_data.append({
            "sample_size": int(size),
            "train_rmse": round(tr_rmse, 4),
            "train_std": round(tr_std, 4),
            "val_rmse": round(te_rmse, 4),
            "val_std": round(te_std, 4),
        })

    return {
        "curve_points": curve_data,
        "interpretation": "Convergence of train and val curves indicates balanced variance and low bias."
    }
