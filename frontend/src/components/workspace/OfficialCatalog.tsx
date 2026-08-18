"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  fetchOfficialCircular,
  importOfficialCircular,
  listOfficialCirculars,
  type OfficialCircular,
  type OfficialPdf,
} from "@/lib/circulars";

const LANG_LABEL: Record<OfficialPdf["language"], string> = {
  en: "English",
  si: "Sinhala",
  ta: "Tamil",
  unknown: "PDF",
};

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OfficialCatalog({ reloadToken = 0 }: { reloadToken?: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<OfficialCircular[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [officialUrl, setOfficialUrl] = useState("https://moe.gov.lk/en/circulars/");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [pdfs, setPdfs] = useState<OfficialPdf[]>([]);
  const [pdfsLoading, setPdfsLoading] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listOfficialCirculars({ page, search });
      setItems(data.items);
      setTotalPages(Math.max(1, data.totalPages));
      setOfficialUrl(data.officialUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load official circulars");
    } finally {
      setLoading(false);
    }
  }, [page, search, reloadToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleOpen(item: OfficialCircular) {
    if (openId === item.id) {
      setOpenId(null);
      setPdfs([]);
      return;
    }
    setOpenId(item.id);
    setPdfs([]);
    setPdfsLoading(true);
    try {
      const detail = await fetchOfficialCircular(item.id);
      setPdfs(detail.pdfs);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not load PDFs", "error");
      setOpenId(null);
    } finally {
      setPdfsLoading(false);
    }
  }

  async function handleImport(moeId: number, pdf: OfficialPdf) {
    if (!user) {
      router.push(`/sign-in?returnTo=${encodeURIComponent("/circulars?tab=official")}`);
      return;
    }
    setImportingId(pdf.id);
    try {
      const circular = await importOfficialCircular(moeId, pdf.id);
      showToast(`Imported ${pdf.filename} from moe.gov.lk`, "success");
      router.push(`/circular/${circular.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Import failed", "error");
    } finally {
      setImportingId(null);
    }
  }

  return (
    <section id="official" className="space-y-4">
      <p className="ws-muted text-sm">
        Live list from{" "}
        <a
          href={officialUrl}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300"
        >
          moe.gov.lk/en/circulars
        </a>
        . Choose a language PDF to import into your library.
      </p>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(query.trim());
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search official circulars…"
          className="ws-panel min-h-10 flex-1 py-2.5 px-3 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-cyan-400/40 dark:text-white dark:placeholder:text-slate-400"
        />
        <button
          type="submit"
          className="rounded-lg bg-cyan-600 px-4 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">
          {error}
          <button type="button" onClick={() => void load()} className="ml-3 font-semibold text-rose-900 dark:text-white">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="loading-shimmer h-16 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="ws-muted text-sm">No official circulars matched that search.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="ws-panel overflow-hidden rounded-xl">
              <button
                type="button"
                onClick={() => void handleOpen(item)}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-semibold text-ink-900 dark:text-white">{item.title}</span>
                  <span className="ws-muted mt-1 block text-xs">{formatDate(item.date)}</span>
                </span>
                <span className="ws-muted shrink-0 text-xs font-semibold">
                  {openId === item.id ? "Hide PDFs" : "PDFs"}
                </span>
              </button>
              {openId === item.id && (
                <div className="border-t border-slate-200 px-4 py-3 dark:border-white/10">
                  {pdfsLoading ? (
                    <p className="ws-muted text-xs">Loading official PDFs…</p>
                  ) : pdfs.length === 0 ? (
                    <p className="ws-muted text-xs">
                      No PDF attached. Open the{" "}
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-cyan-700 dark:text-cyan-400">
                          official page
                        </a>
                      ) : (
                        "official page"
                      )}
                      .
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {pdfs.map((pdf) => (
                        <li key={pdf.id} className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm text-ink-700 dark:text-slate-200">
                            {pdf.filename}
                            <span className="ws-muted ml-2 text-xs">{LANG_LABEL[pdf.language]}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleImport(item.id, pdf)}
                            disabled={importingId === pdf.id}
                            className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900"
                          >
                            {importingId === pdf.id ? "Importing…" : user ? "Import" : "Sign in to import"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-ink-700 disabled:opacity-40 dark:border-white/15 dark:text-slate-200"
          >
            Previous
          </button>
          <span className="ws-muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-ink-700 disabled:opacity-40 dark:border-white/15 dark:text-slate-200"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
