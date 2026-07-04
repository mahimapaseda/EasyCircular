"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatRelativeTime } from "@/components/workspace/workspaceUtils";
import { listCirculars, type Circular } from "@/lib/circulars";

type RecentHistoryProps = {
  currentId: string;
};

export default function RecentHistory({ currentId }: RecentHistoryProps) {
  const [items, setItems] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listCirculars()
      .then((data) => {
        if (!cancelled) {
          setItems(data.items.filter((c) => c.id !== currentId).slice(0, 5));
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  return (
    <div className="ws-card overflow-hidden">
      <div className="ws-card-header">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-bold text-white">Recent History</h3>
        </div>
        <Link href="/circulars" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">
          View all
        </Link>
      </div>

      <div className="divide-y divide-white/10">
        {loading && (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="loading-shimmer h-10 rounded-lg" />
            ))}
          </div>
        )}
        {!loading && items.length === 0 && (
          <p className="px-5 py-8 text-center text-xs text-slate-500">No other documents yet.</p>
        )}
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/circular/${item.id}`}
            className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-white/5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {item.originalFilename}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{formatRelativeTime(item.updatedAt)}</p>
            </div>
            <StatusBadge status={item.status} className="shrink-0 text-[10px]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
