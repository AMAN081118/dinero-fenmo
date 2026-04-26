"""
Shared test fixtures.

Uses an in-memory SQLite database for test isolation.
Each test gets a completely fresh database — no leakage between tests.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# In-memory SQLite for fast, isolated tests
TEST_DATABASE_URL = "sqlite:///./test_expenses.db"
engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    """Create fresh tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    """FastAPI test client with overridden DB dependency."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def sample_expense():
    """Valid expense payload for reuse across tests."""
    return {
        "amount": 250.50,
        "category": "Food",
        "description": "Dinner at restaurant",
        "date": "2026-04-25",
        "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
    }