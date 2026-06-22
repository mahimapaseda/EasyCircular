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
  onToggle: () => void;
  onTextViewChange: (view: TextView) => void;
  onDraftChange: (text: string) => void;
  onExtract: () => void;
  onSave: () => void;
  onReset: () => void;
};

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
      <div className="ws-card border border-dashed border-brand-200 p-6 dark:border-brand-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">Ready to extract</p>
            <p className="mt-0.5 text-xs text-ink-500">{circular.originalFilename}</p>
          </div>
          <button type="button" onClick={onExtract} className="btn-primary shrink-0">
            Extract text
          </button>
        </div>
      </div>
    );
  }

  if (extracting) {
    return (
      <div className="ws-card p-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <div>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">Extracting text…</p>
            <p className="text-xs text-ink-500">PDF parsing and OCR if needed</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasText && circular.status === "failed" && extractionError) {
    return (
      <div className="ws-card border border-rose-200 p-5 dark:border-rose-800">
        <p className="text-sm text-rose-800 dark:text-rose-200">{extractionError}</p>
        <button type="button" onClick={onExtract} className="btn-secondary mt-3 text-xs">
          Try again
        </button>
      </div>
    );
  }

  if (!hasText && circular.status !== "uploaded") return null;

  return (
    <div className="ws-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left transition hover:opacity-80"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H18A2.25 2.25 0 0120.25 6v12m-8.5-3h7.5m-7.5 3H12" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900 dark:text-white">Source text</p>
            <p className="truncate text-xs text-ink-500">
              {hasEntities ? `${circular.entities.length} entities` : "Extracted content"}
              {confidence !== null && ` · ${confidence}% confidence`}
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onExtract} className="btn-ghost hidden text-xs sm:inline-flex">
            Re-extract
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? "Collapse source text" : "Expand source text"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-slate-100 dark:hover:bg-ink-800"
          >
            <svg
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
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
        <div className="border-t border-ink-100 dark:border-ink-800">
          {hasEntities && (
            <div className="border-b border-ink-100 px-5 py-2.5 dark:border-ink-800">
              <div className="ws-segment">
                <button
                  type="button"
                  onClick={() => onTextViewChange("highlights")}
                  className={`ws-segment-btn ${textView === "highlights" ? "ws-segment-active" : "ws-segment-idle"}`}
                >
                  Highlights
                </button>
                <button
                  type="button"
                  onClick={() => onTextViewChange("editor")}
                  className={`ws-segment-btn ${textView === "editor" ? "ws-segment-active" : "ws-segment-idle"}`}
                >
                  Editor
                </button>
              </div>
            </div>
          )}

          <div className="p-5">
            {textView === "highlights" && hasEntities ? (
              <div className="max-h-[280px] overflow-y-auto scrollbar-thin rounded-lg border border-ink-200 bg-slate-50 p-4 dark:border-ink-700 dark:bg-ink-950/60">
                <EntityHighlight text={sourceText} entities={circular.entities} />
              </div>
            ) : (
              <textarea
                value={draftText}
                onChange={(e) => onDraftChange(e.target.value)}
                disabled={!hasText && circular.status === "failed"}
                className="input-field min-h-[220px] resize-y font-mono text-[13px] leading-relaxed"
              />
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={saving || !hasText || textView === "highlights"}
                className="btn-secondary text-xs"
              >
                {saving ? "Saving…" : "Save edits"}
              </button>
              {circular.editedText && textView === "editor" && (
                <button type="button" onClick={onReset} className="btn-ghost text-xs">
                  Reset
                </button>
              )}
              <button type="button" onClick={onExtract} className="btn-ghost text-xs sm:hidden">
                Re-extract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
