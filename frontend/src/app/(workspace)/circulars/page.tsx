"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import DocumentCard from "@/components/workspace/DocumentCard";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { listCirculars, type Circular } from "@/lib/circulars";

type FilterKey = "all" | "completed" | "active";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Summarized" },
  { key: "active", label: "In progress" },
];

function matchesFilter(item: Circular, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "completed") return item.status === "completed";
  return item.status !== "completed";
}

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

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

  const stats = useMemo(() => {
    const completed = items.filter((i) => i.status === "completed").length;
    return {
      total: items.length,
      completed,
      active: items.length - completed,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (!matchesFilter(item, filter)) return false;
      if (!q) return true;
      const haystack = [
        item.originalFilename,
        item.summary?.title,
        item.summary?.sections.map((s) => s.content).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, filter, query]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-ink-200/80 bg-white/95 px-4 py-4 backdrop-blur-md sm:px-6 dark:border-ink-800 dark:bg-ink-900/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-ink-900 dark:text-white">Documents</h1>
            <p className="text-sm text-ink-500">Your MOE circular analyses</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              aria-label="Refresh documents"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition hover:bg-slate-50 dark:border-ink-700 dark:hover:bg-ink-800"
            >
              <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {!authLoading && !user && (
          <p className="mb-5 rounded-lg border border-brand-200 bg-brand-50/50 px-4 py-3 text-sm text-ink-700 dark:border-brand-800 dark:bg-brand-950/20 dark:text-ink-300">
            <Link href="/sign-in" className="font-semibold text-brand-600 dark:text-brand-400">
              Sign in
            </Link>{" "}
            to sync documents across devices.
          </p>
        )}

        {/* Stats */}
        <dl className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: stats.total },
            { label: "Summarized", value: stats.completed },
            { label: "In progress", value: stats.active },
          ].map(({ label, value }) => (
            <div key={label} className="ws-stat px-4 py-3">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-ink-900 dark:text-white">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Search + filters */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents…"
              className="input-field pl-9"
            />
          </div>
          <div className="ws-segment">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`ws-segment-btn ${filter === key ? "ws-segment-active" : "ws-segment-idle"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm dark:border-rose-800 dark:bg-rose-950/30">
            <span className="text-rose-800 dark:text-rose-200">{error}</span>
            <button type="button" onClick={() => void load()} className="btn-secondary text-xs">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="loading-shimmer h-36 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-ink-200 py-20 text-center dark:border-ink-700">
            {items.length === 0 ? (
              <>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/40">
                  <svg className="h-7 w-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H18A2.25 2.25 0 0120.25 6v12m-8.5-3h7.5m-7.5 3H12" />
                  </svg>
                </div>
                <p className="font-semibold text-ink-800 dark:text-ink-200">No documents yet</p>
                <p className="mt-1 text-sm text-ink-500">Use New Analysis in the sidebar to upload a circular.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-ink-800 dark:text-ink-200">No matches</p>
                <p className="mt-1 text-sm text-ink-500">Try a different search or filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                  className="btn-ghost mt-3 text-sm"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <DocumentCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
