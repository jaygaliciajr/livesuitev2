"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  EllipsisVertical,
  Plus,
  Search,
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { listContainer, listItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

type PaymentType = "GCASH" | "MAYA" | "BANK_TRANSFER" | "COD" | "OTHER";

interface PaymentMode {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  payment_type: PaymentType;
  created_at: string;
}

type FormState = {
  bank_name: string;
  account_name: string;
  account_number: string;
  payment_type: PaymentType;
};

const STORAGE_KEY = "ls-banks";

const paymentTypeOptions: Array<{ value: PaymentType; label: string }> = [
  { value: "GCASH", label: "GCash" },
  { value: "MAYA", label: "Maya" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "COD", label: "COD" },
  { value: "OTHER", label: "Other" },
];

const quickAddPresets: Array<{ label: string; payment_type: PaymentType; bank_name: string }> = [
  { label: "GCash", payment_type: "GCASH", bank_name: "GCash" },
  { label: "Maya", payment_type: "MAYA", bank_name: "Maya" },
  { label: "Bank", payment_type: "BANK_TRANSFER", bank_name: "" },
  { label: "COD", payment_type: "COD", bank_name: "Cash on Delivery" },
];

const initialForm: FormState = {
  bank_name: "",
  account_name: "",
  account_number: "",
  payment_type: "GCASH",
};

export function MyBanksModule() {
  const [items, setItems] = useState<PaymentMode[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<PaymentType | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) setItems(JSON.parse(raw));
    setLoading(false);
  }, []);

  function persist(next: PaymentMode[]) {
    setItems(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function openCreate(prefill?: Partial<FormState>) {
    const profileRaw = window.localStorage.getItem("ls-profile");
    const profile = profileRaw ? JSON.parse(profileRaw) : { store_name: "" };
    setEditingId(null);
    setErrors({});
    setForm({
      ...initialForm,
      account_name: profile.store_name || "",
      ...prefill,
    });
    setDrawerOpen(true);
  }

  function openEdit(item: PaymentMode) {
    setEditingId(item.id);
    setErrors({});
    setForm({
      bank_name: item.bank_name,
      account_name: item.account_name,
      account_number: item.account_number,
      payment_type: item.payment_type || "BANK_TRANSFER",
    });
    setDrawerOpen(true);
  }

  function validate(next: FormState) {
    const message: Partial<Record<keyof FormState, string>> = {};
    if (!next.payment_type) message.payment_type = "Select a payment type.";
    if (!next.bank_name.trim()) message.bank_name = "Enter bank/wallet name.";
    if (!next.account_name.trim()) message.account_name = "Enter account name.";

    const isCod = next.payment_type === "COD";
    if (!isCod && !next.account_number.trim()) {
      message.account_number = "Enter account number.";
    } else if (!isCod && next.account_number.trim().length < 6) {
      message.account_number = "Account number looks too short.";
    }

    return message;
  }

  function onSubmit() {
    const payload = {
      ...form,
      bank_name: form.bank_name.trim(),
      account_name: form.account_name.trim(),
      account_number: form.payment_type === "COD" ? "N/A" : form.account_number.trim(),
    };
    const nextErrors = validate(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (editingId) {
      persist(
        items.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...payload,
              }
            : item,
        ),
      );
      toast.success("Payment mode updated");
    } else {
      persist([
        {
          id: makeId(),
          ...payload,
          created_at: new Date().toISOString(),
        },
        ...items,
      ]);
      toast.success("Payment mode saved");
    }

    setDrawerOpen(false);
    setEditingId(null);
  }

  function onDelete(item: PaymentMode) {
    if (!window.confirm(`Delete ${item.bank_name}?`)) return;
    persist(items.filter((row) => row.id !== item.id));
    setActiveMenuId(null);
    toast.success("Payment mode removed");
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = filterType === "ALL" ? true : item.payment_type === filterType;
      if (!q) return matchesType;
      const text = `${item.bank_name} ${item.account_name} ${item.account_number} ${item.payment_type}`.toLowerCase();
      return matchesType && text.includes(q);
    });
  }, [items, search, filterType]);

  return (
    <div className="space-y-4 pb-1">
      <PageHeader
        title="Mode of Payment"
        subtitle="Add and manage receiving accounts for invoices and customer payments."
        actions={
          <Button size="sm" onClick={() => openCreate()}>
            <Plus size={14} /> New Mode
          </Button>
        }
      />

      <Card className="space-y-3 rounded-[18px] p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Quick Add</p>
            <p className="text-xs text-muted">Tap once to start with smart defaults</p>
          </div>
          <p className="text-xs text-muted">Mobile optimized</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {quickAddPresets.map((preset) => (
            <button
              key={preset.label}
              className="focus-ring flex h-14 items-center justify-center rounded-[14px] border border-border/75 bg-panel-2/70 px-2 text-sm font-medium text-foreground transition hover:border-border-strong"
              onClick={() =>
                openCreate({
                  payment_type: preset.payment_type,
                  bank_name: preset.bank_name,
                })
              }
            >
              {preset.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-2.5 rounded-[18px] p-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input placeholder="Search payment modes" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={filterType === "ALL"} label="All" onClick={() => setFilterType("ALL")} />
          {paymentTypeOptions.map((type) => (
            <FilterChip
              key={type.value}
              active={filterType === type.value}
              label={type.label}
              onClick={() => setFilterType(type.value)}
            />
          ))}
        </div>
      </Card>

      <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-2.5">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-[14px]" />
            <Skeleton className="h-20 w-full rounded-[14px]" />
            <Skeleton className="h-20 w-full rounded-[14px]" />
          </div>
        ) : null}

        {filteredItems.map((item) => {
          const icon = paymentTypeIcon(item.payment_type);
          return (
            <motion.div key={item.id} variants={listItem}>
              <Card className="relative rounded-[14px] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-2xl border border-border/75 bg-panel-2/80 p-2.5 text-primary">{icon}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{item.bank_name}</p>
                        <span className="rounded-full border border-border/70 bg-panel-2/65 px-2 py-0.5 text-[11px] font-medium text-muted">
                          {paymentTypeLabel(item.payment_type)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">{item.account_name}</p>
                      <p className="truncate text-xs font-medium text-foreground/90">{item.account_number}</p>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl border border-border/75 bg-panel-2/70 text-muted"
                      onClick={() => setActiveMenuId((prev) => (prev === item.id ? null : item.id))}
                      aria-label="Open actions"
                    >
                      <EllipsisVertical size={16} />
                    </button>
                    {activeMenuId === item.id ? (
                      <div className="surface-elevated absolute right-0 top-11 z-20 min-w-[128px] rounded-2xl p-1">
                        <button
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-panel-2/80"
                          onClick={() => {
                            setActiveMenuId(null);
                            openEdit(item);
                          }}
                        >
                          <CreditCard size={14} /> Edit
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-danger hover:bg-panel-2/80"
                          onClick={() => onDelete(item)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {!loading && filteredItems.length === 0 ? (
        <EmptyState title="No payment mode found" body="Use Quick Add to create GCash, Maya, bank transfer, or COD details." />
      ) : null}

      <Modal
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setErrors({});
        }}
        title={editingId ? "Edit Payment Mode" : "Add Payment Mode"}
      >
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-sm text-muted">Payment Type</p>
            <div className="grid grid-cols-3 gap-2">
              {paymentTypeOptions.map((option) => (
                <button
                  key={option.value}
                  className={cn(
                    "focus-ring h-11 rounded-2xl border px-2 text-xs font-medium transition",
                    form.payment_type === option.value
                      ? "border-primary/60 bg-primary/12 text-primary"
                      : "border-border/75 bg-panel-2/70 text-muted",
                  )}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      payment_type: option.value,
                      bank_name: !prev.bank_name.trim() ? suggestedName(option.value) : prev.bank_name,
                    }))
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
            {errors.payment_type ? <p className="mt-1 text-xs text-danger">{errors.payment_type}</p> : null}
          </div>

          <Input
            label="Bank / Wallet Name"
            value={form.bank_name}
            placeholder="e.g. BDO, GCash, Maya"
            error={errors.bank_name}
            onChange={(event) => setForm((prev) => ({ ...prev, bank_name: event.target.value }))}
          />

          <Input
            label="Account Name"
            value={form.account_name}
            placeholder="Account holder name"
            error={errors.account_name}
            onChange={(event) => setForm((prev) => ({ ...prev, account_name: event.target.value }))}
          />

          <Input
            label="Account Number"
            value={form.account_number}
            placeholder={form.payment_type === "COD" ? "Auto-filled as N/A" : "Enter account number"}
            disabled={form.payment_type === "COD"}
            error={errors.account_number}
            onChange={(event) => setForm((prev) => ({ ...prev, account_number: event.target.value }))}
          />

          <Button className="h-12 w-full" size="lg" onClick={onSubmit}>
            <CheckCircle2 size={16} /> {editingId ? "Save Changes" : "Save Payment Mode"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function makeId() {
  const generator = globalThis.crypto && "randomUUID" in globalThis.crypto ? globalThis.crypto.randomUUID : null;
  if (generator) return generator.call(globalThis.crypto);
  return `pm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function paymentTypeLabel(type: PaymentType) {
  if (type === "BANK_TRANSFER") return "Bank Transfer";
  if (type === "COD") return "COD";
  if (type === "GCASH") return "GCash";
  if (type === "MAYA") return "Maya";
  return "Other";
}

function suggestedName(type: PaymentType) {
  if (type === "GCASH") return "GCash";
  if (type === "MAYA") return "Maya";
  if (type === "COD") return "Cash on Delivery";
  return "";
}

function paymentTypeIcon(type: PaymentType) {
  if (type === "GCASH" || type === "MAYA") return <Smartphone size={18} />;
  if (type === "BANK_TRANSFER") return <Building2 size={18} />;
  if (type === "COD") return <CircleDollarSign size={18} />;
  return <CreditCard size={18} />;
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex h-9 items-center rounded-full border px-3 text-xs font-medium whitespace-nowrap transition",
        active ? "border-primary/55 bg-primary/12 text-primary" : "border-border/75 bg-panel-2/70 text-muted",
      )}
      onClick={onClick}
    >
      {label}
      <ChevronDown size={13} className={cn("ml-1 opacity-65", active ? "text-primary" : "text-muted")} />
    </button>
  );
}
