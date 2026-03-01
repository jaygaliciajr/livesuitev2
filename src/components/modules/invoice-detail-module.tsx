"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CalendarDays, CreditCard, MapPin, PackageOpen, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { getInvoiceDetail } from "@/lib/data";
import { formatCurrency, toDateInputValue } from "@/lib/utils";
import { InvoiceOrderLine } from "@/types/domain";

interface PurchaseMeta {
  dueDate: string;
  discount: number;
  shippingFee: number;
  wallet: number;
  previousBalance: number;
  taxAmount: number;
  otherAdjustments: number;
  orderDate: string;
  billTo: string;
  shipTo: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
}

const META_STORAGE = "ls-invoice-meta";

export function InvoiceDetailModule({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [lines, setLines] = useState<InvoiceOrderLine[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [meta, setMeta] = useState<PurchaseMeta>({
    dueDate: toDateInputValue(new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)),
    discount: 0,
    shippingFee: 0,
    wallet: 0,
    previousBalance: 0,
    taxAmount: 0,
    otherAdjustments: 0,
    orderDate: toDateInputValue(new Date()),
    billTo: "",
    shipTo: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await getInvoiceDetail(invoiceId);
      setInvoice(detail.invoice);
      setLines(detail.lines);

      const bankRaw = window.localStorage.getItem("ls-banks");
      if (bankRaw) setBanks(JSON.parse(bankRaw));

      const metaRaw = window.localStorage.getItem(META_STORAGE);
      if (metaRaw) {
        const map = JSON.parse(metaRaw) as Record<string, PurchaseMeta>;
        if (map[invoiceId]) {
          setMeta((prev) => ({ ...prev, ...map[invoiceId] }));
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load invoice details.");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  function persistMeta(next: PurchaseMeta) {
    setMeta(next);
    const raw = window.localStorage.getItem(META_STORAGE);
    const existing = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem(META_STORAGE, JSON.stringify({ ...existing, [invoiceId]: next }));
  }

  const groupedBySupplier = useMemo(() => {
    const map = new Map<string, InvoiceOrderLine[]>();
    lines.forEach((line) => {
      const key = line.supplier_name || "Unknown supplier";
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(line);
    });
    return [...map.entries()];
  }, [lines]);

  const amountToPay = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
    const finalTotal =
      subtotal - (meta.discount || 0) + (meta.shippingFee || 0) + (meta.previousBalance || 0) + (meta.taxAmount || 0) + (meta.otherAdjustments || 0) - (meta.wallet || 0);
    return {
      subtotal,
      finalTotal: Math.max(finalTotal, 0),
    };
  }, [lines, meta]);

  if (loading) return <Card>Loading invoice details...</Card>;
  if (error) return <EmptyState title="Invoice unavailable" body={error} />;
  if (!invoice) return <EmptyState title="Invoice missing" body="The selected invoice could not be found." />;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2">
        <Link href="/invoices" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-panel px-3 text-sm font-medium text-foreground">
          <ArrowLeft size={15} /> Back
        </Link>
        <span className="text-sm font-semibold text-muted">Invoice #{invoice.id.slice(0, 8).toUpperCase()}</span>
      </header>

      <Card className="space-y-3 border-border bg-panel">
        <h2 className="text-sm font-semibold text-foreground">Purchase Details</h2>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Due Date" type="date" value={meta.dueDate} onChange={(event) => persistMeta({ ...meta, dueDate: event.target.value })} />
          <Input label="Quantity" value={String(lines.reduce((sum, line) => sum + line.qty, 0))} disabled />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Discount" type="number" min={0} value={String(meta.discount)} onChange={(event) => persistMeta({ ...meta, discount: Number(event.target.value) })} />
          <Input label="Shipping Fee" type="number" min={0} value={String(meta.shippingFee)} onChange={(event) => persistMeta({ ...meta, shippingFee: Number(event.target.value) })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Wallet" type="number" min={0} value={String(meta.wallet)} onChange={(event) => persistMeta({ ...meta, wallet: Number(event.target.value) })} />
          <Input label="Previous Balance" type="number" min={0} value={String(meta.previousBalance)} onChange={(event) => persistMeta({ ...meta, previousBalance: Number(event.target.value) })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Tax Amount" type="number" min={0} value={String(meta.taxAmount)} onChange={(event) => persistMeta({ ...meta, taxAmount: Number(event.target.value) })} />
          <Input label="Other Adjustments" type="number" value={String(meta.otherAdjustments)} onChange={(event) => persistMeta({ ...meta, otherAdjustments: Number(event.target.value) })} />
        </div>
      </Card>

      <Card className="space-y-3 border-border bg-panel">
        <h2 className="text-sm font-semibold text-foreground">Customer Details</h2>
        <div className="grid grid-cols-1 gap-2 text-sm text-muted">
          <p className="inline-flex items-center gap-2"><CalendarDays size={14} /> Order Date: {meta.orderDate}</p>
          <Input label="Order Date" type="date" value={meta.orderDate} onChange={(event) => persistMeta({ ...meta, orderDate: event.target.value })} />
          <Input label="Bill To" value={meta.billTo || invoice.customer_name} onChange={(event) => persistMeta({ ...meta, billTo: event.target.value })} />
          <Input label="Ship To" value={meta.shipTo} onChange={(event) => persistMeta({ ...meta, shipTo: event.target.value })} />
        </div>
      </Card>

      <Card className="space-y-3 border-border bg-panel">
        <h2 className="text-sm font-semibold text-foreground">List of Orders</h2>
        <div className="space-y-3">
          {groupedBySupplier.map(([supplierName, supplierLines]) => (
            <div key={supplierName} className="rounded-xl border border-border bg-background p-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"><Building2 size={14} /> {supplierName}</p>
              <div className="mt-2 space-y-2">
                {supplierLines.map((line) => (
                  <div key={line.line_id} className="rounded-lg border border-border bg-panel p-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{line.product_code}</p>
                      <p className="font-semibold text-primary">{formatCurrency(line.amount)}</p>
                    </div>
                    <p className="mt-1 text-muted">Variant: {line.color || "-"} / {line.size || "Pre-size"}</p>
                    <p className="text-muted">Qty: {line.qty}</p>
                    {line.note ? <p className="text-muted">Note: {line.note}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-3 border-border bg-panel">
        <h2 className="text-sm font-semibold text-foreground">Mode of Payments</h2>
        {banks.length > 0 ? (
          <div className="space-y-2">
            {banks.map((bank) => (
              <div key={bank.id} className="rounded-xl border border-border bg-background p-2.5 text-sm">
                <p className="font-semibold text-foreground">{bank.bank_name}</p>
                <p className="text-xs text-muted">{bank.account_name} • {bank.account_number}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No payment methods" body="Add accounts in My Bank to show payment options here." />
        )}
      </Card>

      <Card className="space-y-3 border-primary/30 bg-primary/5 p-4">
        <h2 className="text-sm font-semibold text-primary">Amount to Pay</h2>
        <div className="space-y-1 text-sm text-muted">
          <p className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><PackageOpen size={13} /> Subtotal</span> <span>{formatCurrency(amountToPay.subtotal)}</span></p>
          <p className="flex items-center justify-between"><span>Discount</span> <span>- {formatCurrency(meta.discount)}</span></p>
          <p className="flex items-center justify-between"><span>Shipping + Fees</span> <span>{formatCurrency(meta.shippingFee + meta.taxAmount + meta.otherAdjustments)}</span></p>
          <p className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><Wallet size={13} /> Wallet Applied</span> <span>- {formatCurrency(meta.wallet)}</span></p>
          <p className="flex items-center justify-between"><span>Previous Balance</span> <span>{formatCurrency(meta.previousBalance)}</span></p>
        </div>
        <div className="rounded-xl border border-primary/35 bg-panel px-3 py-3">
          <p className="text-xs font-medium text-muted">Final Amount Due</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(amountToPay.finalTotal)}</p>
        </div>
        <p className="text-xs text-muted">Suggested additional fields: invoice reference no., payment terms, tax ID, and shipment tracking.</p>
      </Card>

      <Card className="border-border bg-panel text-xs text-muted">
        <p className="inline-flex items-center gap-2"><MapPin size={13} /> Billing and shipping data are editable for reconciliation and logistics accuracy.</p>
        <p className="mt-1 inline-flex items-center gap-2"><CreditCard size={13} /> Payment methods are synced from My Bank settings.</p>
      </Card>
    </div>
  );
}
