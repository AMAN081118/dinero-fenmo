// Custom hook for managing expense state and API interactions.

import { useState, useEffect, useCallback } from "react";
import {
  getExpenses,
  createExpense,
  type Expense,
  type ExpenseCreatePayload,
} from "../api/expenses";

interface UseExpensesReturn {
  // Data
  expenses: Expense[];
  total: string;
  count: number;

  // Filters
  category: string;
  setCategory: (cat: string) => void;
  sort: string;
  setSort: (sort: string) => void;

  // List state
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;

  // Mutation
  addExpense: (data: ExpenseCreatePayload) => Promise<void>;
  submitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  clearSubmitStatus: () => void;
}

export function useExpenses(): UseExpensesReturn {
  // ── State ───────────────────────────────────────────────
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState("0.00");
  const [count, setCount] = useState(0);

  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("date_desc");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ── Fetch expenses ────────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getExpenses({
        category: category || undefined,
        sort,
      });
      setExpenses(data.expenses);
      setTotal(data.total);
      setCount(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [category, sort]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // ── Create expense ────────────────────────────────────────
  const addExpense = useCallback(
    async (expenseData: ExpenseCreatePayload) => {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      try {
        await createExpense(expenseData);
        setSubmitSuccess(true);
        await fetchExpenses();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create expense";
        setSubmitError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [fetchExpenses],
  );

  // ── Clear messages ────────────────────────────────────────
  const clearSubmitStatus = useCallback(() => {
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  return {
    expenses,
    total,
    count,
    category,
    setCategory,
    sort,
    setSort,
    loading,
    error,
    refetch: fetchExpenses,
    addExpense,
    submitting,
    submitError,
    submitSuccess,
    clearSubmitStatus,
  };
}
