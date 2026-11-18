# ApxForge Quantitative Analytics & ML Platform — REST API Specification

**Base URL**: `http://localhost:8000/api/v1`  
**Interactive Swagger UI**: `http://localhost:8000/docs`  
**ReDoc Reference**: `http://localhost:8000/redoc`

---

## 1. Authentication & Session Management

All authenticated endpoints require an `Authorization: Bearer <token>` header or a secure `access_token` httpOnly cookie.

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/login` | Authenticate with username and password. Returns access and refresh tokens. | No (Rate limited: 5/min) |
| `POST` | `/auth/logout` | Invalidate current session and clear authentication cookies. | No |
| `POST` | `/auth/refresh` | Exchange a valid refresh token for a new access token. | No |
| `GET` | `/auth/me` | Fetch identity, role, and password change requirement for current user. | Yes |
| `POST` | `/auth/change-password` | Update current user password and clear `must_change_password` flag. | Yes |
| `POST` | `/auth/register` | Register a new user account with role assignment. | Admin only |

---

## 2. Market Data & Options Analytics

Bit-for-bit mathematical parity with legacy Black-Scholes and Greeks engines.

| Method | Endpoint | Description | Query / Body Parameters |
|---|---|---|---|
| `GET` | `/market/quote` | Fetch latest real-time or cached quote. | `symbol: str`, `refresh: bool` |
| `GET` | `/market/history` | Historical OHLCV candle series. | `symbol: str`, `period: str`, `interval: str` |
| `GET` | `/market/fundamentals` | Financial valuation multiples and company profile. | `symbol: str` |
| `GET` | `/market/options` | Complete options chain with implied volatility. | `symbol: str` |
| `POST` | `/market/price-option` | Execute analytical Black-Scholes pricing, full Greeks, delta hedging, and ML risk scoring. | `S, K, T, r, vol, option_type, sensitivity` |

---

## 3. Stocks, Funds, Screener & Comparison

| Method | Endpoint | Description | Parameters |
|---|---|---|---|
| `GET` | `/stocks/` | List supported equity universe with 24H performance. | Optional sector filter |
| `GET` | `/stocks/{symbol}` | Enriched stock detail including multi-timeframe SMA/EMA, RSI, MACD, Bollinger Bands. | `symbol: str` |
| `GET` | `/funds/` | List major ETFs and index funds (SPY, QQQ, VOO, IWM, GLD, TLT). | None |
| `GET` | `/funds/{symbol}` | Fund holdings exposure, expense ratio, and category metrics. | `symbol: str` |
| `POST` | `/screener/` | Filter assets dynamically across market cap, P/E, volume, RSI, and beta. | SQL-safe filter criteria |
| `GET` | `/screener/presets` | Retrieve predefined screener filters (Oversold Large-Caps, High Momentum). | None |
| `POST` | `/compare/` | Multi-asset comparative return normalization and correlation analysis. | Up to 5 symbols, period |

---

## 4. Machine Learning & Model Lab (`/model-lab`)

Full data science pipeline with versioned artifact registry and interpretability.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/model-lab/preprocess` | Handle missing values, outliers (IQR/z-score/winsorize), and scaling (Standard/MinMax/Robust). |
| `POST` | `/model-lab/features` | Generate returns, volatility windows, technical indicators, calendar flags, and lag features. |
| `POST` | `/model-lab/feature-selection` | Select optimal features using variance threshold, correlation filter, mutual information, lasso, or RFE. |
| `POST` | `/model-lab/train/regression` | Train Linear, Ridge, Lasso, ElasticNet, Random Forest, Gradient Boosting, XGBoost, or LightGBM regressor. |
| `POST` | `/model-lab/train/classification` | Train directional classifier with SMOTE/ADASYN class balancing, calibration curves, and confusion matrix. |
| `POST` | `/model-lab/train/ensemble` | Train Voting or Stacking meta-regressors. |
| `POST` | `/model-lab/clustering` | Perform KMeans (with elbow & silhouette analysis), DBSCAN, or Agglomerative clustering. |
| `POST` | `/model-lab/dim-reduction` | Compute Principal Component Analysis (loadings & scree plot) or t-SNE 2D/3D projections. |
| `POST` | `/model-lab/time-series` | Stationarity tests (ADF, KPSS), ACF/PACF autocorrelation, seasonal decomposition, and ARIMA/MLP forecasting. |
| `POST` | `/model-lab/tune/optuna` | Execute Bayesian hyperparameter optimization with Optuna over N trials. |
| `POST` | `/model-lab/tune/grid-search` | Exhaustive GridSearchCV or RandomizedSearchCV cross-validation. |
| `POST` | `/model-lab/explain` | Explain model predictions using SHAP (global summary & local waterfall) or LIME surrogate rules. |
| `POST` | `/model-lab/automl` | Autonomous pipeline optimization across multiple algorithms with leaderboard generation. |
| `GET` | `/model-lab/registry` | List all persisted joblib model artifacts with hyperparameters, performance metrics, and version tags. |
| `POST` | `/model-lab/predict` | Generate real-time inferences against any registered model version. |

---

## 5. Statistical Rigor Lab (`/stats-lab`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/stats-lab/t-test` | One-sample and two-sample Student's t-test and Welch's t-test (unequal variances). |
| `POST` | `/stats-lab/anova` | One-way ANOVA hypothesis test followed by post-hoc Tukey HSD pairwise contrasts. |
| `POST` | `/stats-lab/chi-square` | Chi-square test of categorical independence with contingency table. |
| `POST` | `/stats-lab/multiple-testing-correction` | Adjust p-values using Bonferroni or False Discovery Rate (Benjamini-Hochberg) methods. |
| `POST` | `/stats-lab/bias-variance-sweep` | Polynomial degree sweep (1 to 15) illustrating underfitting vs. overfitting error decomposition. |
| `POST` | `/stats-lab/cross-validation` | Compare standard K-Fold vs. TimeSeriesSplit to demonstrate data leakage risks in financial series. |

---

## 6. Portfolio, Backtesting, News & Alerts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/portfolio/` | List user holdings, unrealized P&L, actual vs. target allocation, and rebalancing recommendations. |
| `POST` | `/portfolio/` | Add or update position. |
| `DELETE` | `/portfolio/{id}` | Delete holding. |
| `POST` | `/backtest/run` | Execute algorithmic backtest (SMA Crossover, RSI Reversion, MACD Momentum, Bollinger Bands). |
| `GET` | `/backtest/history` | List historical simulation runs for current user. |
| `GET` | `/news/` | Financial news aggregator analyzed with NLP sentiment lexicon (-1.0 to +1.0). |
| `GET` | `/alerts/` | List active quantitative surveillance alerts and evaluate trigger status. |
| `POST` | `/alerts/` | Configure new alert rule (price above, price below, RSI boundary). |
| `POST` | `/alerts/{id}/reset` | Reset triggered alert state. |
| `DELETE` | `/alerts/{id}` | Delete alert. |

---

## 7. Reports & Export (`/reports`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/reports/generate` | Synthesize comprehensive multi-section quantitative research dossier for any ticker. |

---

## 8. Administrative Operations (`/admin`)

Requires administrative credentials (`role === "admin"`).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/users` | List all registered accounts with role and status. |
| `POST` | `/admin/users/{id}/toggle-active` | Activate or deactivate user access. |
| `POST` | `/admin/users/{id}/reset-password-flag`| Force user to change password on subsequent login. |
| `POST` | `/admin/models/retrain` | Trigger asynchronous end-to-end retraining pipeline for registered ML models. |
| `GET` | `/admin/diagnostics` | Real-time process telemetry, memory usage, database file size, and APScheduler jobs. |
| `GET` | `/admin/audit-logs` | Immutable audit trail of operational and security actions. |

