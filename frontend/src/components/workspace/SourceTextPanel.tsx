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
  collapsible?: boolean;
  onToggle: () => void;
  onTextViewChange: (view: TextView) => void;
  onDraftChange: (text: string) => void;
  onExtract: () => void;
  onSave: () => void;
  onReset: () => void;
};

const panelClass =
  "ws-panel overflow-hidden";

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
  collapsible = true,
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
      <div className={`${panelClass} px-6 py-8`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">Ready to extract</p>
            <p className="ws-muted mt-1 text-xs">{circular.originalFilename}</p>
            <p className="ws-muted mt-2 text-xs">PDF parsing with OCR fallback for scans</p>
          </div>
          <button
            type="button"
            onClick={onExtract}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-cyan-500 dark:bg-white dark:text-slate-900 dark:hover:bg-white/95"
          >
            Extract text
          </button>
        </div>
      </div>
    );
  }

  if (extracting) {
    return (
      <div className={`${panelClass} px-6 py-10 sm:px-10 sm:py-14`}>
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="mt-5 text-lg font-bold text-ink-900 dark:text-white">Extracting text</p>
          <p className="ws-muted mt-2 text-sm leading-relaxed">
            Reading the PDF, then running OCR on scanned Sinhala, Tamil, or English pages.
            This can take about 30 seconds.
          </p>
          <p className="mt-4 text-xs font-medium text-ink-600 dark:text-slate-400">{circular.originalFilename}</p>
        </div>
      </div>
    );
  }

  if (!hasText && circular.status === "failed" && extractionError) {
    return (
      <div className={`${panelClass} border-rose-200 p-5 dark:border-rose-400/20`}>
        <p className="text-sm text-rose-800 dark:text-rose-300">{extractionError}</p>
        <button
          type="button"
          onClick={onExtract}
          className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-800 transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/10"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!hasText && circular.status !== "uploaded") return null;

  const confidenceColor =
    confidence === null
      ? "text-ink-400 dark:text-slate-400"
      : confidence >= 90
        ? "text-emerald-700 dark:text-emerald-300"
        : confidence >= 70
          ? "text-cyan-700 dark:text-cyan-300"
          : "text-amber-700 dark:text-amber-300";

  const showBody = expanded || !collapsible;

  const headerCopy = (
    <div className="min-w-0">
      <p className="ws-label tracking-[0.16em]">Source text</p>
      {!(compact && !showBody) && (
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
          {hasEntities && (
            <span className="font-medium text-ink-700 dark:text-slate-300">{circular.entities.length} entities</span>
          )}
          {confidence !== null && (
            <>
              {hasEntities && <span className="text-slate-400">·</span>}
              <span className={`font-medium ${confidenceColor}`}>{confidence}% confidence</span>
            </>
          )}
          {!hasEntities && confidence === null && (
            <span className="text-ink-600 dark:text-slate-300">Extracted content</span>
          )}
        </div>
      )}
      {compact && !showBody && (
        <p className="ws-muted mt-0.5 truncate text-[11px]">
          {[
            hasEntities && `${circular.entities.length} entities`,
            confidence !== null && `${confidence}% confidence`,
            !hasEntities && confidence === null && "Extracted content",
          ]
            .filter(Boolean)
            .join(" · ")}
          {" · Expand to review"}
        </p>
      )}
    </div>
  );

  return (
    <div className={`${panelClass} ${compact && !showBody ? "xl:max-w-none" : ""}`}>
      <div className={`flex items-center gap-2 ${compact && !showBody ? "px-3 py-2" : "px-4 py-3"}`}>
        {collapsible ? (
          <button
            type="button"
            onClick={onToggle}
            className="flex min-w-0 flex-1 items-center gap-2 text-left transition hover:opacity-80"
          >
            {headerCopy}
          </button>
        ) : (
          <div className="min-w-0 flex-1">{headerCopy}</div>
        )}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onExtract}
            className="hidden rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-ink-600 transition hover:bg-slate-50 hover:text-ink-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white sm:inline-flex"
          >
            Re-extract
          </button>
          {collapsible && (
            <button
              type="button"
              onClick={onToggle}
              aria-label={expanded ? "Collapse source text" : "Expand source text"}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-md border border-slate-200 text-ink-500 transition hover:bg-slate-50 hover:text-ink-900 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform duration-300 ${showBody ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {showBody && (
        <div className="border-t border-slate-200 dark:border-white/10">
          {hasEntities && (
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="ws-segment">
                <button
                  type="button"
                  onClick={() => onTextViewChange("highlights")}
                  className={`ws-segment-btn ${
                    textView === "highlights" ? "ws-segment-active" : "ws-segment-idle"
                  }`}
                >
                  Highlights
                </button>
                <button
                  type="button"
                  onClick={() => onTextViewChange("editor")}
                  className={`ws-segment-btn ${
                    textView === "editor" ? "ws-segment-active" : "ws-segment-idle"
                  }`}
                >
                  Editor
                </button>
              </div>
              <span className="ws-label tracking-wider">
                {textView === "highlights" ? "Entity view" : "Edit mode"}
              </span>
            </div>
          )}

          <div className="px-5 pb-5">
            {textView === "highlights" && hasEntities ? (
              <div className="max-h-[min(70vh,720px)] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 scrollbar-thin dark:border-white/15 dark:bg-black/30 sm:p-4">
                <EntityHighlight text={sourceText} entities={circular.entities} />
              </div>
            ) : (
              <textarea
                value={draftText}
                onChange={(e) => onDraftChange(e.target.value)}
                disabled={!hasText && circular.status === "failed"}
                className="max-h-[min(70vh,720px)] min-h-[min(55vh,560px)] w-full resize-y overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-[13px] leading-relaxed text-ink-800 outline-none placeholder:text-ink-400 scrollbar-thin focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 dark:border-white/15 dark:bg-black/30 dark:text-slate-100 dark:placeholder:text-slate-400 sm:px-4"
              />
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={saving || !hasText || textView === "highlights"}
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-ink-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                {saving ? "Saving…" : "Save edits"}
              </button>
              {circular.editedText && textView === "editor" && (
                <button
                  type="button"
                  onClick={onReset}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-500 transition hover:text-ink-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={onExtract}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-500 transition hover:text-ink-900 dark:text-slate-400 dark:hover:text-white sm:hidden"
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
