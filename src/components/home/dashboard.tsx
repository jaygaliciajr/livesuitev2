"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeDollarSign,
  CalendarClock,
  ChartNoAxesColumnIncreasing,
  Clock3,
  FileText,
  HandCoins,
  Package,
  Rocket,
  Truck,
  UsersRound,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { getDashboardMetrics } from "@/lib/data";
import { cn, formatCount, formatCurrency, getDateRange, toDateInputValue } from "@/lib/utils";
import { DashboardMetrics, DateFilter } from "@/types/domain";

const quickLinks = [
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/customers", label: "Customers", icon: UsersRound },
  { href: "/invoices", label: "Invoice", icon: FileText },
  { href: "/my-banks", label: "My Bank", icon: Wallet },
  { href: "/payments", label: "Payments", icon: BadgeDollarSign },
  { href: "/subscription", label: "Subscription", icon: Rocket },
  { href: "/history", label: "History", icon: Clock3 },
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

    void loadMetrics();
    return () => {
      mounted = false;
    };
  }, [range.from, range.to]);

  const metricCards = [
    {
      label: "Total Units Mined",
      value: formatCount(metrics.totalPcs),
      description: "Reserved product units",
      icon: Package,
      iconTone: "text-sky-600 bg-sky-50 dark:bg-sky-500/15 dark:text-sky-300",
    },
    {
      label: "Total Invoice Value",
      value: formatCurrency(metrics.totalInvoice),
      description: "Recorded invoice revenue",
      icon: FileText,
      iconTone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      label: "Outstanding Balance",
      value: formatCurrency(metrics.unpaidAmount),
      description: "Pending customer balances",
      icon: HandCoins,
      iconTone: "text-rose-600 bg-rose-50 dark:bg-rose-500/15 dark:text-rose-300",
    },
    {
      label: "Active Miners",
      value: formatCount(metrics.totalMiners),
      description: "Unique active customers",
      icon: UsersRound,
      iconTone: "text-violet-600 bg-violet-50 dark:bg-violet-500/15 dark:text-violet-300",
    },
  ] as const;

  return (
    <div className="space-y-5 pb-2">
      <header className="space-y-3">
        <div className="flex items-end justify-between gap-3 px-0.5">
          <div>
            <h1 className="text-[1.8rem] font-semibold leading-none tracking-tight text-foreground">Sales Overview</h1>
            <p className="mt-1 text-sm text-muted">Operational summary for live-selling performance.</p>
          </div>
          <div className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-panel px-3 text-sm font-medium text-muted">
            <CalendarClock size={15} />
            {dateFilter === "today" ? "Today" : dateFilter === "week" ? "This Week" : "Custom"}
          </div>
        </div>

        <Card className="space-y-3 rounded-2xl border border-border bg-panel shadow-card">
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
      </header>

      {error ? <EmptyState title="Metrics unavailable" body={error} /> : null}

      <section className="grid grid-cols-2 gap-3">
        {metricCards.map((metric, index) => (
          <MetricCard key={metric.label} {...metric} delay={index * 0.05} loading={loading} />
        ))}
      </section>

      <Card className="rounded-3xl border border-border bg-panel p-3.5 shadow-card">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="text-base font-semibold text-foreground">Quick Access</h2>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
            <ChartNoAxesColumnIncreasing size={13} /> Modules
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex h-[92px] flex-col items-center justify-center rounded-2xl border border-border bg-background text-center transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-card"
              >
                <span className="mb-2 rounded-xl border border-border/80 bg-slate-100/85 p-2 text-slate-600 transition group-hover:bg-slate-200/75 group-hover:text-primary dark:bg-slate-800/80 dark:text-slate-300 dark:group-hover:bg-slate-700/80">
                  <Icon size={19} />
                </span>
                <span className="text-[13px] font-semibold leading-tight text-foreground">{link.label}</span>
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
  description,
  icon: Icon,
  iconTone,
  loading,
  delay,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  iconTone: string;
  loading: boolean;
  delay: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay }}
      className="rounded-2xl border border-border bg-panel p-4 shadow-card"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <span className={cn("rounded-xl p-2", iconTone)}>
          <Icon size={16} />
        </span>
      </div>
      <motion.p
        key={value}
        initial={{ opacity: 0.35, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-4 text-2xl font-semibold tracking-tight text-foreground"
      >
        {loading ? "..." : value}
      </motion.p>
      <p className="mt-4 text-xs leading-relaxed text-muted">{description}</p>
    </motion.article>
  );
}
