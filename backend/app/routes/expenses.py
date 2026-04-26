"""
Expense API routes.

POST /expenses — Create a new expense (idempotent)
GET  /expenses — List expenses with optional filter + sort
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ExpenseCreate, ExpenseListResponse, ExpenseResponse
from app.services.expense_service import create_expense, get_expenses

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post(
    "",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new expense",
    description=(
        "Creates a new expense entry. Requires an idempotency_key (UUID v4) "
        "to safely handle retries and duplicate submissions. If the same "
        "idempotency_key is sent again, the original expense is returned."
    ),
)
def add_expense(
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
):
    expense, created = create_expense(db, expense_data)
    return expense


@router.get(
    "",
    response_model=ExpenseListResponse,
    summary="List expenses",
    description=(
        "Returns all expenses. Supports optional filtering by category "
        "and sorting by date. The response includes a running total "
        "of the filtered result set."
    ),
)
def list_expenses(
    category: Optional[str] = Query(
        default=None,
        description="Filter by category (case-insensitive). Example: Food",
        examples=["Food"],
    ),
    sort: Optional[str] = Query(
        default="date_desc",
        description="Sort order. Options: date_desc (default), date_asc",
        examples=["date_desc"],
        pattern="^(date_desc|date_asc)$",
    ),
    db: Session = Depends(get_db),
):
    expenses, total = get_expenses(db, category=category, sort=sort)

    return ExpenseListResponse(
        expenses=expenses,
        total=total,
        count=len(expenses),
    )