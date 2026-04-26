"""
Pydantic schemas for request validation and response serialization.

Key decisions:
- Decimal type for amount — matches the DB column, ensures no
  floating-point issues from API input to storage.
- idempotency_key is required on create — the client MUST generate
  a UUID to protect against duplicate submissions.
- Strict validation: amount > 0, category/description not empty,
  date not in the future.
"""

from datetime import date as DateType
from datetime import datetime as DateTimeType
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


# ── Request Schemas ──────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    """Schema for POST /expenses request body."""

    amount: Decimal = Field(
        ...,
        gt=0,
        max_digits=12,
        decimal_places=2,
        description="Expense amount. Must be positive.",
        examples=[49.99],
    )
    category: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Expense category (e.g., Food, Transport).",
        examples=["Food"],
    )
    description: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Brief description of the expense.",
        examples=["Lunch at cafe"],
    )
    date: DateType = Field(
        ...,
        description="Date of the expense (YYYY-MM-DD).",
        examples=["2026-04-25"],
    )
    idempotency_key: str = Field(
        ...,
        min_length=36,
        max_length=36,
        description="Client-generated UUID v4 to prevent duplicate submissions.",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    )

    @field_validator("category", "description")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        """Strip leading/trailing whitespace and reject blank strings."""
        stripped = v.strip()
        if not stripped:
            raise ValueError("Must not be blank.")
        return stripped

    @field_validator("date")
    @classmethod
    def date_not_in_future(cls, v: DateType) -> DateType:
        """Prevent logging expenses with future dates."""
        if v > DateType.today():
            raise ValueError("Date cannot be in the future.")
        return v


# ── Response Schemas ─────────────────────────────────────────────

class ExpenseResponse(BaseModel):
    """Schema for a single expense in API responses."""

    id: int
    amount: Decimal
    category: str
    description: str
    date: DateType
    created_at: DateTimeType

    model_config = {"from_attributes": True}


class ExpenseListResponse(BaseModel):
    """Schema for GET /expenses response."""

    expenses: list[ExpenseResponse]
    total: Decimal = Field(
        description="Sum of all expense amounts in the current result set."
    )
    count: int = Field(
        description="Number of expenses in the current result set."
    )