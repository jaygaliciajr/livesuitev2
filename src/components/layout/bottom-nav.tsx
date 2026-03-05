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
      className="fixed inset-x-0 z-40 flex justify-center px-3 lg:hidden"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        paddingLeft: "max(env(safe-area-inset-left, 0px), 0.75rem)",
        paddingRight: "max(env(safe-area-inset-right, 0px), 0.75rem)",
      }}
    >
      <div className="surface-elevated inline-flex items-center justify-center gap-2 rounded-full p-2 backdrop-blur-xl">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <motion.div key={item.href} {...tapFeedback}>
              <Link
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "focus-ring flex h-12 w-12 items-center justify-center rounded-full transition",
                  active
                    ? "premium-glow bg-gradient-to-br from-primary to-primary-strong text-white"
                    : "text-muted hover:bg-panel-2/75 hover:text-foreground",
                )}
              >
                <Icon size={19} />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
}
