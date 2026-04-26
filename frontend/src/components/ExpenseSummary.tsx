interface ExpenseSummaryProps {
  total: string;
  count: number;
  loading: boolean;
}

export default function ExpenseSummary({
  total,
  count,
  loading,
}: ExpenseSummaryProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
      {/* Total */}
      <div className="flex-1 min-w-[140px]">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Total Expenses
        </p>
        <p
          className={`text-2xl font-bold text-green-700 ${
            loading ? "animate-pulse" : ""
          }`}
        >
          ₹{Number(total).toFixed(2)}
        </p>
      </div>

      {/* Count */}
      <div className="min-w-[100px]">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Entries
        </p>
        <p
          className={`text-2xl font-bold text-gray-900 ${
            loading ? "animate-pulse" : ""
          }`}
        >
          {count}
        </p>
      </div>
    </div>
  );
}
