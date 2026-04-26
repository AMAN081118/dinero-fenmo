import type { Expense } from "../api/expenses";

interface CategorySummaryProps {
  expenses: Expense[];
  loading: boolean;
}

interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-400",
  Transport: "bg-blue-400",
  Housing: "bg-purple-400",
  Utilities: "bg-yellow-400",
  Entertainment: "bg-pink-400",
  Healthcare: "bg-red-400",
  Shopping: "bg-teal-400",
  Education: "bg-indigo-400",
  Other: "bg-gray-400",
};

function getCategoryBarColor(category: string): string {
  return CATEGORY_COLORS[category] || "bg-gray-400";
}

function computeCategoryTotals(expenses: Expense[]): CategoryTotal[] {
  const map = new Map<string, { total: number; count: number }>();

  for (const expense of expenses) {
    const existing = map.get(expense.category) || { total: 0, count: 0 };
    existing.total += Number(expense.amount);
    existing.count += 1;
    map.set(expense.category, existing);
  }

  return Array.from(map.entries())
    .map(([category, { total, count }]) => ({ category, total, count }))
    .sort((a, b) => b.total - a.total); // Highest spend first
}

export default function CategorySummary({
  expenses,
  loading,
}: CategorySummaryProps) {
  if (loading || expenses.length === 0) return null;

  const categoryTotals = computeCategoryTotals(expenses);
  const maxTotal = categoryTotals[0]?.total || 1;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        📊 Spending by Category
      </h2>

      <div className="space-y-3">
        {categoryTotals.map(({ category, total, count }) => {
          const percentage = (total / maxTotal) * 100;

          return (
            <div key={category}>
              {/* Label row */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {category}
                  <span className="ml-1.5 text-xs text-gray-400 font-normal">
                    ({count} {count === 1 ? "entry" : "entries"})
                  </span>
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  ₹
                  {total.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Bar */}
              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getCategoryBarColor(
                    category,
                  )}`}
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
