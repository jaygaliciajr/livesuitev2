import { Inbox } from "lucide-react";
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
    <div className="surface-card rounded-[16px] border-dashed p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-panel-2/65 text-muted">
        <Inbox size={20} />
      </div>
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
