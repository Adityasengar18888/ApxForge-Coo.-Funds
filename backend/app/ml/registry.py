import os
import json
import joblib
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
from backend.app.core.logging import logger

ARTIFACTS_DIR = Path("backend/app/ml/artifacts")
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

class ModelRegistry:
    def __init__(self):
        self.artifacts_dir = ARTIFACTS_DIR
        self.metadata_file = self.artifacts_dir / "registry_metadata.json"
        self._load_metadata()

    def _load_metadata(self):
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, "r") as f:
                    self.metadata = json.load(f)
            except Exception:
                self.metadata = {}
        else:
            self.metadata = {}

    def _save_metadata(self):
        with open(self.metadata_file, "w") as f:
            json.dump(self.metadata, f, indent=2)

    def register_model(
        self,
        model_name: str,
        version: str,
        task_type: str,
        artifact: Any,
        features: List[str],
        metrics: Dict[str, Any],
        dataset_snapshot: str = "default_prices"
    ) -> str:
        artifact_filename = f"{model_name.lower().replace(' ', '_')}_{version}.joblib"
        artifact_path = self.artifacts_dir / artifact_filename

        joblib.dump(artifact, artifact_path)

        meta_entry = {
            "model_name": model_name,
            "version": version,
            "task_type": task_type,
            "features": features,
            "metrics": metrics,
            "dataset_snapshot": dataset_snapshot,
            "artifact_path": str(artifact_path),
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "status": "ready"
        }

        self.metadata[model_name] = meta_entry
        self._save_metadata()
        logger.info(f"Successfully registered model '{model_name}' v{version} at {artifact_path}")
        return str(artifact_path)

    def load_model(self, model_name: str) -> Optional[Any]:
        if model_name in self.metadata:
            path = Path(self.metadata[model_name]["artifact_path"])
            if path.exists():
                return joblib.load(path)
        return None

    def get_model_metadata(self, model_name: str) -> Optional[Dict[str, Any]]:
        return self.metadata.get(model_name)

    def list_models(self) -> List[Dict[str, Any]]:
        return list(self.metadata.values())

    def is_trained(self, model_name: str) -> bool:
        return model_name in self.metadata and Path(self.metadata[model_name]["artifact_path"]).exists()

model_registry = ModelRegistry()

