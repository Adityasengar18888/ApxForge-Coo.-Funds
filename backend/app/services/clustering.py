import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

def perform_clustering(
    df: pd.DataFrame,
    features: List[str],
    algorithm: str = "kmeans",  # "kmeans", "dbscan", "agglomerative"
    n_clusters: int = 3,
    eps: float = 0.5,
    min_samples: int = 5
) -> Dict[str, Any]:
    """
    Cluster assets or market regimes. Returns cluster assignments, metrics, and centroids.
    """
    X = df[features].dropna()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    if algorithm == "dbscan":
        model = DBSCAN(eps=eps, min_samples=min_samples)
        labels = model.fit_predict(X_scaled)
    elif algorithm == "agglomerative":
        model = AgglomerativeClustering(n_clusters=n_clusters)
        labels = model.fit_predict(X_scaled)
    else:  # kmeans default
        model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = model.fit_predict(X_scaled)

    # Compute silhouette score if more than 1 cluster present and not all noise
    unique_labels = set(labels)
    sil_score = 0.0
    if len(unique_labels) > 1 and not (len(unique_labels) == 2 and -1 in unique_labels):
        try:
            sil_score = round(float(silhouette_score(X_scaled, labels)), 4)
        except Exception:
            sil_score = 0.0

    # Calculate centroids and cluster profiles
    X_with_labels = X.copy()
    X_with_labels["cluster"] = labels

    cluster_counts = {int(k): int(v) for k, v in pd.Series(labels).value_counts().items()}
    centroids = {}
    for cluster_id in unique_labels:
        subset = X_with_labels[X_with_labels["cluster"] == cluster_id].drop("cluster", axis=1)
        centroids[int(cluster_id)] = {col: round(float(subset[col].mean()), 4) for col in features}

    # Elbow curve analysis for KMeans
    elbow_curve = []
    if algorithm == "kmeans":
        max_k = min(8, len(X) - 1)
        for k in range(2, max_k + 1):
            km = KMeans(n_clusters=k, random_state=42, n_init=5)
            km.fit(X_scaled)
            elbow_curve.append({
                "k": k,
                "inertia": round(float(km.inertia_), 2),
                "silhouette": round(float(silhouette_score(X_scaled, km.labels_)), 4)
            })

    return {
        "algorithm": algorithm,
        "n_clusters": len(unique_labels),
        "silhouette_score": sil_score,
        "cluster_counts": cluster_counts,
        "centroids": centroids,
        "elbow_curve": elbow_curve,
        "cluster_assignments": [int(l) for l in labels]
    }

