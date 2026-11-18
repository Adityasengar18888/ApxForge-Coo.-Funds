import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_generate_report():
    payload = {
        "symbol": "AAPL",
        "include_summary": True,
        "include_fundamentals": True,
        "include_technicals": True,
        "include_risk": True,
        "include_ml_forecast": True,
        "include_disclaimer": True,
    }
    res = client.post("/api/v1/reports/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["symbol"] == "AAPL"
    assert "executive_summary" in data
    assert "fundamentals" in data
    assert "technical_indicators" in data
    assert "risk_profile" in data
    assert "ml_forecast" in data
    assert "regulatory_disclaimer" in data

