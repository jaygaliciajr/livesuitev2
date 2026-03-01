import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-border/90 bg-panel/98 p-4 shadow-card backdrop-blur-[1px]", className)}>
      {children}
    </section>
  );
}
