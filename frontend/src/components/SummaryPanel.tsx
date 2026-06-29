"use client";

import { useEffect, useState } from "react";
import { exportSummaryAsMarkdown, exportSummaryAsTxt } from "@/lib/exportSummary";
import type { Circular, CircularSummary } from "@/lib/circulars";

const ENTITY_PILL: Record<string, string> = {
  DATE: "bg-amber-50 text-amber-800 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800",
  PERSON: "bg-sky-50 text-sky-800 ring-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800",
  ORG: "bg-brand-50 text-brand-800 ring-brand-200/80 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-800",
  LAW: "bg-violet-50 text-violet-800 ring-violet-200/80 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-800",
  OTHER: "bg-slate-100 text-ink-700 ring-ink-200/80 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-700",
};

type SummaryPanelProps = {
  circular: Circular;
  processing: boolean;
  editing: boolean;
  saving: boolean;
  draftSummary: CircularSummary | null;
  onEditStart: () => void;
  onEditCancel: () => void;
  onDraftChange: (summary: CircularSummary) => void;
  onSave: () => void;
  onExport?: (format: "txt" | "md") => void;
};

function actionItemsToText(items: string[]): string {
  return items.join("\n");
}

function textToActionItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function SummaryPanel({
  circular,
  processing,
  editing,
  saving,
  draftSummary,
  onEditStart,
  onEditCancel,
  onDraftChange,
  onSave,
  onExport,
}: SummaryPanelProps) {
  const summary = circular.summary;
  const meta = circular.processingMeta;
  const hasText = Boolean(circular.extractedText || circular.editedText);
  const topEntities = circular.entities.slice(0, 8);
  const [actionItemsDraft, setActionItemsDraft] = useState("");

  useEffect(() => {
    if (editing && draftSummary) {
      setActionItemsDraft(actionItemsToText(draftSummary.actionItems));
    }
  }, [editing, draftSummary]);

  function handleExport(format: "txt" | "md") {
    if (format === "txt") exportSummaryAsTxt(circular);
    else exportSummaryAsMarkdown(circular);
    onExport?.(format);
  }

  async function handleCopy() {
    const text =
      summary?.rawMarkdown ||
      summary?.sections.map((s) => `${s.heading}\n${s.content}`).join("\n\n") ||
      "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    onExport?.("txt");
  }

  function updateDraft(patch: Partial<CircularSummary>) {
    if (!draftSummary) return;
    onDraftChange({ ...draftSummary, ...patch });
  }

  function updateSection(index: number, patch: Partial<{ heading: string; content: string }>) {
    if (!draftSummary) return;
    const sections = draftSummary.sections.map((section, i) =>
      i === index ? { ...section, ...patch } : section,
    );
    onDraftChange({ ...draftSummary, sections });
  }

  function commitActionItems(text: string) {
    setActionItemsDraft(text);
    if (!draftSummary) return;
    onDraftChange({ ...draftSummary, actionItems: textToActionItems(text) });
  }

  return (
    <section className="ws-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-3 dark:border-ink-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-400">AI Summary</span>
          {summary?.mode === "llm" && !editing && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              AI
            </span>
          )}
          {summary?.mode === "fallback" && !editing && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              Extractive
            </span>
          )}
          {(summary?.mode === "edited" || editing) && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Edited
            </span>
          )}
          {meta.cached && !editing && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500 dark:bg-ink-800 dark:text-ink-400">
              Cached
            </span>
          )}
        </div>
        {summary && !editing && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={onEditStart} className="btn-ghost text-xs">
              Edit
            </button>
            <button type="button" onClick={() => void handleCopy()} className="btn-ghost text-xs">
              Copy
            </button>
            <button type="button" onClick={() => handleExport("md")} className="btn-ghost text-xs">
              Export
            </button>
          </div>
        )}
        {summary && editing && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={onEditCancel} className="btn-ghost text-xs" disabled={saving}>
              Cancel
            </button>
            <button type="button" onClick={onSave} className="btn-primary py-1.5 text-xs" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {meta.guardrailWarnings && meta.guardrailWarnings.length > 0 && !editing && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Review suggested
            </p>
            <ul className="mt-2 space-y-1">
              {meta.guardrailWarnings.map((w) => (
                <li key={w} className="text-sm text-amber-900 dark:text-amber-200">• {w}</li>
              ))}
            </ul>
          </div>
        )}

        {!summary && !processing && circular.status !== "processing" && (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-slate-50/50 p-8 text-center dark:border-ink-700 dark:bg-ink-950/30">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/40">
              <svg className="h-7 w-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-ink-800 dark:text-ink-200">No summary yet</p>
            <p className="mt-1 max-w-sm text-sm text-ink-500">
              {hasText
                ? "Generate a structured summary with purpose, deadlines, and action items."
                : "Extract text from the PDF first."}
            </p>
          </div>
        )}

        {(processing || circular.status === "processing") && (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            <div className="text-center">
              <p className="font-semibold text-ink-900 dark:text-white">Building summary…</p>
              <p className="mt-0.5 text-sm text-ink-500">Analyzing entities and structure</p>
            </div>
          </div>
        )}

        {summary && !editing && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold leading-snug text-ink-900 dark:text-white sm:text-2xl">
                {summary.title}
              </h2>
              {meta.model && circular.status === "completed" && (
                <p className="mt-1.5 text-xs text-ink-400">
                  {[meta.model, meta.durationMs && `${(meta.durationMs / 1000).toFixed(1)}s`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>

            {topEntities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topEntities.map((e, i) => (
                  <span
                    key={`${e.start}-${i}`}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${ENTITY_PILL[e.label] || ENTITY_PILL.OTHER}`}
                  >
                    {e.text}
                  </span>
                ))}
                {circular.entities.length > 8 && (
                  <span className="self-center text-xs text-ink-400">
                    +{circular.entities.length - 8} more
                  </span>
                )}
              </div>
            )}

            <div className="space-y-4">
              {summary.sections.map((section) => (
                <article key={section.heading}>
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                    {section.heading}
                  </h3>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-800 dark:text-ink-200">
                    {section.content}
                  </p>
                </article>
              ))}
            </div>

            {summary.actionItems.length > 0 && (
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-5 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  Action items
                </h3>
                <ol className="space-y-2.5">
                  {summary.actionItems.map((item, i) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-800 dark:text-ink-200">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {summary && editing && draftSummary && (
          <div className="space-y-5">
            <p className="text-sm text-ink-500">
              Refine the summary before export. Changes are saved to your document only.
            </p>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-ink-500">
                Title
              </span>
              <input
                type="text"
                value={draftSummary.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-base font-semibold text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
              />
            </label>

            <div className="space-y-4">
              {draftSummary.sections.map((section, index) => (
                <div
                  key={`${section.heading}-${index}`}
                  className="rounded-xl border border-ink-200 bg-slate-50/50 p-4 dark:border-ink-700 dark:bg-ink-950/30"
                >
                  <label className="mb-3 block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                      Section heading
                    </span>
                    <input
                      type="text"
                      value={section.heading}
                      onChange={(e) => updateSection(index, { heading: e.target.value })}
                      className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-ink-500">
                      Content
                    </span>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(index, { content: e.target.value })}
                      rows={Math.max(4, Math.min(12, section.content.split("\n").length + 1))}
                      className="w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm leading-relaxed text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
                    />
                  </label>
                </div>
              ))}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Action items
              </span>
              <span className="mb-2 block text-xs text-ink-500">One item per line</span>
              <textarea
                value={actionItemsDraft}
                onChange={(e) => commitActionItems(e.target.value)}
                rows={5}
                placeholder="Enter each action on its own line"
                className="w-full resize-y rounded-lg border border-emerald-200 bg-emerald-50/30 px-3 py-2 text-sm leading-relaxed text-ink-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-ink-200"
              />
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
