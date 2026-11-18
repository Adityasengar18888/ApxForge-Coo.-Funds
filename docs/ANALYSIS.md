# Complete Analysis of Legacy Codebase (ApxForge-Coo.-Funds)

## 1. Full File Tree with One-Line Purpose

| Path | Purpose |
|------|---------|
| `app.py` | Monolithic Streamlit application containing authentication, options pricing, Greeks, ML risk scoring, payoff charts, volatility analysis, Gemini AI assistant, and risk meter. |
| `api_server.py` | Minimal FastAPI entry point exposing Black-Scholes pricing and Greeks via `/price` endpoint. |
| `main.py` | CLI analysis script iterating through tickers to fetch data, compute volatility, generate synthetic options datasets, train Random Forest, and calculate Greeks & hedge. |
| `requirements.txt` | Python dependency manifest listing Streamlit, numpy, pandas, matplotlib, plotly, google-generativeai, mysql-connector-python, scikit-learn, python-dotenv. |
| `README.txt` | Brief installation and execution notes for running `app.py` and training scripts. |
| `src/black_scholes.py` | Analytical Black-Scholes call option pricing function using cumulative normal distribution. |
| `src/config.py` | Global configuration constants: `TICKERS` (AAPL, MSFT, NVDA, TSLA, AMZN, META, GOOGL), `RISK_FREE_RATE` (0.05), `TRADING_DAYS` (252), `RANDOM_STATE` (42). |
| `src/data_loader.py` | Yahoo Finance data fetcher retrieving historical stock prices and computing log returns. |
| `src/feature_engineering.py` | Synthetic option dataset generator producing simulated Spot, Strike, Expiry, Volatility, Greeks, and perturbed MarketPrice. |
| `src/global_dataset.py` | Builds options dataset across multiple option chain rows with proxy spot approximation. |
| `src/global_ml_model.py` | Multi-ticker options pricing model using GradientBoostingRegressor and OneHotEncoder on ticker symbols. |
| `src/greeks.py` | Black-Scholes Greeks calculations for call options (Delta, Theta, Vega). |
| `src/hedge.py` | Delta-neutral hedging calculation (`-delta` shares per contract). |
| `src/ml_model.py` | Random Forest regression model trained on simulated option parameters to predict MarketPrice. |
| `src/option_chain.py` | Yahoo Finance option chain loader collecting calls and puts across all available expiration dates. |
| `src/volatility.py` | Annualized historical volatility calculation using trading days square root scaling. |
| `src/vol_surface.py` | Approximates implied volatility smile/surface across moneyness bins and expiration dates. |
| `src/api/routes.py` | FastAPI router containing the `/price` endpoint for Black-Scholes pricing, Greeks, and delta hedge. |
| `src/api/__init__.py` | Package initializer for API routes. |
| `data/raw/*.csv` | Historical daily price CSVs for AAPL, AMZN, GOOGL, META, MSFT, NVDA, TSLA. |
| `data/processed/*.csv` | Processed option dataset CSVs with simulated parameters and Black-Scholes features. |
| `reports/bot.html` | Legacy standalone HTML prototype for Jarvis AI chat assistant with background video. |
| `reports/script.js` | Client-side JavaScript for Jarvis AI chat directly connecting to Gemini 2.0 Flash API with hardcoded API key. |
| `reports/style.css` | CSS styling for the legacy Jarvis chatbot interface. |
| `reports/bg.mp4` | Video asset used in Jarvis chat background. |
| `reports/logo.png` | Image logo asset. |

---

## 2. Current Tech Stack, Python Version & Dependencies

- **Python Version**: 3.12.5 (local environment runtime; targeted for Python 3.11/3.12 compatibility).
- **Core Frameworks**:
  - `streamlit>=1.32.0` (UI frontend & reactive server - to be completely replaced)
  - `fastapi` & `uvicorn` (minimal API server prototype)
- **Scientific & ML**:
  - `numpy>=1.26.0`
  - `pandas>=2.1.0`
  - `scipy` (scipy.stats.norm)
  - `scikit-learn>=1.4.0` (RandomForestRegressor, GradientBoostingRegressor, StandardScaler, OneHotEncoder)
- **Data & Market**:
  - `yfinance`
- **Visualization**:
  - `matplotlib>=3.8.0`
  - `plotly>=5.18.0`
- **Database**:
  - `mysql-connector-python>=8.3.0` (targeted for migration to SQLite / SQLModel with Postgres readiness)
- **AI / LLM**:
  - `google-generativeai>=0.4.1`

---

## 3. Legacy Streamlit Pages, Tabs & Functions

### Authentication & User Management:
- **`show_simple_login()`**: Fallback demo login form (`demo` / `demo123`).
- **`show_login_page()`**: Database-driven login, user registration (username, email, password, full name, company), and password reset stub.
- **`show_user_preferences()`**: Allows setting default ticker, default option type (Call/Put), expiry days, history years, risk tolerance (low/medium/high), and theme (light/dark).
- **`show_contact_modal()`**: Contact information and form capturing inquiries into session state.
- **`show_help_center()`**: FAQ accordion, quick start guide, and support ticket creation.

### Application Tabs in `main_application()`:
- **Tab 1 — Pricing & Risk (`📈 Pricing & Risk`)**:
  - Live metric cards: Spot Price, Strike, Volatility, Expiry.
  - Valuation metrics: Final Price (BS or ML-Adjusted), Delta, Theta, Vega, Delta Hedge shares.
  - Risk meter banner with color code (HIGH/MEDIUM/LOW) and numeric score (0-100).
- **Tab 2 — Payoff (`📉 Payoff`)**:
  - Payoff curve at expiry plotted over spot price range `[0.7 * S, 1.3 * S]`.
  - P&L calculation: `payoff = max(ST - K, 0) - premium` for Call, `max(K - ST, 0) - premium` for Put.
- **Tab 3 — Volatility (`🧠 Volatility`)**:
  - Displays historical volatility vs scenario volatility (Low -20%, Current, High +20%).
  - Real Yahoo option chain option and volatility surface grid (moneyness bins x expiry dates).
- **Tab 4 — Market Data (`📊 Market Data`)**:
  - Historical stock price chart over 1-10 years.
  - Live option chain snapshot table (first 20 rows of calls/puts).
- **Tab 5 — AI Chat (`🤖 AI Chat`)**:
  - Gemini-powered options assistant with key configuration and conversation history.
- **Tab 6 — Risk Meter (`⚠️ Risk Meter`)**:
  - Plotly gauge chart (0-100) with green/yellow/red risk bands.
  - Key factor breakdown: Moneyness, Time Decay, Volatility, Gamma, Liquidity, Delta Exposure.
  - Stress testing simulation (Market Crash -20%, Volatility Spike +50%, Time Decay 7d, Combined Stress).
  - CSV export of risk report.

---

## 4. Data Sources and Call Patterns

1. **`yfinance.Ticker`**:
   - `Ticker.history(period="1y")` (and parameterized periods like `"5y"`): Fetches daily OHLCV, calculates log returns `ln(Close / Close.shift(1))`.
   - `Ticker.options`: Fetches expiration date strings.
   - `Ticker.option_chain(expiry)`: Fetches calls and puts dataframes (`strike`, `lastPrice`, `impliedVolatility`, `volume`, `openInterest`).
2. **Local CSVs**:
   - `data/raw/{ticker}_price.csv`: Cached historical price datasets.
   - `data/processed/{ticker}_options_dataset.csv`: Precomputed synthetic options datasets.
3. **Synthetic Option Generation**:
   - `src/feature_engineering.py`: Simulates perturbed Spot, Strike, Expiry, Volatility, computes theoretical BS price and Greeks, and adds Gaussian noise (`N(0, 0.5)`) to yield `MarketPrice`.

---

## 5. ML Models & Prediction Logic

1. **Local Single-Ticker Options Pricing Model (`src/ml_model.py`)**:
   - Model: `RandomForestRegressor(n_estimators=300, max_depth=10, random_state=42)`.
   - Features: `[Spot, Strike, T, Vol, Delta, Theta, Vega]` scaled via `StandardScaler`.
   - Target: `MarketPrice`.
   - Metric: MAE on 20% test split.
2. **Global Multi-Ticker Options Pricing Model (`src/global_ml_model.py`)**:
   - Model: `GradientBoostingRegressor(n_estimators=300, learning_rate=0.05, max_depth=4)`.
   - Pipeline: `ColumnTransformer` with `OneHotEncoder` on `Ticker` + passthrough numerical features `[Spot, Strike, T, IV, Delta, Theta, Vega]`.
   - Target: `MarketPrice`.
   - Metric: MAE.
3. **ML Risk Scoring Engine (`app.py: calculate_ml_risk_score`)**:
   - Composite risk index from 0 to 100 based on weighted factors:
     - Moneyness (25%): 70 for ATM (0.9-1.1), 40 for ITM calls, 80 for OTM calls.
     - Time Decay (20%): `min(100, max(0, abs(theta) * 365 * 100))`.
     - Volatility (20%): IV ratio or Vega scaled.
     - Gamma (15%): `min(100, max(0, gamma * 10000))`.
     - Liquidity (10%): `100 - min(100, (avg_volume / 1000) * 10)`.
     - Delta Exposure (10%): `min(100, abs(delta) * 100)`.
   - Multiplied by sensitivity factor (0.5 to 2.0).

---

## 6. Business Rules & Mathematical Formulas (MUST BE PRESERVED)

1. **Black-Scholes Call Pricing**:
   $$d_1 = \frac{\ln(S / K) + (r + 0.5\sigma^2)T}{\sigma\sqrt{T}}$$
   $$d_2 = d_1 - \sigma\sqrt{T}$$
   $$C = S \cdot \Phi(d_1) - K e^{-rT} \Phi(d_2)$$
2. **Put-Call Parity**:
   $$P = C + K e^{-rT} - S$$
3. **Greeks**:
   - $\text{Delta}_{\text{call}} = \Phi(d_1)$
   - $\text{Delta}_{\text{put}} = \Phi(d_1) - 1$
   - $\text{Gamma} = \frac{\phi(d_1)}{S \sigma \sqrt{T}}$
   - $\text{Vega} = \frac{S \phi(d_1) \sqrt{T}}{100}$ (per 1% volatility change)
   - $\text{Theta}_{\text{call}} = \frac{-S \phi(d_1)\sigma / (2\sqrt{T}) - r K e^{-rT} \Phi(d_2)}{365}$ (per day)
   - $\text{Theta}_{\text{put}} = \frac{-S \phi(d_1)\sigma / (2\sqrt{T}) + r K e^{-rT} \Phi(-d_2)}{365}$ (per day)
   - $\text{Rho}_{\text{call}} = \frac{K T e^{-rT} \Phi(d_2)}{100}$ (per 1% rate change)
   - $\text{Rho}_{\text{put}} = \frac{-K T e^{-rT} \Phi(-d_2)}{100}$
4. **Delta Hedging**:
   $$\text{Hedge Shares} = -\text{Delta}$$
5. **Annualized Historical Volatility**:
   $$\sigma = \text{std}(\ln(S_t / S_{t-1})) \times \sqrt{252}$$
6. **Risk Categorization**:
   - Low: Score < 40
   - Moderate / Medium: $40 \le \text{Score} < 70$
   - High: Score $\ge 70$

---

## 7. Hardcoded Values, Secrets, Absolute Paths & Code Smells

1. **Security Vulnerabilities & Secrets**:
   - `reports/script.js:13`: Exposed raw Gemini API key: `"AIzaSyD5lKeVgMDdMAT6uXaaQ-mR5RBJBV3X2AI"`.
   - `app.py:39, 51, 86, 233, 287, 363, 406, 442, 465`: Hardcoded MySQL password `"aditya18"`, root user, and localhost.
   - Hardcoded demo credentials in code: username `"demo"`, password `"demo123"`.
2. **Absolute Paths in Compiled Code / Comments**:
   - `c:\Users\Welcome\OneDrive\Desktop\hedge\src\ml_model.py` and similar paths found in compiled pyc metadata from legacy migrations.
3. **Code Smells & Suspected Issues**:
   - *Suspected Issue 1*: In `src/global_dataset.py`, `S = row["lastPrice"] + row["strike"]` is used as a proxy spot price when historical spot is not joined. This is crude and only an approximation. (Preserved with note in migration).
   - *Suspected Issue 2*: In `src/greeks.py`, Vega is `S * norm.pdf(d1) * np.sqrt(T)`, whereas in `app.py:690`, Vega is divided by 100 (for 1% change). Both representations exist in legacy. We will support standardized Vega and percentage-scaled Vega with clear documentation.
   - *Suspected Issue 3*: MySQL connection failure drops directly into simple login without schema persistence.
   - *Suspected Issue 4*: Streamlit page reruns trigger full retraining of Random Forest on synthetic samples synchronously on the main thread, freezing the UI.
   - *Suspected Issue 5*: Monolithic `app.py` mixes presentation, database queries, mathematical modeling, and AI chat in a single 1,739-line file.

---

## 8. Migration Mapping Table

| Legacy File / Component | New Target Location | Action | Reason |
|-------------------------|---------------------|--------|--------|
| `src/black_scholes.py` | `backend/app/services/pricing.py` | Port & Extend | Mathematical core pricing logic (Call & Put) |
| `src/greeks.py` | `backend/app/services/indicators.py` & `pricing.py` | Port & Extend | Analytic Greeks engine + all Greeks (Gamma, Rho, etc.) |
| `src/hedge.py` | `backend/app/services/pricing.py` | Port | Delta hedging calculation |
| `src/volatility.py` | `backend/app/services/indicators.py` | Port & Extend | Historical volatility + rolling volatility metrics |
| `src/vol_surface.py` | `backend/app/services/pricing.py` | Port & Extend | Volatility surface matrix for 2D/3D visualization |
| `src/data_loader.py` | `backend/app/services/data_provider.py` | Port & Rewrite | Provider abstraction with Yahoo Finance + offline MockProvider |
| `src/feature_engineering.py` | `backend/app/services/features.py` | Port & Expand | Feature generation, synthetic dataset generator, lags, momentum |
| `src/ml_model.py` | `backend/app/services/predictor.py` & `ml/` | Port & Modernize | Scikit-learn Random Forest model + persistent joblib artifacts |
| `src/global_dataset.py` | `backend/app/services/features.py` | Port | Global options dataset builder |
| `src/global_ml_model.py` | `backend/app/services/predictor.py` | Port & Modernize | Multi-ticker GradientBoosting pipeline |
| `src/api/routes.py` | `backend/app/api/v1/market.py` & `predict.py` | Rewrite to FastAPI v1 | RESTful OpenAPI endpoints |
| `app.py: calculate_ml_risk_score` | `backend/app/services/scoring.py` | Port | 100% exact legacy risk scoring preserved |
| `app.py: MySQL DB & Auth` | `backend/app/core/security.py`, `models/user.py`, `db/` | Rewrite to SQLModel + JWT | Industry standard SQLite/PostgreSQL with bcrypt & JWT auth |
| `app.py: Streamlit UI` | `frontend/app/` (Next.js 14 App Router) | Rewrite to Next.js | Modern, responsive Apple HIG design system |
| `reports/bot.html & script.js` | `frontend/app/(app)/assistant/` & `backend/app/api/v1/` | Port & Secure | Secure backend proxy for AI assistant without leaking keys |
| `reports/bg.mp4, logo.png` | `frontend/public/` | Port | Static media assets |
