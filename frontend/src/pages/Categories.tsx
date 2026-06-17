import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Category, CategoryKind, Priority } from "../api/types";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";

const priorities: Priority[] = ["High", "Medium", "Low"];

export function CategoriesPage() {
  const [incomeCats, setIncomeCats] = useState<Category[]>([]);
  const [expenseCats, setExpenseCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");

  const load = useCallback(async () => {
    const [income, expense] = await Promise.all([
      api.get<Category[]>("/api/categories?kind=income"),
      api.get<Category[]>("/api/categories?kind=expense"),
    ]);
    setIncomeCats(income);
    setExpenseCats(expense);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    await api.post("/api/categories", {
      name,
      kind,
      priority: kind === "expense" ? priority : null,
    });
    setOpen(false);
    setName("");
    await load();
  }

  async function remove(id: string) {
    await api.delete(`/api/categories/${id}`);
    await load();
  }

  function CategoryTable({ items, title }: { items: Category[]; title: string }) {
    return (
      <div className="card">
        <h2 className="mb-4 font-semibold">{title}</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted">No {title.toLowerCase()} yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                {title.includes("Expense") && <th>Priority</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  {title.includes("Expense") && <td>{cat.priority ?? "—"}</td>}
                  <td>
                    <button type="button" className="text-sm text-red-400" onClick={() => remove(cat.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  const isEmpty = incomeCats.length === 0 && expenseCats.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted">Manage income and expense categories</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          Add Category
        </button>
      </div>

      {isEmpty ? (
        <EmptyState
          title="No categories yet"
          description="Create income and expense categories before logging transactions."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              Add your first category
            </button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryTable items={incomeCats} title="Income Categories" />
          <CategoryTable items={expenseCats} title="Expense Categories" />
        </div>
      )}

      <Modal open={open} title="Add Category" onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-sm text-muted">Type</label>
            <select
              className="input"
              value={kind}
              onChange={(e) => setKind(e.target.value as CategoryKind)}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Name</label>
            <input className="input" value={name} required onChange={(e) => setName(e.target.value)} />
          </div>
          {kind === "expense" && (
            <div>
              <label className="mb-1 block text-sm text-muted">Priority</label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                {priorities.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" className="btn btn-primary w-full">Save</button>
        </form>
      </Modal>
    </div>
  );
}
