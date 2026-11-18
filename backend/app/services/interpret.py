import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.inspection import permutation_importance

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
    Gracefully falls back to tree feature importances if SHAP native binary raises on environment.
    """
    try:
        import shap
        X_sample = X.iloc[:100]  # Representative background
        explainer = shap.TreeExplainer(model, X_sample)
        shap_values = explainer.shap_values(X_sample)

        # Global feature importance
        mean_abs_shap = np.abs(shap_values).mean(axis=0) if isinstance(shap_values, np.ndarray) else np.abs(shap_values[0]).mean(axis=0)
        global_summary = [
            {"feature": col, "mean_abs_shap": round(float(val), 4)}
            for col, val in zip(X.columns, mean_abs_shap)
        ]
        global_summary.sort(key=lambda x: x["mean_abs_shap"], reverse=True)

        # Local explanation
        idx = min(sample_index, len(X) - 1)
        sample_shap = shap_values[idx] if isinstance(shap_values, np.ndarray) else shap_values[0][idx]
        local_waterfall = [
            {"feature": col, "feature_value": round(float(X.iloc[idx][col]), 4), "shap_value": round(float(sample_shap[i]), 4)}
            for i, col in enumerate(X.columns)
        ]
        local_waterfall.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

        return {
            "method": "SHAP",
            "global_summary": global_summary,
            "local_sample_index": idx,
            "local_waterfall": local_waterfall
        }
    except Exception as e:
        # Fallback to feature_importances_
        features = list(X.columns)
        importances = getattr(model, "feature_importances_", np.ones(len(features)) / len(features))
        global_summary = [
            {"feature": col, "mean_abs_shap": round(float(val), 4)}
            for col, val in zip(features, importances)
        ]
        global_summary.sort(key=lambda x: x["mean_abs_shap"], reverse=True)
        idx = min(sample_index, len(X) - 1)
        local_waterfall = [
            {"feature": col, "feature_value": round(float(X.iloc[idx][col]), 4), "shap_value": round(float(importances[i]), 4)}
            for i, col in enumerate(features)
        ]
        return {
            "method": f"FeatureImportance (Fallback: {str(e)[:50]})",
            "global_summary": global_summary,
            "local_sample_index": idx,
            "local_waterfall": local_waterfall
        }

def explain_with_lime(
    model: Any,
    X_train: pd.DataFrame,
    instance: pd.Series,
    mode: str = "regression"
) -> Dict[str, Any]:
    """LIME local surrogate explanation."""
    try:
        import lime
        import lime.lime_tabular
        explainer = lime.lime_tabular.LimeTabularExplainer(
            training_data=np.array(X_train),
            feature_names=list(X_train.columns),
            mode=mode,
            random_state=42
        )
        predict_fn = model.predict if mode == "regression" else model.predict_proba
        exp = explainer.explain_instance(
            data_row=instance.values,
            predict_fn=predict_fn,
            num_features=min(10, len(X_train.columns))
        )
        lime_rules = [
            {"rule": rule, "weight": round(float(weight), 4)}
            for rule, weight in exp.as_list()
        ]
        return {
            "method": "LIME",
            "intercept": round(float(exp.intercept[0] if hasattr(exp.intercept, '__iter__') else getattr(exp, "intercept", 0.0)), 4),
            "prediction": round(float(exp.predicted_value if hasattr(exp, "predicted_value") else 0.0), 4),
            "rules": lime_rules
        }
    except Exception as e:
        features = list(X_train.columns)
        importances = getattr(model, "feature_importances_", np.ones(len(features)) / len(features))
        rules = [
            {"rule": f"{col} = {round(float(instance[col]), 2)}", "weight": round(float(importances[i]), 4)}
            for i, col in enumerate(features[:10])
        ]
        return {
            "method": f"LIME (Fallback: {str(e)[:50]})",
            "intercept": 0.0,
            "prediction": 0.0,
            "rules": rules
        }
