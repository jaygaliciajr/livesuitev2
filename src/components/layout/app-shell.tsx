"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  Bell,
  CircleUserRound,
  FileText,
  History,
  Home,
  LogOut,
  Menu,
  Package,
  Radio,
  Settings,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/suppliers", label: "Suppliers", icon: Shield },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/my-banks", label: "My Banks", icon: Wallet },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

const pageTitleMap: Array<{ match: (path: string) => boolean; title: string }> = [
  { match: (path) => path.startsWith("/live"), title: "Live Encoding" },
  { match: (path) => path.startsWith("/invoices"), title: "Invoices" },
  { match: (path) => path.startsWith("/suppliers"), title: "Suppliers" },
  { match: (path) => path.startsWith("/inventory"), title: "Inventory" },
  { match: (path) => path.startsWith("/customers"), title: "Customers" },
  { match: (path) => path.startsWith("/payments"), title: "Payments" },
  { match: (path) => path.startsWith("/my-banks"), title: "My Banks" },
  { match: (path) => path.startsWith("/subscription"), title: "Subscription" },
  { match: (path) => path.startsWith("/history"), title: "History" },
  { match: (path) => path.startsWith("/settings"), title: "Settings" },
  { match: () => true, title: "Dashboard" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: "Gary Sales",
    role: "OWNER",
    photo: "https://i.pravatar.cc/96?img=12",
  });

  useEffect(() => {
    const role = window.localStorage.getItem("ls-user-role") || "OWNER";
    const name = window.localStorage.getItem("ls-user-name") || "Gary Sales";
    const photo = window.localStorage.getItem("ls-user-photo") || "https://i.pravatar.cc/96?img=12";
    setProfile({ role, name, photo });
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const title = useMemo(() => pageTitleMap.find((item) => item.match(pathname))?.title || "Dashboard", [pathname]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#6d86bb]/30 via-[#5f759f]/20 to-transparent" />

      <motion.aside
        initial={false}
        animate={{ x: menuOpen ? 0 : -320, opacity: menuOpen ? 1 : 0.8 }}
        transition={{ type: "spring", stiffness: 280, damping: 32 }}
        className="fixed left-0 top-0 z-30 h-full w-[82%] max-w-[290px] rounded-r-[34px] border-r border-white/20 bg-gradient-to-b from-[#6f83ac] via-[#5c7098] to-[#4e638d] p-4 text-white shadow-[0_20px_45px_rgba(20,34,60,0.45)]"
      >
        <div className="mb-8 flex items-center gap-3 rounded-2xl bg-white/10 p-2.5">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-white/35 bg-white/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{profile.name}</p>
            <p className="text-xs text-white/75">{profile.role}</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-white/18 text-white" : "text-white/78 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-xl bg-white/12 px-3 py-2 text-sm font-medium text-white/90">
          <LogOut size={16} /> Sign Out
        </button>
      </motion.aside>

      {menuOpen ? <button className="fixed inset-0 z-20 bg-black/30" onClick={() => setMenuOpen(false)} aria-label="Close side menu" /> : null}

      <motion.div
        initial={false}
        animate={
          menuOpen
            ? {
                x: 252,
                scale: 0.9,
                rotateY: -2,
                borderRadius: 28,
              }
            : { x: 0, scale: 1, rotateY: 0, borderRadius: 0 }
        }
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        style={{ transformOrigin: "left center" }}
        className="relative z-40 min-h-screen bg-background"
      >
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 px-3 py-2 backdrop-blur sm:px-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-panel text-foreground"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Toggle side menu"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted">LiveSuite</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-panel text-muted">
                <Bell size={16} />
              </button>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-2.5 py-1 text-xs font-medium text-muted">
                <CircleUserRound size={13} /> {profile.role}
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto min-h-[calc(100vh-56px)] max-w-3xl px-3 pb-28 pt-3 sm:px-4">
          {children}
        </div>
        <BottomNav />
      </motion.div>
    </div>
  );
}
