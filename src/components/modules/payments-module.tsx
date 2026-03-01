"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { addPayment, listInvoices, listPayments } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export function PaymentsModule() {
  const [payments, setPayments] = useState<Array<any>>([]);
  const [invoices, setInvoices] = useState<Array<any>>([]);
  const [form, setForm] = useState({ invoiceId: "", amount: "0", method: "Cash", reference: "" });

  const load = useCallback(async () => {
    const [payRows, invRows] = await Promise.all([listPayments(), listInvoices()]);
    setPayments(payRows);
    setInvoices(invRows);
    if (invRows[0]) {
      setForm((prev) => ({ ...prev, invoiceId: invRows[0].id }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAdd() {
    if (!form.invoiceId) return;
    await addPayment({
      invoice_id: form.invoiceId,
      amount: Number(form.amount),
      method: form.method,
      reference: form.reference,
    });
    setForm((prev) => ({ ...prev, amount: "0", reference: "" }));
    await load();
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Payments</h1>
      </header>
      <Card className="space-y-2">
        <label className="text-xs text-muted">Invoice</label>
        <select className="h-11 rounded-xl border border-border bg-panel px-3 text-sm" value={form.invoiceId} onChange={(event) => setForm((prev) => ({ ...prev, invoiceId: event.target.value }))}>
          {invoices.map((invoice) => (
            <option key={invoice.id} value={invoice.id}>
              {(invoice.customers?.full_name || "Unknown")} - {formatCurrency(invoice.total_amount)} ({invoice.status})
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" min={0} value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} placeholder="Amount" />
          <Input value={form.method} onChange={(event) => setForm((prev) => ({ ...prev, method: event.target.value }))} placeholder="Method" />
        </div>
        <Input value={form.reference} onChange={(event) => setForm((prev) => ({ ...prev, reference: event.target.value }))} placeholder="Reference (optional)" />
        <Button onClick={onAdd}>Record Payment</Button>
      </Card>
      <div className="space-y-2">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <p className="text-sm font-semibold">{payment.invoices?.customers?.full_name || "Unknown customer"}</p>
            <p className="text-xs text-muted">
              {formatCurrency(payment.amount)} via {payment.method} • {new Date(payment.created_at).toLocaleString()}
            </p>
          </Card>
        ))}
      </div>
      {payments.length === 0 ? <EmptyState title="No payments yet" body="Record incoming payments here." /> : null}
    </div>
  );
}
