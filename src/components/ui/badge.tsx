import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  default: "bg-primary/22 text-primary border border-primary/35",
  success: "bg-emerald-500/16 text-emerald-300 border border-emerald-400/35",
  warning: "bg-amber-500/16 text-amber-300 border border-amber-400/35",
  danger: "bg-rose-500/16 text-rose-300 border border-rose-400/35",
};

export function Badge({ tone = "default", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}
