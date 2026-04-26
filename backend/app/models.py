"""
SQLAlchemy ORM models.

Key decisions:
- `amount` uses Numeric(12, 2) — NEVER float — to avoid
  floating-point rounding errors with real money.
  12 digits total, 2 decimal places → supports up to 9,999,999,999.99
- `idempotency_key` is a unique client-generated UUID that prevents
  duplicate expense creation on retries/double-clicks.
- `created_at` is auto-set server-side for audit trail.
"""

from datetime import date as DateType
from datetime import datetime as DateTimeType

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Integer,
    Numeric,
    String,
    func,
)

from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(String(500), nullable=False)
    date = Column(Date, nullable=False, index=True)
    idempotency_key = Column(String(36), unique=True, nullable=False, index=True)
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self):
        return (
            f"<Expense(id={self.id}, amount={self.amount}, "
            f"category='{self.category}', date={self.date})>"
        )