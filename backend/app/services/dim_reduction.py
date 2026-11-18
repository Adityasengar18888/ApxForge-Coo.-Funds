import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler

def perform_pca(
    df: pd.DataFrame,
    features: List[str],
    n_components: int = 3
) -> Dict[str, Any]:
    """
    Principal Component Analysis with scree plot, cumulative variance, loadings, 2D and 3D projections.
    """
    X = df[features].dropna()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    actual_n = min(n_components, len(features), len(X))
    pca = PCA(n_components=actual_n, random_state=42)
    coords = pca.fit_transform(X_scaled)

    explained_var = [round(float(v), 4) for v in pca.explained_variance_ratio_]
    cumulative_var = [round(float(v), 4) for v in np.cumsum(pca.explained_variance_ratio_)]

    loadings = []
    for comp_idx in range(actual_n):
        comp_loadings = {
            features[feat_idx]: round(float(pca.components_[comp_idx, feat_idx]), 4)
            for feat_idx in range(len(features))
        }
        loadings.append({
            "component": f"PC{comp_idx + 1}",
            "explained_variance_pct": round(explained_var[comp_idx] * 100.0, 2),
            "loadings": comp_loadings
        })

    # Projections formatted for 2D and 3D plotting
    projections = []
    for idx in range(min(200, len(coords))):
        point: Dict[str, Any] = {
            "index": idx,
            "pc1": round(float(coords[idx, 0]), 4),
            "pc2": round(float(coords[idx, 1]), 4) if actual_n > 1 else 0.0,
            "pc3": round(float(coords[idx, 2]), 4) if actual_n > 2 else 0.0,
        }
        projections.append(point)

    return {
        "n_components": actual_n,
        "explained_variance": explained_var,
        "cumulative_variance": cumulative_var,
        "total_explained_pct": round(float(cumulative_var[-1] * 100.0), 2) if cumulative_var else 0.0,
        "loadings": loadings,
        "projections": projections
    }

def perform_tsne(
    df: pd.DataFrame,
    features: List[str],
    n_components: int = 2,
    perplexity: float = 30.0
) -> Dict[str, Any]:
    """
    t-Distributed Stochastic Neighbor Embedding for manifold visualization.
    """
    X = df[features].dropna()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Subsample if large for fast responsive execution
    sample_size = min(300, len(X_scaled))
    X_sample = X_scaled[:sample_size]

    perp = min(perplexity, max(5.0, (sample_size - 1) / 3))
    tsne = TSNE(n_components=n_components, perplexity=perp, random_state=42, n_iter=600)
    embedded = tsne.fit_transform(X_sample)

    points = []
    for idx in range(len(embedded)):
        pt: Dict[str, Any] = {
            "index": idx,
            "dim1": round(float(embedded[idx, 0]), 4),
            "dim2": round(float(embedded[idx, 1]), 4),
            "dim3": round(float(embedded[idx, 2]), 4) if n_components > 2 else 0.0
        }
        points.append(pt)

    return {
        "algorithm": "t-SNE",
        "n_samples": sample_size,
        "points": points
    }
