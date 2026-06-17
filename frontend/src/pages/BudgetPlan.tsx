import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Category, BudgetLine, TaxItem } from "../api/types";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { MonthPicker } from "../components/ui/MonthPicker";
import { CurrencyInput } from "../components/ui/CurrencyInput";
import { currentMonth, formatCurrency } from "../lib/format";

export function BudgetPlanPage() {
  const [month, setMonth] = useState(currentMonth());
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [taxes, setTaxes] = useState<TaxItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [planned, setPlanned] = useState("");
  const [notes, setNotes] = useState("");
  const [taxLabel, setTaxLabel] = useState("");
  const [taxValue, setTaxValue] = useState("");
  const [taxDue, setTaxDue] = useState("");
  const [taxNotes, setTaxNotes] = useState("");

  const load = useCallback(async () => {
    const [budgetLines, taxItems, expenseCats] = await Promise.all([
      api.get<BudgetLine[]>(`/api/budget/${month}`),
      api.get<TaxItem[]>("/api/taxes"),
      api.get<Category[]>("/api/categories?kind=expense"),
    ]);
    setLines(budgetLines);
    setTaxes(taxItems);
    setCategories(expenseCats);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveLine(id: string, field: "planned" | "notes", value: string | number) {
    const line = lines.find((l) => l.id === id);
    if (!line) return;
    await api.post(`/api/budget/${month}/lines`, {
      categoryId: line.categoryId,
      planned: field === "planned" ? Number(value) : line.planned,
      notes: field === "notes" ? value : line.notes,
    });
    await load();
  }

  async function addBudgetLine(e: FormEvent) {
    e.preventDefault();
    await api.post(`/api/budget/${month}/lines`, {
      categoryId,
      planned: Number(planned),
      notes,
    });
    setAddOpen(false);
    setCategoryId("");
    setPlanned("");
    setNotes("");
    await load();
  }

  async function addTax(e: FormEvent) {
    e.preventDefault();
    await api.post("/api/taxes", {
      label: taxLabel,
      value: taxValue ? Number(taxValue) : null,
      dueDate: taxDue || null,
      notes: taxNotes,
    });
    setTaxOpen(false);
    setTaxLabel("");
    setTaxValue("");
    setTaxDue("");
    setTaxNotes("");
    await load();
  }

  async function toggleTaxPaid(item: TaxItem) {
    await api.patch(`/api/taxes/${item.id}`, { paid: !item.paid });
    await load();
  }

  async function deleteTax(id: string) {
    await api.delete(`/api/taxes/${id}`);
    await load();
  }

  async function deleteLine(id: string) {
    await api.delete(`/api/budget/${month}/lines/${id}`);
    await load();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Budget Plan</h1>
          <p className="text-sm text-muted">Monthly planned vs actual spending</p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <div className="card overflow-x-auto">
        <div className="mb-4 flex justify-between">
          <h2 className="font-semibold">Monthly Budget</h2>
          <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}>
            Add Category
          </button>
        </div>

        {lines.length === 0 ? (
          <EmptyState
            title="No budget lines for this month"
            description="Add expense categories to start planning your monthly budget."
            action={
              <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}>
                Add budget category
              </button>
            }
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Planned</th>
                <th>Actual</th>
                <th>Difference</th>
                <th>Priority</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.category.name}</td>
                  <td>
                    <input
                      type="number"
                      className="input max-w-[120px]"
                      defaultValue={line.planned}
                      onBlur={(e) => saveLine(line.id, "planned", e.target.value)}
                    />
                  </td>
                  <td>{formatCurrency(line.actual)}</td>
                  <td className={line.difference >= 0 ? "text-green-400" : "text-red-400"}>
                    {formatCurrency(line.difference)}
                  </td>
                  <td>{line.category.priority ?? "—"}</td>
                  <td>
                    <input
                      className="input max-w-[160px]"
                      defaultValue={line.notes}
                      onBlur={(e) => saveLine(line.id, "notes", e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-sm text-red-400"
                      onClick={() => deleteLine(line.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card overflow-x-auto">
        <div className="mb-4 flex justify-between">
          <h2 className="font-semibold">Taxes Info</h2>
          <button type="button" className="btn btn-secondary" onClick={() => setTaxOpen(true)}>
            Add Tax Item
          </button>
        </div>

        {taxes.length === 0 ? (
          <EmptyState
            title="No tax items"
            description="Track tax rates, due dates, and payment status here."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Value</th>
                <th>Due Date</th>
                <th>Paid?</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {taxes.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{item.value != null ? formatCurrency(item.value) : "—"}</td>
                  <td>{item.dueDate ?? "—"}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={item.paid}
                      onChange={() => toggleTaxPaid(item)}
                    />
                  </td>
                  <td>{item.notes || "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="text-sm text-red-400"
                      onClick={() => deleteTax(item.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={addOpen} title="Add Budget Category" onClose={() => setAddOpen(false)}>
        <form className="space-y-4" onSubmit={addBudgetLine}>
          <div>
            <label className="mb-1 block text-sm text-muted">Expense Category</label>
            <select
              className="input"
              value={categoryId}
              required
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Planned Amount</label>
            <CurrencyInput value={planned} onChange={setPlanned} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Notes</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Add to Budget
          </button>
        </form>
      </Modal>

      <Modal open={taxOpen} title="Add Tax Item" onClose={() => setTaxOpen(false)}>
        <form className="space-y-4" onSubmit={addTax}>
          <div>
            <label className="mb-1 block text-sm text-muted">Label</label>
            <input
              className="input"
              value={taxLabel}
              required
              onChange={(e) => setTaxLabel(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Value</label>
            <CurrencyInput value={taxValue} onChange={setTaxValue} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Due Date</label>
            <input
              type="date"
              className="input"
              value={taxDue}
              onChange={(e) => setTaxDue(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Notes</label>
            <input className="input" value={taxNotes} onChange={(e) => setTaxNotes(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Add Tax Item
          </button>
        </form>
      </Modal>
    </div>
  );
}
