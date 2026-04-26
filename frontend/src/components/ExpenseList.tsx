// Expense list displayed as a responsive table.

import type { Expense } from "../api/expenses";

interface ExpenseListProps {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: string): string {
  return `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Category badge colors ────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-100 text-orange-800",
  Transport: "bg-blue-100 text-blue-800",
  Housing: "bg-purple-100 text-purple-800",
  Utilities: "bg-yellow-100 text-yellow-800",
  Entertainment: "bg-pink-100 text-pink-800",
  Healthcare: "bg-red-100 text-red-800",
  Shopping: "bg-teal-100 text-teal-800",
  Education: "bg-indigo-100 text-indigo-800",
  Other: "bg-gray-100 text-gray-800",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || "bg-gray-100 text-gray-800";
}

// ── Loading skeleton ─────────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-3">
            <div className="h-4 bg-gray-200 rounded w-20" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 bg-gray-200 rounded-full w-24" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-gray-200 rounded w-40" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-gray-200 rounded w-16" />
          </td>
        </tr>
      ))}
    </>
  );
}

export default function ExpenseList({
  expenses,
  loading,
  error,
  onRetry,
}: ExpenseListProps) {
  // ── Error state ─────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700 mb-3">Failed to load expenses</p>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────
  if (!loading && expenses.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-gray-500 font-medium">No expenses found</p>
        <p className="text-sm text-gray-400 mt-1">
          Add your first expense above, or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* ── Desktop table ──────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Date
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Category
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Description
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows />
            ) : (
              expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(
                        expense.category,
                      )}`}
                    >
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 max-w-[300px] truncate">
                    {expense.description}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                    {formatAmount(expense.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card layout ─────────────────────────────── */}
      <div className="sm:hidden divide-y divide-gray-100">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))
          : expenses.map((expense) => (
              <div key={expense.id} className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-gray-900 text-sm truncate mr-2">
                    {expense.description}
                  </p>
                  <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                    {formatAmount(expense.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColor(
                      expense.category,
                    )}`}
                  >
                    {expense.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(expense.date)}
                  </span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
