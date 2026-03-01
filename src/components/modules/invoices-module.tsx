"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, CircleDollarSign, Coins, CreditCard, ReceiptText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { listInvoicesWithFilters, listSuppliers } from "@/lib/data";
import { formatCurrency, toDateInputValue } from "@/lib/utils";
import { InvoiceListItem, Supplier } from "@/types/domain";

const SUBMITTED_STORAGE = "ls-invoice-submitted";
const META_STORAGE = "ls-invoice-meta";

type UiStatus = "New" | "Paid" | "Unpaid" | "Partial" | "Overdue" | "Submitted";
type InvoiceTab = "to_send" | "unpaid" | "overdue" | "paid";

export function InvoicesModule() {
  const [items, setItems] = useState<InvoiceListItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    supplierId: "",
  });
  const [activeTab, setActiveTab] = useState<InvoiceTab>("to_send");

  const [submittedMap, setSubmittedMap] = useState<Record<string, boolean>>({});
  const [metaMap, setMetaMap] = useState<Record<string, { dueDate?: string }>>({});

  useEffect(() => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    setFilters((prev) => ({ ...prev, from: toDateInputValue(from), to: toDateInputValue(today) }));
  }, []);

  useEffect(() => {
    const submittedRaw = window.localStorage.getItem(SUBMITTED_STORAGE);
    const metaRaw = window.localStorage.getItem(META_STORAGE);
    if (submittedRaw) setSubmittedMap(JSON.parse(submittedRaw));
    if (metaRaw) setMetaMap(JSON.parse(metaRaw));
  }, []);

  const loadInvoices = useCallback(async () => {
    if (!filters.from || !filters.to) return;
    const rows = await listInvoicesWithFilters({
      from: `${filters.from}T00:00:00.000Z`,
      to: `${filters.to}T23:59:59.999Z`,
      supplierId: filters.supplierId || undefined,
    });
    setItems(rows);
  }, [filters.from, filters.to, filters.supplierId]);

  const loadSuppliersAndInvoices = useCallback(async () => {
    const [supplierRows] = await Promise.all([listSuppliers()]);
    setSuppliers(supplierRows);
    await loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    void loadSuppliersAndInvoices();
  }, [loadSuppliersAndInvoices]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices, submittedMap, metaMap]);

  const summary = useMemo(() => {
    const totalSales = items.reduce((sum, item) => sum + item.total_amount, 0);
    const paidAmount = items.reduce((sum, item) => sum + item.paid_amount, 0);
    const unpaidAmount = items.reduce((sum, item) => sum + Math.max(item.total_amount - item.paid_amount, 0), 0);
    const totalOutstanding = unpaidAmount;
    return { totalSales, paidAmount, unpaidAmount, totalOutstanding };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const uiStatus = getInvoiceUiStatus(item, metaMap[item.id]?.dueDate, submittedMap[item.id]);
      if (activeTab === "to_send") return !submittedMap[item.id];
      if (activeTab === "unpaid") return uiStatus === "Unpaid" || uiStatus === "Partial";
      if (activeTab === "overdue") return uiStatus === "Overdue";
      if (activeTab === "paid") return uiStatus === "Paid";
      return true;
    });
  }, [items, activeTab, metaMap, submittedMap]);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Invoices</h1>
        <p className="text-sm text-muted">Track billing, payment health, and supplier-based invoice performance.</p>
      </header>

      <section className="grid grid-cols-2 gap-2">
        <SummaryCard icon={CircleDollarSign} label="Total Sales" value={formatCurrency(summary.totalSales)} description="Gross invoice value" />
        <SummaryCard icon={Coins} label="Paid Amount" value={formatCurrency(summary.paidAmount)} description="Confirmed collections" />
        <SummaryCard icon={CreditCard} label="Unpaid Amount" value={formatCurrency(summary.unpaidAmount)} description="Pending receivables" />
        <SummaryCard icon={ReceiptText} label="Outstanding" value={formatCurrency(summary.totalOutstanding)} description="Open invoice balance" />
      </section>

      <Card className="space-y-3">
        <SegmentedControl
          value={activeTab}
          onChange={(value) => setActiveTab(value as InvoiceTab)}
          options={[
            { label: "To Send", value: "to_send" },
            { label: "Unpaid", value: "unpaid" },
            { label: "Overdue", value: "overdue" },
            { label: "Paid", value: "paid" },
          ]}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" label="From" value={filters.from} onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))} />
          <Input type="date" label="To" value={filters.to} onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))} />
        </div>
        <label className="text-xs text-muted">Supplier Filter</label>
        <select
          className="h-11 rounded-xl border border-border bg-panel px-3 text-sm"
          value={filters.supplierId}
          onChange={(event) => setFilters((prev) => ({ ...prev, supplierId: event.target.value }))}
        >
          <option value="">All suppliers</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </Card>

      <div className="space-y-2">
        {filteredItems.map((item) => {
          const uiStatus = getInvoiceUiStatus(item, metaMap[item.id]?.dueDate, submittedMap[item.id]);
          return (
            <Link key={item.id} href={`/invoices/${item.id}`} className="block">
              <Card className="space-y-2 transition hover:border-primary/35 hover:shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.customer_name}</p>
                    <p className="text-xs text-muted">{item.supplier_name} • {new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={uiStatus} />
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-background p-2 text-xs">
                  <div>
                    <p className="text-muted">Total</p>
                    <p className="font-semibold text-foreground">{formatCurrency(item.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted">Paid</p>
                    <p className="font-semibold text-foreground">{formatCurrency(item.paid_amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted">Unpaid</p>
                    <p className="font-semibold text-foreground">{formatCurrency(Math.max(item.total_amount - item.paid_amount, 0))}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {filteredItems.length === 0 ? <EmptyState title="No invoices" body="Close a live session to auto-generate invoices." /> : null}

      <Card className="border-border bg-panel">
        <div className="flex items-start gap-2 text-xs text-muted">
          <CalendarRange size={14} className="mt-0.5" />
          <p>Invoice status is automatically derived from payment, due date, and submitted state.</p>
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <Card className="space-y-2 border-border bg-panel p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        <span className="rounded-lg border border-border bg-background p-1.5 text-muted">
          <Icon size={14} />
        </span>
      </div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted">{description}</p>
    </Card>
  );
}

function getInvoiceUiStatus(item: InvoiceListItem, dueDate?: string, submitted?: boolean): UiStatus {
  if (submitted) return "Submitted";

  if (item.paid_amount >= item.total_amount && item.total_amount > 0) return "Paid";
  if (item.paid_amount > 0) return "Partial";

  if (dueDate) {
    const due = new Date(dueDate);
    const now = new Date();
    if (due.getTime() < now.getTime()) return "Overdue";
  }

  const ageMs = Date.now() - new Date(item.created_at).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours < 24) return "New";
  return "Unpaid";
}

function StatusBadge({ status }: { status: UiStatus }) {
  const palette: Record<UiStatus, string> = {
    New: "border border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-400/35 dark:bg-sky-500/20 dark:text-sky-200",
    Paid: "border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-200",
    Unpaid: "border border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-400/35 dark:bg-rose-500/20 dark:text-rose-200",
    Partial: "border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-400/35 dark:bg-amber-500/20 dark:text-amber-200",
    Overdue: "border border-red-300 bg-red-100 text-red-800 dark:border-red-400/35 dark:bg-red-500/20 dark:text-red-200",
    Submitted: "border border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-400/35 dark:bg-violet-500/20 dark:text-violet-200",
  };

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${palette[status]}`}>{status}</span>;
}
