import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, id, helperText, error, ...props },
  ref,
) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm text-muted" htmlFor={id}>
      {label ? <span className="text-xs font-medium tracking-wide text-foreground-soft">{label}</span> : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          "focus-ring h-11 rounded-[14px] border border-border/80 bg-panel-2/75 px-3 text-sm text-foreground outline-none placeholder:text-muted/85",
          error ? "border-danger/70" : "hover:border-border-strong",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : helperText ? <span className="text-xs text-muted">{helperText}</span> : null}
    </label>
  );
});
