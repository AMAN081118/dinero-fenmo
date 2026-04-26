//API client for the Expense Tracker backend.

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

async function fetchWithRetry(url, options = {}, retries = 2, backoff = 500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, backoff * Math.pow(2, attempt)),
        );
        continue;
      }

      return response;
    } catch (error) {
      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, backoff * Math.pow(2, attempt)),
        );
        continue;
      }
      throw error;
    }
  }
}

// Parse API response. Throws structured error for non-OK responses.
async function handleResponse(response) {
  if (response.ok) {
    return await response.json();
  }

  // Try to extract FastAPI validation error details
  let errorMessage = `Request failed with status ${response.status}`;
  try {
    const errorBody = await response.json();
    if (errorBody.detail) {
      // FastAPI validation errors come as an array of objects
      if (Array.isArray(errorBody.detail)) {
        errorMessage = errorBody.detail
          .map((err) => `${err.loc?.slice(-1)?.[0] || "field"}: ${err.msg}`)
          .join(", ");
      } else {
        errorMessage = errorBody.detail;
      }
    }
  } catch {
    // Response body wasn't JSON — use the status text
  }

  const error = new Error(errorMessage);
  error.status = response.status;
  throw error;
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Create a new expense.
 * Idempotency is handled via the idempotency_key in the payload.
 */
export async function createExpense(expenseData) {
  const response = await fetchWithRetry(`${API_BASE_URL}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expenseData),
  });

  return handleResponse(response);
}

/**
 * Fetch expenses with optional filters.
 * @param {Object} params
 * @param {string} [params.category] - Filter by category
 * @param {string} [params.sort]     - Sort order: "date_desc" | "date_asc"
 */
export async function getExpenses({ category, sort } = {}) {
  const queryParams = new URLSearchParams();

  if (category) queryParams.set("category", category);
  if (sort) queryParams.set("sort", sort);

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/expenses${queryString ? `?${queryString}` : ""}`;

  const response = await fetchWithRetry(url, { method: "GET" });

  return handleResponse(response);
}
