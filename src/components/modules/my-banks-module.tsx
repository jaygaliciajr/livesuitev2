"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

interface Bank {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
}

const STORAGE_KEY = "ls-banks";

export function MyBanksModule() {
  const [items, setItems] = useState<Bank[]>([]);
  const [form, setForm] = useState({ bank_name: "", account_name: "", account_number: "" });

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) setItems(JSON.parse(raw));
  }, []);

  function persist(next: Bank[]) {
    setItems(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function onAdd() {
    if (!form.bank_name.trim() || !form.account_name.trim() || !form.account_number.trim()) return;
    const next: Bank = { id: crypto.randomUUID(), ...form };
    persist([next, ...items]);
    setForm({ bank_name: "", account_name: "", account_number: "" });
  }

  function onEdit(item: Bank) {
    const nextBank = window.prompt("Bank name", item.bank_name);
    if (!nextBank) return;
    const nextAccountName = window.prompt("Account name", item.account_name);
    if (!nextAccountName) return;
    const nextAccountNumber = window.prompt("Account number", item.account_number);
    if (!nextAccountNumber) return;
    persist(
      items.map((row) =>
        row.id === item.id
          ? { ...row, bank_name: nextBank, account_name: nextAccountName, account_number: nextAccountNumber }
          : row,
      ),
    );
  }

  function onDelete(item: Bank) {
    if (!window.confirm(`Delete ${item.bank_name}?`)) return;
    persist(items.filter((row) => row.id !== item.id));
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">My Banks</h1>
      </header>
      <Card className="space-y-2">
        <Input placeholder="Bank name" value={form.bank_name} onChange={(event) => setForm((prev) => ({ ...prev, bank_name: event.target.value }))} />
        <Input placeholder="Account name" value={form.account_name} onChange={(event) => setForm((prev) => ({ ...prev, account_name: event.target.value }))} />
        <div className="flex gap-2">
          <Input placeholder="Account number" value={form.account_number} onChange={(event) => setForm((prev) => ({ ...prev, account_number: event.target.value }))} />
          <Button onClick={onAdd}>Add</Button>
        </div>
      </Card>
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{item.bank_name}</p>
              <p className="text-xs text-muted">{item.account_name} • {item.account_number}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => onEdit(item)}>
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={() => onDelete(item)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {items.length === 0 ? <EmptyState title="No banks" body="Add payout banks for quick reference." /> : null}
    </div>
  );
}
