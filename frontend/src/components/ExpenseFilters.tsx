// Filter and sort controls for the expense list.

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

interface ExpenseFiltersProps {
  category: string;
  onCategoryChange: (cat: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
}

export default function ExpenseFilters({
  category,
  onCategoryChange,
  sort,
  onSortChange,
}: ExpenseFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
      {/* Category filter */}
      <div className="flex-1 min-w-[180px]">
        <label
          htmlFor="filter-category"
          className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1"
        >
          Filter by Category
        </label>
        <select
          id="filter-category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Sort toggle */}
      <div className="min-w-[180px]">
        <label
          htmlFor="sort-order"
          className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1"
        >
          Sort by Date
        </label>
        <button
          id="sort-order"
          type="button"
          onClick={() =>
            onSortChange(sort === "date_desc" ? "date_asc" : "date_desc")
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center justify-between"
        >
          <span>{sort === "date_desc" ? "Newest First" : "Oldest First"}</span>
          <span className="text-gray-400 text-base">
            {sort === "date_desc" ? "↓" : "↑"}
          </span>
        </button>
      </div>
    </div>
  );
}
