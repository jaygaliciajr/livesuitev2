"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { createSupplier, deleteSupplier, listSuppliers, updateSupplier } from "@/lib/data";
import { Supplier } from "@/types/domain";

const LOGO_STORAGE_KEY = "ls-supplier-logos";

export function SuppliersModule() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [form, setForm] = useState({ name: "", logoUrl: "" });
  const [search, setSearch] = useState("");
  const [logoMap, setLogoMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const raw = window.localStorage.getItem(LOGO_STORAGE_KEY);
    if (raw) setLogoMap(JSON.parse(raw));
  }, []);

  useEffect(() => {
    void load(search);
  }, [search]);

  async function load(query = "") {
    const data = await listSuppliers(query);
    setItems(data);
  }

  function persistLogo(nextMap: Record<string, string>) {
    setLogoMap(nextMap);
    window.localStorage.setItem(LOGO_STORAGE_KEY, JSON.stringify(nextMap));
  }

  async function onCreate() {
    if (!form.name.trim()) return;
    const supplier = await createSupplier(form.name);
    if (form.logoUrl.trim()) {
      persistLogo({ ...logoMap, [supplier.id]: form.logoUrl.trim() });
    }
    setForm({ name: "", logoUrl: "" });
    await load(search);
  }

  async function onEdit(item: Supplier) {
    const nextName = window.prompt("Supplier name", item.name);
    if (!nextName) return;
    await updateSupplier(item.id, { name: nextName, notes: item.notes || "" });

    const nextLogo = window.prompt("Logo URL (leave blank for placeholder)", logoMap[item.id] || "") ?? "";
    const nextMap = { ...logoMap };
    if (nextLogo.trim()) {
      nextMap[item.id] = nextLogo.trim();
    } else {
      delete nextMap[item.id];
    }
    persistLogo(nextMap);

    await load(search);
  }

  async function onDelete(item: Supplier) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    await deleteSupplier(item.id);
    const nextMap = { ...logoMap };
    delete nextMap[item.id];
    persistLogo(nextMap);
    await load(search);
  }

  async function onLogoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setForm((prev) => ({ ...prev, logoUrl: dataUrl }));
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Suppliers</h1>
        <p className="text-sm text-muted">Manage supplier profiles and brand logos.</p>
      </header>

      <Card className="space-y-3">
        <Input placeholder="Search supplier" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Input placeholder="Supplier name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        <Input placeholder="Logo URL (optional)" value={form.logoUrl} onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-muted">
            <Upload size={14} /> Gallery
            <input type="file" accept="image/*" className="hidden" onChange={(event) => void onLogoFile(event)} />
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-muted">
            <Camera size={14} /> Camera
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => void onLogoFile(event)} />
          </label>
        </div>
        <Button onClick={onCreate}>Add Supplier</Button>
      </Card>

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <LogoThumb name={item.name} logoUrl={logoMap[item.id]} />
              <p className="text-sm font-semibold">{item.name}</p>
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

      {items.length === 0 ? <EmptyState title="No suppliers" body="Add a supplier to start encoding." /> : null}
    </div>
  );
}

function LogoThumb({ name, logoUrl }: { name: string; logoUrl?: string }) {
  if (logoUrl) {
    return (
      <div
        className="h-10 w-10 rounded-xl border border-border bg-cover bg-center"
        style={{ backgroundImage: `url(${logoUrl})` }}
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-xs font-semibold text-muted">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}
