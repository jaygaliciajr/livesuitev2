"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Home, Radio, ReceiptText } from "lucide-react";
import { tapFeedback } from "@/lib/motion";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/invoices", label: "Invoice", icon: ReceiptText },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 z-40 px-3 lg:hidden"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        paddingLeft: "max(env(safe-area-inset-left, 0px), 0.75rem)",
        paddingRight: "max(env(safe-area-inset-right, 0px), 0.75rem)",
      }}
    >
      <div className="surface-elevated mx-auto flex max-w-sm items-center justify-between rounded-[22px] p-2 backdrop-blur-xl">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <motion.div key={item.href} {...tapFeedback}>
              <Link
                href={item.href}
                className={cn(
                  "focus-ring flex h-14 min-w-[96px] flex-col items-center justify-center rounded-2xl text-xs font-semibold transition",
                  active
                    ? "premium-glow bg-gradient-to-r from-primary to-primary-strong text-white"
                    : "text-muted hover:bg-panel-2/75 hover:text-foreground",
                )}
              >
                <Icon size={18} />
                <span className="mt-0.5">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
}
