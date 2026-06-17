"use client";

import { exportSummaryAsMarkdown, exportSummaryAsTxt } from "@/lib/exportSummary";
import type { Circular } from "@/lib/circulars";

const SECTION_COLORS = [
  "border-l-brand-500 bg-gradient-to-r from-brand-50/60",
  "border-l-fuchsia-500 bg-gradient-to-r from-fuchsia-50/60",
  "border-l-amber-500 bg-gradient-to-r from-amber-50/60",
  "border-l-emerald-500 bg-gradient-to-r from-emerald-50/60",
  "border-l-cyan-500 bg-gradient-to-r from-cyan-50/60",
];

const DARK_SECTION_COLORS = [
  "dark:border-l-brand-400 dark:from-brand-950/30",
  "dark:border-l-fuchsia-400 dark:from-fuchsia-950/30",
  "dark:border-l-amber-400 dark:from-amber-950/30",
  "dark:border-l-emerald-400 dark:from-emerald-950/30",
  "dark:border-l-cyan-400 dark:from-cyan-950/30",
];

type SummaryPanelProps = {
  circular: Circular;
  processing: boolean;
  onProcess: () => void;
  onExport?: (format: "txt" | "md") => void;
};

export default function SummaryPanel({
  circular,
  processing,
  onProcess,
  onExport,
}: SummaryPanelProps) {
  const summary = circular.summary;
  const meta = circular.processingMeta;
  const canProcess =
    circular.status === "extracted" ||
    circular.status === "completed" ||
    circular.status === "failed";
  const hasText = Boolean(circular.extractedText || circular.editedText);

  function handleExport(format: "txt" | "md") {
    if (format === "txt") {
      exportSummaryAsTxt(circular);
    } else {
      exportSummaryAsMarkdown(circular);
    }
    onExport?.(format);
  }

  return (
    <section className="flex flex-col rounded-3xl border border-brand-200/50 bg-white/70 shadow-xl shadow-brand-900/5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/50">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-brand-100/50 bg-gradient-to-r from-transparent to-brand-50/50 p-5 dark:border-ink-800/50 dark:to-brand-950/20 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-md shadow-fuchsia-500/30">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black text-ink-900 dark:text-white">AI Summary</h2>
            <p className="text-xs font-semibold text-ink-500 dark:text-ink-400">
              Purpose · requirements · deadlines · actions
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {summary && (
            <>
              <button type="button" onClick={() => handleExport("txt")} className="btn-secondary rounded-full px-4 py-1.5 text-xs font-bold gap-1.5 shadow-sm">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                TXT
              </button>
              <button type="button" onClick={() => handleExport("md")} className="btn-secondary rounded-full px-4 py-1.5 text-xs font-bold gap-1.5 shadow-sm">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V7.5a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 7.5v10.5A2.25 2.25 0 006 20.25z" />
                </svg>
                MD
              </button>
            </>
          )}
          {canProcess && hasText && (
            <button
              type="button"
              onClick={onProcess}
              disabled={processing || circular.status === "processing"}
              className="btn-primary rounded-full px-4 py-1.5 text-xs font-bold gap-1.5 shadow-sm"
            >
              {processing || circular.status === "processing" ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Processing…
                </>
              ) : summary ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Re-summarize
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Generate summary
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 p-5 space-y-6">

      {/* Guardrail warnings */}
      {meta.guardrailWarnings && meta.guardrailWarnings.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/60 dark:border-amber-700/50 dark:from-amber-950/30 dark:to-orange-950/20">
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-100/60 px-4 py-2 dark:border-amber-800/50 dark:bg-amber-950/40">
            <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Review suggested
            </p>
          </div>
          <ul className="space-y-1 p-3">
            {meta.guardrailWarnings.map((warning) => (
              <li key={warning} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Processing meta */}
      {meta.model && circular.status === "completed" && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {[
            { label: meta.model, icon: "🤖" },
            ...(meta.cached ? [{ label: "Cached", icon: "⚡" }] : []),
            ...(meta.chunkCount != null && meta.chunkCount > 1 ? [{ label: `${meta.chunkCount} chunks`, icon: "📄" }] : []),
            ...(meta.durationMs != null && meta.durationMs > 0 ? [{ label: `${(meta.durationMs / 1000).toFixed(1)}s`, icon: "⏱" }] : []),
            ...(meta.tokensUsed != null && meta.tokensUsed > 0 ? [{ label: `${meta.tokensUsed} tokens`, icon: "🔢" }] : []),
          ].map(({ label, icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-semibold text-ink-600 dark:bg-ink-800 dark:text-ink-400"
            >
              <span>{icon}</span>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!summary && !processing && circular.status !== "processing" && (
        <div className="mt-5 flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-100 bg-gradient-to-br from-brand-50/40 to-fuchsia-50/20 p-6 text-center dark:border-ink-700 dark:from-brand-950/20 dark:to-fuchsia-950/10">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-100 to-violet-100 dark:from-fuchsia-950/40 dark:to-violet-950/30">
            <svg className="h-6 w-6 text-fuchsia-500 dark:text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="font-bold text-ink-700 dark:text-ink-200">No summary yet</p>
          <p className="mt-1 text-xs font-medium text-ink-500 dark:text-ink-400">
            {hasText
              ? "Save text edits then click Generate summary above."
              : "Extract and review the circular text first."}
          </p>
        </div>
      )}

      {/* Processing state */}
      {(processing || circular.status === "processing") && (
        <div className="mt-5 overflow-hidden rounded-xl border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-violet-50/60 dark:border-fuchsia-800/50 dark:from-fuchsia-950/30 dark:to-violet-950/20">
          <div className="flex items-center gap-3 p-4">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-md shadow-fuchsia-500/30">
              <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-fuchsia-900 dark:text-fuchsia-200">Building AI summary…</p>
              <p className="text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400">
                Extracting entities · running NER · generating structured output
              </p>
            </div>
          </div>
          <div className="relative h-1.5 bg-fuchsia-100 dark:bg-fuchsia-950/40">
            <div className="absolute inset-y-0 w-1/3 animate-pulsebar rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500" />
          </div>
        </div>
      )}

      {/* Summary content */}
      {summary && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-ink-100 pb-4 dark:border-ink-800/50">
            <h3 className="text-xl font-black tracking-tight text-ink-900 dark:text-white">{summary.title}</h3>
            {summary.mode === "llm" && (
              <span className="rounded-full bg-gradient-to-r from-brand-50 to-fuchsia-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-700 ring-1 ring-brand-200 shadow-sm dark:from-brand-900/30 dark:to-fuchsia-900/20 dark:text-brand-300 dark:ring-brand-700">
                AI-Generated
              </span>
            )}
            {summary.mode === "fallback" && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 ring-1 ring-amber-200 shadow-sm dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700">
                Extractive
              </span>
            )}
          </div>

          <div className="grid gap-4">
            {summary.sections.map((section, index) => (
              <div
                key={section.heading}
                className={`relative overflow-hidden rounded-2xl border bg-white/40 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:bg-white/60 dark:bg-ink-900/20 dark:hover:bg-ink-900/40 ${SECTION_COLORS[index % SECTION_COLORS.length].replace("bg-gradient-to-r", "border-l-4").replace("from-", "border-").replace("/60", "")} ${DARK_SECTION_COLORS[index % DARK_SECTION_COLORS.length].replace("dark:from-", "dark:border-").replace("/30", "")}`}
              >
                <h4 className="text-xs font-black uppercase tracking-widest text-ink-500 dark:text-ink-400 mb-2.5">
                  {section.heading}
                </h4>
                <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-ink-800 dark:text-ink-200">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {summary.actionItems.length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 shadow-lg shadow-emerald-900/5 dark:border-emerald-800/40 dark:from-emerald-950/30 dark:to-teal-950/10">
              <div className="flex items-center gap-3 border-b border-emerald-100/50 bg-emerald-100/30 px-5 py-3 dark:border-emerald-900/30 dark:bg-emerald-900/20">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
                  Action items
                </h4>
              </div>
              <div className="p-5">
                <ul className="space-y-4">
                  {summary.actionItems.map((item, i) => (
                    <li key={item} className="flex items-start gap-4">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-emerald-600 shadow-sm ring-1 ring-emerald-200 dark:bg-ink-950 dark:text-emerald-400 dark:ring-emerald-800">
                        {i + 1}
                      </span>
                      <p className="text-sm font-bold text-ink-800 dark:text-ink-200 pt-0.5">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entities chip cloud */}
      {circular.entities.length > 0 && (
        <div className="mt-6 border-t border-brand-100 pt-5 dark:border-ink-800">
          <h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-ink-500 dark:text-ink-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Detected entities ({circular.entities.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {circular.entities.slice(0, 30).map((entity, index) => {
              const colorMap: Record<string, string> = {
                DATE: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-700",
                PERSON: "bg-fuchsia-100 text-fuchsia-800 ring-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:ring-fuchsia-700",
                ORG: "bg-brand-100 text-brand-800 ring-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-700",
                LAW: "bg-cyan-100 text-cyan-800 ring-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-700",
                OTHER: "bg-ink-100 text-ink-700 ring-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-700",
              };
              return (
                <span
                  key={`${entity.start}-${entity.end}-${index}`}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${colorMap[entity.label] || colorMap.OTHER}`}
                  title={entity.label}
                >
                  {entity.text}
                </span>
              );
            })}
            {circular.entities.length > 30 && (
              <span className="inline-flex items-center rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-bold text-ink-500 ring-1 ring-ink-200 dark:bg-ink-800 dark:text-ink-400 dark:ring-ink-700">
                +{circular.entities.length - 30} more
              </span>
            )}
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
