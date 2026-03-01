"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeDollarSign,
  ChartNoAxesColumnIncreasing,
  Clock3,
  FileText,
  HandCoins,
  Package,
  Rocket,
  Truck,
  TrendingDown,
  TrendingUp,
  UsersRound,
  Wallet,
} from "lucide-react";
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek, subDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { getDashboardMetrics } from "@/lib/data";
import { cn, formatCount, formatCurrency } from "@/lib/utils";
import { DashboardMetrics } from "@/types/domain";

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

type ProfitFilter = "today" | "session" | "weekly" | "monthly";

const initialMetrics: DashboardMetrics = {
  totalPcs: 0,
  totalInvoice: 0,
  unpaidAmount: 0,
  totalMiners: 0,
};

export function HomeDashboard() {
  const [profitFilter, setProfitFilter] = useState<ProfitFilter>("today");
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [previousMetrics, setPreviousMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ranges = useMemo(() => getRanges(profitFilter), [profitFilter]);

  useEffect(() => {
    let mounted = true;
    const loadMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const [current, previous] = await Promise.all([
          getDashboardMetrics(ranges.current.from.toISOString(), ranges.current.to.toISOString()),
          getDashboardMetrics(ranges.previous.from.toISOString(), ranges.previous.to.toISOString()),
        ]);

        if (!mounted) return;
        setMetrics(current);
        setPreviousMetrics(previous);
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
  }, [ranges]);

  const expenseRatio = 0.22;
  const revenue = metrics.totalInvoice;
  const expenses = revenue * expenseRatio;
  const netProfit = revenue - expenses;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const previousRevenue = previousMetrics.totalInvoice;
  const previousExpenses = previousRevenue * expenseRatio;
  const previousNet = previousRevenue - previousExpenses;
  const growth = previousNet > 0 ? ((netProfit - previousNet) / previousNet) * 100 : 0;

  const sparklinePoints = useMemo(() => buildSparkline(netProfit, previousNet, revenue), [netProfit, previousNet, revenue]);

  const summaryCards = [
    {
      label: "Total Orders",
      value: formatCount(metrics.totalPcs),
      description: "Orders encoded today",
      icon: Package,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(metrics.totalInvoice),
      description: "Gross sales captured",
      icon: BadgeDollarSign,
    },
    {
      label: "Outstanding Balance",
      value: formatCurrency(metrics.unpaidAmount),
      description: "Awaiting settlement",
      icon: HandCoins,
    },
    {
      label: "Active Customers",
      value: formatCount(metrics.totalMiners),
      description: "Unique buyers engaged",
      icon: UsersRound,
    },
  ] as const;

  return (
    <div className="space-y-5 pb-2">
      {error ? <EmptyState title="Metrics unavailable" body={error} /> : null}

      <Card className="premium-glow rounded-[30px] border-primary/35 bg-gradient-to-br from-primary/18 via-panel/85 to-accent/12 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-[1.15rem] font-semibold tracking-tight text-foreground">Profit Monitoring</h1>
            <p className="text-xs text-muted">Owner financial control panel</p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-panel/80 px-2 py-1 text-xs font-medium text-muted">
            {growth >= 0 ? <TrendingUp size={13} className="text-emerald-400" /> : <TrendingDown size={13} className="text-rose-400" />}
            {loading ? "..." : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`}
          </div>
        </div>

        <SegmentedControl
          value={profitFilter}
          onChange={(value) => setProfitFilter(value as ProfitFilter)}
          options={[
            { label: "Today", value: "today" },
            { label: "Session", value: "session" },
            { label: "Weekly", value: "weekly" },
            { label: "Monthly", value: "monthly" },
          ]}
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <MetricPill label="Net Profit" value={loading ? "..." : formatCurrency(netProfit)} highlight />
          <MetricPill label="Revenue" value={loading ? "..." : formatCurrency(revenue)} />
          <MetricPill label="Expenses" value={loading ? "..." : formatCurrency(expenses)} />
          <MetricPill label="Profit Margin" value={loading ? "..." : `${margin.toFixed(1)}%`} />
        </div>

        <div className="mt-3 rounded-2xl border border-border/75 bg-panel/72 p-2.5">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>Growth trend preview</span>
            <span className="inline-flex items-center gap-1">
              <ArrowUpRight size={12} /> last periods
            </span>
          </div>
          <svg viewBox="0 0 280 78" className="h-[78px] w-full">
            <defs>
              <linearGradient id="sparkLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(84,153,255,0.9)" />
                <stop offset="100%" stopColor="rgba(84,153,255,0.1)" />
              </linearGradient>
            </defs>
            <path d={`${sparklinePoints} L 280 78 L 0 78 Z`} fill="url(#sparkLine)" opacity="0.6" />
            <path d={sparklinePoints} stroke="rgba(111,182,255,0.95)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-3">
        {summaryCards.map((metric, index) => (
          <motion.article
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.05 }}
            className="glass-panel rounded-3xl border border-border/75 bg-panel/82 p-4 shadow-card"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-muted">{metric.label}</p>
              <span className="rounded-xl border border-border/70 bg-panel/65 p-2 text-muted">
                <metric.icon size={15} />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{loading ? "..." : metric.value}</p>
            <p className="mt-2 text-xs text-muted">{metric.description}</p>
          </motion.article>
        ))}
      </section>

      <Card className="glass-panel rounded-3xl border-border/75 bg-panel/82 p-3.5 shadow-card">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-base font-semibold text-foreground">Quick Access</h2>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
            <ChartNoAxesColumnIncreasing size={13} /> Shortcuts
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex h-[90px] flex-col items-center justify-center rounded-2xl border border-border/75 bg-panel/66 text-center transition hover:-translate-y-0.5 hover:border-primary/35"
              >
                <span className="mb-2 rounded-xl bg-gradient-to-br from-primary/25 to-accent/15 p-2 text-primary/90">
                  <Icon size={18} />
                </span>
                <span className="text-[12px] font-medium leading-tight text-foreground">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function MetricPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-border/70 bg-panel/72 p-2.5", highlight ? "premium-glow" : "")}> 
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("mt-1 text-sm font-semibold", highlight ? "text-foreground" : "text-foreground/90")}>{value}</p>
    </div>
  );
}

function getRanges(filter: ProfitFilter) {
  const now = new Date();

  if (filter === "today" || filter === "session") {
    const current = { from: startOfDay(now), to: endOfDay(now) };
    const prevDate = subDays(now, 1);
    const previous = { from: startOfDay(prevDate), to: endOfDay(prevDate) };
    return { current, previous };
  }

  if (filter === "weekly") {
    const current = { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    const prevAnchor = subDays(current.from, 1);
    const previous = { from: startOfWeek(prevAnchor, { weekStartsOn: 1 }), to: endOfWeek(prevAnchor, { weekStartsOn: 1 }) };
    return { current, previous };
  }

  const current = { from: startOfMonth(now), to: endOfMonth(now) };
  const prevAnchor = subDays(current.from, 1);
  const previous = { from: startOfMonth(prevAnchor), to: endOfMonth(prevAnchor) };
  return { current, previous };
}

function buildSparkline(netProfit: number, previousNet: number, revenue: number) {
  const base = Math.max(revenue, netProfit, previousNet, 1);
  const seed = Math.max(base, 1) / 9;
  const values = [
    previousNet * 0.68 + seed,
    previousNet * 0.77 + seed * 1.15,
    previousNet * 0.74 + seed * 0.95,
    netProfit * 0.72 + seed * 1.2,
    netProfit * 0.84 + seed,
    netProfit * 0.8 + seed * 1.25,
    revenue * 0.65 + seed,
    revenue * 0.7 + seed * 1.1,
    revenue * 0.75 + seed,
    netProfit * 0.93 + seed * 0.9,
  ];

  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const spread = maxValue - minValue || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 280;
    const y = 72 - ((value - minValue) / spread) * 62;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  return points.join(" ");
}
