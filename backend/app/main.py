"""
FastAPI application entrypoint.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routes import expenses

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup."""
    Base.metadata.create_all(bind=engine)
    logger.info(f"CORS allowed origins: {settings.ALLOWED_ORIGINS}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=False,  # Must be False when using "*"
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

logger.info(f"CORS configured with allowed origins: {settings.ALLOWED_ORIGINS}")

# ── Routes ───────────────────────────────────────────────────
app.include_router(expenses.router, prefix="/api")


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "cors_origins": settings.ALLOWED_ORIGINS,
    }