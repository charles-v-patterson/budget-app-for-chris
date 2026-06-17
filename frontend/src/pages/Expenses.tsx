import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Category, ExpenseEntry } from "../api/types";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { MonthPicker } from "../components/ui/MonthPicker";
import { CurrencyInput } from "../components/ui/CurrencyInput";
import { currentMonth, formatCurrency, formatDate, todayISO } from "../lib/format";

export function ExpensesPage() {
  const [month, setMonth] = useState(currentMonth());
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseEntry | null>(null);
  const [date, setDate] = useState(todayISO());
  const [source, setSource] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [gross, setGross] = useState("");
  const [tax, setTax] = useState("0");
  const [net, setNet] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    const [items, cats] = await Promise.all([
      api.get<ExpenseEntry[]>(`/api/expenses?month=${month}`),
      api.get<Category[]>("/api/categories?kind=expense"),
    ]);
    setEntries(items);
    setCategories(cats);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDate(todayISO());
    setSource("");
    setCategoryId("");
    setGross("");
    setTax("0");
    setNet("");
    setNotes("");
    setOpen(true);
  }

  function openEdit(entry: ExpenseEntry) {
    setEditing(entry);
    setDate(entry.date);
    setSource(entry.source);
    setCategoryId(entry.categoryId);
    setGross(String(entry.gross));
    setTax(String(entry.tax));
    setNet(entry.net != null ? String(entry.net) : "");
    setNotes(entry.notes);
    setOpen(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      date,
      source,
      categoryId,
      gross: Number(gross),
      tax: Number(tax),
      net: net ? Number(net) : null,
      notes,
    };
    if (editing) {
      await api.patch(`/api/expenses/${editing.id}`, payload);
    } else {
      await api.post("/api/expenses", payload);
    }
    setOpen(false);
    await load();
  }

  async function remove(id: string) {
    await api.delete(`/api/expenses/${id}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expense Tracking</h1>
          <p className="text-sm text-muted">Log expenses with gross, tax, and optional net</p>
        </div>
        <div className="flex gap-3">
          <MonthPicker value={month} onChange={setMonth} />
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            Add Expense
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No expense entries"
          description="Record your first expense to start tracking spending."
          action={
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              Add expense
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Category</th>
                <th>Gross</th>
                <th>Tax</th>
                <th>Net</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.date)}</td>
                  <td>{entry.source || "—"}</td>
                  <td>{entry.category?.name ?? "—"}</td>
                  <td>{formatCurrency(entry.gross)}</td>
                  <td>{formatCurrency(entry.tax)}</td>
                  <td>{entry.net != null ? formatCurrency(entry.net) : "—"}</td>
                  <td>{entry.notes || "—"}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button type="button" className="text-sm text-accent" onClick={() => openEdit(entry)}>
                      Edit
                    </button>
                    <button type="button" className="text-sm text-red-400" onClick={() => remove(entry.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} title={editing ? "Edit Expense" : "Add Expense"} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-sm text-muted">Date</label>
            <input type="date" className="input" value={date} required onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Source</label>
            <input className="input" value={source} onChange={(e) => setSource(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Category</label>
            <select className="input" value={categoryId} required onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm text-muted">Gross</label>
              <CurrencyInput value={gross} onChange={setGross} required />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Tax</label>
              <CurrencyInput value={tax} onChange={setTax} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Net (optional)</label>
              <CurrencyInput value={net} onChange={setNet} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Notes</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary w-full">Save</button>
        </form>
      </Modal>
    </div>
  );
}
