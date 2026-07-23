"""
tests/test_credit.py  —  Credit score, risk profile, investment plan, dashboard tests.

Note: credit score endpoint requires the ML model to be trained first.
Tests that require the model are marked with pytest.mark.requires_model.
Tests that don't require the model run unconditionally.
"""
import pytest

VALID_CREDIT_PAYLOAD = {
    "recharge_frequency": 15,
    "bill_payment_regularity": 85.0,
    "upi_transaction_count": 90,
    "wallet_usage_score": 70.0,
    "monthly_savings_pct": 18.0,
    "ecommerce_frequency": 12,
    "bank_balance_stability": 75.0,
}

VALID_RISK_PAYLOAD = {
    "age": 28,
    "monthly_income": 50000,
    "occupation": "Software Engineer",
    "monthly_savings": 12000,
    "investment_amount": 5000,
    "has_emergency_fund": True,
    "investment_duration_years": 10,
    "market_loss_reaction": "hold",
}


# ─── Risk Profile (no model required) ────────────────────────────────────────

def test_risk_profile_happy_path(client, auth_headers):
    resp = client.post("/api/v1/risk-profile", json=VALID_RISK_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["risk_level"] in {"Low", "Medium", "High"}
    assert "rationale" in data
    assert "score_breakdown" in data
    assert "disclaimer" in data


def test_risk_profile_high_risk(client, auth_headers):
    payload = {**VALID_RISK_PAYLOAD, "age": 22, "investment_duration_years": 15,
               "market_loss_reaction": "buy_more", "has_emergency_fund": True}
    resp = client.post("/api/v1/risk-profile", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["risk_level"] == "High"


def test_risk_profile_low_risk(client, auth_headers):
    payload = {**VALID_RISK_PAYLOAD, "age": 65, "investment_duration_years": 1,
               "market_loss_reaction": "panic_sell", "has_emergency_fund": False}
    resp = client.post("/api/v1/risk-profile", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["risk_level"] == "Low"


def test_risk_profile_invalid_reaction(client, auth_headers):
    payload = {**VALID_RISK_PAYLOAD, "market_loss_reaction": "dont_care"}
    resp = client.post("/api/v1/risk-profile", json=payload, headers=auth_headers)
    assert resp.status_code == 422


def test_risk_profile_no_auth(client):
    resp = client.post("/api/v1/risk-profile", json=VALID_RISK_PAYLOAD)
    assert resp.status_code == 401


# ─── Investment Plan (no model required) ─────────────────────────────────────

def test_investment_plan_low(client, auth_headers):
    resp = client.post("/api/v1/investment-plan",
                       json={"risk_level": "Low", "monthly_investment": 5000},
                       headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "allocation" in data
    assert "projections" in data
    assert "1y" in data["projections"]
    assert "5y" in data["projections"]
    assert "disclaimer" in data
    # Sanity: worst < avg < best
    p = data["projections"]["5y"]
    assert p["worst"] < p["avg"] < p["best"]


def test_investment_plan_invalid_risk(client, auth_headers):
    resp = client.post("/api/v1/investment-plan",
                       json={"risk_level": "Extreme", "monthly_investment": 5000},
                       headers=auth_headers)
    assert resp.status_code == 422


def test_investment_plan_zero_amount(client, auth_headers):
    resp = client.post("/api/v1/investment-plan",
                       json={"risk_level": "Medium", "monthly_investment": 0},
                       headers=auth_headers)
    assert resp.status_code == 422


# ─── Sample Users (public endpoint) ──────────────────────────────────────────

def test_sample_users_paginated(client):
    resp = client.get("/api/v1/sample-users?page=1&page_size=5")
    assert resp.status_code == 200
    data = resp.json()
    assert "users" in data
    assert "total" in data
    # May be 0 if dataset not generated yet — that's acceptable in test env
    assert isinstance(data["total"], int)


# ─── Dashboard (requires auth) ────────────────────────────────────────────────

def test_dashboard_empty(client, auth_headers, registered_user):
    user_id = registered_user["user_id"]
    resp = client.get(f"/api/v1/dashboard/{user_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == user_id
    assert "disclaimer" in data


def test_dashboard_wrong_user(client, auth_headers):
    # Access another user's dashboard → 403
    resp = client.get("/api/v1/dashboard/9999", headers=auth_headers)
    assert resp.status_code == 403


def test_shap_explanation_endpoint(client, auth_headers, registered_user):
    user_id = registered_user["user_id"]
    resp = client.get(f"/api/v1/explain/{user_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == user_id
    assert "summary_headline" in data
    assert "features" in data
    assert len(data["features"]) == 7
    # Verify structure of features
    first_feat = data["features"][0]
    assert "english_explanation" in first_feat
    assert first_feat["direction"] in {"helps", "hurts"}


def test_credit_simulation_endpoint(client, auth_headers):
    resp = client.post("/api/v1/simulate", json=VALID_CREDIT_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "old_score" in data
    assert "new_score" in data
    assert "delta" in data
    assert "explanation" in data
    assert isinstance(data["delta"], int)


def test_coach_endpoint(client, auth_headers):
    payload = {
        "credit_score": 620,
        "shap_factors": [
            {"feature": "bill_payment_regularity", "contribution": -15.5, "direction": "hurts"}
        ],
        "monthly_savings_pct": 12.5,
        "monthly_income": 45000.0,
        "risk_level": "Medium"
    }
    resp = client.post("/api/v1/coach", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "summary" in data
    assert "recommendations" in data
    assert len(data["recommendations"]) == 3
    assert data["recommendations"][0]["title"] is not None
    assert "impact_estimate" in data["recommendations"][0]


# ─── Feature 4 — PDF Download ─────────────────────────────────────────────────

def test_pdf_report_download_happy_path(client, auth_headers):
    """After completing a credit assessment, GET /report/{id}/pdf must return a PDF binary."""
    # Ensure there's a credit assessment first
    client.post("/api/v1/credit-score", json=VALID_CREDIT_PAYLOAD, headers=auth_headers)

    # Request PDF
    resp = client.get("/api/v1/report/1/pdf", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"] == "application/pdf"
    # PDF magic bytes: %PDF
    assert resp.content[:4] == b"%PDF", "Response should start with PDF magic bytes"
    assert "content-disposition" in resp.headers
    assert resp.headers["content-disposition"].startswith("attachment;")


def test_pdf_report_no_assessment_returns_404(client, auth_headers_fresh):
    """GET /report/{id}/pdf must return 404 when no credit assessment exists for user."""
    resp = client.get(f"/api/v1/report/{auth_headers_fresh['user_id']}/pdf",
                      headers=auth_headers_fresh["headers"])
    assert resp.status_code == 404
    assert "credit assessment" in resp.json()["detail"].lower()
