"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeDollarSign,
  CalendarClock,
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

type UserRole = "OWNER" | "ADMIN";

export function HomeDashboard() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customFrom, setCustomFrom] = useState(toDateInputValue(new Date()));
  const [customTo, setCustomTo] = useState(toDateInputValue(new Date()));
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("OWNER");

  const range = useMemo(() => getDateRange(dateFilter, customFrom, customTo), [dateFilter, customFrom, customTo]);

  useEffect(() => {
    const savedRole = window.localStorage.getItem("ls-user-role") as UserRole | null;
    if (savedRole === "OWNER" || savedRole === "ADMIN") {
      setRole(savedRole);
    }
  }, []);

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

  const greeting = useMemo(() => getGreeting(), []);

  const metricCards = [
    {
      label: "Total Pcs",
      value: formatCount(metrics.totalPcs),
      description: "Items added to carts",
      icon: Package,
      tone: "metric-tone-blue",
      valueTone: "text-sky-600",
      iconTone: "bg-sky-100 text-sky-600",
    },
    {
      label: "Total Invoice",
      value: formatCurrency(metrics.totalInvoice),
      description: "Generated from all carts",
      icon: FileText,
      tone: "metric-tone-green",
      valueTone: "text-emerald-600",
      iconTone: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Unpaid Amount",
      value: formatCurrency(metrics.unpaidAmount),
      description: "Waiting for payment",
      icon: HandCoins,
      tone: "metric-tone-pink",
      valueTone: "text-rose-600",
      iconTone: "bg-rose-100 text-rose-600",
    },
    {
      label: "Total Miners",
      value: formatCount(metrics.totalMiners),
      description: "Customer interactions",
      icon: UsersRound,
      tone: "metric-tone-purple",
      valueTone: "text-fuchsia-600",
      iconTone: "bg-fuchsia-100 text-fuchsia-600",
    },
  ] as const;

  function onSetRole(nextRole: UserRole) {
    setRole(nextRole);
    window.localStorage.setItem("ls-user-role", nextRole);
  }

  return (
    <div className="space-y-4 pb-2">
      <header className="space-y-3">
        <Card className="rounded-[28px] border-0 bg-white/90 px-4 py-3 shadow-[0_16px_32px_rgba(44,64,106,0.13)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-semibold">
                <button
                  className={cn("rounded-full px-3 py-1", role === "OWNER" ? "bg-slate-900 text-white" : "text-slate-500")}
                  onClick={() => onSetRole("OWNER")}
                >
                  OWNER
                </button>
                <button
                  className={cn("rounded-full px-3 py-1", role === "ADMIN" ? "bg-slate-900 text-white" : "text-slate-500")}
                  onClick={() => onSetRole("ADMIN")}
                >
                  ADMIN
                </button>
              </div>
              <p className="mt-2 text-[27px] font-semibold leading-none text-slate-800">{greeting}</p>
              <p className="mt-1 text-sm text-slate-500">Let&apos;s make this live session smooth and fast.</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 via-cyan-100 to-blue-300 text-lg font-bold text-slate-700 shadow-inner">
              {role === "OWNER" ? "O" : "A"}
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-800">Sales Overview</h2>
          <Card className="min-w-40 rounded-full border-0 bg-white/80 px-3 py-2 shadow-none">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <CalendarClock size={16} />
              <span>
                {dateFilter === "today" ? "Today" : dateFilter === "week" ? "This Week" : "Custom"}
              </span>
            </div>
          </Card>
        </div>

        <Card className="space-y-3 rounded-2xl border-0 bg-white/75 shadow-none">
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
          <MetricCard key={metric.label} {...metric} delay={index * 0.06} loading={loading} />
        ))}
      </section>

      <Card className="rounded-[28px] border-0 bg-white/90 p-3.5 shadow-[0_16px_32px_rgba(44,64,106,0.11)]">
        <div className="mb-2.5 px-1">
          <h2 className="text-base font-semibold text-slate-800">Quick Access</h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex h-[92px] flex-col items-center justify-center rounded-2xl bg-slate-50 text-center transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                <span className="mb-2 rounded-xl bg-white p-2 text-slate-700 shadow-sm transition group-hover:text-primary">
                  <Icon size={19} />
                </span>
                <span className="text-[13px] font-semibold leading-tight text-slate-700">{link.label}</span>
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
  tone,
  valueTone,
  iconTone,
  loading,
  delay,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  tone: string;
  valueTone: string;
  iconTone: string;
  loading: boolean;
  delay: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        "relative overflow-hidden rounded-3xl border-0 bg-white px-4 py-4 shadow-[0_16px_30px_rgba(31,48,85,0.12)]",
        "metric-tone-base",
        tone,
      )}
    >
      <div className="relative z-10 flex items-start justify-between">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <span className={cn("rounded-xl p-2", iconTone)}>
          <Icon size={17} />
        </span>
      </div>
      <motion.p
        key={value}
        initial={{ opacity: 0.25, y: 7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn("relative z-10 mt-4 text-[2rem] font-bold leading-none", valueTone)}
      >
        {loading ? "..." : value}
      </motion.p>
      <p className="relative z-10 mt-5 text-sm text-slate-500">{description}</p>
    </motion.article>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}
