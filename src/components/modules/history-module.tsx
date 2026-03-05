"use client";

import { ComponentType, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Package, PhilippinePeso, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listLiveSessionsPaginated, listSessionOrderRows } from "@/lib/data";
import { formatCount, formatCurrency } from "@/lib/utils";

const PAGE_SIZE = 10;

type SessionCard = {
  id: string;
  supplier_id: string;
  started_at: string;
  ended_at: string | null;
  status: "active" | "ended";
  created_at: string;
  suppliers?: { name?: string | null };
  total_amount: number;
  total_pcs: number;
  total_customers: number;
  total_lines: number;
};

export function HistoryModule() {
  const [items, setItems] = useState<SessionCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsMap, setDetailsMap] = useState<Record<string, Array<any>>>({});
  const [loading, setLoading] = useState(true);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  useEffect(() => {
    void load(page);
  }, [page]);

  async function load(nextPage: number) {
    setLoading(true);
    const data = await listLiveSessionsPaginated(nextPage, PAGE_SIZE);
    setItems(data.items as SessionCard[]);
    setTotal(data.total);
    setLoading(false);
  }

  async function toggleDetails(sessionId: string) {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }
    setExpandedSessionId(sessionId);
    if (detailsMap[sessionId]) return;

    setDetailsLoading(true);
    try {
      const rows = await listSessionOrderRows(sessionId);
      setDetailsMap((prev) => ({ ...prev, [sessionId]: rows }));
    } finally {
      setDetailsLoading(false);
    }
  }

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  function parseVariant(note?: string | null) {
    if (!note || !note.startsWith("variant:")) {
      return { color: "", size: "", note: note || "" };
    }
    const [color = "", size = "", userNote = ""] = note.replace("variant:", "").split("|");
    return { color, size, note: userNote };
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">History</h1>
        <p className="text-sm text-muted">Track completed live sessions and review all encoded transactions.</p>
      </header>

      <div className="space-y-2.5">
        {items.map((item) => {
          const details = detailsMap[item.id] ?? [];
          const expanded = expandedSessionId === item.id;
          return (
            <Card key={item.id} className="space-y-2.5 p-3.5">
              <button className="w-full text-left" onClick={() => void toggleDetails(item.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.suppliers?.name || "Unknown supplier"}</p>
                    <p className="mt-0.5 text-xs text-muted">Started: {new Date(item.started_at).toLocaleString()}</p>
                    <p className="text-xs text-muted">Ended: {item.ended_at ? new Date(item.ended_at).toLocaleString() : "Not closed"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={item.status === "active" ? "success" : "default"}>{item.status.toUpperCase()}</Badge>
                    {expanded ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MetricTile label="Total Amount" value={formatCurrency(item.total_amount)} icon={PhilippinePeso} />
                  <MetricTile label="Total Pcs" value={formatCount(item.total_pcs)} icon={Package} />
                  <MetricTile label="Total Customer" value={formatCount(item.total_customers)} icon={UsersRound} />
                </div>
              </button>

              {expanded ? (
                <div className="space-y-2 rounded-2xl border border-border/65 bg-background/65 p-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Session Transactions</p>
                    <p className="text-xs text-muted">{formatCount(item.total_lines)} lines</p>
                  </div>
                  {detailsLoading && !detailsMap[item.id] ? <p className="text-xs text-muted">Loading session transactions...</p> : null}
                  <div className="space-y-2">
                    {details.map((row) => {
                      const variant = parseVariant(row.note);
                      return (
                        <div key={row.line_id} className="rounded-xl border border-border/70 bg-panel/65 p-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">{row.product_code}</p>
                            <p className="text-sm font-semibold text-foreground">{formatCurrency(row.line_total)}</p>
                          </div>
                          <p className="mt-0.5 text-xs text-muted">
                            {row.customer_name} • Qty {row.qty} • Unit {formatCurrency(row.price_snapshot)}
                          </p>
                          <p className="text-xs text-muted">
                            Variant: {variant.color || "No color"} / {variant.size || "Pre-size"}
                          </p>
                          {variant.note ? <p className="text-xs text-muted">Note: {variant.note}</p> : null}
                          <p className="text-[11px] text-muted">Encoded: {new Date(row.created_at).toLocaleString()}</p>
                        </div>
                      );
                    })}
                    {details.length === 0 && !detailsLoading ? (
                      <EmptyState title="No transactions found" body="This session has no encoded order lines yet." />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      {items.length === 0 && !loading ? <EmptyState title="No session history" body="Closed sessions will show up here." /> : null}

      {total > 0 ? (
        <Card className="flex items-center justify-between p-3">
          <p className="text-xs text-muted">
            Showing {start}-{end} of {total} sessions
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              Previous
            </Button>
            <span className="text-xs font-medium text-muted">
              Page {page} / {totalPages}
            </span>
            <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
              Next
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-panel/62 p-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted">{label}</p>
        <Icon size={13} className="text-muted" />
      </div>
      <p className="mt-1.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
