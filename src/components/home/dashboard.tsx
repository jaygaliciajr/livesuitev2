"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  UsersRound,
  Wallet,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  addDays,
  addHours,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getISOWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subWeeks,
  subYears,
} from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { KPIStat } from "@/components/ui/kpi-stat";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardMetrics, listInvoiceAmountsInRange } from "@/lib/data";
import { listContainer, listItem, tapFeedback } from "@/lib/motion";
import { formatCount, formatCurrency } from "@/lib/utils";
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

type ProfitFilter = "today" | "weekly" | "monthly" | "yearly";
type ExpenseEntry = { date: string; amount: number };
type InvoiceTrendPoint = { created_at: string; total_amount: number };

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
  const [expenseCurrent, setExpenseCurrent] = useState(0);
  const [expensePrevious, setExpensePrevious] = useState(0);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [invoiceTrendPoints, setInvoiceTrendPoints] = useState<InvoiceTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartHostRef = useRef<HTMLDivElement | null>(null);
  const [canRenderChart, setCanRenderChart] = useState(false);

  const ranges = useMemo(() => getRanges(profitFilter), [profitFilter]);

  useEffect(() => {
    let mounted = true;
    const loadMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const [current, previous, invoiceTrend] = await Promise.all([
          getDashboardMetrics(ranges.current.from.toISOString(), ranges.current.to.toISOString()),
          getDashboardMetrics(ranges.previous.from.toISOString(), ranges.previous.to.toISOString()),
          listInvoiceAmountsInRange(ranges.current.from.toISOString(), ranges.current.to.toISOString()),
        ]);

        if (!mounted) return;
        setMetrics(current);
        setPreviousMetrics(previous);
        const expensesRaw = window.localStorage.getItem("ls-expenses");
        const expenses = expensesRaw ? (JSON.parse(expensesRaw) as ExpenseEntry[]) : [];
        setInvoiceTrendPoints(invoiceTrend);
        setExpenseEntries(expenses);
        setExpenseCurrent(sumExpensesForRange(expenses, ranges.current.from, ranges.current.to));
        setExpensePrevious(sumExpensesForRange(expenses, ranges.previous.from, ranges.previous.to));
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

  useEffect(() => {
    if (!chartHostRef.current) return;
    let mounted = true;
    const node = chartHostRef.current;
    const observer = new ResizeObserver((entries) => {
      if (!mounted) return;
      const rect = entries[0]?.contentRect;
      setCanRenderChart(Boolean(rect && rect.width > 0 && rect.height > 0));
    });
    observer.observe(node);
    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, []);

  const revenue = metrics.totalInvoice;
  const expenses = expenseCurrent;
  const netProfit = revenue - expenses;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const previousRevenue = previousMetrics.totalInvoice;
  const previousExpenses = expensePrevious;
  const previousNet = previousRevenue - previousExpenses;
  const growth = previousNet > 0 ? ((netProfit - previousNet) / previousNet) * 100 : 0;

  const trendSeries = useMemo(
    () =>
      buildTrendSeries({
        filter: profitFilter,
        from: ranges.current.from,
        invoices: invoiceTrendPoints,
        expenses: expenseEntries,
      }),
    [expenseEntries, invoiceTrendPoints, profitFilter, ranges],
  );

  return (
    <div className="space-y-5 pb-2">
      <PageHeader title="Dashboard" subtitle="Executive overview of live selling performance and cash flow." />

      {error ? <EmptyState title="Metrics unavailable" body={error} /> : null}

      <Card variant="elevated" className="overflow-hidden rounded-[18px] border-primary/25">
        <div className="mb-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary/85">Profit Monitoring</p>
              <h2 className="mt-1 text-2xl font-semibold text-foreground">Net {loading ? "..." : formatCurrency(netProfit)}</h2>
            </div>
            <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-panel-2/70 px-2.5 py-1 text-xs font-semibold text-foreground">
              <ArrowUpRight size={12} className={growth >= 0 ? "text-success" : "text-danger"} />
              {loading ? "..." : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`}
              <span className="hidden text-muted sm:inline">vs previous period</span>
            </div>
          </div>
          <div className="w-full max-w-[420px]">
            <SegmentedControl
              value={profitFilter}
              onChange={(value) => setProfitFilter(value as ProfitFilter)}
              options={[
                { label: "Today", value: "today" },
                { label: "Weekly", value: "weekly" },
                { label: "Monthly", value: "monthly" },
                { label: "Yearly", value: "yearly" },
              ]}
            />
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <MiniMetric label="Revenue" value={loading ? "..." : formatCurrency(revenue)} />
          <MiniMetric label="Expenses" value={loading ? "..." : formatCurrency(expenses)} />
          <MiniMetric label="Profit Margin" value={loading ? "..." : `${margin.toFixed(1)}%`} />
          <MiniMetric label="Unpaid" value={loading ? "..." : formatCurrency(metrics.unpaidAmount)} />
        </div>

        <div ref={chartHostRef} className="surface-card rounded-[14px] p-2 sm:p-3">
          {loading || !canRenderChart ? (
            <Skeleton className="h-52 w-full rounded-[12px]" />
          ) : (
            <div className="h-52 min-h-[208px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendSeries} margin={{ top: 8, right: 8, left: -16, bottom: 2 }}>
                  <defs>
                    <linearGradient id="kpi-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.48} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.5} vertical={false} />
                  <XAxis dataKey="label" stroke="var(--muted)" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis
                    stroke="var(--muted)"
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    fontSize={11}
                    tickFormatter={(value) => formatAxisAmount(Number(value))}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "color-mix(in srgb, var(--surface) 92%, transparent)",
                      color: "var(--fg)",
                    }}
                    formatter={(value: number | string | undefined) => formatCurrency(Number(value || 0))}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={2.4}
                    fillOpacity={1}
                    fill="url(#kpi-area)"
                    activeDot={{ r: 3.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KPIStat
          title="Total Pcs"
          value={metrics.totalPcs}
          formatter={(value) => formatCount(Math.round(value))}
          loading={loading}
          description="Sold item quantity"
          icon={<Package size={15} />}
        />
        <KPIStat
          title="Total Invoice"
          value={metrics.totalInvoice}
          formatter={(value) => formatCurrency(value)}
          loading={loading}
          description="Invoiced sales value"
          icon={<BadgeDollarSign size={15} />}
        />
        <KPIStat
          title="Unpaid Amount"
          value={metrics.unpaidAmount}
          formatter={(value) => formatCurrency(value)}
          loading={loading}
          description="Pending collections due"
          icon={<HandCoins size={15} />}
        />
        <KPIStat
          title="Total Miners"
          value={metrics.totalMiners}
          formatter={(value) => formatCount(Math.round(value))}
          loading={loading}
          description="Unique active customers"
          icon={<UsersRound size={15} />}
        />
      </section>

      <Card className="rounded-[18px]">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Quick Access</h3>
            <p className="text-xs text-muted">Common modules for encoding and finance operations.</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
            <ChartNoAxesColumnIncreasing size={13} /> Shortcuts
          </span>
        </div>
        <motion.div variants={listContainer} initial="hidden" animate="show" className="grid grid-cols-4 gap-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <motion.div key={link.href} variants={listItem}>
                <Link
                  href={link.href}
                  className="focus-ring group flex h-20 flex-col items-center justify-center rounded-[12px] border border-border/80 bg-panel-2/65 px-1 text-center transition hover:-translate-y-0.5 hover:border-border-strong sm:h-24 sm:rounded-[14px]"
                >
                  <motion.span
                    {...tapFeedback}
                    className="mb-1.5 rounded-lg border border-border/70 bg-panel-3/45 p-1.5 text-primary sm:mb-2 sm:rounded-xl sm:p-2"
                  >
                    <Icon size={16} className="sm:h-[18px] sm:w-[18px]" />
                  </motion.span>
                  <span className="text-[11px] font-medium leading-tight text-foreground sm:text-xs">{link.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </Card>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-border/75 bg-panel-2/70 p-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function getRanges(filter: ProfitFilter) {
  const now = new Date();

  if (filter === "today") {
    const current = { from: startOfDay(now), to: endOfDay(now) };
    const prevDate = subDays(now, 1);
    const previous = { from: startOfDay(prevDate), to: endOfDay(prevDate) };
    return { current, previous };
  }

  if (filter === "weekly") {
    const current = {
      from: startOfWeek(subWeeks(now, 7), { weekStartsOn: 1 }),
      to: endOfWeek(now, { weekStartsOn: 1 }),
    };
    const prevEnd = subDays(current.from, 1);
    const previous = {
      from: startOfWeek(subWeeks(prevEnd, 7), { weekStartsOn: 1 }),
      to: endOfWeek(prevEnd, { weekStartsOn: 1 }),
    };
    return { current, previous };
  }

  if (filter === "monthly") {
    const current = { from: startOfMonth(now), to: endOfMonth(now) };
    const prevAnchor = subDays(current.from, 1);
    const previous = { from: startOfMonth(prevAnchor), to: endOfMonth(prevAnchor) };
    return { current, previous };
  }

  const current = { from: startOfYear(now), to: endOfYear(now) };
  const prevYear = subYears(now, 1);
  const previous = { from: startOfYear(prevYear), to: endOfYear(prevYear) };
  return { current, previous };
}

function buildTrendSeries({
  filter,
  from,
  invoices,
  expenses,
}: {
  filter: ProfitFilter;
  from: Date;
  invoices: InvoiceTrendPoint[];
  expenses: ExpenseEntry[];
}) {
  const invoicePoints = invoices.map((item) => ({
    at: new Date(item.created_at).getTime(),
    amount: Number(item.total_amount || 0),
  }));
  const expensePoints = expenses.map((item) => ({
    at: new Date(item.date).getTime(),
    amount: Number(item.amount || 0),
  }));

  const getAmountForRange = (rangeFrom: Date, rangeTo: Date) => {
    const fromTime = rangeFrom.getTime();
    const toTime = rangeTo.getTime();
    const income = invoicePoints.reduce((sum, point) => (point.at >= fromTime && point.at < toTime ? sum + point.amount : sum), 0);
    const spend = expensePoints.reduce((sum, point) => (point.at >= fromTime && point.at < toTime ? sum + point.amount : sum), 0);
    return income - spend;
  };

  if (filter === "today") {
    const dayStart = startOfDay(from);
    return Array.from({ length: 8 }).map((_, index) => {
      const bucketFrom = addHours(dayStart, index * 3);
      const bucketTo = addHours(dayStart, (index + 1) * 3);
      return {
        label: format(bucketFrom, "ha"),
        value: getAmountForRange(bucketFrom, bucketTo),
      };
    });
  }

  if (filter === "weekly") {
    const weekStart = startOfWeek(from, { weekStartsOn: 1 });
    return Array.from({ length: 8 }).map((_, index) => {
      const bucketFrom = addWeeks(weekStart, index);
      const bucketTo = addWeeks(weekStart, index + 1);
      return {
        label: `W${getISOWeek(bucketFrom)}`,
        value: getAmountForRange(bucketFrom, bucketTo),
      };
    });
  }

  if (filter === "yearly") {
    const yearStart = startOfYear(from);
    return Array.from({ length: 12 }).map((_, index) => {
      const bucketFrom = addMonths(yearStart, index);
      const bucketTo = addMonths(yearStart, index + 1);
      return {
        label: format(bucketFrom, "MMM"),
        value: getAmountForRange(bucketFrom, bucketTo),
      };
    });
  }

  const monthStart = startOfMonth(from);
  const nextMonthStart = addMonths(monthStart, 1);
  const totalDays = Math.max(1, Math.round((nextMonthStart.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)));
  return Array.from({ length: totalDays }).map((_, index) => {
    const bucketFrom = addDays(monthStart, index);
    const bucketTo = addDays(monthStart, index + 1);
    return {
      label: format(bucketFrom, "d"),
      value: getAmountForRange(bucketFrom, bucketTo),
    };
  });
}

function sumExpensesForRange(expenses: Array<{ date: string; amount: number }>, from: Date, to: Date) {
  const fromTime = from.getTime();
  const toTime = to.getTime();
  return expenses.reduce((sum, expense) => {
    const expenseTime = new Date(expense.date).getTime();
    if (expenseTime >= fromTime && expenseTime <= toTime) {
      return sum + Number(expense.amount || 0);
    }
    return sum;
  }, 0);
}

function formatAxisAmount(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `₱${(value / 1_000).toFixed(1)}k`;
  return `₱${Math.round(value)}`;
}
