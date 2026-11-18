# ApxForge Funds — Quantitative Analytics & Machine Learning Platform

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2%20(App%20Router)-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg)](https://www.typescriptlang.org/)
[![Design](https://img.shields.io/badge/Design%20System-Apple%20iOS%20HIG-007AFF.svg)](https://developer.apple.com/design/human-interface-guidelines/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A high-performance quantitative investment analytics, derivatives pricing engine, and institutional machine learning workbench. Completely re-engineered from the ground up, replacing the legacy Streamlit architecture with a modern decoupled **Next.js 14 + FastAPI** web platform.

---

## Architecture Overview

```
                                      ┌─────────────────────────────────────────────────────┐
                                      │              Next.js 14 Frontend                    │
                                      │   (App Router, TypeScript Strict, Tailwind CSS,     │
                                      │    Apple iOS HIG, ECharts 2D, Three.js 3D WebGL)    │
                                      └──────────────────────────┬──────────────────────────┘
                                                                 │ REST / JWT Cookies
                                                                 ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FastAPI Backend Engine                                  │
│  ┌──────────────────────────────┬──────────────────────────────┬────────────────────────┐ │
│  │     Pricing & Greeks Engine  │   Data Science & ML Layer    │   Statistical Rigor    │ │
│  │   - Black-Scholes Call/Put   │   - Preprocessing & Scalers  │   - Welch & Student t  │ │
│  │   - Delta, Gamma, Theta      │   - Regression & Classifier  │   - ANOVA + Tukey HSD  │ │
│  │   - Vega, Rho, Delta Hedge   │   - SMOTE & ADASYN           │   - Chi-Square Test    │ │
│  │   - Volatility Surface       │   - Optuna Bayesian Tuning   │   - FDR / Bonferroni   │ │
│  │   - Legacy ML Risk Scoring   │   - SHAP / LIME Explanations │   - Bias-Variance      │ │
│  │   - Sharpe, Sortino, VaR     │   - Versioned Model Registry │   - TimeSeriesSplit CV │ │
│  └──────────────────────────────┴──────────────────────────────┴────────────────────────┘ │
│                                                │                                          │
│                    ┌───────────────────────────┴───────────────────────────┐              │
│                    │                  SQLModel Persistence                 │              │
│                    │    (Users, Watchlists, Portfolios, Backtests, Alerts) │              │
│                    └───────────────────────────────────────────────────────┘              │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

1. **Derivatives & Quantitative Analytics (100% Bit-for-Bit Parity)**:
   - Analytical Black-Scholes call and put option valuation.
   - Exact first- and second-order Greeks ($\Delta, \Gamma, \Theta, \mathcal{V}, \rho$).
   - Dynamic delta-hedging simulation with shares calculation and cash rebalancing.
   - 3D Volatility surface generated across strike and expiration space.
   - Multi-factor ML-adjusted risk scoring incorporating moneyness, time decay, volatility ratio, gamma, liquidity, and delta exposure.

2. **Machine Learning & AI Workbench (`/model-lab`)**:
   - Automated missing data imputation (Mean, Median, Mode, KNN) and outlier clipping (IQR, Z-Score, Winsorization).
   - Supervised models: Ridge, Lasso, ElasticNet, Random Forest, Gradient Boosting, XGBoost, LightGBM, and Stacking meta-ensembles.
   - Class-imbalanced learning with SMOTE and ADASYN.
   - Bayesian hyperparameter optimization powered by Optuna.
   - Model interpretability via TreeSHAP waterfall charts and LIME linear surrogates.
   - Versioned `.joblib` model artifact registry.

3. **Statistical Hypothesis Testing (`/stats-lab`)**:
   - One-sample, two-sample Student's and Welch's t-tests.
   - One-way ANOVA with post-hoc Tukey HSD pairwise contrasts.
   - Chi-Square test of categorical regime independence.
   - Family-wise error rate corrections (Bonferroni, Benjamini-Hochberg FDR).
   - Polynomial degree bias-variance sweep (degrees 1–15).
   - TimeSeriesSplit vs. standard K-Fold cross-validation comparison.

4. **Rich 2D & 3D Interactive Visualizations**:
   - **2D (Apache ECharts)**: Candlestick + Volume, Multi-line/area curves, Sparklines, Radar fundamentals, Sector treemaps, Sentiment gauges, and P&L waterfall charts.
   - **3D (Three.js WebGL)**: 3D Volatility Manifold, 3D PCA Feature Scatter, 3D Risk-Return Manifold, 3D Correlation Surface, 3D Monte Carlo Cone, and 3D Sector Extrusions.

5. **Full Apple iOS HIG Design Language**:
   - SF Pro typography hierarchy, grouped inset lists, rounded card radiuses (16–20px), bottom sheets, tactile spring micro-interactions (scale 0.97 on press), and translucent frosted glass (`backdrop-filter: blur(20px)`).

6. **Enterprise Security & Administration (`/admin`)**:
   - Seeded default administrator (`admin` / `admin123`) with mandatory first-login password rotation.
   - Sliding-window login rate limiting (5 attempts/min/IP) and 10-minute lockout after 10 failures.
   - User administration, asynchronous model retraining trigger, and append-only audit trail.

---

## Quick Start Guide

### Prerequisites
- Node.js 18+ and `pnpm`
- Python 3.11+
- (Optional) Docker & Docker Compose

### 1. Launch with Docker Compose (Fastest)

```bash
docker compose up -d --build
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`

### 2. Local Development Setup

#### Backend:
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run database initialization & seed admin user
python -c "from backend.app.db.init_db import init_db; init_db()"

# Train initial ML model artifacts
python -m backend.app.ml.train

# Start FastAPI server
uvicorn backend.app.main:app --reload --port 8000
```

#### Frontend:
```bash
cd frontend

# Install dependencies
pnpm install

# Start Next.js development server
pnpm dev
```
Navigate to `http://localhost:3000`.

---

## Default Credentials

| Field | Value | Notes |
|---|---|---|
| **Username** | `admin` | Default Superuser Account |
| **Password** | `admin123` | Flagged with `must_change_password=True` |

> [!WARNING]
> A persistent warning is logged on startup whenever the default administrator password is unchanged. Change your password immediately via the Profile screen or Change Password modal.

---

## Verification & Testing

To execute the test suites and quality gates:

```bash
# Run all backend unit & parity tests
pytest backend/tests -v

# Run legacy mathematical parity tests only
pytest backend/tests/test_parity.py -v

# Run backend linter
ruff check backend

# Run frontend build verification
cd frontend && pnpm build
```

---

## Documentation Directory

- [ANALYSIS.md](docs/ANALYSIS.md) — Comprehensive legacy codebase audit, formulas, and mapping.
- [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — Apple iOS Human Interface Guidelines styling tokens & components.
- [API.md](docs/API.md) — Full REST API endpoint reference and OpenAPI specification.
- [MIGRATION.md](docs/MIGRATION.md) — Feature parity ledger and legacy comparison.
- [ML.md](docs/ML.md) — Machine Learning and AI architecture, Optuna, SHAP/LIME, and Model Registry.
- [STATS.md](docs/STATS.md) — Statistical testing methodology, ANOVA, t-tests, and bias-variance tradeoff.
- [DECISIONS.md](docs/DECISIONS.md) — Architectural Decision Records (ADR).

---

## Regulatory Disclaimer

> [!NOTE]
> **DISCLAIMER**: This platform is designed solely for informational, academic, and quantitative research purposes. It does not constitute financial, investment, legal, or tax advice. Derivative pricing calculations and machine learning forecasts are theoretical estimates and statistical projections, not guarantees of future performance.
