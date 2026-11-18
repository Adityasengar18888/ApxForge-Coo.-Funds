import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_portfolio_endpoint():
    res = client.get("/api/v1/portfolio/")
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "holdings" in data
    assert len(data["holdings"]) > 0

def test_backtest_run():
    payload = {
        "symbol": "AAPL",
        "strategy_name": "sma_crossover",
        "period": "1y",
        "initial_capital": 50000.0,
        "commission_bps": 5.0,
        "params": {"fast_period": 10, "slow_period": 30}
    }
    res = client.post("/api/v1/backtest/run", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "equity_curve" in data
    assert "trades" in data
    assert data["summary"]["initial_capital"] == 50000.0

def test_news_endpoint():
    res = client.get("/api/v1/news/?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "market_sentiment" in data
    assert "articles" in data
    assert len(data["articles"]) > 0

def test_alerts_endpoint():
    res = client.get("/api/v1/alerts/")
    assert res.status_code == 200
    data = res.json()
    assert "alerts" in data
    assert len(data["alerts"]) > 0
