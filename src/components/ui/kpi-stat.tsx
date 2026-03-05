"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";
import { Card } from "@/components/ui/card";

export function KPIStat({
  title,
  value,
  description,
  icon,
  formatter,
  loading,
}: {
  title: string;
  value: number;
  description: string;
  icon?: React.ReactNode;
  formatter?: (value: number) => string;
  loading?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [previousValue, setPreviousValue] = useState(0);

  useEffect(() => {
    if (loading) return;
    const controls = animate(previousValue, value, {
      duration: 0.55,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
      onComplete: () => {
        setPreviousValue(value);
      },
    });
    return () => controls.stop();
  }, [value, loading, previousValue]);

  return (
    <Card variant="default" className="rounded-[16px] p-4">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted">{title}</p>
        {icon ? <span className="rounded-xl border border-border/70 bg-panel-2/75 p-2 text-muted">{icon}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {loading ? "..." : formatter ? formatter(displayValue) : Math.round(displayValue).toLocaleString()}
      </p>
      <p className="mt-1.5 text-xs text-muted">{description}</p>
    </Card>
  );
}
