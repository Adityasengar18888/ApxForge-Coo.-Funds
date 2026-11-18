import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.inspection import permutation_importance
import shap
import lime
import lime.lime_tabular

def explain_with_permutation_importance(
    model: Any,
    X: pd.DataFrame,
    y: pd.Series
) -> List[Dict[str, Any]]:
    """Permutation feature importance."""
    result = permutation_importance(model, X, y, n_repeats=5, random_state=42)
    features = list(X.columns)

    importance_list = []
    for feat, mean, std in zip(features, result.importances_mean, result.importances_std):
        importance_list.append({
            "feature": feat,
            "importance": round(float(mean), 4),
            "std": round(float(std), 4)
        })

    importance_list.sort(key=lambda x: x["importance"], reverse=True)
    return importance_list

def explain_with_shap(
    model: Any,
    X: pd.DataFrame,
    sample_index: int = 0
) -> Dict[str, Any]:
    """
    SHAP global summary values and local waterfall explanation for specific sample.
    """
    X_sample = X.iloc[:100]  # Representative background
    explainer = shap.TreeExplainer(model, X_sample)
    shap_values = explainer.shap_values(X_sample)

    # Global summary (mean absolute shap value per feature)
    if isinstance(shap_values, list):
        mean_shap = np.mean(np.abs(shap_values[1]), axis=0)
    else:
        mean_shap = np.mean(np.abs(shap_values), axis=0)

    features = list(X.columns)
    global_summary = [
        {"feature": feat, "mean_abs_shap": round(float(val), 4)}
        for feat, val in zip(features, mean_shap)
    ]
    global_summary.sort(key=lambda x: x["mean_abs_shap"], reverse=True)

    # Local waterfall for sample_index
    idx = min(sample_index, len(X_sample) - 1)
    if isinstance(shap_values, list):
        local_vals = shap_values[1][idx]
    else:
        local_vals = shap_values[idx]

    base_val = float(explainer.expected_value[1] if isinstance(explainer.expected_value, (list, np.ndarray)) else explainer.expected_value)

    local_waterfall = []
    for feat, shap_val, feat_val in zip(features, local_vals, X_sample.iloc[idx]):
        local_waterfall.append({
            "feature": feat,
            "feature_value": round(float(feat_val), 4),
            "shap_value": round(float(shap_val), 4),
            "effect": "positive" if shap_val > 0 else "negative"
        })
    local_waterfall.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

    return {
        "base_value": round(base_val, 4),
        "global_summary": global_summary,
        "local_waterfall": local_waterfall
    }

def explain_with_lime(
    model: Any,
    X: pd.DataFrame,
    sample_index: int = 0,
    mode: str = "regression"
) -> List[Dict[str, Any]]:
    """
    LIME local tabular explanation for a single prediction.
    """
    explainer = lime.lime_tabular.LimeTabularExplainer(
        training_data=np.array(X),
        feature_names=list(X.columns),
        mode=mode,
        random_state=42
    )

    idx = min(sample_index, len(X) - 1)
    exp = explainer.explain_instance(
        data_row=X.iloc[idx],
        predict_fn=model.predict,
        num_features=min(8, len(X.columns))
    )

    lime_rules = []
    for rule, weight in exp.as_list():
        lime_rules.append({
            "rule": rule,
            "weight": round(float(weight), 4),
            "direction": "positive" if weight > 0 else "negative"
        })

    return lime_rules
