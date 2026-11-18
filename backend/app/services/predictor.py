import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple, Union
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet, LogisticRegression
from sklearn.ensemble import (
    RandomForestRegressor,
    GradientBoostingRegressor,
    RandomForestClassifier,
    GradientBoostingClassifier,
    VotingRegressor,
    VotingClassifier,
    StackingRegressor,
    StackingClassifier
)
from sklearn.svm import SVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    mean_squared_error,
    mean_absolute_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE, ADASYN
import xgboost as xgb
import lightgbm as lgb

# Regression Models Factory
def get_regressor(model_name: str, **kwargs):
    name = model_name.lower()
    if name == "linear":
        return LinearRegression()
    elif name == "ridge":
        return Ridge(alpha=kwargs.get("alpha", 1.0))
    elif name == "lasso":
        return Lasso(alpha=kwargs.get("alpha", 0.1))
    elif name == "elasticnet":
        return ElasticNet(alpha=kwargs.get("alpha", 0.1), l1_ratio=kwargs.get("l1_ratio", 0.5))
    elif name == "random_forest":
        return RandomForestRegressor(n_estimators=kwargs.get("n_estimators", 100), max_depth=kwargs.get("max_depth", 10), random_state=42)
    elif name == "gradient_boosting":
        return GradientBoostingRegressor(n_estimators=kwargs.get("n_estimators", 100), learning_rate=kwargs.get("learning_rate", 0.1), random_state=42)
    elif name == "xgboost":
        return xgb.XGBRegressor(n_estimators=kwargs.get("n_estimators", 100), learning_rate=kwargs.get("learning_rate", 0.1), random_state=42, verbosity=0)
    elif name == "lightgbm":
        return lgb.LGBMRegressor(n_estimators=kwargs.get("n_estimators", 100), learning_rate=kwargs.get("learning_rate", 0.1), random_state=42, verbose=-1)
    elif name == "voting":
        return VotingRegressor(estimators=[
            ('rf', RandomForestRegressor(n_estimators=50, random_state=42)),
            ('gb', GradientBoostingRegressor(n_estimators=50, random_state=42)),
            ('ridge', Ridge())
        ])
    elif name == "stacking":
        return StackingRegressor(
            estimators=[
                ('rf', RandomForestRegressor(n_estimators=50, random_state=42)),
                ('ridge', Ridge())
            ],
            final_estimator=LinearRegression()
        )
    return RandomForestRegressor(n_estimators=100, random_state=42)

# Classification Models Factory
def get_classifier(model_name: str, **kwargs):
    name = model_name.lower()
    if name == "logistic":
        return LogisticRegression(class_weight=kwargs.get("class_weight", None), random_state=42)
    elif name == "random_forest":
        return RandomForestClassifier(n_estimators=kwargs.get("n_estimators", 100), max_depth=kwargs.get("max_depth", 8), class_weight=kwargs.get("class_weight", None), random_state=42)
    elif name == "svc":
        return SVC(probability=True, class_weight=kwargs.get("class_weight", None), random_state=42)
    elif name == "xgboost":
        return xgb.XGBClassifier(n_estimators=kwargs.get("n_estimators", 100), learning_rate=kwargs.get("learning_rate", 0.1), random_state=42, verbosity=0)
    elif name == "lightgbm":
        return lgb.LGBMClassifier(n_estimators=kwargs.get("n_estimators", 100), learning_rate=kwargs.get("learning_rate", 0.1), random_state=42, verbose=-1)
    elif name == "voting":
        return VotingClassifier(estimators=[
            ('rf', RandomForestClassifier(n_estimators=50, random_state=42)),
            ('lr', LogisticRegression(random_state=42))
        ], voting='soft')
    elif name == "stacking":
        return StackingClassifier(
            estimators=[
                ('rf', RandomForestClassifier(n_estimators=50, random_state=42)),
                ('lr', LogisticRegression(random_state=42))
            ],
            final_estimator=LogisticRegression()
        )
    return RandomForestClassifier(n_estimators=100, random_state=42)


def train_regression_model(
    X: pd.DataFrame,
    y: pd.Series,
    model_name: str = "random_forest",
    test_size: float = 0.2,
    **kwargs
) -> Dict[str, Any]:
    """Train regression model and return performance metrics and residual data."""
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, shuffle=False)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = get_regressor(model_name, **kwargs)
    model.fit(X_train_scaled, y_train)

    preds = model.predict(X_test_scaled)
    residuals = y_test - preds

    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mae = mean_absolute_error(y_test, preds)
    mape = np.mean(np.abs(residuals / (y_test + 1e-9))) * 100.0
    r2 = r2_score(y_test, preds)

    # Residual scatter points (actual vs predicted, and residual distribution)
    residual_points = []
    for actual, pred, res in zip(y_test, preds, residuals):
        residual_points.append({
            "actual": round(float(actual), 4),
            "predicted": round(float(pred), 4),
            "residual": round(float(res), 4)
        })

    return {
        "model_name": model_name,
        "task": "regression",
        "metrics": {
            "rmse": round(float(rmse), 4),
            "mae": round(float(mae), 4),
            "mape": round(float(mape), 2),
            "r2": round(float(r2), 4)
        },
        "sample_predictions": residual_points[:50],
        "model_artifact": model,
        "scaler": scaler
    }


def train_classification_model(
    X: pd.DataFrame,
    y: pd.Series,
    model_name: str = "random_forest",
    test_size: float = 0.2,
    imbalanced_strategy: Optional[str] = None,  # "smote", "adasyn", "class_weight"
    calibrate_probabilities: bool = True,
    **kwargs
) -> Dict[str, Any]:
    """Train direction classifier with imbalanced sampling, calibration, and metrics."""
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, shuffle=False)

    before_distribution = {int(k): int(v) for k, v in y_train.value_counts().items()}

    # Imbalanced handling
    if imbalanced_strategy == "smote":
        try:
            sampler = SMOTE(random_state=42)
            X_train, y_train = sampler.fit_resample(X_train, y_train)
        except Exception:
            pass
    elif imbalanced_strategy == "adasyn":
        try:
            sampler = ADASYN(random_state=42)
            X_train, y_train = sampler.fit_resample(X_train, y_train)
        except Exception:
            pass

    after_distribution = {int(k): int(v) for k, v in y_train.value_counts().items()}

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    base_model = get_classifier(model_name, **kwargs)

    if calibrate_probabilities and model_name not in ["voting", "stacking"]:
        model = CalibratedClassifierCV(estimator=base_model, cv=3)
    else:
        model = base_model

    model.fit(X_train_scaled, y_train)
    preds = model.predict(X_test_scaled)
    probs = model.predict_proba(X_test_scaled)[:, 1] if hasattr(model, "predict_proba") else preds

    acc = accuracy_score(y_test, preds)
    prec = precision_score(y_test, preds, zero_division=0)
    rec = recall_score(y_test, preds, zero_division=0)
    f1 = f1_score(y_test, preds, zero_division=0)
    try:
        auc = roc_auc_score(y_test, probs)
    except Exception:
        auc = 0.5

    cm = confusion_matrix(y_test, preds).tolist()

    return {
        "model_name": model_name,
        "task": "classification",
        "imbalanced_strategy": imbalanced_strategy,
        "class_distribution": {
            "before": before_distribution,
            "after": after_distribution
        },
        "metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1": round(float(f1), 4),
            "roc_auc": round(float(auc), 4)
        },
        "confusion_matrix": cm,
        "model_artifact": model,
        "scaler": scaler
    }

