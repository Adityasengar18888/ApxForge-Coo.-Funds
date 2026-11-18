from fastapi import APIRouter
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import numpy as np
import pandas as pd

from backend.app.services.statistics import (
    run_hypothesis_tests,
    run_one_way_anova,
    run_chi_square_test,
    simulate_bias_variance_sweep
)
from backend.app.services.validation import run_cross_validation_comparison
from backend.app.services.data_provider import data_provider

router = APIRouter(prefix="/stats-lab", tags=["Statistics Lab"])

class HypothesisRequest(BaseModel):
    sample_a: List[float]
    sample_b: Optional[List[float]] = None
    pop_mean: float = 0.0
    alpha: float = 0.05

@router.post("/hypothesis-test")
def test_hypothesis(req: HypothesisRequest):
    return run_hypothesis_tests(
        req.sample_a,
        sample_b=req.sample_b,
        pop_mean=req.pop_mean,
        alpha=req.alpha
    )

@router.get("/anova")
def anova_endpoint():
    # Asset returns across sectors
    np.random.seed(42)
    groups = {
        "Tech (XLK)": list(np.random.normal(0.0012, 0.016, 120)),
        "Finance (XLF)": list(np.random.normal(0.0006, 0.012, 120)),
        "Energy (XLE)": list(np.random.normal(0.0002, 0.022, 120)),
        "Health (XLV)": list(np.random.normal(0.0005, 0.010, 120)),
    }
    return run_one_way_anova(groups)

@router.get("/chi-square")
def chi_square_endpoint():
    # Contingency matrix: [Market Regime x Trade Outcome (Win/Loss)]
    # Bull Market: 75 wins, 25 losses
    # Bear Market: 35 wins, 65 losses
    matrix = [[75, 25], [35, 65]]
    return run_chi_square_test(matrix)

@router.get("/bias-variance")
def bias_variance_endpoint():
    return simulate_bias_variance_sweep()

@router.get("/cross-validation")
def cross_validation_endpoint(symbol: str = "AAPL"):
    df = data_provider.get_history(symbol, period="1y")
    df["ret"] = df["Close"].pct_change().fillna(0)
    X = df[["Open", "High", "Low", "Volume"]]
    y = df["Close"]

    return run_cross_validation_comparison(X, y)
