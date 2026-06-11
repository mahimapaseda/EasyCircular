"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { listCirculars, type Circular } from "@/lib/circulars";

export default function CircularsPage() {
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
      const message = err instanceof Error ? err.message : "Could not load circulars";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!authLoading) {
      void load();
    }
  }, [authLoading, user?.id, load]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">
            Circular library
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            All documents uploaded in this browser session or account.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="btn-secondary w-full sm:w-auto"
          >
            Refresh
          </button>
          <Link href="/#upload" className="btn-primary w-full text-center sm:w-auto">
            Upload new
          </Link>
        </div>
      </div>

      {!authLoading && !user && (
        <div className="panel mt-6 border-brand-200 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-950/20">
          <p className="text-sm text-ink-700 dark:text-ink-300">
            <Link href="/sign-in" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
              Sign in
            </Link>{" "}
            to sync circulars across devices. Guest uploads stay tied to this browser session.
          </p>
        </div>
      )}

      {error && (
        <div className="panel mt-6 flex flex-col gap-3 border-rose-200 bg-rose-50 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          <button type="button" onClick={() => void load()} className="btn-secondary shrink-0">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="panel mt-8 p-8 text-center text-sm text-ink-500 dark:text-ink-400">
          Loading library…
        </div>
      ) : items.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-ink-900 dark:text-white">
            No circulars yet
          </h2>
          <p className="mt-2 max-w-md text-sm text-ink-500 dark:text-ink-400">
            Upload your first MOE circular to extract text, review it, and generate a summary.
          </p>
          <Link href="/#upload" className="btn-primary mt-6">
            Upload circular
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
          <ul className="divide-y divide-ink-200 dark:divide-ink-800">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/circular/${item.id}`}
                  className="flex flex-col gap-3 px-4 py-4 transition hover:bg-ink-50 dark:hover:bg-ink-950/40 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink-900 dark:text-white">
                      {item.originalFilename}
                    </p>
                    <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                      {new Date(item.createdAt).toLocaleString()}
                      {item.entities.length > 0 && ` · ${item.entities.length} entities`}
                    </p>
                    {item.summary?.title && (
                      <p className="mt-2 line-clamp-2 text-sm text-ink-600 dark:text-ink-400">
                        {item.summary.title}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={item.status} className="w-fit shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
