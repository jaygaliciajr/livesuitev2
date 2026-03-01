"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  Bell,
  CircleUserRound,
  Fingerprint,
  KeyRound,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
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
    const dark = theme === "dark";
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

        <nav className="space-y-2">
          <Link href="/settings" className="flex items-center gap-3 rounded-xl bg-white/15 px-3 py-2.5 text-sm font-medium text-white">
            <CircleUserRound size={18} /> My Profile
          </Link>

          <button
            className="flex w-full items-center justify-between rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium text-white/90"
            onClick={toggleBiometrics}
          >
            <span className="inline-flex items-center gap-3">
              <Fingerprint size={18} /> Enable Biometrics
            </span>
            <span className={`h-5 w-9 rounded-full p-0.5 transition ${biometricEnabled ? "bg-emerald-300" : "bg-white/30"}`}>
              <span className={`block h-4 w-4 rounded-full bg-white transition ${biometricEnabled ? "translate-x-4" : ""}`} />
            </span>
          </button>

          <button
            className="flex w-full items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium text-white/90"
            onClick={onChangePassword}
          >
            <KeyRound size={18} /> Change Password
          </button>

          <button
            className="flex w-full items-center justify-between rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium text-white/90"
            onClick={toggleDarkMode}
          >
            <span className="inline-flex items-center gap-3">
              {darkModeEnabled ? <Moon size={18} /> : <Sun size={18} />} Enable Dark Mode
            </span>
            <span className={`h-5 w-9 rounded-full p-0.5 transition ${darkModeEnabled ? "bg-emerald-300" : "bg-white/30"}`}>
              <span className={`block h-4 w-4 rounded-full bg-white transition ${darkModeEnabled ? "translate-x-4" : ""}`} />
            </span>
          </button>
        </nav>
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
