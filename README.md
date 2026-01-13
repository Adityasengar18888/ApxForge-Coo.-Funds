📊 ApxForge Coo. Funds — Options Analytics & Risk Platform

A full-stack options pricing, analytics, and ML-based risk assessment platform built with Streamlit, Python, MySQL, and Google Gemini.

This application combines classical quantitative finance (Black–Scholes, Greeks) with machine-learning adjustments, user authentication, session management, risk scoring, and an AI assistant for interactive learning and analysis.

🚀 Features
🔐 Authentication & User Management

MySQL-backed user authentication

Secure password hashing with salt (SHA-256)

User sessions with expiry & activity tracking

Role-based users (admin / user)

User preferences persisted in database

Demo login fallback (no DB required)

📈 Options Analytics

Black–Scholes pricing (Call & Put)

Full Greeks: Delta, Gamma, Theta, Vega, Rho

Delta-hedging recommendations

Payoff diagrams

Historical volatility estimation

Real Yahoo option chain support

🤖 ML-Adjusted Pricing

Synthetic option data generation

ML regression model to adjust theoretical prices

Feature scaling & MAE reporting

Optional ML pricing toggle

⚠️ ML-Based Risk Meter

Risk score (0–100) with sensitivity control

Risk factors:

Moneyness

Time decay (Theta)

Volatility exposure (Vega)

Gamma risk

Liquidity (chain-based)

Delta exposure

Stress testing scenarios

Risk gauge + breakdown charts

CSV export of risk reports

🧠 Volatility Intelligence

Historical vs scenario volatility

Implied volatility from option chains

Approximate volatility surface

🤖 AI Chat Assistant

Powered by Google Gemini

Context-free Q&A on:

Options

Greeks

Risk management

Market concepts

User-supplied API key (no hard-coding)

🏗️ Project Structure
.
├── app.py                     # Main Streamlit application
├── requirements.txt
├── src/
│   ├── config.py              # Tickers, constants, risk-free rate
│   ├── data_loader.py         # Stock price data
│   ├── volatility.py          # Historical volatility
│   ├── black_scholes.py       # Pricing models
│   ├── greeks.py              # Greeks calculation
│   ├── hedge.py               # Delta hedging logic
│   ├── feature_engineering.py # ML dataset generation
│   ├── ml_model.py            # Model training
│   ├── option_chain.py        # Yahoo option chain loader
│   ├── vol_surface.py         # Volatility surface approximation
└── README.md

⚙️ Requirements
Python

Python 3.10+ (don’t try this on 3.8 and complain)

Python Packages

Install dependencies:

pip install -r requirements.txt


Key libraries:

streamlit

numpy

pandas

matplotlib

plotly

scikit-learn

mysql-connector-python

google-generativeai

🗄️ Database Setup (MySQL)
Default Configuration (change this)
Host: localhost
User: root
Password: aditya18
Database: options_analytics


⚠️ This is hard-coded in your code. That is bad practice.
Move credentials to environment variables before deploying anywhere.

Auto-Initialization

On first run, the app:

Creates the database

Creates all tables

Inserts a demo admin user

Demo Credentials
Username: demo
Password: demo123

▶️ Running the App
streamlit run app.py


If MySQL fails:

App automatically falls back to demo mode

No database required

🔑 Gemini AI Setup

Get a free API key from
👉 https://aistudio.google.com/app/apikey

Enter it inside the AI Chat tab

The key is stored only in session state (not persisted)

📤 Exports & Reports

Risk analysis CSV export

Stress test comparison

Copyable text summaries

🛑 Important Warnings (Read This)

You are currently doing all of the following wrong:

❌ Hard-coding database passwords

❌ No .env usage

❌ No migrations (raw SQL everywhere)

❌ ML model retrained on every run (wasteful)

❌ No unit tests

❌ No async handling for I/O

❌ No rate limiting for Gemini calls

❌ No Docker / deployment config

This is a strong prototype, not a production system.

🧠 Who This Is For

Quant & finance students

Risk analysts

Traders experimenting with models

ML-in-finance learners

Portfolio & derivatives researchers

This is not beginner-friendly — and that’s fine.

📄 License

Private / Educational use only
Commercial usage requires refactoring and security hardening.
