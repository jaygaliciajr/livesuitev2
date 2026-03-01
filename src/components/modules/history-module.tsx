"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listLiveSessions } from "@/lib/data";

export function HistoryModule() {
  const [items, setItems] = useState<Array<any>>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const data = await listLiveSessions();
    setItems(data);
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">History</h1>
      </header>
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{item.suppliers?.name || "Unknown supplier"}</p>
              <Badge tone={item.status === "active" ? "success" : "default"}>{item.status.toUpperCase()}</Badge>
            </div>
            <p className="text-xs text-muted">Started: {new Date(item.started_at).toLocaleString()}</p>
            <p className="text-xs text-muted">Ended: {item.ended_at ? new Date(item.ended_at).toLocaleString() : "Not closed"}</p>
          </Card>
        ))}
      </div>
      {items.length === 0 ? <EmptyState title="No session history" body="Closed sessions will show up here." /> : null}
    </div>
  );
}
