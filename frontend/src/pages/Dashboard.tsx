import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { CategorySpend, MonthlyData, RecurringEntry, SavingsGoal } from "../api/types";
import { MonthlyCashFlowChart } from "../components/charts/MonthlyCashFlowChart";
import { CategorySpendChart } from "../components/charts/CategorySpendChart";
import { EmptyState } from "../components/ui/EmptyState";
import { formatCurrency, formatDate } from "../lib/format";

export function DashboardPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthly, setMonthly] = useState<MonthlyData | null>(null);
  const [categorySpend, setCategorySpend] = useState<CategorySpend[]>([]);
  const [recurring, setRecurring] = useState<RecurringEntry[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, c, r, g] = await Promise.all([
        api.get<MonthlyData>(`/api/dashboard/monthly?year=${year}`),
        api.get<CategorySpend[]>(`/api/dashboard/category-spend?year=${year}`),
        api.get<RecurringEntry[]>("/api/dashboard/upcoming-recurring?days=7"),
        api.get<SavingsGoal[]>("/api/dashboard/savings-summary"),
      ]);
      setMonthly(m);
      setCategorySpend(c);
      setRecurring(r);
      setGoals(g);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  const hasData =
    (monthly?.months.some((m) => m.income || m.expenses) ?? false) ||
    categorySpend.length > 0;

  async function recordRecurring(id: string) {
    await api.post(`/api/recurring/${id}/record`, {});
    await load();
  }

  if (loading) {
    return <p className="text-muted">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted">Monthly cash flow and spending overview</p>
        </div>
        <select
          className="input max-w-[120px]"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {!hasData ? (
        <EmptyState
          title="No financial data yet"
          description="Add income and expense entries to see your charts and summaries here."
        />
      ) : (
        <>
          <div className="card">
            <h2 className="mb-4 font-semibold">Monthly Cash Flow</h2>
            <MonthlyCashFlowChart data={monthly?.months ?? []} />
          </div>

          <div className="card">
            <h2 className="mb-4 font-semibold">Annual Spend by Category</h2>
            {categorySpend.length === 0 ? (
              <p className="text-sm text-muted">No expense data for {year}.</p>
            ) : (
              <CategorySpendChart data={categorySpend} />
            )}
          </div>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold">Upcoming Recurring (7 days)</h2>
          {recurring.length === 0 ? (
            <p className="text-sm text-muted">No recurring items due soon.</p>
          ) : (
            <ul className="space-y-3">
              {recurring.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {item.source || item.category?.name} ({item.kind})
                    </p>
                    <p className="text-xs text-muted">
                      Due {formatDate(item.nextDueDate)} · {formatCurrency(item.gross)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary px-3 py-1 text-xs"
                    onClick={() => recordRecurring(item.id)}
                  >
                    Record
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">Savings Goals</h2>
          {goals.length === 0 ? (
            <p className="text-sm text-muted">No savings goals yet.</p>
          ) : (
            <ul className="space-y-4">
              {goals.map((goal) => (
                <li key={goal.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-muted">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
