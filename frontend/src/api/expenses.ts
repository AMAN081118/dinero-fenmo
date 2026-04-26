// API client for the Expense Tracker backend.

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// ── Types ─────────────────────────────────────────────────────

export interface Expense {
  id: number;
  amount: string;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  total: string;
  count: number;
}

export interface ExpenseCreatePayload {
  amount: number;
  category: string;
  description: string;
  date: string;
  idempotency_key: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

// ── Retry Logic ─────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2,
  backoff = 500,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Don't retry client errors (4xx) — they won't change on retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // 5xx server error — retry if we have attempts left
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoff * 2 ** attempt));
        continue;
      }

      return response;
    } catch (error) {
      // Network error (offline, DNS failure, etc.)
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoff * 2 ** attempt));
        continue;
      }
      throw error;
    }
  }

  // TypeScript requires this — should never be reached
  throw new Error("Request failed after all retries");
}

// ── Response Handler ────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let errorMessage = `Request failed with status ${response.status}`;
  try {
    const errorBody = await response.json();
    if (errorBody.detail) {
      if (Array.isArray(errorBody.detail)) {
        errorMessage = errorBody.detail
          .map(
            (err: { loc?: string[]; msg: string }) =>
              `${err.loc?.slice(-1)?.[0] || "field"}: ${err.msg}`,
          )
          .join(", ");
      } else {
        errorMessage = errorBody.detail;
      }
    }
  } catch {
    // Response body wasn't JSON
  }

  const error = new Error(errorMessage) as Error & { status?: number };
  error.status = response.status;
  throw error;
}

// ── Public API ──────────────────────────────────────────────

export async function createExpense(
  payload: ExpenseCreatePayload,
): Promise<Expense> {
  const response = await fetchWithRetry(`${API_BASE_URL}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse<Expense>(response);
}

export async function getExpenses(
  params: { category?: string; sort?: string } = {},
): Promise<ExpenseListResponse> {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.set("category", params.category);
  if (params.sort) queryParams.set("sort", params.sort);

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/expenses${queryString ? `?${queryString}` : ""}`;

  const response = await fetchWithRetry(url, { method: "GET" });

  return handleResponse<ExpenseListResponse>(response);
}
