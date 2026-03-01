"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listInvoices, updateInvoicePayment } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export function InvoicesModule() {
  const [items, setItems] = useState<Array<any>>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const data = await listInvoices();
    setItems(data);
  }

  async function onQuickPay(invoice: any) {
    const value = window.prompt("Paid amount", String(invoice.paid_amount));
    if (!value) return;
    const amount = Number(value);
    if (!Number.isFinite(amount)) return;
    await updateInvoicePayment(invoice.id, amount);
    await load();
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Invoices</h1>
      </header>
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{item.customers?.full_name || "Unknown customer"}</p>
                <p className="text-xs text-muted">Total: {formatCurrency(item.total_amount)}</p>
              </div>
              <Badge tone={item.status === "PAID" ? "success" : item.status === "PARTIAL" ? "warning" : "danger"}>{item.status}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <p>Paid: {formatCurrency(item.paid_amount)}</p>
              <p>Unpaid: {formatCurrency(item.total_amount - item.paid_amount)}</p>
            </div>
            <Button variant="secondary" onClick={() => onQuickPay(item)}>
              Update Payment
            </Button>
          </Card>
        ))}
      </div>
      {items.length === 0 ? <EmptyState title="No invoices" body="Generate draft invoices from a live session." /> : null}
    </div>
  );
}
