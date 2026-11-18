import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.feature_selection import VarianceThreshold, mutual_info_regression, RFE
from sklearn.linear_model import Lasso
from sklearn.ensemble import RandomForestRegressor

def select_features(
    X: pd.DataFrame,
    y: pd.Series,
    strategy: str = "variance",  # "variance", "correlation", "mutual_info", "rfe", "lasso"
    threshold: float = 0.01,
    n_features: int = 10
) -> Dict[str, Any]:
    """
    Select features and report kept/dropped features, scores, and reasons.
    """
    feature_names = list(X.columns)
    kept_features: List[str] = []
    dropped_features: List[Dict[str, Any]] = []
    scores: Dict[str, float] = {}

    if strategy == "variance":
        selector = VarianceThreshold(threshold=threshold)
        selector.fit(X)
        variances = X.var().to_dict()
        for col, var in variances.items():
            scores[col] = round(float(var), 4)
            if var >= threshold:
                kept_features.append(col)
            else:
                dropped_features.append({"feature": col, "score": round(float(var), 4), "reason": f"Variance below threshold ({threshold})"})

    elif strategy == "correlation":
        corr_with_target = X.apply(lambda col: col.corr(y)).abs()
        for col, corr in corr_with_target.items():
            scores[col] = round(float(corr), 4) if not np.isnan(corr) else 0.0
            if scores[col] >= threshold:
                kept_features.append(col)
            else:
                dropped_features.append({"feature": col, "score": scores[col], "reason": f"Target correlation below {threshold}"})

    elif strategy == "mutual_info":
        mi_scores = mutual_info_regression(X.fillna(0), y)
        for col, score in zip(feature_names, mi_scores):
            scores[col] = round(float(score), 4)
        sorted_cols = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)
        kept_features = sorted_cols[:n_features]
        for col in sorted_cols[n_features:]:
            dropped_features.append({"feature": col, "score": scores[col], "reason": "Not in top N mutual information features"})

    elif strategy == "lasso":
        lasso = Lasso(alpha=threshold, random_state=42)
        lasso.fit(X.fillna(0), y)
        for col, coef in zip(feature_names, lasso.coef_):
            scores[col] = round(float(abs(coef)), 4)
            if abs(coef) > 1e-5:
                kept_features.append(col)
            else:
                dropped_features.append({"feature": col, "score": 0.0, "reason": "L1 regularization penalized coefficient to zero"})

    elif strategy == "rfe":
        estimator = RandomForestRegressor(n_estimators=50, random_state=42)
        rfe = RFE(estimator, n_features_to_select=min(n_features, len(feature_names)))
        rfe.fit(X.fillna(0), y)
        for col, rank, support in zip(feature_names, rfe.ranking_, rfe.support_):
            scores[col] = int(rank)
            if support:
                kept_features.append(col)
            else:
                dropped_features.append({"feature": col, "score": int(rank), "reason": f"RFE rank {rank} (lower rank is better)"})

    # Guard against 0 kept features
    if not kept_features:
        kept_features = feature_names[:min(n_features, len(feature_names))]

    return {
        "strategy": strategy,
        "kept_features": kept_features,
        "dropped_features": dropped_features,
        "scores": scores,
        "total_features": len(feature_names),
        "kept_count": len(kept_features)
    }
