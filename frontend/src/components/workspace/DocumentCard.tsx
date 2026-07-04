"use client";

import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatRelativeTime, wordCount } from "@/components/workspace/workspaceUtils";
import type { Circular } from "@/lib/circulars";

type DocumentCardProps = {
  item: Circular;
};

export default function DocumentCard({ item }: DocumentCardProps) {
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

  return (
    <Link
      href={`/circular/${item.id}`}
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-xl transition hover:border-white/20 hover:bg-black/40"
    >
      <div className="flex items-start justify-between gap-3">
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
              <p className="mt-1 line-clamp-2 text-sm leading-snug text-slate-400">
                {item.summary.title}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                {item.status === "uploaded" ? "Awaiting extraction" : "Summary not generated"}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={item.status} className="shrink-0" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
        <p className="truncate text-xs text-slate-500">{meta}</p>
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-cyan-400 opacity-0 transition group-hover:opacity-100">
          Open
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
