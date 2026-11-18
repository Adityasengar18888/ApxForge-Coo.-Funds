import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from sklearn.preprocessing import MinMaxScaler, StandardScaler, RobustScaler
from sklearn.impute import KNNImputer

def handle_missing_values(df: pd.DataFrame, strategy: str = "forward_fill") -> pd.DataFrame:
    """
    Handle missing values with strategy:
    mean, median, mode, knn, forward_fill, backward_fill, drop
    """
    data = df.copy()

    if strategy == "drop":
        return data.dropna()
    elif strategy == "forward_fill":
        return data.ffill().bfill()
    elif strategy == "backward_fill":
        return data.bfill().ffill()
    elif strategy == "mean":
        for col in data.select_dtypes(include=[np.number]).columns:
            data[col] = data[col].fillna(data[col].mean())
        return data
    elif strategy == "median":
        for col in data.select_dtypes(include=[np.number]).columns:
            data[col] = data[col].fillna(data[col].median())
        return data
    elif strategy == "mode":
        for col in data.columns:
            mode_val = data[col].mode()
            if not mode_val.empty:
                data[col] = data[col].fillna(mode_val[0])
        return data
    elif strategy == "knn":
        num_cols = data.select_dtypes(include=[np.number]).columns
        if len(num_cols) > 0:
            imputer = KNNImputer(n_neighbors=5)
            data[num_cols] = imputer.fit_transform(data[num_cols])
        return data
    return data.ffill().bfill()

def detect_and_handle_outliers(
    df: pd.DataFrame,
    columns: Optional[List[str]] = None,
    method: str = "iqr",
    action: str = "winsorize"  # "winsorize", "clip", "drop"
) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """
    Detect and handle outliers via:
    - method: iqr, z_score, winsorization
    - action: winsorize, drop
    """
    data = df.copy()
    cols = columns or list(data.select_dtypes(include=[np.number]).columns)
    outlier_counts: Dict[str, int] = {}

    for col in cols:
        series = data[col]
        if method == "iqr":
            q25 = series.quantile(0.25)
            q75 = series.quantile(0.75)
            iqr = q75 - q25
            lower_bound = q25 - 1.5 * iqr
            upper_bound = q75 + 1.5 * iqr
        elif method == "z_score":
            mean = series.mean()
            std = series.std() + 1e-9
            lower_bound = mean - 3.0 * std
            upper_bound = mean + 3.0 * std
        else:  # default 5th-95th percentile
            lower_bound = series.quantile(0.05)
            upper_bound = series.quantile(0.95)

        is_outlier = (series < lower_bound) | (series > upper_bound)
        outlier_counts[col] = int(is_outlier.sum())

        if action == "drop":
            data = data[~is_outlier]
        else:  # winsorize / clip
            data[col] = series.clip(lower=lower_bound, upper=upper_bound)

    return data, outlier_counts

def scale_features(
    df: pd.DataFrame,
    columns: Optional[List[str]] = None,
    scaler_type: str = "standard"  # "standard", "minmax", "robust"
) -> Tuple[pd.DataFrame, Any]:
    """
    Scale numeric features using StandardScaler, MinMaxScaler, or RobustScaler.
    """
    data = df.copy()
    cols = columns or list(data.select_dtypes(include=[np.number]).columns)

    if scaler_type == "minmax":
        scaler = MinMaxScaler()
    elif scaler_type == "robust":
        scaler = RobustScaler()
    else:
        scaler = StandardScaler()

    if len(cols) > 0:
        data[cols] = scaler.fit_transform(data[cols])

    return data, scaler

def generate_data_quality_report(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Generate missingness, summary statistics, and data shape report.
    """
    total_rows = len(df)
    missing_summary = {}
    column_stats = {}

    for col in df.columns:
        null_count = int(df[col].isnull().sum())
        missing_summary[col] = {
            "null_count": null_count,
            "null_pct": round(float((null_count / total_rows) * 100.0), 2) if total_rows > 0 else 0.0,
            "dtype": str(df[col].dtype)
        }

        if np.issubdtype(df[col].dtype, np.number):
            valid = df[col].dropna()
            column_stats[col] = {
                "mean": round(float(valid.mean()), 4) if not valid.empty else None,
                "std": round(float(valid.std()), 4) if not valid.empty else None,
                "min": round(float(valid.min()), 4) if not valid.empty else None,
                "median": round(float(valid.median()), 4) if not valid.empty else None,
                "max": round(float(valid.max()), 4) if not valid.empty else None,
                "skewness": round(float(valid.skew()), 4) if len(valid) > 2 else 0.0
            }

    return {
        "total_rows": total_rows,
        "total_columns": len(df.columns),
        "missing_summary": missing_summary,
        "column_stats": column_stats
    }
