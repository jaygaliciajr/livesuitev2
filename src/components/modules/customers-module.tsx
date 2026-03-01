"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from "@/lib/data";
import { Customer } from "@/types/domain";

export function CustomersModule() {
  const [items, setItems] = useState<Customer[]>([]);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    void load(search);
  }, [search]);

  async function load(query = "") {
    const data = await listCustomers(query);
    setItems(data);
  }

  async function onCreate() {
    if (!form.name.trim()) return;
    await createCustomer(form.name, form.phone);
    setForm({ name: "", phone: "" });
    await load(search);
  }

  async function onEdit(item: Customer) {
    const nextName = window.prompt("Customer name", item.full_name);
    if (!nextName) return;
    const nextPhone = window.prompt("Phone", item.phone || "") ?? undefined;
    await updateCustomer(item.id, { full_name: nextName, phone: nextPhone });
    await load(search);
  }

  async function onDelete(item: Customer) {
    if (!window.confirm(`Delete ${item.full_name}?`)) return;
    await deleteCustomer(item.id);
    await load(search);
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Customers</h1>
      </header>
      <Card className="space-y-2">
        <Input placeholder="Search customer" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Input placeholder="Customer name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        <div className="flex gap-2">
          <Input placeholder="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
          <Button onClick={onCreate}>Add</Button>
        </div>
      </Card>
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{item.full_name}</p>
              <p className="text-xs text-muted">{item.phone || "No phone"}</p>
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
      {items.length === 0 ? <EmptyState title="No customers" body="Add quick customer records for faster mining." /> : null}
    </div>
  );
}
