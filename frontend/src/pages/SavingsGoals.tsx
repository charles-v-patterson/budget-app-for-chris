import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { SavingsGoal } from "../api/types";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { CurrencyInput } from "../components/ui/CurrencyInput";
import { formatCurrency } from "../lib/format";

export function SavingsGoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [open, setOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [contribution, setContribution] = useState("");

  const load = useCallback(async () => {
    const items = await api.get<SavingsGoal[]>("/api/savings-goals");
    setGoals(items);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    await api.post("/api/savings-goals", {
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount),
      targetDate: targetDate || null,
      notes,
    });
    setOpen(false);
    setName("");
    setTargetAmount("");
    setCurrentAmount("0");
    setTargetDate("");
    setNotes("");
    await load();
  }

  async function submitContribution(e: FormEvent) {
    e.preventDefault();
    if (!contributeOpen) return;
    await api.post(`/api/savings-goals/${contributeOpen.id}/contribute`, {
      amount: Number(contribution),
    });
    setContributeOpen(null);
    setContribution("");
    await load();
  }

  async function remove(id: string) {
    await api.delete(`/api/savings-goals/${id}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Savings Goals</h1>
          <p className="text-sm text-muted">Track sinking funds and savings targets</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          Add Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          title="No savings goals"
          description="Create a savings goal to track progress toward a target amount."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              Add savings goal
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <div key={goal.id} className="card">
              <div className="mb-3 flex items-start justify-between">
                <h3 className="font-semibold">{goal.name}</h3>
                <button type="button" className="text-sm text-red-400" onClick={() => remove(goal.id)}>
                  Delete
                </button>
              </div>
              <p className="mb-2 text-sm text-muted">
                {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
              </p>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-elevated">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              {goal.targetDate && (
                <p className="mb-3 text-xs text-muted">Target date: {goal.targetDate}</p>
              )}
              {goal.notes && <p className="mb-3 text-sm text-muted">{goal.notes}</p>}
              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={() => {
                  setContributeOpen(goal);
                  setContribution("");
                }}
              >
                Add Contribution
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} title="Add Savings Goal" onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-sm text-muted">Name</label>
            <input className="input" value={name} required onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-muted">Target Amount</label>
              <CurrencyInput value={targetAmount} onChange={setTargetAmount} required />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Current Amount</label>
              <CurrencyInput value={currentAmount} onChange={setCurrentAmount} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Target Date (optional)</label>
            <input type="date" className="input" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Notes</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary w-full">Save</button>
        </form>
      </Modal>

      <Modal
        open={contributeOpen != null}
        title={`Contribute to ${contributeOpen?.name ?? ""}`}
        onClose={() => setContributeOpen(null)}
      >
        <form className="space-y-4" onSubmit={submitContribution}>
          <div>
            <label className="mb-1 block text-sm text-muted">Amount</label>
            <CurrencyInput value={contribution} onChange={setContribution} required />
          </div>
          <button type="submit" className="btn btn-primary w-full">Add Contribution</button>
        </form>
      </Modal>
    </div>
  );
}
