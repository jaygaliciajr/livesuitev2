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
      <div className="mx-auto flex max-w-sm items-center justify-between rounded-[24px] border border-border bg-panel/92 p-2 shadow-[0_18px_42px_rgba(14,35,79,0.18)] backdrop-blur-xl">
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
                  ? "bg-primary text-white shadow-[0_8px_20px_rgba(21,82,191,0.35)]"
                  : "text-muted hover:bg-background hover:text-foreground",
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
