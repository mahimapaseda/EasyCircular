"use client";

import { useEffect, useMemo, useState } from "react";
import { exportSummaryAsMarkdown, exportSummaryAsTxt } from "@/lib/exportSummary";
import type { Circular, CircularSummary } from "@/lib/circulars";

const ENTITY_STYLE: Record<string, { pill: string; dot: string; label: string }> = {
  DATE: {
    pill: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    dot: "bg-amber-400",
    label: "Dates",
  },
  PERSON: {
    pill: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    dot: "bg-sky-400",
    label: "People",
  },
  ORG: {
    pill: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
    dot: "bg-cyan-400",
    label: "Organizations",
  },
  LAW: {
    pill: "border-purple-400/25 bg-purple-400/10 text-purple-200",
    dot: "bg-purple-400",
    label: "References",
  },
  OTHER: {
    pill: "border-white/10 bg-white/5 text-slate-300",
    dot: "bg-slate-400",
    label: "Other",
  },
};

function entityStyle(label: string) {
  return ENTITY_STYLE[label] || ENTITY_STYLE.OTHER;
}

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
  onRegenerate?: () => void;
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
  onRegenerate,
  onExport,
}: SummaryPanelProps) {
  const summary = circular.summary;
  const meta = circular.processingMeta;
  const hasText = Boolean(circular.extractedText || circular.editedText);
  const [actionItemsDraft, setActionItemsDraft] = useState("");

  const visibleEntities = useMemo(() => circular.entities.slice(0, 16), [circular.entities]);
  const hiddenEntityCount = Math.max(0, circular.entities.length - visibleEntities.length);

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

  const modeTag = (() => {
    if (editing || summary?.mode === "edited") {
      return { text: "Edited", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" };
    }
    if (summary?.mode === "fallback") {
      return { text: "Extractive", cls: "border-amber-400/30 bg-amber-400/10 text-amber-300" };
    }
    if (summary?.mode === "llm") {
      return { text: "AI", cls: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" };
    }
    return null;
  })();

  return (
    <section className="relative flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-xl shadow-black/20 backdrop-blur-xl lg:min-h-[min(72vh,720px)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-md shadow-cyan-500/30">
            <span className="absolute inset-px rounded-[7px] bg-gradient-to-br from-white/30 to-transparent" />
            <svg className="relative h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              AI Summary
            </span>
            <div className="mt-0.5 flex items-center gap-1.5">
              {modeTag && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${modeTag.cls}`}>
                  {modeTag.text}
                </span>
              )}
              {meta.cached && !editing && (
                <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Cached
                </span>
              )}
            </div>
          </div>
        </div>
        {summary && !editing && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={processing || circular.status === "processing"}
                className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-white/15 disabled:opacity-60 md:hidden"
              >
                {processing || circular.status === "processing" ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Summarizing…
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    Regenerate
                  </>
                )}
              </button>
            )}
            <div className="flex w-full items-center justify-stretch gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5 sm:w-auto sm:justify-start">
            <button
              type="button"
              onClick={onEditStart}
              className="min-h-9 flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white sm:flex-none sm:py-1"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="min-h-9 flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white sm:flex-none sm:py-1"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => handleExport("md")}
              className="min-h-9 flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white sm:flex-none sm:py-1"
            >
              Export
            </button>
            </div>
          </div>
        )}
        {summary && editing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEditCancel}
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-md disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto border-t border-white/5 p-4 sm:p-6 lg:p-8">
        {summary?.mode === "fallback" && meta.llmError && !editing && (
          <div className="mb-6 rounded-xl border border-rose-400/25 bg-gradient-to-br from-rose-400/10 to-rose-400/5 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-300">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              AI summary unavailable
            </p>
            <p className="mt-2 text-xs leading-relaxed text-rose-100/90 sm:text-sm">
              {meta.llmError} A basic extractive summary is shown instead — use Regenerate to retry.
            </p>
          </div>
        )}

        {meta.guardrailWarnings && meta.guardrailWarnings.length > 0 && !editing && (
          <div className="mb-6 rounded-xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 to-amber-400/5 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-300">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              Review suggested
            </p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto sm:max-h-none sm:overflow-visible">
              {meta.guardrailWarnings.map((w) => (
                <li key={w} className="text-xs leading-relaxed text-amber-100/90 sm:text-sm">• {w}</li>
              ))}
            </ul>
          </div>
        )}

        {!summary && !processing && circular.status !== "processing" && (
          <div className="flex min-h-[min(60vh,520px)] flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
            <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/25 to-blue-600/10 ring-1 ring-white/10">
              <div className="absolute inset-px rounded-[15px] bg-gradient-to-br from-white/10 to-transparent" />
              <svg className="relative h-7 w-7 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
          <div className="flex min-h-[min(60vh,520px)] flex-col items-center justify-center gap-4 py-8">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400/20" />
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">Building summary…</p>
              <p className="mt-0.5 text-sm text-slate-400">Analyzing entities and structure</p>
            </div>
          </div>
        )}

        {summary && !editing && (
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-lg font-bold leading-snug tracking-tight text-white sm:text-2xl lg:text-[2rem] lg:leading-tight">
                {summary.title}
              </h2>
              <div className="mt-4 h-px w-20 bg-gradient-to-r from-cyan-400 to-transparent" />
              {meta.durationMs && circular.status === "completed" && (
                <div className="mt-3 text-[11px] font-medium text-slate-500">
                  <span>{(meta.durationMs / 1000).toFixed(1)}s</span>
                </div>
              )}
            </div>

            {/* ─── Circular Metadata Detail Card ─────────────── */}
            {(summary.circularNumber || summary.issuedDate || summary.issuedBy || summary.targetAudience || summary.effectiveDate) && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Circular Details
                </h3>
                <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {summary.circularNumber && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Number</span>
                      <p className="mt-0.5 text-sm font-medium text-white">{summary.circularNumber}</p>
                    </div>
                  )}
                  {summary.issuedDate && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Issued</span>
                      <p className="mt-0.5 text-sm font-medium text-white">{summary.issuedDate}</p>
                    </div>
                  )}
                  {summary.issuedBy && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Issued By</span>
                      <p className="mt-0.5 text-sm font-medium text-white">{summary.issuedBy}</p>
                    </div>
                  )}
                  {summary.effectiveDate && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Effective</span>
                      <p className="mt-0.5 text-sm font-medium text-white">{summary.effectiveDate}</p>
                    </div>
                  )}
                  {summary.targetAudience && (
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Target Audience</span>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-200">{summary.targetAudience}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {visibleEntities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {visibleEntities.map((e, i) => {
                  const s = entityStyle(e.label);
                  return (
                    <span
                      key={`${e.start}-${i}`}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${s.pill}`}
                      title={e.label}
                    >
                      <span className={`h-1 w-1 rounded-full ${s.dot}`} />
                      {e.text}
                    </span>
                  );
                })}
                {hiddenEntityCount > 0 && (
                  <span className="self-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                    +{hiddenEntityCount} more
                  </span>
                )}
              </div>
            )}

            <div className="space-y-5">
              {summary.sections.map((section, index) => (
                <article key={`${section.heading}-${index}`} className="relative rounded-xl border border-white/5 bg-white/[0.02] p-5 pl-12 sm:p-6 sm:pl-14">
                  <span className="absolute left-4 top-5 flex h-6 w-6 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-400/10 text-[11px] font-bold text-cyan-300 sm:left-5">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                    {section.heading}
                  </h3>
                  <p className="whitespace-pre-wrap text-base leading-7 text-slate-200 sm:text-[17px]">
                    {section.content}
                  </p>
                </article>
              ))}
            </div>

            {summary.actionItems.length > 0 && (
              <div className="relative overflow-hidden rounded-xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/10 via-emerald-400/[0.03] to-transparent p-6 sm:p-7">
                <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl" />
                <div className="relative">
                  <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Action items
                  </h3>
                  <ol className="grid gap-3 sm:grid-cols-2">
                    {summary.actionItems.map((item, i) => (
                      <li key={item} className="flex gap-3 rounded-lg border border-emerald-400/10 bg-black/20 p-3 text-sm leading-relaxed text-slate-100">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[10px] font-bold text-white shadow-sm shadow-emerald-500/30">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
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

            {/* ─── Metadata Fields ─────────────── */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Circular Details
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Number</span>
                  <input
                    type="text"
                    value={draftSummary.circularNumber || ""}
                    onChange={(e) => updateDraft({ circularNumber: e.target.value || null })}
                    className={inputClass}
                    placeholder="e.g. 10/2026"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Issued Date</span>
                  <input
                    type="text"
                    value={draftSummary.issuedDate || ""}
                    onChange={(e) => updateDraft({ issuedDate: e.target.value || null })}
                    className={inputClass}
                    placeholder="e.g. 04.05.2026"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Issued By</span>
                  <input
                    type="text"
                    value={draftSummary.issuedBy || ""}
                    onChange={(e) => updateDraft({ issuedBy: e.target.value || null })}
                    className={inputClass}
                    placeholder="e.g. Ministry of Education"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Effective Date</span>
                  <input
                    type="text"
                    value={draftSummary.effectiveDate || ""}
                    onChange={(e) => updateDraft({ effectiveDate: e.target.value || null })}
                    className={inputClass}
                    placeholder="e.g. With immediate effect"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Target Audience</span>
                  <input
                    type="text"
                    value={draftSummary.targetAudience || ""}
                    onChange={(e) => updateDraft({ targetAudience: e.target.value || null })}
                    className={inputClass}
                    placeholder="e.g. All Provincial Education Secretaries"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              {draftSummary.sections.map((section, index) => (
                <div
                  key={`${section.heading}-${index}`}
                  className="relative rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <span className="absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-md border border-cyan-400/30 bg-slate-900 text-[10px] font-black text-cyan-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
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
