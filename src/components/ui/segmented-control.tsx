import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="grid gap-1 rounded-[14px] border border-border/80 bg-panel-2/80 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          className={cn(
            "focus-ring min-h-10 rounded-[10px] px-3 py-2 text-xs font-semibold transition",
            value === option.value ? "surface-card text-primary" : "text-muted hover:bg-panel/70",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
