# Expense Tracker

A minimal full-stack personal finance tool for recording and reviewing expenses.
Built with **FastAPI** (Python) + **React 19** (TypeScript) + **Tailwind CSS v4**.

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20.19+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173/)

### Tests

```bash
cd backend
pytest tests/ -v
```

---

## Key Design Decisions

### Money Handling

- **`Decimal` end-to-end**: Pydantic `Decimal` → SQLAlchemy `Numeric(12,2)` → JSON string.
- Never uses `float` for monetary values — avoids IEEE 754 rounding errors
  (e.g., `0.1 + 0.2 ≠ 0.3`).

### Idempotency (Duplicate Request Safety)

- Client generates a **UUID v4 `idempotency_key`** per form submission.
- Backend stores it with a **UNIQUE constraint**.
- On retry (double-click, network timeout, page refresh), the same key is sent →
  backend returns the existing record instead of creating a duplicate.
- Race conditions are caught by the DB UNIQUE constraint + IntegrityError handling.
- Key is regenerated **only on successful submission**, ensuring retries are always safe.

### Database: SQLite

- Zero infrastructure — no server to install or configure.
- ACID-compliant — proper transactions for data correctness.
- Easy to swap — SQLAlchemy abstracts the dialect; switching to PostgreSQL
  is a config change + migration.
- Appropriate for a single-user personal finance tool.

### API Client: Native `fetch()` (No Axios)

- Axios npm packages were compromised in March 2026 (versions 1.14.1 & 0.30.4
  contained a malicious RAT payload).
- `fetch()` is built into all modern browsers — zero dependencies, zero supply
  chain risk.
- Thin wrapper provides retry logic with exponential backoff.

### Architecture

- **Backend**: Routes → Services → Database (3-layer separation).
- **Frontend**: Components → Custom Hook → API Client.
- Service layer keeps business logic testable without HTTP concerns.
- Custom hook (`useExpenses`) centralizes all state management.

### Server-Side Filtering & Sorting

- Filter and sort are done via API query parameters, not client-side.
- Scales properly — if dataset grows, we're not shipping all records to the browser.
- Category column and date column are indexed for performance.

---

## Trade-offs (Due to Timebox)

| Decision                     | Trade-off                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------ |
| SQLite instead of PostgreSQL | Simpler setup, but no concurrent write scaling. Fine for personal use.         |
| No pagination                | All expenses returned at once. Would need pagination for 1000+ records.        |
| No authentication            | Single-user tool assumption. Would need auth for multi-user.                   |
| No Alembic migrations        | Tables auto-created on startup. Production would need migration management.    |
| Categories are hardcoded     | Stored as strings, not a separate table. Quick to implement but less flexible. |
| No edit/delete               | CRUD limited to Create + Read. Would be next features to add.                  |
| Minimal styling              | Tailwind utility classes only, no design system or component library.          |

## What I Intentionally Did Not Do

- **No WebSocket/real-time updates** — Overkill for a single-user expense tracker.
- **No state management library (Redux/Zustand)** — A single custom hook is sufficient
  for this scope. Would reconsider with more features.
- **No end-to-end tests (Playwright/Cypress)** — Prioritized backend integration tests
  for data correctness, which is more critical for a finance tool.
- **No Docker** — Would add for team deployment but unnecessary for this exercise.

---

## Tech Stack

| Layer      | Technology         | Version          |
| ---------- | ------------------ | ---------------- |
| Backend    | Python + FastAPI   | 3.12+ / 0.115.12 |
| ORM        | SQLAlchemy         | 2.0.40           |
| Database   | SQLite             | Built-in         |
| Frontend   | React (TypeScript) | 19               |
| Build Tool | Vite               | 8                |
| Styling    | Tailwind CSS       | 4                |
| Tests      | pytest + httpx     | 8.3.5 / 0.28.1   |

---

## Live Demo

- **App**: https://expense-tracker-YOUR_USERNAME.vercel.app
- **API Docs**: https://expense-tracker-api-xxxx.onrender.com/docs
- **Health Check**: https://expense-tracker-api-xxxx.onrender.com/health

- The backend is hosted on Render's free tier, which sleeps after 15 minutes of inactivity. The first request may take ~30-60 seconds to wake up. Subsequent requests will be fast.

## Deployment

- **Frontend**: Vercel
- **Backend**: Render (free tier)
- **Database**: SQLite (ephemeral on Render — data resets on redeploy.
  In production, this would be swapped for PostgreSQL.)

---
