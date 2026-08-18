"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
  translateCircularSummary,
  workflowStep,
  type Circular,
  type CircularSummary,
  type SummaryLang,
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
  const autoExtractStarted = useRef<string | null>(null);
  const [textReviewed, setTextReviewed] = useState(false);
  const draftTextRef = useRef(draftText);
  const circularRef = useRef(circular);

  draftTextRef.current = draftText;
  circularRef.current = circular;

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
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load circular");
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const extractOnce = useCallback(
    async (options?: { quietSuccess?: boolean }): Promise<Circular | null> => {
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
          return null;
        }
        if (!displayText(response.circular).trim()) {
          const message = "Extraction produced no usable text.";
          setError(message);
          showToast(message, "error");
          return null;
        }
        setTextReviewed(false);
        if (!options?.quietSuccess) {
          showToast("Text extracted. Review it before generating a summary.", "success");
        }
        return response.circular;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Extraction failed";
        setError(message);
        showToast(message, "error");
        await load();
        return null;
      } finally {
        setExtracting(false);
      }
    },
    [id, load, showToast],
  );

  const processOnce = useCallback(
    async (options?: { sourceCircular?: Circular | null }): Promise<Circular | null> => {
      setProcessing(true);
      setError(null);
      try {
        const current = options?.sourceCircular ?? circularRef.current;
        if (!current) {
          throw new Error("Circular not loaded");
        }

        const persistedText = displayText(current);
        const draft = draftTextRef.current;
        const draftDiffers = draft.trim() !== persistedText.trim();

        if (draftDiffers) {
          const saved = await saveCircularText(id, draft);
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
            `${result.guardrailWarnings.length} date warning(s). Review suggested.`,
            "info",
          );
        }
        return result.circular;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Processing failed";
        setError(message);
        showToast(message, "error");
        await load();
        return null;
      } finally {
        setProcessing(false);
      }
    },
    [id, load, showToast],
  );

  const runAutoExtract = useCallback(async () => {
    await extractOnce({ quietSuccess: true });
  }, [extractOnce]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    autoExtractStarted.current = null;
    setTextReviewed(false);
  }, [id]);

  useEffect(() => {
    if (!circular || circular.id !== id) return;
    if (circular.status !== "uploaded") return;
    if (autoExtractStarted.current === id) return;
    autoExtractStarted.current = id;
    void runAutoExtract();
  }, [circular, id, runAutoExtract]);

  async function handleExtract() {
    await extractOnce();
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

  async function handleTranslate(targetLang: SummaryLang) {
    try {
      const updated = await translateCircularSummary(id, targetLang);
      setCircular(updated);
      if (updated.summary) setDraftSummary(cloneSummary(updated.summary));
      showToast(
        targetLang === "si"
          ? "Brief translated to Sinhala."
          : targetLang === "ta"
            ? "Brief translated to Tamil."
            : "Brief translated to English.",
        "success",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Translation failed";
      showToast(message, "error");
      throw err;
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await saveCircularText(id, draftText);
      setCircular(updated);
      setDraftText(displayText(updated));
      setTextReviewed(true);
      showToast("Your edits were saved. You can generate a summary.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save text";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleProcess() {
    if (!circular?.summary && !textReviewed) {
      showToast("Review the extracted text before generating a summary.", "info");
      return;
    }
    await processOnce();
  }

  function handleConfirmReview() {
    setTextReviewed(true);
    showToast("Text marked as reviewed.", "success");
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
  const busy = extracting || processing || circular.status === "processing";
  const canProcess =
    circular.status === "extracted" ||
    circular.status === "completed" ||
    circular.status === "failed";
  const hasEntities = circular.entities.length > 0;
  const needsReview = !hasSummary && canProcess && hasText && !textReviewed;
  const extractPhase = extracting || circular.status === "uploaded" || (!hasText && !hasSummary);
  const reviewPhase = !extractPhase && !hasSummary && hasText && circular.status !== "processing";

  const showHeaderGenerate = canProcess && hasText && !hasSummary && textReviewed;
  const generateButton = showHeaderGenerate ? (
    <button
      type="button"
      onClick={() => void handleProcess()}
      disabled={busy}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-white/95 disabled:opacity-60"
    >
      {busy ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          Summarizing…
        </>
      ) : (
        "Generate summary"
      )}
    </button>
  ) : canProcess && hasText && hasSummary ? (
    <button
      type="button"
      onClick={() => void handleProcess()}
      disabled={busy}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
    >
      {busy ? "Summarizing…" : "Regenerate"}
    </button>
  ) : null;

  const sourcePanel = (
    <SourceTextPanel
      circular={circular}
      draftText={draftText}
      textView={textView}
      sourceText={sourceText}
      confidence={confidence}
      extracting={extracting || circular.status === "uploaded"}
      saving={saving}
      hasText={hasText}
      hasEntities={hasEntities}
      expanded={reviewPhase || sourceExpanded}
      compact={hasSummary && !sourceExpanded}
      collapsible={!reviewPhase && hasSummary}
      onToggle={() => setSourceExpanded((v) => !v)}
      onTextViewChange={setTextView}
      onDraftChange={setDraftText}
      onExtract={() => void handleExtract()}
      onSave={() => void handleSave()}
      onReset={() => setDraftText(circular.extractedText ?? "")}
    />
  );

  return (
    <WorkflowLayout circular={circular} currentStep={step} actions={generateButton}>
      {error && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-300 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="shrink-0 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Retry
          </button>
        </div>
      )}

      {extractPhase && sourcePanel}

      {reviewPhase && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          {sourcePanel}
          <aside className="ws-panel xl:sticky xl:top-36">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="ws-label tracking-[0.16em]">Step 3 · Review</p>
              <p className="mt-2 text-sm font-semibold text-white">
                Check the extracted text before summarizing
              </p>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm text-slate-300">
              <p>Fix OCR mistakes in the editor, especially Sinhala or Tamil names, dates, and the circular number.</p>
              <p>The original PDF is the legal source. This text is only a working copy.</p>
            </div>
            <div className="border-t border-white/10 px-5 py-4">
              {needsReview ? (
                <button
                  type="button"
                  onClick={handleConfirmReview}
                  disabled={busy}
                  className="flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-white/95 disabled:opacity-60"
                >
                  Text is correct
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleProcess()}
                  disabled={busy}
                  className="flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-white/95 disabled:opacity-60"
                >
                  {busy ? "Summarizing…" : "Generate summary"}
                </button>
              )}
              <p className="ws-muted mt-3 text-center text-[11px]">
                {needsReview
                  ? "Saving edits also marks the text as reviewed."
                  : "Ready to generate a structured brief from this text."}
              </p>
            </div>
          </aside>
        </div>
      )}

      {!extractPhase && !reviewPhase && (
        <div
          className={
            sourceExpanded
              ? "grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,38%)] lg:items-start"
              : "flex w-full flex-col gap-4"
          }
        >
          {hasSummary && !sourceExpanded && <div className="w-full">{sourcePanel}</div>}

          <div className={`min-w-0 ${sourceExpanded ? "order-1" : ""}`}>
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
              onTranslate={handleTranslate}
            />
          </div>

          {sourceExpanded && (
            <div className="order-2 lg:sticky lg:top-36 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
              {sourcePanel}
            </div>
          )}
        </div>
      )}
    </WorkflowLayout>
  );
}
