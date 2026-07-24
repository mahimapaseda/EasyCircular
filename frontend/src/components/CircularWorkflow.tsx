"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import SummaryPanel from "@/components/SummaryPanel";
import SourceTextPanel from "@/components/workspace/SourceTextPanel";
import WorkflowLayout from "@/components/workflow/WorkflowLayout";
import { extractionConfidence } from "@/components/workspace/workspaceUtils";
import { useToast } from "@/context/ToastContext";
import {
  cloneSummary,
  displayText,
  extractCircularText,
  fetchCircular,
  processCircular,
  saveCircularSummary,
  saveCircularText,
  workflowStep,
  type Circular,
  type CircularSummary,
} from "@/lib/circulars";

type CircularWorkflowProps = {
  id: string;
};

type TextView = "highlights" | "editor";

export default function CircularWorkflow({ id }: CircularWorkflowProps) {
  const [circular, setCircular] = useState<Circular | null>(null);
  const [draftText, setDraftText] = useState("");
  const [textView, setTextView] = useState<TextView>("editor");
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [draftSummary, setDraftSummary] = useState<CircularSummary | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCircular(id);
      setCircular(data);
      setDraftText(displayText(data));
      if (data.summary) setDraftSummary(cloneSummary(data.summary));
      else setDraftSummary(null);
      setEditingSummary(false);
      if (data.entities.length > 0) setTextView("highlights");
      setSourceExpanded(!data.summary && Boolean(data.extractedText || data.editedText));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load circular");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleExtract() {
    setExtracting(true);
    setError(null);
    setSourceExpanded(true);
    try {
      const response = await extractCircularText(id);
      setCircular(response.circular);
      setDraftText(displayText(response.circular));
      if (response.error) {
        setError(response.error);
        showToast(response.error, "error");
      } else {
        showToast("Text extracted successfully.", "success");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed";
      setError(message);
      showToast(message, "error");
      await load();
    } finally {
      setExtracting(false);
    }
  }

  async function handleSaveSummary() {
    if (!draftSummary) return;
    setSavingSummary(true);
    setError(null);
    try {
      const updated = await saveCircularSummary(id, draftSummary);
      setCircular(updated);
      if (updated.summary) setDraftSummary(cloneSummary(updated.summary));
      setEditingSummary(false);
      showToast("Summary updated.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save summary";
      setError(message);
      showToast(message, "error");
    } finally {
      setSavingSummary(false);
    }
  }

  function handleStartSummaryEdit() {
    if (!circular?.summary) return;
    setDraftSummary(cloneSummary(circular.summary));
    setEditingSummary(true);
  }

  function handleCancelSummaryEdit() {
    if (circular?.summary) setDraftSummary(cloneSummary(circular.summary));
    setEditingSummary(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await saveCircularText(id, draftText);
      setCircular(updated);
      setDraftText(displayText(updated));
      showToast("Your edits were saved.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save text";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleProcess() {
    setProcessing(true);
    setError(null);
    try {
      const persistedText = displayText(circular!);
      const draftDiffers = draftText.trim() !== persistedText.trim();

      if (draftDiffers) {
        const saved = await saveCircularText(id, draftText);
        setCircular(saved);
        setDraftText(displayText(saved));
      }

      const result = await processCircular(id);
      setCircular(result.circular);
      setDraftText(displayText(result.circular));
      if (result.circular.summary) {
        setDraftSummary(cloneSummary(result.circular.summary));
      }
      setEditingSummary(false);
      if (result.circular.entities.length > 0) setTextView("highlights");
      setSourceExpanded(false);
      showToast(
        result.cached
          ? "Loaded a cached summary for identical text."
          : "Summary generated successfully.",
        "success",
      );
      if (result.guardrailWarnings?.length) {
        showToast(
          `${result.guardrailWarnings.length} date warning(s) — review suggested.`,
          "info",
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Processing failed";
      setError(message);
      showToast(message, "error");
      await load();
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <p className="text-sm font-semibold text-slate-300">Loading document…</p>
      </div>
    );
  }

  if (!circular) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-bold text-rose-300">{error || "Circular not found"}</p>
        <Link
          href="/circulars"
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          ← Back to documents
        </Link>
      </div>
    );
  }

  const step = workflowStep(circular);
  const hasText = Boolean(displayText(circular));
  const sourceText = displayText(circular);
  const confidence = extractionConfidence(circular);
  const hasSummary = Boolean(circular.summary);
  const canProcess =
    circular.status === "extracted" ||
    circular.status === "completed" ||
    circular.status === "failed";
  const hasEntities = circular.entities.length > 0;

  const generateButton =
    canProcess && hasText ? (
      <button
        type="button"
        onClick={() => void handleProcess()}
        disabled={processing || circular.status === "processing"}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-md transition hover:scale-[1.02] disabled:opacity-60"
      >
        {processing || circular.status === "processing" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
            Summarizing…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Generate summary
          </>
        )}
      </button>
    ) : null;

  return (
    <WorkflowLayout circular={circular} currentStep={step} actions={generateButton}>
      {error && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            Retry
          </button>
        </div>
      )}

      <div
        className={
          hasSummary
            ? sourceExpanded
              ? "grid w-full gap-4 md:gap-5 lg:grid-cols-[minmax(280px,38%)_minmax(0,1fr)] lg:items-start"
              : "grid w-full gap-4 md:gap-5 lg:grid-cols-[minmax(220px,30%)_minmax(0,1fr)] lg:items-start"
            : "mx-auto w-full max-w-3xl space-y-4 md:space-y-5"
        }
      >
        <div
          className={`space-y-4 md:space-y-5 ${hasSummary ? "order-2 lg:order-1 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto" : ""}`}
        >
          <SourceTextPanel
            circular={circular}
            draftText={draftText}
            textView={textView}
            sourceText={sourceText}
            confidence={confidence}
            extracting={extracting}
            saving={saving}
            hasText={hasText}
            hasEntities={hasEntities}
            expanded={sourceExpanded}
            compact={hasSummary}
            onToggle={() => setSourceExpanded((v) => !v)}
            onTextViewChange={setTextView}
            onDraftChange={setDraftText}
            onExtract={() => void handleExtract()}
            onSave={() => void handleSave()}
            onReset={() => setDraftText(circular.extractedText ?? "")}
          />

          {!circular.summary && canProcess && hasText && (
            <div className="relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/10 via-blue-500/5 to-transparent p-6 text-center">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="relative flex flex-col items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Next step
                </span>
                <p className="text-sm font-semibold text-white">
                  Text is ready — generate a structured summary
                </p>
                <button
                  type="button"
                  onClick={() => void handleProcess()}
                  disabled={processing || circular.status === "processing"}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-black/20 transition hover:scale-[1.02]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Generate AI Summary
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`min-w-0 space-y-4 md:space-y-5 ${hasSummary ? "order-1 lg:order-2" : ""}`}>
          <SummaryPanel
            circular={circular}
            processing={processing}
            editing={editingSummary}
            saving={savingSummary}
            draftSummary={draftSummary}
            onEditStart={handleStartSummaryEdit}
            onEditCancel={handleCancelSummaryEdit}
            onDraftChange={setDraftSummary}
            onSave={() => void handleSaveSummary()}
            onRegenerate={
              canProcess && hasText && hasSummary
                ? () => void handleProcess()
                : undefined
            }
            onExport={(format) =>
              showToast(`Summary exported as ${format.toUpperCase()}.`, "success")
            }
          />
        </div>
      </div>
    </WorkflowLayout>
  );
}
