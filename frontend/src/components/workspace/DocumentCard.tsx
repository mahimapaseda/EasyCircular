"use client";

import Link from "next/link";
import { useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatRelativeTime, wordCount } from "@/components/workspace/workspaceUtils";
import type { Circular } from "@/lib/circulars";

type DocumentCardProps = {
  item: Circular;
  onDelete?: (id: string) => void | Promise<void>;
};

export default function DocumentCard({ item, onDelete }: DocumentCardProps) {
  const [deleting, setDeleting] = useState(false);

  const words = wordCount(item);
  const pages = item.processingMeta.pageCount;
  const entities = item.entities.length;

  const meta = [
    formatRelativeTime(item.updatedAt),
    pages > 0 && `${pages} pg`,
    words > 0 && `${words.toLocaleString()} words`,
    entities > 0 && `${entities} entities`,
  ]
    .filter(Boolean)
    .join(" · ");

  async function handleDelete() {
    if (!onDelete || deleting) return;

    const confirmed = window.confirm(
      `Delete "${item.originalFilename}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="ws-panel group relative flex h-full flex-col rounded-2xl transition hover:border-white/25">
      <Link
        href={`/circular/${item.id}`}
        className="flex flex-1 flex-col p-5"
        aria-label={`Open ${item.originalFilename}`}
      >
        <div className="flex items-start justify-between gap-3 pr-8">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-white group-hover:text-cyan-300">
                {item.originalFilename}
              </p>
              {item.summary?.title ? (
                <p className="ws-muted mt-1 line-clamp-2 text-sm leading-snug">
                  {item.summary.title}
                </p>
              ) : (
                <p className="ws-muted mt-1 text-sm">
                  {item.status === "uploaded" ? "Awaiting extraction" : "Summary not generated"}
                </p>
              )}
            </div>
          </div>
          <StatusBadge status={item.status} className="shrink-0" />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
          <p className="ws-muted truncate text-xs">{meta}</p>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-cyan-400 opacity-0 transition group-hover:opacity-100">
            Open
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </Link>

      {onDelete && (
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          aria-label={`Delete ${item.originalFilename}`}
          className="absolute right-3 top-3 flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-slate-400 opacity-100 transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 md:opacity-0 md:group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
