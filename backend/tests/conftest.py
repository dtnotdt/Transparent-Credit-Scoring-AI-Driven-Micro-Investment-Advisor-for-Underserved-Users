"""
tests/conftest.py  —  Shared pytest fixtures.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///./test_tetrathon.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create tables once for the test session."""
    from app.models import user, assessment  # noqa: F401
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """Per-test database session that rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """TestClient with db override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def registered_user(client) -> dict:
    """Register a user and return token + user info."""
    resp = client.post("/api/v1/auth/register", json={
        "email": "test@tetrathon.dev",
        "username": "testuser",
        "password": "securepass123",
    })
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture()
def auth_headers(registered_user) -> dict:
    return {"Authorization": f"Bearer {registered_user['access_token']}"}


@pytest.fixture()
def auth_headers_fresh(client) -> dict:
    """Register a second fresh user with NO assessments.
    Returns dict with 'headers' and 'user_id' keys."""
    resp = client.post("/api/v1/auth/register", json={
        "email": "fresh@tetrathon.dev",
        "username": "freshuser",
        "password": "securepass456",
    })
    assert resp.status_code == 201
    data = resp.json()
    return {
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
        "user_id": data["user_id"],
    }
