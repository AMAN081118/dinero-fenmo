"""
Tests for GET /api/expenses

Covers:
- List all expenses
- Filter by category (case-insensitive)
- Sort by date (desc / asc)
- Total calculation for filtered results
- Empty state
- Invalid sort parameter
"""

import uuid


def _make_expense(client, amount, category, description, date):
    """Helper to create an expense with a unique idempotency key."""
    return client.post(
        "/api/expenses",
        json={
            "amount": amount,
            "category": category,
            "description": description,
            "date": date,
            "idempotency_key": str(uuid.uuid4()),
        },
    )


def _seed_expenses(client):
    """Create a standard set of test expenses."""
    _make_expense(client, 100.00, "Food", "Groceries", "2026-04-20")
    _make_expense(client, 250.50, "Food", "Restaurant dinner", "2026-04-22")
    _make_expense(client, 1500.00, "Transport", "Metro pass", "2026-04-21")
    _make_expense(client, 50.00, "Entertainment", "Movie ticket", "2026-04-23")


def test_list_all_expenses(client):
    """Should return all expenses with correct total."""
    _seed_expenses(client)

    response = client.get("/api/expenses")
    assert response.status_code == 200

    data = response.json()
    assert data["count"] == 4
    assert float(data["total"]) == 1900.50
    assert len(data["expenses"]) == 4


def test_list_empty(client):
    """Empty database should return empty list with zero total."""
    response = client.get("/api/expenses")
    data = response.json()

    assert data["count"] == 0
    assert float(data["total"]) == 0.00
    assert data["expenses"] == []


def test_filter_by_category(client):
    """Filter should return only matching category and recalculate total."""
    _seed_expenses(client)

    response = client.get("/api/expenses?category=Food")
    data = response.json()

    assert data["count"] == 2
    assert float(data["total"]) == 350.50
    for expense in data["expenses"]:
        assert expense["category"] == "Food"


def test_filter_case_insensitive(client):
    """Category filter should be case-insensitive."""
    _seed_expenses(client)

    response = client.get("/api/expenses?category=food")
    data = response.json()

    assert data["count"] == 2


def test_filter_no_match(client):
    """Filtering by nonexistent category should return empty."""
    _seed_expenses(client)

    response = client.get("/api/expenses?category=NonExistent")
    data = response.json()

    assert data["count"] == 0
    assert float(data["total"]) == 0.00


def test_sort_date_desc(client):
    """Default sort: newest date first."""
    _seed_expenses(client)

    response = client.get("/api/expenses?sort=date_desc")
    data = response.json()

    dates = [e["date"] for e in data["expenses"]]
    assert dates == sorted(dates, reverse=True)


def test_sort_date_asc(client):
    """Ascending sort: oldest date first."""
    _seed_expenses(client)

    response = client.get("/api/expenses?sort=date_asc")
    data = response.json()

    dates = [e["date"] for e in data["expenses"]]
    assert dates == sorted(dates)


def test_filter_and_sort_combined(client):
    """Filter + sort should work together."""
    _seed_expenses(client)

    response = client.get("/api/expenses?category=Food&sort=date_asc")
    data = response.json()

    assert data["count"] == 2
    dates = [e["date"] for e in data["expenses"]]
    assert dates == sorted(dates)
    for expense in data["expenses"]:
        assert expense["category"] == "Food"


def test_invalid_sort_rejected(client):
    """Invalid sort parameter should return 422."""
    response = client.get("/api/expenses?sort=invalid")
    assert response.status_code == 422