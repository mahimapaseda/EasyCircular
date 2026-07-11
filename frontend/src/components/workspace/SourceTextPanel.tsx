"use client";

import EntityHighlight from "@/components/EntityHighlight";
import type { Circular } from "@/lib/circulars";

type TextView = "highlights" | "editor";

type SourceTextPanelProps = {
  circular: Circular;
  draftText: string;
  textView: TextView;
  sourceText: string;
  confidence: number | null;
  extracting: boolean;
  saving: boolean;
  hasText: boolean;
  hasEntities: boolean;
  expanded: boolean;
  compact?: boolean;
  onToggle: () => void;
  onTextViewChange: (view: TextView) => void;
  onDraftChange: (text: string) => void;
  onExtract: () => void;
  onSave: () => void;
  onReset: () => void;
};

const panelClass =
  "rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden shadow-xl shadow-black/20";

export default function SourceTextPanel({
  circular,
  draftText,
  textView,
  sourceText,
  confidence,
  extracting,
  saving,
  hasText,
  hasEntities,
  expanded,
  compact = false,
  onToggle,
  onTextViewChange,
  onDraftChange,
  onExtract,
  onSave,
  onReset,
}: SourceTextPanelProps) {
  const extractionError = circular.processingMeta.extractionError;

  if (circular.status === "uploaded" && !extracting) {
    return (
      <div className={`${panelClass} p-8`}>
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 via-sky-500/20 to-blue-600/10 shadow-lg shadow-cyan-500/10 ring-1 ring-white/10">
            <div className="absolute inset-px rounded-[15px] bg-gradient-to-br from-white/10 to-transparent" />
            <svg className="relative h-7 w-7 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-white">Ready to extract</p>
            <p className="mt-1 text-sm text-slate-400">{circular.originalFilename}</p>
            <p className="mt-2 text-xs text-slate-500">PDF parsing with OCR fallback for scanned documents</p>
          </div>
          <button
            type="button"
            onClick={onExtract}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-black/20 transition hover:scale-[1.02]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A3.375 3.375 0 006.75 21h10.5a3.375 3.375 0 003.375-3.375V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Extract text
          </button>
        </div>
      </div>
    );
  }

  if (extracting) {
    return (
      <div className={`${panelClass} p-6`}>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <div>
            <p className="text-sm font-semibold text-white">Extracting text…</p>
            <p className="text-xs text-slate-400">PDF parsing and OCR if needed</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasText && circular.status === "failed" && extractionError) {
    return (
      <div className={`${panelClass} border-rose-400/20 p-5`}>
        <p className="text-sm text-rose-300">{extractionError}</p>
        <button
          type="button"
          onClick={onExtract}
          className="mt-3 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!hasText && circular.status !== "uploaded") return null;

  const confidenceColor =
    confidence === null
      ? "text-slate-400"
      : confidence >= 90
        ? "text-emerald-300"
        : confidence >= 70
          ? "text-cyan-300"
          : "text-amber-300";

  return (
    <div className={`${panelClass} ${compact && !expanded ? "xl:max-w-none" : ""}`}>
      <div className={`flex items-center gap-3 ${compact && !expanded ? "px-4 py-3" : "px-5 py-4"}`}>
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left transition hover:opacity-80"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/15 to-blue-600/5 text-cyan-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H18A2.25 2.25 0 0120.25 6v12m-8.5-3h7.5m-7.5 3H12" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Source text
              <span className="inline-flex h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {hasEntities && (
                <span className="font-semibold text-slate-300">
                  {circular.entities.length} entities
                </span>
              )}
              {confidence !== null && (
                <>
                  {hasEntities && <span className="text-slate-600">·</span>}
                  <span className={`font-semibold ${confidenceColor}`}>
                    {confidence}% confidence
                  </span>
                </>
              )}
              {!hasEntities && confidence === null && (
                <span className="text-slate-400">Extracted content</span>
              )}
            </div>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onExtract}
            className="hidden rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            Re-extract
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? "Collapse source text" : "Expand source text"}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg
              className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10">
          {hasEntities && (
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5">
                <button
                  type="button"
                  onClick={() => onTextViewChange("highlights")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    textView === "highlights"
                      ? "bg-white/15 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Highlights
                </button>
                <button
                  type="button"
                  onClick={() => onTextViewChange("editor")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    textView === "editor"
                      ? "bg-white/15 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Editor
                </button>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {textView === "highlights" ? "Entity view" : "Edit mode"}
              </span>
            </div>
          )}

          <div className="px-5 pb-5">
            {textView === "highlights" && hasEntities ? (
              <div className="max-h-[min(50vh,360px)] overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3 scrollbar-thin sm:max-h-[360px] sm:p-4">
                <EntityHighlight text={sourceText} entities={circular.entities} />
              </div>
            ) : (
              <textarea
                value={draftText}
                onChange={(e) => onDraftChange(e.target.value)}
                disabled={!hasText && circular.status === "failed"}
                className="min-h-[200px] w-full resize-y rounded-xl border border-white/15 bg-black/20 px-3 py-3 font-mono text-[12px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 sm:min-h-[280px] sm:px-4 sm:text-[13px]"
              />
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={saving || !hasText || textView === "highlights"}
                className="min-h-10 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save edits"}
              </button>
              {circular.editedText && textView === "editor" && (
                <button
                  type="button"
                  onClick={onReset}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={onExtract}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white sm:hidden"
              >
                Re-extract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
