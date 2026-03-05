import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  variant = "default",
  interactive = false,
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "elevated" | "ghost";
  interactive?: boolean;
}) {
  const variantClass =
    variant === "elevated"
      ? "surface-elevated"
      : variant === "ghost"
        ? "border border-border/75 bg-panel-2/60"
        : "surface-card";

  return (
    <section
      className={cn(
        "rounded-[16px] p-4",
        variantClass,
        interactive ? "cursor-pointer transition hover:-translate-y-0.5 hover:border-border-strong" : "",
        className,
      )}
    >
      {children}
    </section>
  );
}
