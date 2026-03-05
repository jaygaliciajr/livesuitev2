"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { CircleUserRound, Fingerprint, KeyRound, Loader2, Menu, Moon, Sun, Wallet, X } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useTheme } from "@/components/settings/theme-provider";
import { drawerMotion, pageTransition, tapFeedback } from "@/lib/motion";
import { cn } from "@/lib/utils";

const pageTitleMap: Array<{ match: (path: string) => boolean; title: string; subtitle: string }> = [
  { match: (path) => path.startsWith("/live"), title: "Live Encoding", subtitle: "Fast customer and order capture" },
  { match: (path) => path.startsWith("/invoices"), title: "Invoices", subtitle: "Billing, status, and collection flow" },
  { match: (path) => path.startsWith("/suppliers"), title: "Suppliers", subtitle: "Supplier records and logos" },
  { match: (path) => path.startsWith("/inventory"), title: "Inventory", subtitle: "Product and stock management" },
  { match: (path) => path.startsWith("/customers"), title: "Customers", subtitle: "Customer master records" },
  { match: (path) => path.startsWith("/payments"), title: "Payments", subtitle: "Collection logs and updates" },
  { match: (path) => path.startsWith("/my-banks"), title: "Payment Modes", subtitle: "Receiving account configuration" },
  { match: (path) => path.startsWith("/subscription"), title: "Subscription", subtitle: "Plan and access summary" },
  { match: (path) => path.startsWith("/history"), title: "History", subtitle: "Completed live session archive" },
  { match: (path) => path.startsWith("/expenses"), title: "Expenses Tracker", subtitle: "Operational spend monitoring" },
  { match: (path) => path.startsWith("/settings"), title: "Settings", subtitle: "Workspace defaults and controls" },
  { match: () => true, title: "Dashboard", subtitle: "Business performance at a glance" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: "Gary Sales",
    role: "OWNER",
    photo: "https://i.pravatar.cc/96?img=12",
  });
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef(0);
  const pullingRef = useRef(false);

  const PULL_MAX = 94;
  const PULL_THRESHOLD = 68;

  useEffect(() => {
    const role = window.localStorage.getItem("ls-user-role") || "OWNER";
    const name = window.localStorage.getItem("ls-user-name") || "Gary Sales";
    const photo = window.localStorage.getItem("ls-user-photo") || "https://i.pravatar.cc/96?img=12";
    setProfile({ role, name, photo });
    setBiometricEnabled(window.localStorage.getItem("ls-enable-biometrics") === "true");
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function supportsTouchPull() {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches;
  }

  function pageAtTop() {
    if (typeof window === "undefined") return false;
    return window.scrollY <= 0;
  }

  function isScrollableContainer(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    let node: HTMLElement | null = target;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      const canScroll = /(auto|scroll)/.test(style.overflowY);
      if (canScroll && node.scrollHeight > node.clientHeight && node.scrollTop > 0) return true;
      node = node.parentElement;
    }
    return false;
  }

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (!supportsTouchPull() || isRefreshing) return;
    if (!pageAtTop()) return;
    if (isScrollableContainer(event.target)) return;
    touchStartYRef.current = event.touches[0]?.clientY ?? 0;
    pullingRef.current = true;
  }

  function onTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (!pullingRef.current || isRefreshing) return;
    const currentY = event.touches[0]?.clientY ?? 0;
    const delta = currentY - touchStartYRef.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    if (!pageAtTop()) {
      setPullDistance(0);
      return;
    }
    event.preventDefault();
    const damped = Math.min(PULL_MAX, delta * 0.46);
    setPullDistance(damped);
  }

  function onTouchEnd() {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      window.setTimeout(() => {
        window.location.reload();
      }, 260);
      return;
    }
    setPullDistance(0);
  }

  const pageMeta = useMemo(
    () => pageTitleMap.find((item) => item.match(pathname)) || pageTitleMap[pageTitleMap.length - 1],
    [pathname],
  );

  function toggleBiometrics() {
    setBiometricEnabled((prev) => {
      const next = !prev;
      window.localStorage.setItem("ls-enable-biometrics", String(next));
      return next;
    });
  }

  function onChangePassword() {
    window.alert("Password change flow will be connected to your auth provider.");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="surface-card sticky top-0 hidden h-screen border-r border-border/80 p-4 lg:flex lg:flex-col">
          <SidebarContent
            profile={profile}
            biometricEnabled={biometricEnabled}
            onToggleBiometrics={toggleBiometrics}
            onToggleTheme={toggleTheme}
            onChangePassword={onChangePassword}
            darkModeEnabled={theme === "dark"}
          />
        </aside>

        <AnimatePresence>
          {menuOpen ? (
            <>
              <motion.button
                className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden"
                onClick={() => setMenuOpen(false)}
                aria-label="Close side menu"
                initial={drawerMotion.overlay.initial}
                animate={drawerMotion.overlay.animate}
                exit={drawerMotion.overlay.exit}
                transition={drawerMotion.overlay.transition}
              />
              <motion.aside
                className="surface-elevated fixed left-0 top-0 z-50 h-full w-[84%] max-w-[292px] border-r border-border/80 p-4 lg:hidden"
                style={{
                  paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
                  paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
                }}
                initial={drawerMotion.panel.initial}
                animate={drawerMotion.panel.animate}
                exit={drawerMotion.panel.exit}
                transition={drawerMotion.panel.transition}
              >
                <div className="mb-4 flex justify-end">
                  <button
                    className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/75 bg-panel-2/70 text-muted"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <X size={18} />
                  </button>
                </div>
                <SidebarContent
                  profile={profile}
                  biometricEnabled={biometricEnabled}
                  onToggleBiometrics={toggleBiometrics}
                  onToggleTheme={toggleTheme}
                  onChangePassword={onChangePassword}
                  darkModeEnabled={theme === "dark"}
                />
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        <div className="min-w-0">
          <AnimatePresence>
            {pullDistance > 0 || isRefreshing ? (
              <motion.div
                className="pointer-events-none fixed left-1/2 z-40 -translate-x-1/2 rounded-full border border-border/80 bg-panel-2/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-card"
                style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 size={13} className={cn(isRefreshing || pullDistance >= PULL_THRESHOLD ? "animate-spin" : "")} />
                  {isRefreshing ? "Refreshing..." : pullDistance >= PULL_THRESHOLD ? "Release to refresh" : "Pull to refresh"}
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <header
            className="sticky top-0 z-30 border-b border-border/80 bg-background/92 px-3 py-3 backdrop-blur-md sm:px-4 lg:px-6"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
          >
            <div className="mx-auto flex max-w-6xl items-center justify-between">
              <div className="flex items-center gap-2.5">
                <motion.button
                  {...tapFeedback}
                  className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-border/80 bg-panel-2/70 text-foreground lg:hidden"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Toggle side menu"
                >
                  <Menu size={18} />
                </motion.button>
                <div>
                  <p className="text-base font-semibold text-foreground">{pageMeta.title}</p>
                  <p className="text-xs text-muted">{pageMeta.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  {...tapFeedback}
                  className="focus-ring inline-flex h-11 items-center gap-1 rounded-[14px] border border-border/80 bg-panel-2/75 px-3 text-xs font-medium text-muted"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
                  {theme === "dark" ? "Dark" : "Light"}
                </motion.button>
                <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-panel-2/75 px-2.5 py-1 text-xs font-medium text-foreground-soft">
                  <CircleUserRound size={13} /> {profile.role}
                </span>
              </div>
            </div>
          </header>

          <motion.main
            initial={false}
            animate={pageTransition.animate}
            transition={pageTransition.transition}
            className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-3 pb-28 pt-4 sm:px-4 lg:px-6"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 7rem)",
              transform: `translateY(${pullDistance}px)`,
              transition: isRefreshing || pullDistance === 0 ? "transform 180ms ease" : "none",
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
          >
            {children}
          </motion.main>

          <BottomNav />
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  profile,
  biometricEnabled,
  darkModeEnabled,
  onToggleBiometrics,
  onToggleTheme,
  onChangePassword,
}: {
  profile: { name: string; role: string; photo: string };
  biometricEnabled: boolean;
  darkModeEnabled: boolean;
  onToggleBiometrics: () => void;
  onToggleTheme: () => void;
  onChangePassword: () => void;
}) {
  return (
    <>
      <div className="surface-card mb-6 flex items-center gap-3 rounded-[14px] p-2.5">
        <div className="h-11 w-11 overflow-hidden rounded-full border border-border bg-panel-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{profile.name}</p>
          <p className="text-xs text-muted">{profile.role}</p>
        </div>
      </div>

      <nav className="space-y-2">
        <SidebarItem href="/settings" label="My Profile" icon={CircleUserRound} />
        <SidebarItem href="/expenses" label="Expenses Tracker" icon={Wallet} />
        <SidebarToggleItem
          label="Enable Biometrics"
          icon={Fingerprint}
          enabled={biometricEnabled}
          onToggle={onToggleBiometrics}
        />
        <button
          className="focus-ring flex h-11 w-full items-center gap-3 rounded-[14px] border border-border/80 bg-panel-2/70 px-3 text-sm font-medium text-foreground"
          onClick={onChangePassword}
        >
          <KeyRound size={17} /> Change Password
        </button>
        <SidebarToggleItem label="Enable Dark Mode" icon={Moon} enabled={darkModeEnabled} onToggle={onToggleTheme} />
      </nav>
    </>
  );
}

function SidebarItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring flex h-11 items-center gap-3 rounded-[14px] border border-border/80 bg-panel-2/70 px-3 text-sm font-medium text-foreground",
        "hover:border-border-strong",
      )}
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}

function SidebarToggleItem({
  label,
  icon: Icon,
  enabled,
  onToggle,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="focus-ring flex h-11 w-full items-center justify-between rounded-[14px] border border-border/80 bg-panel-2/70 px-3 text-sm font-medium text-foreground"
      onClick={onToggle}
    >
      <span className="inline-flex items-center gap-3">
        <Icon size={17} /> {label}
      </span>
      <span className={cn("h-5 w-9 rounded-full p-0.5 transition", enabled ? "bg-success" : "bg-border-strong")}>
        <span className={cn("block h-4 w-4 rounded-full bg-white transition", enabled ? "translate-x-4" : "")} />
      </span>
    </button>
  );
}
