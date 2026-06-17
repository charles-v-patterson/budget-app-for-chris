export type CategoryKind = "income" | "expense";
export type Priority = "High" | "Medium" | "Low";
export type Frequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  priority: Priority | null;
  createdAt: string;
}

export interface IncomeEntry {
  id: string;
  date: string;
  source: string;
  categoryId: string;
  category?: Category;
  gross: number;
  tax: number;
  net: number;
  notes: string;
  createdAt: string;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  source: string;
  categoryId: string;
  category?: Category;
  gross: number;
  tax: number;
  net: number | null;
  notes: string;
  createdAt: string;
}

export interface BudgetLine {
  id: string;
  categoryId: string;
  category: Category;
  month: string;
  planned: number;
  actual: number;
  difference: number;
  notes: string;
}

export interface TaxItem {
  id: string;
  label: string;
  value: number | null;
  dueDate: string | null;
  paid: boolean;
  notes: string;
  createdAt: string;
}

export interface RecurringEntry {
  id: string;
  kind: "income" | "expense";
  source: string;
  categoryId: string;
  category?: Category;
  gross: number;
  tax: number;
  frequency: Frequency;
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
  active: boolean;
  notes: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  targetDate: string | null;
  notes: string;
  createdAt: string;
}

export interface MonthlyData {
  year: number;
  months: Array<{
    label: string;
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
}

export interface CategorySpend {
  category: string;
  total: number;
}
