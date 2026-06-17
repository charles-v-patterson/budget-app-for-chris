import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/Dashboard";
import { BudgetPlanPage } from "./pages/BudgetPlan";
import { IncomePage } from "./pages/Income";
import { ExpensesPage } from "./pages/Expenses";
import { RecurringPage } from "./pages/Recurring";
import { SavingsGoalsPage } from "./pages/SavingsGoals";
import { CategoriesPage } from "./pages/Categories";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="budget" element={<BudgetPlanPage />} />
          <Route path="income" element={<IncomePage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="recurring" element={<RecurringPage />} />
          <Route path="savings" element={<SavingsGoalsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
