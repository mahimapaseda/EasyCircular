"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import SummaryPanel from "@/components/SummaryPanel";
import SourceTextPanel from "@/components/workspace/SourceTextPanel";
import WorkflowLayout from "@/components/workflow/WorkflowLayout";
import { extractionConfidence } from "@/components/workspace/workspaceUtils";
import { useToast } from "@/context/ToastContext";
import {
  displayText,
  extractCircularText,
  fetchCircular,
  processCircular,
  saveCircularText,
  workflowStep,
  type Circular,
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
      const result = await processCircular(id);
      setCircular(result.circular);
      setDraftText(displayText(result.circular));
      if (result.circular.entities.length > 0) setTextView("highlights");
      setSourceExpanded(false);
      showToast(
        result.cached
          ? "Loaded a cached summary for identical text."
          : "Summary generated successfully.",
        "success",
      );
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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        <p className="text-sm font-semibold text-ink-600 dark:text-ink-400">Loading document…</p>
      </div>
    );
  }

  if (!circular) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-bold text-rose-700 dark:text-rose-400">{error || "Circular not found"}</p>
        <Link href="/circulars" className="btn-secondary">← Back to documents</Link>
      </div>
    );
  }

  const step = workflowStep(circular);
  const hasText = Boolean(displayText(circular));
  const sourceText = displayText(circular);
  const confidence = extractionConfidence(circular);
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
        className="btn-primary gap-2 py-2 text-sm"
      >
        {processing || circular.status === "processing" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Summarizing…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Generate summary
          </>
        )}
      </button>
    ) : null;

  return (
    <WorkflowLayout circular={circular} currentStep={step} actions={generateButton}>
      {error && (
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100">
          <p className="font-semibold">{error}</p>
          <button type="button" onClick={() => void load()} className="btn-secondary shrink-0 text-xs">
            Retry
          </button>
        </div>
      )}

      <div className="space-y-5">
        <SummaryPanel
          circular={circular}
          processing={processing}
          onExport={(format) =>
            showToast(`Summary exported as ${format.toUpperCase()}.`, "success")
          }
        />

        {!circular.summary && canProcess && hasText && (
          <div className="ws-card flex flex-col items-center gap-3 border border-dashed border-brand-200 p-8 text-center dark:border-brand-800">
            <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">
              Text is ready — generate a structured summary
            </p>
            <button
              type="button"
              onClick={() => void handleProcess()}
              disabled={processing || circular.status === "processing"}
              className="btn-primary"
            >
              Generate AI Summary
            </button>
          </div>
        )}

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
          onToggle={() => setSourceExpanded((v) => !v)}
          onTextViewChange={setTextView}
          onDraftChange={setDraftText}
          onExtract={() => void handleExtract()}
          onSave={() => void handleSave()}
          onReset={() => setDraftText(circular.extractedText ?? "")}
        />
      </div>
    </WorkflowLayout>
  );
}
