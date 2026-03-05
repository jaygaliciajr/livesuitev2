"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Edit3, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupplier, deleteSupplier, listSuppliers, updateSupplier } from "@/lib/data";
import { listContainer, listItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Supplier } from "@/types/domain";

const LOGO_STORAGE_KEY = "ls-supplier-logos";

type Density = "compact" | "comfortable";

export function SuppliersModule() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [density, setDensity] = useState<Density>("comfortable");
  const [logoMap, setLogoMap] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", logoUrl: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(LOGO_STORAGE_KEY);
    if (raw) setLogoMap(JSON.parse(raw));
  }, []);

  useEffect(() => {
    void load(search);
  }, [search]);

  async function load(query = "") {
    setLoading(true);
    try {
      const data = await listSuppliers(query);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  function persistLogo(nextMap: Record<string, string>) {
    setLogoMap(nextMap);
    window.localStorage.setItem(LOGO_STORAGE_KEY, JSON.stringify(nextMap));
  }

  function openCreate() {
    setEditing(null);
    setError(null);
    setForm({ name: "", logoUrl: "" });
    setModalOpen(true);
  }

  function openEdit(item: Supplier) {
    setEditing(item);
    setError(null);
    setForm({ name: item.name, logoUrl: logoMap[item.id] || "" });
    setModalOpen(true);
  }

  async function onSubmit() {
    if (!form.name.trim()) {
      setError("Supplier name is required.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const supplier = await updateSupplier(editing.id, { name: form.name, notes: editing.notes || "" });
        const nextMap = { ...logoMap };
        if (form.logoUrl.trim()) nextMap[supplier.id] = form.logoUrl.trim();
        else delete nextMap[supplier.id];
        persistLogo(nextMap);
        toast.success("Supplier updated");
      } else {
        const supplier = await createSupplier(form.name);
        if (form.logoUrl.trim()) {
          persistLogo({ ...logoMap, [supplier.id]: form.logoUrl.trim() });
        }
        toast.success("Supplier added");
      }

      setModalOpen(false);
      setForm({ name: "", logoUrl: "" });
      await load(search);
    } catch (err: any) {
      setError(err.message || "Unable to save supplier.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item: Supplier) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    await deleteSupplier(item.id);
    const nextMap = { ...logoMap };
    delete nextMap[item.id];
    persistLogo(nextMap);
    toast.success("Supplier removed");
    await load(search);
  }

  async function onLogoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setForm((prev) => ({ ...prev, logoUrl: dataUrl }));
  }

  const tableRows = useMemo(() => items, [items]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Suppliers"
        subtitle="Manage supplier partners, logos, and quick access records."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} /> Add Supplier
          </Button>
        }
      />

      <Card className="space-y-3 rounded-[18px]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input placeholder="Search supplier name" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">Density</span>
            <SegmentedControl
              value={density}
              onChange={(value) => setDensity(value as Density)}
              options={[
                { label: "Compact", value: "compact" },
                { label: "Comfort", value: "comfortable" },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-[18px] p-0">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-[12px]" />
            ))}
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="grid grid-cols-[1.2fr_1fr_152px] border-b border-border/70 bg-panel-2/65 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <p>Supplier</p>
                <p>Created</p>
                <p className="text-right">Actions</p>
              </div>
              <motion.div variants={listContainer} initial="hidden" animate="show" className="divide-y divide-border/70">
                {tableRows.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={listItem}
                    className={cn(
                      "grid grid-cols-[1.2fr_1fr_152px] items-center px-4 text-sm transition hover:bg-panel-2/45",
                      density === "compact" ? "py-2.5" : "py-3.5",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <LogoThumb name={item.name} logoUrl={logoMap[item.id]} />
                      <p className="font-semibold text-foreground">{item.name}</p>
                    </div>
                    <p className="text-xs text-muted">{new Date(item.created_at).toLocaleDateString()}</p>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                        <Edit3 size={14} /> Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => void onDelete(item)}>
                        <Trash2 size={14} /> Delete
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-2 p-3 md:hidden">
              {tableRows.map((item) => (
                <motion.article key={item.id} variants={listItem} className="rounded-[14px] border border-border/75 bg-panel-2/60 p-3">
                  <div className="mb-2 flex items-center gap-3">
                    <LogoThumb name={item.name} logoUrl={logoMap[item.id]} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted">Created {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                      <Edit3 size={14} /> Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void onDelete(item)}>
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </>
        )}
      </Card>

      {!loading && items.length === 0 ? <EmptyState title="No suppliers yet" body="Add your first supplier to start product encoding sessions." ctaLabel="Add Supplier" onClick={openCreate} /> : null}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Supplier" : "Add Supplier"}>
        <div className="space-y-3">
          <Input
            label="Supplier Name"
            placeholder="Enter supplier name"
            value={form.name}
            error={error || undefined}
            onChange={(event) => {
              setError(null);
              setForm((prev) => ({ ...prev, name: event.target.value }));
            }}
          />
          <Input
            label="Logo URL (optional)"
            placeholder="https://..."
            value={form.logoUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="focus-ring flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-border/80 bg-panel-2/70 px-3 text-sm font-medium text-foreground-soft">
              <Upload size={14} /> Gallery
              <input type="file" accept="image/*" className="hidden" onChange={(event) => void onLogoFile(event)} />
            </label>
            <label className="focus-ring flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-border/80 bg-panel-2/70 px-3 text-sm font-medium text-foreground-soft">
              <Camera size={14} /> Camera
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => void onLogoFile(event)} />
            </label>
          </div>
          <Button className="w-full" size="lg" onClick={() => void onSubmit()} loading={saving}>
            {editing ? "Save Supplier" : "Create Supplier"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function LogoThumb({ name, logoUrl }: { name: string; logoUrl?: string }) {
  if (logoUrl) {
    return (
      <div
        className="h-11 w-11 rounded-[12px] border border-border bg-cover bg-center"
        style={{ backgroundImage: `url(${logoUrl})` }}
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-border bg-panel-2/65 text-xs font-semibold text-muted">
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
