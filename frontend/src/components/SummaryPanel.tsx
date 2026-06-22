"use client";

import { exportSummaryAsMarkdown, exportSummaryAsTxt } from "@/lib/exportSummary";
import type { Circular } from "@/lib/circulars";

const ENTITY_PILL: Record<string, string> = {
  DATE: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  PERSON: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  ORG: "bg-brand-100 text-brand-800 border-brand-200 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-800",
  LAW: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800",
  OTHER: "bg-ink-100 text-ink-700 border-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:border-ink-700",
};

type SummaryPanelProps = {
  circular: Circular;
  processing: boolean;
  onExport?: (format: "txt" | "md") => void;
};

export default function SummaryPanel({
  circular,
  processing,
  onExport,
}: SummaryPanelProps) {
  const summary = circular.summary;
  const meta = circular.processingMeta;
  const hasText = Boolean(circular.extractedText || circular.editedText);

  function handleExport(format: "txt" | "md") {
    if (format === "txt") exportSummaryAsTxt(circular);
    else exportSummaryAsMarkdown(circular);
    onExport?.(format);
  }

  async function handleCopy() {
    const text = summary?.rawMarkdown || summary?.sections.map((s) => `${s.heading}\n${s.content}`).join("\n\n") || "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    onExport?.("txt");
  }

  const topEntities = circular.entities.slice(0, 6);

  return (
    <section className="ws-card flex flex-col overflow-hidden">
      <div className="ws-card-header flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-900 dark:text-white">Document Summary</h3>
            <p className="text-xs text-ink-500">Purpose · requirements · deadlines · actions</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {meta.cached && (
            <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-ink-500 dark:border-ink-700 dark:bg-ink-950">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
              </svg>
              Cached
            </span>
          )}
          {summary && (
            <>
              <button type="button" onClick={() => void handleCopy()} className="btn-ghost text-xs">
                Copy
              </button>
              <button type="button" onClick={() => handleExport("md")} className="btn-ghost text-xs">
                Export
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 p-5">
        {/* Guardrails */}
        {meta.guardrailWarnings && meta.guardrailWarnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Review suggested
            </p>
            <ul className="space-y-1">
              {meta.guardrailWarnings.map((w) => (
                <li key={w} className="text-xs text-amber-900 dark:text-amber-200">• {w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Processing meta */}
        {meta.model && circular.status === "completed" && (
          <div className="flex flex-wrap gap-1.5">
            {[meta.model, meta.cached && "Cached", meta.durationMs && `${(meta.durationMs / 1000).toFixed(1)}s`, meta.chunkCount && meta.chunkCount > 1 && `${meta.chunkCount} chunks`]
              .filter(Boolean)
              .map((label) => (
                <span key={String(label)} className="rounded-md bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600 dark:bg-ink-800 dark:text-ink-400">
                  {label}
                </span>
              ))}
          </div>
        )}

        {/* Empty */}
        {!summary && !processing && circular.status !== "processing" && (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-ink-200 bg-slate-50/80 p-6 text-center dark:border-ink-700 dark:bg-ink-950/40">
            <svg className="mb-3 h-10 w-10 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm font-semibold text-ink-700 dark:text-ink-300">No summary yet</p>
            <p className="mt-1 text-xs text-ink-500">
              {hasText ? "Use Generate AI Summary below." : "Extract text first."}
            </p>
          </div>
        )}

        {/* Processing */}
        {(processing || circular.status === "processing") && (
          <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-800 dark:bg-brand-950/20">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              <div>
                <p className="text-sm font-bold text-ink-900 dark:text-white">Building summary…</p>
                <p className="text-xs text-ink-500">NER · entities · structured output</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary body */}
        {summary && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold text-ink-900 dark:text-white">{summary.title}</h4>
              {summary.mode === "llm" && (
                <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  AI
                </span>
              )}
              {summary.mode === "fallback" && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  Extractive
                </span>
              )}
            </div>

            {/* Entity pills — mockup style */}
            {topEntities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topEntities.map((e, i) => (
                  <span
                    key={`${e.start}-${i}`}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${ENTITY_PILL[e.label] || ENTITY_PILL.OTHER}`}
                  >
                    {e.label === "DATE" && (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    )}
                    {e.label === "PERSON" && (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                      </svg>
                    )}
                    {e.text}
                  </span>
                ))}
                {circular.entities.length > 6 && (
                  <span className="text-[11px] font-medium text-ink-400">+{circular.entities.length - 6} more</span>
                )}
              </div>
            )}

            <div className="space-y-3">
              {summary.sections.map((section) => (
                <div
                  key={section.heading}
                  className="rounded-lg border border-ink-100 bg-slate-50/80 p-4 dark:border-ink-800 dark:bg-ink-950/40"
                >
                  <h5 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    {section.heading}
                  </h5>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800 dark:text-ink-200">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            {summary.actionItems.length > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/20">
                <h5 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Action items
                </h5>
                <ul className="space-y-2">
                  {summary.actionItems.map((item, i) => (
                    <li key={item} className="flex gap-2 text-sm text-ink-800 dark:text-ink-200">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
