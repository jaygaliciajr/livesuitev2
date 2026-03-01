"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Radio, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 px-3">
      <div className="mx-auto flex max-w-sm items-center justify-between rounded-[24px] border border-white/70 bg-white/78 p-2 shadow-[0_18px_42px_rgba(14,35,79,0.22)] backdrop-blur-xl">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-14 min-w-[96px] flex-col items-center justify-center rounded-2xl text-xs font-semibold transition",
                active ? "bg-primary text-white shadow-[0_8px_20px_rgba(12,74,165,0.35)]" : "text-slate-500 hover:bg-slate-100",
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
