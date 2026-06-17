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
    <div className="group relative">
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
        className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-8 py-14 text-center transition-all duration-300 ${
          dragOver
            ? "border-brand-400 bg-gradient-to-br from-brand-50 to-fuchsia-50 shadow-glow dark:border-brand-500 dark:from-brand-950/30 dark:to-fuchsia-950/20"
            : uploading
            ? "border-fuchsia-300 bg-fuchsia-50/40 dark:border-fuchsia-700 dark:bg-fuchsia-950/20"
            : "border-brand-200 bg-gradient-to-br from-brand-50/60 to-fuchsia-50/30 hover:border-brand-400 hover:shadow-panel-hover dark:border-ink-700 dark:from-ink-900 dark:to-fuchsia-950/10"
        } ${disabled || uploading ? "cursor-not-allowed opacity-80" : ""}`}
      >
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-fuchsia-300/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-brand-300/10 blur-2xl" />

        {/* Icon */}
        <div
          className={`relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br transition-all duration-300 ${
            uploading
              ? "from-fuchsia-500 to-violet-600 shadow-lg shadow-fuchsia-500/30"
              : "from-brand-500 to-fuchsia-600 shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/45"
          }`}
        >
          {uploading ? (
            <svg className="h-8 w-8 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : dragOver ? (
            <svg className="h-8 w-8 animate-bounce text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A3.375 3.375 0 006.75 21h10.5a3.375 3.375 0 003.375-3.375V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          ) : (
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A3.375 3.375 0 006.75 21h10.5a3.375 3.375 0 003.375-3.375V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          )}
        </div>

        <p className="text-xl font-black tracking-tight text-ink-900 dark:text-white">
          {uploading ? "Uploading your circular…" : dragOver ? "Drop it here!" : "Drop PDF or browse"}
        </p>
        <p className="mt-2 text-sm font-medium text-ink-500 dark:text-ink-400">
          {uploading
            ? "Please wait while we store your document"
            : "Ministry of Education circulars · PDF · max 20 MB"}
        </p>

        {/* File types */}
        {!uploading && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {["Sinhala", "Tamil", "English"].map((lang) => (
              <span
                key={lang}
                className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-600 shadow-sm ring-1 ring-brand-100 dark:bg-ink-800 dark:text-brand-300 dark:ring-brand-800"
              >
                {lang}
              </span>
            ))}
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-fuchsia-600 shadow-sm ring-1 ring-fuchsia-100 dark:bg-ink-800 dark:text-fuchsia-300 dark:ring-fuchsia-800">
              OCR supported
            </span>
          </div>
        )}

        {!uploading && (
          <span className="btn-primary pointer-events-none mt-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Choose file
          </span>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
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
