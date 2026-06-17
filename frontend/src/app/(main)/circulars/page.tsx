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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label">Your documents</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-ink-900 dark:text-white">
            Circular Library
          </h1>
          <p className="mt-1.5 text-sm font-medium text-ink-500 dark:text-ink-400">
            All documents uploaded in this browser session or account.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="btn-secondary w-full gap-2 sm:w-auto"
          >
            <svg
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </button>
          <Link href="/#upload" className="btn-primary w-full text-center sm:w-auto">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Upload new
          </Link>
        </div>
      </div>

      {/* Guest banner */}
      {!authLoading && !user && (
        <div className="mt-6 overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-r from-brand-50 to-fuchsia-50/60 dark:border-brand-800/50 dark:from-brand-950/30 dark:to-fuchsia-950/20">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-fuchsia-500 shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-ink-800 dark:text-ink-200">
                Guest session active
              </p>
              <p className="mt-0.5 text-sm text-ink-600 dark:text-ink-400">
                <Link href="/sign-in" className="font-bold text-brand-600 underline decoration-dotted hover:decoration-solid dark:text-brand-400">
                  Sign in
                </Link>{" "}
                to sync circulars across devices. Guest uploads are tied to this browser session only.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50/60 px-4 py-3.5 text-sm dark:border-rose-800/60 dark:from-rose-950/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-200">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
          <button type="button" onClick={() => void load()} className="btn-secondary shrink-0 text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Main content */}
      {loading ? (
        <div className="mt-8 flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="loading-shimmer h-20 rounded-2xl border-2 border-brand-50 dark:border-ink-800"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-brand-200 bg-gradient-to-br from-brand-50/60 to-fuchsia-50/30 px-6 py-20 text-center dark:border-ink-700 dark:from-ink-900 dark:to-fuchsia-950/10">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-fuchsia-100 dark:from-brand-950/50 dark:to-fuchsia-950/30">
            <svg className="h-10 w-10 text-brand-400 dark:text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-ink-900 dark:text-white">No circulars yet</h2>
            <p className="mt-2 max-w-md text-sm font-medium text-ink-500 dark:text-ink-400">
              Upload your first MOE circular to extract text, review it, and generate a structured AI summary.
            </p>
          </div>
          <Link href="/#upload" className="btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Upload circular
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border-2 border-brand-100 bg-white shadow-panel dark:border-ink-800 dark:bg-ink-900">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-brand-50 bg-gradient-to-r from-brand-50/60 to-fuchsia-50/30 px-5 py-3 dark:border-ink-800 dark:from-ink-800/40 dark:to-fuchsia-950/10">
            <p className="text-xs font-black uppercase tracking-widest text-ink-500 dark:text-ink-400">Document</p>
            <p className="text-xs font-black uppercase tracking-widest text-ink-500 dark:text-ink-400">Status</p>
          </div>
          <ul className="divide-y divide-brand-50 dark:divide-ink-800">
            {items.map((item, i) => (
              <li key={item.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <Link
                  href={`/circular/${item.id}`}
                  className="group flex flex-col gap-3 px-5 py-4 transition-all duration-200 hover:bg-gradient-to-r hover:from-brand-50/40 hover:to-fuchsia-50/20 dark:hover:from-brand-950/20 dark:hover:to-fuchsia-950/10 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {/* File icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-fuchsia-100 transition-transform duration-200 group-hover:scale-105 dark:from-brand-950/50 dark:to-fuchsia-950/30">
                      <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-ink-900 transition-colors group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                        {item.originalFilename}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-ink-400 dark:text-ink-500">
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                        {item.entities.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-brand-500 dark:text-brand-400">{item.entities.length} entities</span>
                          </>
                        )}
                        {item.processingMeta.pageCount > 0 && (
                          <>
                            <span>·</span>
                            <span>{item.processingMeta.pageCount} pages</span>
                          </>
                        )}
                      </div>
                      {item.summary?.title && (
                        <p className="mt-1.5 line-clamp-1 text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                          ✨ {item.summary.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={item.status} className="w-fit shrink-0 self-start sm:self-center" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
