"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { CircleUserRound, Fingerprint, KeyRound, Menu, Moon, Sun, Wallet } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";

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
  { match: (path) => path.startsWith("/expenses"), title: "Expenses Tracker" },
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
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    const role = window.localStorage.getItem("ls-user-role") || "OWNER";
    const name = window.localStorage.getItem("ls-user-name") || "Gary Sales";
    const photo = window.localStorage.getItem("ls-user-photo") || "https://i.pravatar.cc/96?img=12";
    setProfile({ role, name, photo });

    const biometrics = window.localStorage.getItem("ls-enable-biometrics") === "true";
    setBiometricEnabled(biometrics);

    const theme = window.localStorage.getItem("ls-theme");
    const dark = theme !== "light";
    setDarkModeEnabled(dark);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const title = useMemo(() => pageTitleMap.find((item) => item.match(pathname))?.title || "Dashboard", [pathname]);

  function toggleBiometrics() {
    const next = !biometricEnabled;
    setBiometricEnabled(next);
    window.localStorage.setItem("ls-enable-biometrics", String(next));
  }

  function toggleDarkMode() {
    const next = !darkModeEnabled;
    setDarkModeEnabled(next);
    const theme = next ? "dark" : "light";
    window.localStorage.setItem("ls-theme", theme);
    document.documentElement.dataset.theme = theme;
  }

  function onChangePassword() {
    window.alert("Password change flow will be connected to authentication provider.");
  }

  return (
    <div className="relative min-h-screen bg-background">
      <motion.aside
        initial={false}
        animate={{ x: menuOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed left-0 top-0 z-40 h-full w-[80%] max-w-[280px] border-r border-border bg-panel p-4 shadow-soft"
      >
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-border bg-background p-2.5">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-panel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{profile.name}</p>
            <p className="text-xs text-muted">{profile.role}</p>
          </div>
        </div>

        <nav className="space-y-2">
          <Link href="/settings" className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground">
            <CircleUserRound size={18} /> My Profile
          </Link>

          <Link href="/expenses" className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground">
            <Wallet size={18} /> Expenses Tracker
          </Link>

          <button
            className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground"
            onClick={toggleBiometrics}
          >
            <span className="inline-flex items-center gap-3">
              <Fingerprint size={18} /> Enable Biometrics
            </span>
            <span className={`h-5 w-9 rounded-full p-0.5 transition ${biometricEnabled ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-700"}`}>
              <span className={`block h-4 w-4 rounded-full bg-white transition ${biometricEnabled ? "translate-x-4" : ""}`} />
            </span>
          </button>

          <button
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground"
            onClick={onChangePassword}
          >
            <KeyRound size={18} /> Change Password
          </button>

          <button
            className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground"
            onClick={toggleDarkMode}
          >
            <span className="inline-flex items-center gap-3">
              {darkModeEnabled ? <Moon size={18} /> : <Sun size={18} />} Enable Dark Mode
            </span>
            <span className={`h-5 w-9 rounded-full p-0.5 transition ${darkModeEnabled ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-700"}`}>
              <span className={`block h-4 w-4 rounded-full bg-white transition ${darkModeEnabled ? "translate-x-4" : ""}`} />
            </span>
          </button>
        </nav>
      </motion.aside>

      {menuOpen ? <button className="fixed inset-0 z-30 bg-black/30" onClick={() => setMenuOpen(false)} aria-label="Close side menu" /> : null}

      <div className="relative z-20 min-h-screen bg-background">
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
              <button
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-panel px-2.5 text-xs font-medium text-muted"
                onClick={toggleDarkMode}
              >
                {darkModeEnabled ? <Moon size={14} /> : <Sun size={14} />}
                {darkModeEnabled ? "Dark" : "Light"}
              </button>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-2.5 py-1 text-xs font-medium text-muted">
                <CircleUserRound size={13} /> {profile.role}
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto min-h-[calc(100vh-56px)] max-w-3xl px-3 pb-28 pt-3 sm:px-4">{children}</div>
        <BottomNav />
      </div>
    </div>
  );
}
