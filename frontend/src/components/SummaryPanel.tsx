"use client";

import { useEffect, useState } from "react";
import { exportSummaryAsMarkdown, exportSummaryAsTxt } from "@/lib/exportSummary";
import type { Circular, CircularSummary } from "@/lib/circulars";

const ENTITY_PILL: Record<string, string> = {
  DATE: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  PERSON: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  ORG: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  LAW: "border-purple-400/30 bg-purple-400/10 text-purple-300",
  OTHER: "border-white/15 bg-white/5 text-slate-300",
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

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20";

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
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Summary</span>
          {summary?.mode === "llm" && !editing && (
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-300">
              AI
            </span>
          )}
          {summary?.mode === "fallback" && !editing && (
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
              Extractive
            </span>
          )}
          {(summary?.mode === "edited" || editing) && (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
              Edited
            </span>
          )}
          {meta.cached && !editing && (
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              Cached
            </span>
          )}
        </div>
        {summary && !editing && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={onEditStart} className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white">
              Edit
            </button>
            <button type="button" onClick={() => void handleCopy()} className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white">
              Copy
            </button>
            <button type="button" onClick={() => handleExport("md")} className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white">
              Export
            </button>
          </div>
        )}
        {summary && editing && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={onEditCancel} className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white" disabled={saving}>
              Cancel
            </button>
            <button type="button" onClick={onSave} className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-slate-900" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {meta.guardrailWarnings && meta.guardrailWarnings.length > 0 && !editing && (
          <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Review suggested
            </p>
            <ul className="mt-2 space-y-1">
              {meta.guardrailWarnings.map((w) => (
                <li key={w} className="text-sm text-amber-200">• {w}</li>
              ))}
            </ul>
          </div>
        )}

        {!summary && !processing && circular.status !== "processing" && (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
              <svg className="h-7 w-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-white">No summary yet</p>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              {hasText
                ? "Generate a structured summary with purpose, deadlines, and action items."
                : "Extract text from the PDF first."}
            </p>
          </div>
        )}

        {(processing || circular.status === "processing") && (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <div className="text-center">
              <p className="font-semibold text-white">Building summary…</p>
              <p className="mt-0.5 text-sm text-slate-400">Analyzing entities and structure</p>
            </div>
          </div>
        )}

        {summary && !editing && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold leading-snug text-white sm:text-2xl">
                {summary.title}
              </h2>
              {meta.model && circular.status === "completed" && (
                <p className="mt-1.5 text-xs text-slate-500">
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
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${ENTITY_PILL[e.label] || ENTITY_PILL.OTHER}`}
                  >
                    {e.text}
                  </span>
                ))}
                {circular.entities.length > 8 && (
                  <span className="self-center text-xs text-slate-500">
                    +{circular.entities.length - 8} more
                  </span>
                )}
              </div>
            )}

            <div className="space-y-4">
              {summary.sections.map((section) => (
                <article key={section.heading}>
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                    {section.heading}
                  </h3>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-200">
                    {section.content}
                  </p>
                </article>
              ))}
            </div>

            {summary.actionItems.length > 0 && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  Action items
                </h3>
                <ol className="space-y-2.5">
                  {summary.actionItems.map((item, i) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-200">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
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
            <p className="text-sm text-slate-400">
              Refine the summary before export. Changes are saved to your document only.
            </p>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Title
              </span>
              <input
                type="text"
                value={draftSummary.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                className={`${inputClass} text-base font-semibold`}
              />
            </label>

            <div className="space-y-4">
              {draftSummary.sections.map((section, index) => (
                <div
                  key={`${section.heading}-${index}`}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <label className="mb-3 block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                      Section heading
                    </span>
                    <input
                      type="text"
                      value={section.heading}
                      onChange={(e) => updateSection(index, { heading: e.target.value })}
                      className={`${inputClass} font-semibold`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Content
                    </span>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(index, { content: e.target.value })}
                      rows={Math.max(4, Math.min(12, section.content.split("\n").length + 1))}
                      className={`${inputClass} resize-y leading-relaxed`}
                    />
                  </label>
                </div>
              ))}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                Action items
              </span>
              <span className="mb-2 block text-xs text-slate-500">One item per line</span>
              <textarea
                value={actionItemsDraft}
                onChange={(e) => commitActionItems(e.target.value)}
                rows={5}
                placeholder="Enter each action on its own line"
                className={`${inputClass} resize-y border-emerald-400/20 leading-relaxed`}
              />
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
