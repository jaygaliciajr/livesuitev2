import { cn } from "@/lib/utils";

export function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      className={cn(
        "relative h-7 w-12 rounded-full transition",
        checked ? "bg-primary" : "bg-border",
      )}
      onClick={onToggle}
      aria-label="Toggle"
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-white transition",
          checked ? "left-6" : "left-1",
        )}
      />
    </button>
  );
}
