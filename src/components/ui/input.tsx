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
      {label ? <span>{label}</span> : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          "h-11 rounded-xl border border-border bg-panel px-3 text-sm text-foreground outline-none ring-primary/25 transition focus:ring-4",
          className,
        )}
        {...props}
      />
    </label>
  );
});
