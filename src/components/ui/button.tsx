import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "border border-primary/55 bg-gradient-to-r from-primary to-primary-strong text-white shadow-card hover:brightness-105 active:brightness-95",
  secondary: "surface-card border-border/85 text-foreground hover:border-border-strong hover:bg-panel-2/85",
  danger: "border border-danger/60 bg-danger text-white shadow-card hover:brightness-105 active:brightness-95",
  success: "border border-success/60 bg-success text-white shadow-card hover:brightness-105 active:brightness-95",
  ghost: "bg-transparent text-foreground hover:bg-panel-2/70",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 min-w-10 px-3 text-sm",
  md: "h-11 min-w-11 px-4 text-sm",
  lg: "h-12 min-w-12 px-5 text-base font-semibold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-[14px] font-medium whitespace-nowrap transition-all active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
});
