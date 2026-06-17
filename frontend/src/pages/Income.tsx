import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Category, IncomeEntry } from "../api/types";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { MonthPicker } from "../components/ui/MonthPicker";
import { CurrencyInput } from "../components/ui/CurrencyInput";
import { currentMonth, formatCurrency, formatDate, todayISO } from "../lib/format";

export function IncomePage() {
  const [month, setMonth] = useState(currentMonth());
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeEntry | null>(null);
  const [date, setDate] = useState(todayISO());
  const [source, setSource] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [gross, setGross] = useState("");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    const [items, cats] = await Promise.all([
      api.get<IncomeEntry[]>(`/api/income?month=${month}`),
      api.get<Category[]>("/api/categories?kind=income"),
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
    setNotes("");
    setOpen(true);
  }

  function openEdit(entry: IncomeEntry) {
    setEditing(entry);
    setDate(entry.date);
    setSource(entry.source);
    setCategoryId(entry.categoryId);
    setGross(String(entry.gross));
    setTax(String(entry.tax));
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
      notes,
    };
    if (editing) {
      await api.patch(`/api/income/${editing.id}`, payload);
    } else {
      await api.post("/api/income", payload);
    }
    setOpen(false);
    await load();
  }

  async function remove(id: string) {
    await api.delete(`/api/income/${id}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Income Tracking</h1>
          <p className="text-sm text-muted">Log income with gross, tax, and net amounts</p>
        </div>
        <div className="flex gap-3">
          <MonthPicker value={month} onChange={setMonth} />
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            Add Income
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No income entries"
          description="Record your first income entry to start tracking."
          action={
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              Add income
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
                  <td>{formatCurrency(entry.net)}</td>
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

      <Modal open={open} title={editing ? "Edit Income" : "Add Income"} onClose={() => setOpen(false)}>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-muted">Gross</label>
              <CurrencyInput value={gross} onChange={setGross} required />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Tax</label>
              <CurrencyInput value={tax} onChange={setTax} />
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
