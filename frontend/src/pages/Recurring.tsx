import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Category, Frequency, RecurringEntry } from "../api/types";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { CurrencyInput } from "../components/ui/CurrencyInput";
import { formatCurrency, formatDate, todayISO } from "../lib/format";

const frequencies: Frequency[] = ["weekly", "biweekly", "monthly", "quarterly", "yearly"];

export function RecurringPage() {
  const [entries, setEntries] = useState<RecurringEntry[]>([]);
  const [incomeCats, setIncomeCats] = useState<Category[]>([]);
  const [expenseCats, setExpenseCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [source, setSource] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [gross, setGross] = useState("");
  const [tax, setTax] = useState("0");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [startDate, setStartDate] = useState(todayISO());
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    const [items, income, expense] = await Promise.all([
      api.get<RecurringEntry[]>("/api/recurring"),
      api.get<Category[]>("/api/categories?kind=income"),
      api.get<Category[]>("/api/categories?kind=expense"),
    ]);
    setEntries(items);
    setIncomeCats(income);
    setExpenseCats(expense);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = kind === "income" ? incomeCats : expenseCats;

  async function submit(e: FormEvent) {
    e.preventDefault();
    await api.post("/api/recurring", {
      kind,
      source,
      categoryId,
      gross: Number(gross),
      tax: Number(tax),
      frequency,
      startDate,
      notes,
    });
    setOpen(false);
    await load();
  }

  async function toggleActive(entry: RecurringEntry) {
    await api.patch(`/api/recurring/${entry.id}`, { active: !entry.active });
    await load();
  }

  async function record(id: string) {
    await api.post(`/api/recurring/${id}/record`, {});
    await load();
  }

  async function remove(id: string) {
    await api.delete(`/api/recurring/${id}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Recurring</h1>
          <p className="text-sm text-muted">Scheduled income and expense templates</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          Add Recurring
        </button>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No recurring items"
          description="Set up recurring bills or income to track and record with one click."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              Add recurring item
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Source</th>
                <th>Category</th>
                <th>Gross</th>
                <th>Frequency</th>
                <th>Next Due</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="capitalize">{entry.kind}</td>
                  <td>{entry.source || "—"}</td>
                  <td>{entry.category?.name ?? "—"}</td>
                  <td>{formatCurrency(entry.gross)}</td>
                  <td className="capitalize">{entry.frequency}</td>
                  <td>{formatDate(entry.nextDueDate)}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={entry.active}
                      onChange={() => toggleActive(entry)}
                    />
                  </td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button type="button" className="text-sm text-accent" onClick={() => record(entry.id)}>
                      Record
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

      <Modal open={open} title="Add Recurring Item" onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-sm text-muted">Type</label>
            <select
              className="input"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as "income" | "expense");
                setCategoryId("");
              }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-muted">Frequency</label>
              <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
                {frequencies.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Start Date</label>
              <input type="date" className="input" value={startDate} required onChange={(e) => setStartDate(e.target.value)} />
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
