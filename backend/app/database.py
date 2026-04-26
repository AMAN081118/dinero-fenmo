"""
Database engine and session management.

SQLite is chosen for this project because:
- Zero infrastructure: no separate DB server needed
- ACID-compliant: proper transaction support for data correctness
- Easy to swap: SQLAlchemy abstracts the dialect; switching to
  PostgreSQL later is just a config change
- Ideal for single-user personal finance tools
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite
    echo=False,  # Set True for SQL debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a DB session per request
    and ensures it's closed afterward.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()