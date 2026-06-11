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
    <section className="panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-ink-900 dark:text-white">
            AI summary
          </h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Structured purpose, requirements, deadlines, and action items.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary && (
            <>
              <button type="button" onClick={() => handleExport("txt")} className="btn-secondary text-xs">
                Export TXT
              </button>
              <button type="button" onClick={() => handleExport("md")} className="btn-secondary text-xs">
                Export MD
              </button>
            </>
          )}
          {canProcess && hasText && (
            <button
              type="button"
              onClick={onProcess}
              disabled={processing || circular.status === "processing"}
              className="btn-primary text-xs"
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
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-semibold">Review suggested</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {meta.guardrailWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {meta.model && circular.status === "completed" && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
          <span>Model: {meta.model}</span>
          {meta.cached && <span>Cached</span>}
          {meta.chunkCount != null && meta.chunkCount > 1 && (
            <span>{meta.chunkCount} chunks</span>
          )}
          {meta.durationMs != null && meta.durationMs > 0 && (
            <span>{(meta.durationMs / 1000).toFixed(1)}s</span>
          )}
          {meta.tokensUsed != null && meta.tokensUsed > 0 && (
            <span>{meta.tokensUsed} tokens</span>
          )}
        </div>
      )}

      {!summary && !processing && circular.status !== "processing" && (
        <div className="mt-4 min-h-[160px] rounded-lg border border-dashed border-ink-200 bg-ink-50/60 p-4 text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-950/40 dark:text-ink-400">
          {hasText
            ? "Save your text edits, then generate a summary with highlighted entities."
            : "The summary will appear here after the circular is processed."}
        </div>
      )}

      {(processing || circular.status === "processing") && (
        <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900 dark:border-brand-700 dark:bg-brand-950/30 dark:text-brand-100">
          Extracting entities and building the summary…
        </div>
      )}

      {summary && (
        <div className="mt-4 space-y-4">
          <h3 className="text-lg font-bold text-ink-900 dark:text-white">
            {summary.title}
          </h3>

          {summary.sections.map((section) => (
            <div key={section.heading}>
              <h4 className="font-semibold text-brand-700 dark:text-brand-300">
                {section.heading}
              </h4>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-700 dark:text-ink-300">
                {section.content}
              </p>
            </div>
          ))}

          {summary.actionItems.length > 0 && (
            <div>
              <h4 className="font-semibold text-brand-700 dark:text-brand-300">
                Action items
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-700 dark:text-ink-300">
                {summary.actionItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {circular.entities.length > 0 && (
        <div className="mt-6 border-t border-ink-200 pt-4 dark:border-ink-700">
          <h4 className="text-sm font-semibold text-ink-900 dark:text-white">
            Detected entities ({circular.entities.length})
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {circular.entities.slice(0, 24).map((entity, index) => (
              <span
                key={`${entity.start}-${entity.end}-${index}`}
                className="badge bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300"
                title={entity.label}
              >
                {entity.text}
                <span className="ml-1 text-ink-400">· {entity.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
