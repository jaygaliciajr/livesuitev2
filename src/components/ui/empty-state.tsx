import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  body,
  ctaLabel,
  onClick,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
  onClick?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-panel p-5 text-center">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-sm text-muted">{body}</p>
      {ctaLabel && onClick ? (
        <Button className="mt-4" size="sm" onClick={onClick}>
          {ctaLabel}
        </Button>
      ) : null}
    </div>
  );
}
