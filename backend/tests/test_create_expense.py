"""
Tests for POST /api/expenses

Covers:
- Successful creation
- Idempotency (duplicate requests return same record)
- Validation: negative amount, missing fields, future date, blank strings
- Money precision (Decimal, not float)
"""


def test_create_expense_success(client, sample_expense):
    """Happy path: create a valid expense."""
    response = client.post("/api/expenses", json=sample_expense)

    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 1
    assert data["amount"] == "250.50"
    assert data["category"] == "Food"
    assert data["description"] == "Dinner at restaurant"
    assert data["date"] == "2026-04-25"
    assert "created_at" in data


def test_idempotency_returns_same_record(client, sample_expense):
    """Sending the same idempotency_key twice should NOT create a duplicate."""
    response1 = client.post("/api/expenses", json=sample_expense)
    response2 = client.post("/api/expenses", json=sample_expense)

    assert response1.status_code == 201
    assert response2.status_code == 201

    # Same record returned
    assert response1.json()["id"] == response2.json()["id"]


def test_different_idempotency_keys_create_different_records(
    client, sample_expense
):
    """Different idempotency keys should create separate expenses."""
    response1 = client.post("/api/expenses", json=sample_expense)

    sample_expense["idempotency_key"] = "660e8400-e29b-41d4-a716-446655440001"
    response2 = client.post("/api/expenses", json=sample_expense)

    assert response1.json()["id"] != response2.json()["id"]


def test_negative_amount_rejected(client, sample_expense):
    """Negative amounts should be rejected."""
    sample_expense["amount"] = -50.00
    response = client.post("/api/expenses", json=sample_expense)
    assert response.status_code == 422


def test_zero_amount_rejected(client, sample_expense):
    """Zero amount should be rejected (must be > 0)."""
    sample_expense["amount"] = 0
    response = client.post("/api/expenses", json=sample_expense)
    assert response.status_code == 422


def test_future_date_rejected(client, sample_expense):
    """Future dates should be rejected."""
    sample_expense["date"] = "2099-12-31"
    response = client.post("/api/expenses", json=sample_expense)
    assert response.status_code == 422


def test_blank_description_rejected(client, sample_expense):
    """Empty or whitespace-only descriptions should be rejected."""
    sample_expense["description"] = "   "
    response = client.post("/api/expenses", json=sample_expense)
    assert response.status_code == 422


def test_missing_required_fields(client):
    """Omitting required fields should return 422."""
    response = client.post("/api/expenses", json={})
    assert response.status_code == 422


def test_money_precision(client, sample_expense):
    """Amount should preserve decimal precision (not float rounding)."""
    sample_expense["amount"] = 19.99
    response = client.post("/api/expenses", json=sample_expense)

    assert response.status_code == 201
    # "19.99" not "19.990000000000002"
    assert response.json()["amount"] == "19.99"