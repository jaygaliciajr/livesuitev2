"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Radio, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/invoices", label: "Invoice", icon: ReceiptText },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 px-3">
      <div className="glass-panel mx-auto flex max-w-sm items-center justify-between rounded-[26px] border border-border/70 bg-panel/76 p-2 shadow-soft backdrop-blur-xl">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-14 min-w-[96px] flex-col items-center justify-center rounded-2xl text-xs font-semibold transition",
                active
                  ? "premium-glow bg-gradient-to-r from-primary/92 to-accent/68 text-white"
                  : "text-muted hover:bg-panel/55 hover:text-foreground",
              )}
            >
              <Icon size={18} />
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
