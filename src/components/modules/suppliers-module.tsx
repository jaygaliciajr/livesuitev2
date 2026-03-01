"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { createSupplier, deleteSupplier, listSuppliers, updateSupplier } from "@/lib/data";
import { Supplier } from "@/types/domain";

export function SuppliersModule() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    void load(search);
  }, [search]);

  async function load(query = "") {
    const data = await listSuppliers(query);
    setItems(data);
  }

  async function onCreate() {
    if (!name.trim()) return;
    await createSupplier(name);
    setName("");
    await load(search);
  }

  async function onEdit(item: Supplier) {
    const nextName = window.prompt("Supplier name", item.name);
    if (!nextName) return;
    await updateSupplier(item.id, { name: nextName, notes: item.notes || "" });
    await load(search);
  }

  async function onDelete(item: Supplier) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    await deleteSupplier(item.id);
    await load(search);
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Suppliers</h1>
      </header>
      <Card className="space-y-3">
        <Input placeholder="Search supplier" value={search} onChange={(event) => setSearch(event.target.value)} />
        <div className="flex gap-2">
          <Input placeholder="New supplier" value={name} onChange={(event) => setName(event.target.value)} />
          <Button onClick={onCreate}>Add</Button>
        </div>
      </Card>
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="flex items-center justify-between">
            <p className="text-sm font-semibold">{item.name}</p>
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
      {items.length === 0 ? <EmptyState title="No suppliers" body="Add a supplier to start encoding." /> : null}
    </div>
  );
}
