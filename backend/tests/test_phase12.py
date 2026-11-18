import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_admin_endpoints_unauthorized():
    # Calling admin endpoints without admin JWT should return 401 or 403
    res_users = client.get("/api/v1/admin/users")
    assert res_users.status_code in [401, 403]

    res_audit = client.get("/api/v1/admin/audit-logs")
    assert res_audit.status_code in [401, 403]

def test_admin_endpoints_with_login():
    # Login as admin
    login_res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch users
    users_res = client.get("/api/v1/admin/users", headers=headers)
    assert users_res.status_code == 200
    users = users_res.json()
    assert len(users) >= 1
    assert any(u["username"] == "admin" for u in users)

    # Fetch diagnostics
    diag_res = client.get("/api/v1/admin/diagnostics", headers=headers)
    assert diag_res.status_code == 200
    diag = diag_res.json()
    assert "system_metrics" in diag
    assert "database" in diag
    assert "scheduler" in diag

    # Fetch audit logs
    audit_res = client.get("/api/v1/admin/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    assert isinstance(audit_res.json(), list)
