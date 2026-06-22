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
          <svg className="h-4 w-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-bold text-ink-900 dark:text-white">Recent History</h3>
        </div>
        <Link href="/circulars" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
          View all
        </Link>
      </div>

      <div className="divide-y divide-ink-100 dark:divide-ink-800">
        {loading && (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="loading-shimmer h-10 rounded-lg" />
            ))}
          </div>
        )}
        {!loading && items.length === 0 && (
          <p className="px-5 py-8 text-center text-xs text-ink-400">No other documents yet.</p>
        )}
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/circular/${item.id}`}
            className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-ink-800/40"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-200">
                {item.originalFilename}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">{formatRelativeTime(item.updatedAt)}</p>
            </div>
            <StatusBadge
              status={item.status}
              className={`shrink-0 text-[10px] ${
                item.status === "completed"
                  ? "!bg-emerald-100 !text-emerald-700 dark:!bg-emerald-950/50 dark:!text-emerald-400"
                  : ""
              }`}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
