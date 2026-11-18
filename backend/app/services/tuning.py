import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error
import optuna

# Suppress verbose Optuna logs
optuna.logging.set_verbosity(optuna.logging.WARNING)

def run_hyperparameter_tuning(
    X: pd.DataFrame,
    y: pd.Series,
    model_type: str = "random_forest",
    strategy: str = "optuna",  # "optuna", "grid", "random"
    n_trials: int = 15
) -> Dict[str, Any]:
    """
    Tune model hyperparameters with Optuna, GridSearch, or RandomizedSearch.
    """
    split = int(0.8 * len(X))
    X_train, X_val = X.iloc[:split], X.iloc[split:]
    y_train, y_val = y.iloc[:split], y.iloc[split:]

    if strategy == "optuna":
        history = []

        def objective(trial: optuna.Trial):
            n_estimators = trial.suggest_int("n_estimators", 20, 150, step=10)
            max_depth = trial.suggest_int("max_depth", 3, 15)
            min_samples_split = trial.suggest_int("min_samples_split", 2, 8)

            rf = RandomForestRegressor(
                n_estimators=n_estimators,
                max_depth=max_depth,
                min_samples_split=min_samples_split,
                random_state=42
            )
            rf.fit(X_train, y_train)
            val_preds = rf.predict(X_val)
            rmse = float(np.sqrt(mean_squared_error(y_val, val_preds)))

            history.append({
                "trial": trial.number,
                "value": round(rmse, 4),
                "params": trial.params
            })
            return rmse

        study = optuna.create_study(direction="minimize")
        study.optimize(objective, n_trials=n_trials)

        best_params = study.best_params
        best_value = round(float(study.best_value), 4)

        return {
            "strategy": "Optuna Bayesian Optimization",
            "best_params": best_params,
            "best_score_rmse": best_value,
            "trials_history": history,
            "total_trials": len(history)
        }

    elif strategy == "grid":
        param_grid = {
            "n_estimators": [30, 60, 100],
            "max_depth": [4, 8, 12]
        }
        grid = GridSearchCV(RandomForestRegressor(random_state=42), param_grid, cv=3, scoring="neg_root_mean_squared_error")
        grid.fit(X, y)

        trials = []
        for idx, (params, score) in enumerate(zip(grid.cv_results_["params"], grid.cv_results_["mean_test_score"])):
            trials.append({
                "trial": idx + 1,
                "value": round(float(-score), 4),
                "params": params
            })

        return {
            "strategy": "GridSearchCV",
            "best_params": grid.best_params_,
            "best_score_rmse": round(float(-grid.best_score_), 4),
            "trials_history": trials,
            "total_trials": len(trials)
        }

    else:  # random search
        param_dist = {
            "n_estimators": [20, 40, 60, 80, 100, 120],
            "max_depth": [3, 5, 7, 9, 12],
            "min_samples_split": [2, 4, 6]
        }
        rand = RandomizedSearchCV(RandomForestRegressor(random_state=42), param_dist, n_iter=n_trials, cv=3, scoring="neg_root_mean_squared_error", random_state=42)
        rand.fit(X, y)

        trials = []
        for idx, (params, score) in enumerate(zip(rand.cv_results_["params"], rand.cv_results_["mean_test_score"])):
            trials.append({
                "trial": idx + 1,
                "value": round(float(-score), 4),
                "params": params
            })

        return {
            "strategy": "RandomizedSearchCV",
            "best_params": rand.best_params_,
            "best_score_rmse": round(float(-rand.best_score_), 4),
            "trials_history": trials,
            "total_trials": len(trials)
        }

