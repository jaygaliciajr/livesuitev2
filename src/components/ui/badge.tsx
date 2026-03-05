import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  default: "border border-primary/35 bg-primary/12 text-primary",
  success: "border border-success/35 bg-success/14 text-success",
  warning: "border border-warning/35 bg-warning/14 text-warning",
  danger: "border border-danger/35 bg-danger/14 text-danger",
};

export function Badge({ tone = "default", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}
