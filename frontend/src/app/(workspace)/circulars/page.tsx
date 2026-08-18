"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import DocumentCard from "@/components/workspace/DocumentCard";
import HealthStatus from "@/components/HealthStatus";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { deleteCircular, listCirculars, type Circular } from "@/lib/circulars";
import OfficialCatalog from "@/components/workspace/OfficialCatalog";

type FilterKey = "all" | "completed" | "active";
type SourceTab = "library" | "official";

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

function SourceSwitch({ active }: { active: SourceTab }) {
  return (
    <div
      role="tablist"
      aria-label="Document source"
      className="relative grid h-10 w-full max-w-md grid-cols-2 rounded-xl border border-slate-200 bg-white/80 p-1 sm:w-[340px] dark:border-white/15 dark:bg-black/35"
    >
      <span
        aria-hidden
        className="absolute bottom-1 top-1 w-[calc(50%-6px)] rounded-lg bg-cyan-600 shadow-lg shadow-cyan-600/20 transition-[left] duration-300 ease-out dark:bg-white dark:shadow-black/30"
        style={{ left: active === "official" ? "calc(50% + 2px)" : "4px" }}
      />
      <Link
        role="tab"
        aria-selected={active === "library"}
        href="/circulars"
        className={`relative z-10 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
          active === "library" ? "text-white dark:text-slate-900" : "text-ink-500 hover:text-ink-900 dark:text-slate-300 dark:hover:text-white"
        }`}
      >
        Your library
      </Link>
      <Link
        role="tab"
        aria-selected={active === "official"}
        href="/circulars?tab=official"
        className={`relative z-10 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
          active === "official" ? "text-white dark:text-slate-900" : "text-ink-500 hover:text-ink-900 dark:text-slate-300 dark:hover:text-white"
        }`}
      >
        Official catalog
      </Link>
    </div>
  );
}

function DocumentsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: SourceTab = searchParams.get("tab") === "official" ? "official" : "library";
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [catalogTick, setCatalogTick] = useState(0);

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

  useEffect(() => {
    if (window.location.hash === "#official") {
      router.replace("/circulars?tab=official");
    }
  }, [router]);

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

  const handleDelete = useCallback(
    async (id: string) => {
      const item = items.find((entry) => entry.id === id);
      try {
        await deleteCircular(id);
        setItems((current) => current.filter((entry) => entry.id !== id));
        showToast(
          item ? `"${item.originalFilename}" deleted` : "Document deleted",
          "success",
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not delete document";
        showToast(message, "error");
        throw err;
      }
    },
    [items, showToast],
  );

  function handleRefresh() {
    if (tab === "official") {
      setCatalogTick((value) => value + 1);
      return;
    }
    void load();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-12 z-10 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/90 md:top-0 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-ink-900 dark:text-white">
                {tab === "official" ? "Official catalog" : "Your library"}
              </h1>
              <p className="ws-muted text-sm">
                {tab === "official"
                  ? "Import PDFs from moe.gov.lk, then review the text before summarizing."
                  : "Uploads and imported circulars you are working on."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={tab === "library" && loading}
              aria-label={tab === "official" ? "Refresh official catalog" : "Refresh documents"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-ink-600 transition hover:bg-slate-50 hover:text-ink-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
            >
              <svg className={`h-4 w-4 ${tab === "library" && loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <SourceSwitch active={tab} />
            <button
              type="button"
              onClick={handleRefresh}
              disabled={tab === "library" && loading}
              aria-label={tab === "official" ? "Refresh official catalog" : "Refresh documents"}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-600 transition hover:bg-slate-50 hover:text-ink-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white lg:flex"
            >
              <svg className={`h-4 w-4 ${tab === "library" && loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {tab === "official" ? (
          <OfficialCatalog reloadToken={catalogTick} />
        ) : (
          <>
            {!authLoading && !user && (
              <p className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-ink-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-slate-300">
                <Link href="/sign-in" className="font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                  Sign in
                </Link>{" "}
                to sync documents across devices.
              </p>
            )}

            <dl className="mb-6 grid grid-cols-1 gap-2 min-[400px]:grid-cols-3 sm:gap-3">
              {[
                { label: "Total", value: stats.total },
                { label: "Summarized", value: stats.completed },
                { label: "In progress", value: stats.active },
              ].map(({ label, value }) => (
                <div key={label} className="ws-panel px-3 py-2.5 sm:px-4 sm:py-3">
                  <dt className="ws-label">{label}</dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums text-ink-900 dark:text-white">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mb-5 flex flex-col gap-3">
              <div className="relative w-full">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your library…"
                  className="ws-panel w-full py-2.5 pl-9 pr-4 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>
              <div className="ws-segment w-full sm:w-auto">
                {FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`ws-segment-btn min-h-10 flex-1 sm:flex-none ${
                      filter === key ? "ws-segment-active" : "ws-segment-idle"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 dark:border-white/20 dark:bg-white/10 dark:text-white"
                >
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
              <div className="ws-panel flex flex-col items-center border-dashed py-20 text-center">
                {items.length === 0 ? (
                  <>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                      <svg className="h-7 w-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H18A2.25 2.25 0 0120.25 6v12m-8.5-3h7.5m-7.5 3H12" />
                      </svg>
                    </div>
                    <p className="font-semibold text-ink-900 dark:text-white">No documents yet</p>
                    <p className="ws-muted mt-1 max-w-sm text-sm">
                      Upload from New Analysis, or import a PDF from the official catalog.
                    </p>
                    <Link
                      href="/circulars?tab=official"
                      className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
                    >
                      Browse official circulars
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-ink-900 dark:text-white">No matches</p>
                    <p className="ws-muted mt-1 text-sm">Try a different search or filter.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setFilter("all");
                      }}
                      className="mt-3 rounded-lg px-3 py-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300"
                    >
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {filtered.map((item) => (
                  <DocumentCard key={item.id} item={item} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="mt-auto border-t border-slate-200 bg-white/90 dark:border-white/10 dark:bg-slate-950/90">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
          <p className="ws-label mb-3">System status</p>
          <HealthStatus compact />
        </div>
      </footer>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink-500 dark:text-slate-400">
          Loading documents…
        </div>
      }
    >
      <DocumentsPageInner />
    </Suspense>
  );
}
