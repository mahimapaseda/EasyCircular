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
  const autoPipelineStarted = useRef<string | null>(null);
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
        if (!options?.quietSuccess) {
          showToast("Text extracted successfully.", "success");
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
            `${result.guardrailWarnings.length} date warning(s) — review suggested.`,
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

  const runAutoPipeline = useCallback(async () => {
    const extracted = await extractOnce({ quietSuccess: true });
    if (!extracted) return;
    await processOnce({ sourceCircular: extracted });
  }, [extractOnce, processOnce]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    autoPipelineStarted.current = null;
  }, [id]);

  useEffect(() => {
    if (!circular || circular.id !== id) return;
    if (circular.status !== "uploaded") return;
    if (autoPipelineStarted.current === id) return;
    autoPipelineStarted.current = id;
    void runAutoPipeline();
  }, [circular, id, runAutoPipeline]);

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
    await processOnce();
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
  const showManualGenerate =
    !circular.summary && canProcess && hasText && !extracting && !processing;

  const showHeaderGenerate = canProcess && hasText && !hasSummary;
  const generateButton = showHeaderGenerate ? (
    <button
      type="button"
      onClick={() => void handleProcess()}
      disabled={busy}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-slate-900 transition hover:bg-white/95 disabled:opacity-60"
    >
      {busy ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          {extracting ? "Extracting…" : "Summarizing…"}
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
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
    >
      {busy ? "Summarizing…" : "Regenerate"}
    </button>
  ) : null;

  return (
    <WorkflowLayout circular={circular} currentStep={step} actions={generateButton}>
      {error && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-300 sm:flex-row sm:items-center sm:justify-between">
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

      <div
        className={
          hasSummary
            ? sourceExpanded
              ? "grid w-full gap-4 md:grid-cols-[minmax(0,1fr)_minmax(260px,36%)] md:items-start md:gap-5"
              : "flex w-full flex-col gap-3"
            : "mx-auto w-full max-w-2xl space-y-4"
        }
      >
        {hasSummary && !sourceExpanded && (
          <div className="w-full shrink-0">
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
              expanded={sourceExpanded}
              compact
              onToggle={() => setSourceExpanded((v) => !v)}
              onTextViewChange={setTextView}
              onDraftChange={setDraftText}
              onExtract={() => void handleExtract()}
              onSave={() => void handleSave()}
              onReset={() => setDraftText(circular.extractedText ?? "")}
            />
          </div>
        )}

        <div className={`min-w-0 ${hasSummary && sourceExpanded ? "order-1" : ""}`}>
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

        {(!hasSummary || sourceExpanded) && (
          <div
            className={`space-y-3 ${
              hasSummary && sourceExpanded
                ? "order-2 md:sticky md:top-28 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto lg:top-32"
                : ""
            }`}
          >
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
              expanded={sourceExpanded}
              compact={hasSummary}
              onToggle={() => setSourceExpanded((v) => !v)}
              onTextViewChange={setTextView}
              onDraftChange={setDraftText}
              onExtract={() => void handleExtract()}
              onSave={() => void handleSave()}
              onReset={() => setDraftText(circular.extractedText ?? "")}
            />

            {showManualGenerate && (
              <div className="ws-panel px-5 py-5 text-center">
                <p className="text-sm font-semibold text-white">Text is ready</p>
                <p className="ws-muted mt-1 text-xs">
                  Generate a structured brief from the extracted circular.
                </p>
                <button
                  type="button"
                  onClick={() => void handleProcess()}
                  disabled={busy}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-white/95 disabled:opacity-60"
                >
                  Generate summary
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </WorkflowLayout>
  );
}
