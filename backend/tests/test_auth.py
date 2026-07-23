"""
tests/test_auth.py  —  Auth endpoint tests (happy path + validation failures).
"""
import pytest


def test_register_success(client):
    resp = client.post("/api/v1/auth/register", json={
        "email": "new@tetrathon.dev",
        "username": "newuser",
        "password": "mypassword123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["username"] == "newuser"


def test_register_duplicate_email(client, registered_user):
    resp = client.post("/api/v1/auth/register", json={
        "email": "test@tetrathon.dev",
        "username": "another",
        "password": "mypassword123",
    })
    assert resp.status_code == 409


def test_register_weak_password(client):
    resp = client.post("/api/v1/auth/register", json={
        "email": "weak@tetrathon.dev",
        "username": "weakuser",
        "password": "abc",  # < 8 chars
    })
    assert resp.status_code == 422


def test_login_success(client, registered_user):
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@tetrathon.dev",
        "password": "securepass123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client, registered_user):
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@tetrathon.dev",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_google_login_redirect(client):
    resp = client.get("/api/v1/auth/google/login", follow_redirects=False)
    assert resp.status_code in (302, 307)
    assert "accounts.google.com" in resp.headers["location"]


def test_google_callback_error_redirect(client):
    resp = client.get("/api/v1/auth/google/callback?error=access_denied", follow_redirects=False)
    assert resp.status_code in (302, 307)
    assert "login?error=" in resp.headers["location"]
    assert "access_denied" in resp.headers["location"]

