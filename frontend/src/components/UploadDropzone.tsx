"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { uploadCircular } from "@/lib/circulars";

const MAX_SIZE = 20 * 1024 * 1024;

type UploadDropzoneProps = {
  disabled?: boolean;
};

export default function UploadDropzone({ disabled = false }: UploadDropzoneProps) {
  const router = useRouter();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (disabled || uploading) return;

      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setError("Please choose a PDF file.");
        return;
      }

      if (file.size > MAX_SIZE) {
        setError("File exceeds the 20 MB limit.");
        return;
      }

      setError(null);
      setUploading(true);

      try {
        const circular = await uploadCircular(file);
        router.push(`/circular/${circular.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setUploading(false);
      }
    },
    [disabled, uploading, router],
  );

  const onFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled || uploading) return;
      void handleUpload(file);
    },
    [disabled, uploading, handleUpload],
  );

  return (
    <div className="panel">
      <label
        htmlFor="circular-upload"
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFile(e.dataTransfer.files[0]);
        }}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
          dragOver
            ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/30"
            : "border-ink-300 bg-ink-50/80 hover:border-brand-400 hover:bg-brand-50/50 dark:border-ink-700 dark:bg-ink-950/40"
        } ${disabled || uploading ? "cursor-not-allowed opacity-80" : ""}`}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-white">
          {uploading ? (
            <svg className="h-7 w-7 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A3.375 3.375 0 006.75 21h10.5a3.375 3.375 0 003.375-3.375V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          )}
        </div>

        <p className="text-lg font-semibold text-ink-900 dark:text-white">
          {uploading ? "Uploading…" : "Drop PDF here or browse"}
        </p>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
          Ministry of Education circulars · max 20 MB
        </p>

        {!uploading && <span className="btn-primary mt-6 pointer-events-none">Choose file</span>}

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </p>
        )}

        <input
          id="circular-upload"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
    </div>
  );
}
