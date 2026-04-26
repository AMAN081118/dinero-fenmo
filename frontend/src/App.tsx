import { useExpenses } from "./hooks/useExpenses";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseSummary from "./components/ExpenseSummary";
import ExpenseFilters from "./components/ExpenseFilters";
import ExpenseList from "./components/ExpenseList";
import CategorySummary from "./components/CategorySummary";

function App() {
  const {
    expenses,
    total,
    count,
    category,
    setCategory,
    sort,
    setSort,
    loading,
    error,
    refetch,
    addExpense,
    submitting,
    submitError,
    submitSuccess,
    clearSubmitStatus,
  } = useExpenses();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* ── Header ───────────────────────────────────────── */}
        <header>
          <h1 className="text-3xl font-bold text-gray-900">
            💰 Expense Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your personal expenses and understand where your money goes.
          </p>
        </header>

        {/* ── Add Expense Form ─────────────────────────────── */}
        <ExpenseForm
          onSubmit={addExpense}
          submitting={submitting}
          submitError={submitError}
          submitSuccess={submitSuccess}
          onClearStatus={clearSubmitStatus}
        />

        {/* ── Summary ──────────────────────────────────────── */}
        <ExpenseSummary total={total} count={count} loading={loading} />

        {/* ── Category Breakdown ───────────────────────────── */}
        <CategorySummary expenses={expenses} loading={loading} />

        {/* ── Filters & Sort ───────────────────────────────── */}
        <ExpenseFilters
          category={category}
          onCategoryChange={setCategory}
          sort={sort}
          onSortChange={setSort}
        />

        {/* ── Expense List ─────────────────────────────────── */}
        <ExpenseList
          expenses={expenses}
          loading={loading}
          error={error}
          onRetry={refetch}
        />
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="mt-12 text-center text-xs text-gray-400 pb-4">
        Expense Tracker · Built with FastAPI + React
      </footer>
    </div>
  );
}

export default App;
