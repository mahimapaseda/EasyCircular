"use client";

import { exportSummaryAsMarkdown, exportSummaryAsTxt } from "@/lib/exportSummary";
import type { Circular } from "@/lib/circulars";

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
    <section className="card p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Summary &amp; entities
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Structured purpose, deadlines, and action items.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary && (
            <>
              <button
                type="button"
                onClick={() => handleExport("txt")}
                className="btn-secondary text-xs sm:text-sm"
              >
                Export TXT
              </button>
              <button
                type="button"
                onClick={() => handleExport("md")}
                className="btn-secondary text-xs sm:text-sm"
              >
                Export MD
              </button>
            </>
          )}
          {canProcess && hasText && (
            <button
              type="button"
              onClick={onProcess}
              disabled={processing || circular.status === "processing"}
              className="btn-primary text-xs sm:text-sm"
            >
              {processing || circular.status === "processing"
                ? "Processing…"
                : summary
                  ? "Re-summarize"
                  : "Generate summary"}
            </button>
          )}
        </div>
      </div>

      {meta.guardrailWarnings && meta.guardrailWarnings.length > 0 && (
        <div className="mt-4 rounded-xl border border-sun-200 bg-sun-50 px-4 py-3 text-sm text-sun-900 dark:border-sun-500/30 dark:bg-sun-500/10 dark:text-sun-100">
          <p className="font-semibold">Review suggested</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {meta.guardrailWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {meta.model && circular.status === "completed" && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span>Model: {meta.model}</span>
          {meta.cached && <span>Cached</span>}
          {meta.durationMs != null && meta.durationMs > 0 && (
            <span>{(meta.durationMs / 1000).toFixed(1)}s</span>
          )}
          {meta.tokensUsed != null && meta.tokensUsed > 0 && (
            <span>{meta.tokensUsed} tokens</span>
          )}
        </div>
      )}

      {!summary && !processing && circular.status !== "processing" && (
        <div className="mt-4 min-h-[160px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400 sm:min-h-[200px]">
          {hasText
            ? "Save your text edits, then generate a summary with highlighted entities."
            : "The summary will appear here after the circular is processed."}
        </div>
      )}

      {(processing || circular.status === "processing") && (
        <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200">
          Extracting entities and building the summary…
        </div>
      )}

      {summary && (
        <div className="mt-4 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {summary.title}
          </h3>

          {summary.sections.map((section) => (
            <div key={section.heading}>
              <h4 className="font-semibold text-brand-700 dark:text-brand-300">
                {section.heading}
              </h4>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {section.content}
              </p>
            </div>
          ))}

          {summary.actionItems.length > 0 && (
            <div>
              <h4 className="font-semibold text-brand-700 dark:text-brand-300">
                Action items
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                {summary.actionItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.rawMarkdown && (
            <details className="rounded-xl border border-slate-200 dark:border-slate-700">
              <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                View markdown
              </summary>
              <pre className="max-h-48 overflow-auto border-t border-slate-200 px-4 py-3 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300">
                {summary.rawMarkdown}
              </pre>
            </details>
          )}
        </div>
      )}

      {circular.entities.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Detected entities ({circular.entities.length})
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {circular.entities.slice(0, 24).map((entity, index) => (
              <span
                key={`${entity.start}-${entity.end}-${index}`}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                title={entity.label}
              >
                {entity.text}
                <span className="ml-1 text-slate-400">· {entity.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
