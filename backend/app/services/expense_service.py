"""
Business logic layer for expenses.

Separated from routes so that:
- Logic is testable without HTTP concerns
- Can be reused if we add CLI, background jobs, etc.
- Route handlers stay thin and focused on HTTP

Key design: Idempotent create
- Client sends a UUID `idempotency_key` with every POST.
- If the key already exists in DB, we return the existing record
  instead of creating a duplicate.
- This handles: double-clicks, browser retries, network retries.
- The UNIQUE constraint on idempotency_key is the ultimate safety net
  even if a race condition slips past the application-level check.
"""

from decimal import Decimal
from typing import Optional

from sqlalchemy import exc
from sqlalchemy.orm import Session

from app.models import Expense
from app.schemas import ExpenseCreate


def create_expense(db: Session, expense_data: ExpenseCreate) -> tuple[Expense, bool]:
    """
    Create an expense or return existing one if idempotency_key matches.

    Returns:
        tuple of (Expense, created: bool)
        - created=True  → new record was inserted
        - created=False → existing record was found (duplicate request)
    """
    # 1. Check if this idempotency_key has already been used
    existing = (
        db.query(Expense)
        .filter(Expense.idempotency_key == expense_data.idempotency_key)
        .first()
    )
    if existing:
        return existing, False

    # 2. Create new expense
    new_expense = Expense(
        amount=expense_data.amount,
        category=expense_data.category,
        description=expense_data.description,
        date=expense_data.date,
        idempotency_key=expense_data.idempotency_key,
    )

    try:
        db.add(new_expense)
        db.commit()
        db.refresh(new_expense)
        return new_expense, True
    except exc.IntegrityError:
        # Race condition: another request with the same key was inserted
        # between our SELECT and INSERT. Roll back and fetch the winner.
        db.rollback()
        existing = (
            db.query(Expense)
            .filter(Expense.idempotency_key == expense_data.idempotency_key)
            .first()
        )
        return existing, False


def get_expenses(
    db: Session,
    category: Optional[str] = None,
    sort: Optional[str] = None,
) -> tuple[list[Expense], Decimal]:
    """
    Fetch expenses with optional filtering and sorting.

    Args:
        db: Database session
        category: If provided, filter expenses to this category (case-insensitive)
        sort: If "date_desc", sort by date newest first.
              Default: newest first by date, then by created_at.

    Returns:
        tuple of (list[Expense], total: Decimal)
    """
    query = db.query(Expense)

    # ── Filter by category (case-insensitive) ────────────────────
    if category:
        query = query.filter(
            Expense.category.ilike(category.strip())
        )

    # ── Sorting ──────────────────────────────────────────────────
    # Default sort is also newest first — sensible default for expenses
    if sort == "date_desc" or sort is None:
        query = query.order_by(Expense.date.desc(), Expense.created_at.desc())
    elif sort == "date_asc":
        # Future-proofing: support ascending too
        query = query.order_by(Expense.date.asc(), Expense.created_at.asc())

    expenses = query.all()

    # ── Calculate total ──────────────────────────────────────────
    # Done in Python (not SQL) because we already have the filtered
    # result set in memory. For large datasets, you'd use SQL SUM().
    total = sum(
        (Decimal(str(e.amount)) for e in expenses),
        Decimal("0.00"),
    )

    return expenses, total