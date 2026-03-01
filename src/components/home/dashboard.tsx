"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Boxes, CreditCard, HandCoins, Package, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { getDashboardMetrics } from "@/lib/data";
import { formatCount, formatCurrency, getDateRange, toDateInputValue } from "@/lib/utils";
import { DashboardMetrics, DateFilter } from "@/types/domain";

const quickLinks = [
  { href: "/suppliers", label: "Suppliers", icon: Boxes },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/customers", label: "Customers", icon: UsersRound },
  { href: "/invoices", label: "Invoice", icon: CreditCard },
  { href: "/my-banks", label: "My Banks", icon: HandCoins },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/subscription", label: "Subscription", icon: Boxes },
  { href: "/history", label: "History", icon: Package },
];

const initialMetrics: DashboardMetrics = {
  totalPcs: 0,
  totalInvoice: 0,
  unpaidAmount: 0,
  totalMiners: 0,
};

export function HomeDashboard() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customFrom, setCustomFrom] = useState(toDateInputValue(new Date()));
  const [customTo, setCustomTo] = useState(toDateInputValue(new Date()));
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => getDateRange(dateFilter, customFrom, customTo), [dateFilter, customFrom, customTo]);

  useEffect(() => {
    let mounted = true;
    const loadMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardMetrics(range.from.toISOString(), range.to.toISOString());
        if (mounted) setMetrics(data);
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load dashboard metrics.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadMetrics();
    return () => {
      mounted = false;
    };
  }, [range.from, range.to]);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">Live Selling Fast Encoding</h1>
        <p className="text-sm text-muted">Track real-time selling performance and jump straight into modules.</p>
      </header>

      <Card className="space-y-3">
        <SegmentedControl
          value={dateFilter}
          onChange={setDateFilter}
          options={[
            { label: "Today", value: "today" },
            { label: "This Week", value: "week" },
            { label: "Custom", value: "custom" },
          ]}
        />
        {dateFilter === "custom" ? (
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" label="From" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
            <Input type="date" label="To" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
          </div>
        ) : null}
      </Card>

      {error ? <EmptyState title="Metrics unavailable" body={error} /> : null}

      <section className="grid grid-cols-2 gap-3">
        <MetricCard label="Total Pcs" value={formatCount(metrics.totalPcs)} icon={Package} loading={loading} />
        <MetricCard label="Total Invoice" value={formatCurrency(metrics.totalInvoice)} icon={CreditCard} loading={loading} />
        <MetricCard label="Unpaid Amount" value={formatCurrency(metrics.unpaidAmount)} icon={HandCoins} loading={loading} />
        <MetricCard label="Total Miners" value={formatCount(metrics.totalMiners)} icon={UsersRound} loading={loading} />
      </section>

      <Card>
        <h2 className="text-sm font-semibold text-foreground">Quick Access</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-20 items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <span className="rounded-xl bg-primary/12 p-2 text-primary">
                  <Icon size={18} />
                </span>
                <span className="text-sm font-semibold text-foreground">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
  loading: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{label}</p>
        <span className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon size={14} />
        </span>
      </div>
      <motion.p
        key={value}
        initial={{ opacity: 0.2, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 text-lg font-semibold text-foreground"
      >
        {loading ? "..." : value}
      </motion.p>
    </Card>
  );
}
