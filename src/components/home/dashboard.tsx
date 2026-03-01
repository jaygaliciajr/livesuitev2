"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeDollarSign,
  CalendarClock,
  ChartNoAxesColumnIncreasing,
  Clock3,
  FileText,
  HandCoins,
  Menu,
  Package,
  Rocket,
  Truck,
  UsersRound,
  Wallet,
  X,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [profile, setProfile] = useState({
    name: "Gary Sales",
    role: "OWNER" as UserRole,
    photo: "https://i.pravatar.cc/96?img=12",
  });

  const range = useMemo(() => getDateRange(dateFilter, customFrom, customTo), [dateFilter, customFrom, customTo]);

  useEffect(() => {
    const savedRole = window.localStorage.getItem("ls-user-role") as UserRole | null;
    const savedName = window.localStorage.getItem("ls-user-name");
    const savedPhoto = window.localStorage.getItem("ls-user-photo");

    setProfile({
      role: savedRole === "ADMIN" ? "ADMIN" : "OWNER",
      name: savedName?.trim() ? savedName : "Gary Sales",
      photo: savedPhoto?.trim() ? savedPhoto : "https://i.pravatar.cc/96?img=12",
    });
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

  function setRole(nextRole: UserRole) {
    setProfile((prev) => ({ ...prev, role: nextRole }));
    window.localStorage.setItem("ls-user-role", nextRole);
  }

  const initials = getInitials(profile.name);

  return (
    <>
      <div className="space-y-5 pb-2">
        <header className="space-y-3">
          <Card className="rounded-2xl border border-border bg-panel px-3.5 py-3 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted transition hover:text-foreground"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{profile.name}</p>
                <p className="text-xs font-medium tracking-wide text-muted">{profile.role}</p>
              </div>

              <div className="relative h-11 w-11 overflow-hidden rounded-full border border-border bg-background">
                {!imageError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photo}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : null}
                {imageError ? (
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground">
                    {initials}
                  </span>
                ) : null}
              </div>
            </div>
          </Card>

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
                  <span className="mb-2 rounded-xl border border-border bg-panel p-2 text-muted transition group-hover:text-primary">
                    <Icon size={19} />
                  </span>
                  <span className="text-[13px] font-semibold leading-tight text-foreground">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button
              className="fixed inset-0 z-50 bg-black/35"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu overlay"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="fixed left-0 top-0 z-[60] h-full w-[86%] max-w-xs border-r border-border bg-panel p-4 shadow-soft"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{profile.name}</p>
                  <p className="text-xs text-muted">{profile.role} Account</p>
                </div>
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <Link className="block rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground" href="/settings" onClick={() => setMenuOpen(false)}>
                  Settings
                </Link>
                <Link className="block rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground" href="/history" onClick={() => setMenuOpen(false)}>
                  Session History
                </Link>
                <Link className="block rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground" href="/subscription" onClick={() => setMenuOpen(false)}>
                  Subscription
                </Link>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-background p-3">
                <p className="text-xs font-medium text-muted">Role Switch</p>
                <div className="mt-2 inline-flex rounded-full border border-border bg-panel p-1 text-xs font-semibold tracking-wide">
                  <button
                    className={cn("rounded-full px-3 py-1.5 transition", profile.role === "OWNER" ? "bg-primary text-white" : "text-muted")}
                    onClick={() => setRole("OWNER")}
                  >
                    OWNER
                  </button>
                  <button
                    className={cn("rounded-full px-3 py-1.5 transition", profile.role === "ADMIN" ? "bg-primary text-white" : "text-muted")}
                    onClick={() => setRole("ADMIN")}
                  >
                    ADMIN
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
