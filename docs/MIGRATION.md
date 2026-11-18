# Migration & Feature Parity Ledger

This document tracks the complete end-to-end migration from the legacy Streamlit dashboard (`https://github.com/Adityasengar18888/ApxForge-Coo.-Funds`) to the modern **Next.js 14 (App Router) + FastAPI** quantitative trading platform.

All original code has been archived intact in `/legacy_reference/` for historical auditability and compliance.

---

## 1. Executive Parity Checklist

| Legacy Feature | Legacy File & Function | Modern Service & API | Status | Mathematical Parity |
|---|---|---|---|---|
| Black-Scholes Call Pricing | `src/black_scholes.py::black_scholes_call` | `backend/app/services/pricing.py::black_scholes_call` | ✅ Migrated | 100% exact match (`test_parity.py`) |
| Black-Scholes Put Pricing | `src/black_scholes.py::black_scholes_put` | `backend/app/services/pricing.py::black_scholes_put` | ✅ Migrated | 100% exact match (`test_parity.py`) |
| Delta (Call & Put) | `src/greeks.py::calculate_delta` | `backend/app/services/pricing.py::calculate_greeks` | ✅ Migrated | 100% exact match (`test_parity.py`) |
| Gamma | `src/greeks.py::calculate_gamma` | `backend/app/services/pricing.py::calculate_greeks` | ✅ Migrated | 100% exact match (`test_parity.py`) |
| Theta (Call & Put) | `src/greeks.py::calculate_theta` | `backend/app/services/pricing.py::calculate_greeks` | ✅ Migrated | 100% exact match (`test_parity.py`) |
| Vega (Percentage scaled) | `src/greeks.py::calculate_vega`, `app.py` | `backend/app/services/pricing.py::calculate_greeks` | ✅ Migrated | 100% exact match (`test_parity.py`) |
| Rho (Call & Put) | `src/greeks.py::calculate_rho` | `backend/app/services/pricing.py::calculate_greeks` | ✅ Migrated | 100% exact match (`test_parity.py`) |
| Delta Hedging Strategy | `src/greeks.py::delta_hedge_strategy` | `backend/app/services/pricing.py::delta_hedge_strategy` | ✅ Migrated | 100% exact match (`test_parity.py`) |
| Volatility Surface Matrix | `app.py::plot_volatility_surface` | `backend/app/services/pricing.py::generate_volatility_surface` | ✅ Migrated | 100% exact match (`test_parity.py`) |
| ML-Adjusted Risk Scoring | `app.py::calculate_ml_risk_score` | `backend/app/services/scoring.py::calculate_ml_risk_score` | ✅ Migrated | 100% exact match (`test_parity.py`) |
| Market Data Fetching | `src/data_fetcher.py::get_stock_data` | `backend/app/services/data_provider.py` | ✅ Migrated | Enhanced with caching & mock provider |
| Options Chain Scraper | `src/data_fetcher.py::get_options_chain` | `backend/app/services/data_provider.py` | ✅ Migrated | High reliability with fallback synthesis |
| Historical Volatility | `src/data_fetcher.py::get_historical_volatility`| `backend/app/services/indicators.py::historical_volatility` | ✅ Migrated | 100% exact match |

---

## 2. Legacy Issues & Improvements Log

1. **Vega Scaling Discrepancy in Legacy Code**:
   - *Legacy Observation*: In `src/greeks.py`, `calculate_vega` computed raw analytical Vega $\frac{\partial V}{\partial \sigma}$. However, in `app.py`, the code divided Vega by 100 to represent the dollar sensitivity per 1% change in implied volatility.
   - *Resolution*: Ported both raw and percentage-scaled representations in `backend/app/services/pricing.py`. Standardized API responses return standard percentage-scaled Vega while providing analytical formulas in documentation.

2. **Streamlit Blocking Execution Model**:
   - *Legacy Observation*: Every parameter tweak triggered a full script reload, blocking UI interaction and causing repeated un-cached yfinance network round-trips.
   - *Resolution*: Replaced with decoupled Next.js frontend with TanStack Query caching and FastAPI asynchronous non-blocking endpoints with multi-tiered TTL caching (60s intraday, 1h daily).

3. **Absence of Authentication & Security**:
   - *Legacy Observation*: Upstream repository had zero authentication, exposed unvalidated user input, and lacked session isolation.
   - *Resolution*: Implemented enterprise JWT with httpOnly cookies, password hashing (bcrypt), role-based access control, login rate limiting (5 attempts/min/IP), account lockout after 10 failures, forced password change flow, and audit logging.

4. **Absence of Systematic ML / DS Architecture**:
   - *Legacy Observation*: The legacy "ML" was a static heuristic rule formula named `calculate_ml_risk_score`.
   - *Resolution*: Built a complete 12-stage Data Science and Machine Learning platform (preprocessing, feature engineering, selection, regression, classification, clustering, dimensionality reduction, time-series, ensembles, Bayesian Optuna tuning, SHAP/LIME interpretability, and AutoML).

---

## 3. Verified Parity Unit Test Evidence

Unit tests in `backend/tests/test_parity.py` assert numeric equality with tolerances under $10^{-6}$:
```bash
pytest backend/tests/test_parity.py -v
```
All tests pass with 100% mathematical fidelity.
