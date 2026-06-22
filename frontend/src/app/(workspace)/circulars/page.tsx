"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { formatRelativeTime } from "@/components/workspace/workspaceUtils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { listCirculars, type Circular } from "@/lib/circulars";

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCirculars();
      setItems(data.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load documents";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, user?.id, load]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Documents</h1>
          <p className="mt-1 text-sm text-ink-500">MOE circulars uploaded to your account or session.</p>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <button type="button" onClick={() => void load()} disabled={loading} className="btn-secondary text-sm">
            Refresh
          </button>
          <Link href="/#upload" className="btn-primary text-sm">
            New analysis
          </Link>
        </div>
      </div>

      {!authLoading && !user && (
        <p className="mt-4 rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-ink-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-400">
          <Link href="/sign-in" className="font-semibold text-brand-600 dark:text-brand-400">
            Sign in
          </Link>{" "}
          to sync documents across devices.
        </p>
      )}

      {error && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm dark:border-rose-800 dark:bg-rose-950/30">
          <span className="text-rose-800 dark:text-rose-200">{error}</span>
          <button type="button" onClick={() => void load()} className="btn-secondary text-xs">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="loading-shimmer h-16 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-xl border border-dashed border-ink-200 py-16 text-center dark:border-ink-700">
          <p className="font-semibold text-ink-800 dark:text-ink-200">No documents yet</p>
          <p className="mt-1 text-sm text-ink-500">Upload a circular PDF to get started.</p>
          <Link href="/#upload" className="btn-primary mt-5 text-sm">
            Upload PDF
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200 bg-white dark:divide-ink-800 dark:border-ink-800 dark:bg-ink-900">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/circular/${item.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-ink-800/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900 dark:text-white">
                    {item.originalFilename}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {formatRelativeTime(item.updatedAt)}
                    {item.summary?.title && ` · ${item.summary.title}`}
                  </p>
                </div>
                <StatusBadge status={item.status} className="shrink-0 text-[10px]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
