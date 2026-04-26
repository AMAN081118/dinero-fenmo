// Expense creation form.

import { useState, useRef, type SyntheticEvent } from "react";
import type { ExpenseCreatePayload } from "../api/expenses";

// ── Common categories for the dropdown ─────────────────────
const CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Education",
  "Other",
] as const;

interface ExpenseFormProps {
  onSubmit: (data: ExpenseCreatePayload) => Promise<void>;
  submitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  onClearStatus: () => void;
}

function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ExpenseForm({
  onSubmit,
  submitting,
  submitError,
  submitSuccess,
  onClearStatus,
}: ExpenseFormProps) {
  // ── Form state ──────────────────────────────────────────
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getTodayString());
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Idempotency key: generated once, reused on retries,
  // regenerated only after successful submission
  const idempotencyKeyRef = useRef(generateIdempotencyKey());

  // ── Client-side validation ────────────────────────────────
  function validate(): boolean {
    const errors: Record<string, string> = {};

    // Amount
    const parsedAmount = parseFloat(amount);
    if (!amount.trim()) {
      errors.amount = "Amount is required.";
    } else if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = "Amount must be a positive number.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      errors.amount = "Amount can have at most 2 decimal places.";
    }

    // Category
    if (!category) {
      errors.category = "Please select a category.";
    }

    // Description
    if (!description.trim()) {
      errors.description = "Description is required.";
    } else if (description.trim().length > 500) {
      errors.description = "Description must be under 500 characters.";
    }

    // Date
    if (!date) {
      errors.date = "Date is required.";
    } else if (date > getTodayString()) {
      errors.date = "Date cannot be in the future.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ── Form submission ───────────────────────────────────────
  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    onClearStatus();

    if (!validate()) return;

    try {
      await onSubmit({
        amount: parseFloat(amount),
        category,
        description: description.trim(),
        date,
        idempotency_key: idempotencyKeyRef.current,
      });

      // ✅ Success — reset form and generate new idempotency key
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(getTodayString());
      setValidationErrors({});
      idempotencyKeyRef.current = generateIdempotencyKey();
    } catch {
      // Error is already handled by the hook (submitError).
      // Idempotency key is intentionally NOT regenerated here,
      // so retries use the same key → safe deduplication.
    }
  }

  // ── Shared input styles ───────────────────────────────────
  const inputBase =
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const inputNormal = `${inputBase} border-gray-300`;
  const inputError = `${inputBase} border-red-400 ring-1 ring-red-400`;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Add New Expense
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Amount */}
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount (₹) <span className="text-red-500">*</span>
          </label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (validationErrors.amount) {
                setValidationErrors((prev) => {
                  const next = { ...prev };
                  delete next.amount;
                  return next;
                });
              }
            }}
            className={validationErrors.amount ? inputError : inputNormal}
            disabled={submitting}
          />
          {validationErrors.amount && (
            <p className="mt-1 text-xs text-red-600">
              {validationErrors.amount}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (validationErrors.category) {
                setValidationErrors((prev) => {
                  const next = { ...prev };
                  delete next.category;
                  return next;
                });
              }
            }}
            className={validationErrors.category ? inputError : inputNormal}
            disabled={submitting}
          >
            <option value="">Select category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {validationErrors.category && (
            <p className="mt-1 text-xs text-red-600">
              {validationErrors.category}
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            type="date"
            value={date}
            max={getTodayString()}
            onChange={(e) => {
              setDate(e.target.value);
              if (validationErrors.date) {
                setValidationErrors((prev) => {
                  const next = { ...prev };
                  delete next.date;
                  return next;
                });
              }
            }}
            className={validationErrors.date ? inputError : inputNormal}
            disabled={submitting}
          />
          {validationErrors.date && (
            <p className="mt-1 text-xs text-red-600">{validationErrors.date}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <input
            id="description"
            type="text"
            placeholder="What was this expense for?"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (validationErrors.description) {
                setValidationErrors((prev) => {
                  const next = { ...prev };
                  delete next.description;
                  return next;
                });
              }
            }}
            className={validationErrors.description ? inputError : inputNormal}
            disabled={submitting}
            maxLength={500}
          />
          {validationErrors.description && (
            <p className="mt-1 text-xs text-red-600">
              {validationErrors.description}
            </p>
          )}
        </div>
      </div>

      {/* Status messages */}
      {submitError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {submitError}
        </div>
      )}

      {submitSuccess && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          ✅ Expense added successfully!
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={submitting}
        className={`w-full sm:w-auto rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all
          ${
            submitting
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 cursor-pointer"
          }`}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Adding...
          </span>
        ) : (
          "Add Expense"
        )}
      </button>
    </form>
  );
}
