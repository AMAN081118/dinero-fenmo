"""
Application configuration.
Uses environment variables with sensible defaults for local development.
"""

import os


class Settings:
    PROJECT_NAME: str = "Expense Tracker API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./expenses.db")

    def __init__(self):
        origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
        self.ALLOWED_ORIGINS: list[str] = [
            origin.strip() for origin in origins.split(",")
        ]


settings = Settings()