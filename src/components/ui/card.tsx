import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        "glass-panel rounded-3xl border border-border/70 bg-panel/85 p-4 shadow-card backdrop-blur-md",
        className,
      )}
    >
      {children}
    </section>
  );
}
