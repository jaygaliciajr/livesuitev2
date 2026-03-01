"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string;
};

const STORAGE_KEY = "ls-expenses";

export function ExpensesModule() {
  const [items, setItems] = useState<Expense[]>([]);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), category: "Packaging", amount: "0", note: "" });

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) setItems(JSON.parse(raw));
  }, []);

  function persist(next: Expense[]) {
    setItems(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function onAdd() {
    const amount = Number(form.amount);
    if (!form.date || !form.category.trim() || !Number.isFinite(amount) || amount <= 0) return;
    const next: Expense = {
      id: crypto.randomUUID(),
      date: form.date,
      category: form.category.trim(),
      amount,
      note: form.note.trim(),
    };
    persist([next, ...items]);
    setForm({ date: new Date().toISOString().slice(0, 10), category: "Packaging", amount: "0", note: "" });
  }

  function onDelete(id: string) {
    persist(items.filter((item) => item.id !== id));
  }

  const totalExpenses = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Expenses Tracker</h1>
        <p className="text-sm text-muted">Log operational expenses to improve profit visibility.</p>
      </header>

      <Card className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" label="Date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} />
          <Input label="Category" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
        </div>
        <Input type="number" min={0} step="0.01" label="Amount" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} />
        <Input label="Note" value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} />
        <Button onClick={onAdd}>Add Expense</Button>
      </Card>

      <Card className="space-y-1">
        <p className="text-sm font-medium text-muted">Total Expenses</p>
        <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalExpenses)}</p>
      </Card>

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{item.category}</p>
              <p className="text-xs text-muted">{item.date} {item.note ? `• ${item.note}` : ""}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{formatCurrency(item.amount)}</p>
              <button className="text-xs text-rose-400" onClick={() => onDelete(item.id)}>
                Remove
              </button>
            </div>
          </Card>
        ))}
      </div>

      {items.length === 0 ? <EmptyState title="No expenses" body="Add expense entries for accurate profit tracking." /> : null}
    </div>
  );
}
