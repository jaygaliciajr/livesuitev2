import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, id, ...props },
  ref,
) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm text-muted" htmlFor={id}>
      {label ? <span className="text-xs font-medium tracking-wide">{label}</span> : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          "glass-panel h-11 rounded-2xl border border-border/80 bg-panel/65 px-3 text-sm text-foreground outline-none ring-primary/20 transition focus:ring-4",
          className,
        )}
        {...props}
      />
    </label>
  );
});
