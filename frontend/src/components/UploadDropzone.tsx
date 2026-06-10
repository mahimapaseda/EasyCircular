"use client";

import { useCallback, useState } from "react";

type UploadDropzoneProps = {
  disabled?: boolean;
};

export default function UploadDropzone({ disabled = true }: UploadDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const onFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled) return;
      setSelectedFile(file.name);
    },
    [disabled],
  );

  return (
    <div className="card overflow-hidden p-6 transition-shadow duration-300 hover:shadow-glow sm:p-8">
      <label
        htmlFor="circular-upload"
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFile(e.dataTransfer.files[0]);
        }}
        className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-300 ${
          dragOver
            ? "scale-[1.02] border-grape-400 bg-grape-500/10 shadow-glow"
            : "border-slate-300 bg-slate-50/80 hover:border-brand-400 hover:bg-brand-50/60 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
        } ${disabled ? "cursor-not-allowed" : ""}`}
      >
        <div
          className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 via-grape-500 to-coral-500 text-white shadow-glow transition-transform duration-300 ${
            dragOver ? "scale-110" : "animate-float-slow"
          }`}
        >
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <p className="text-lg font-semibold text-slate-900 dark:text-white">
          Drop your circular PDF here
        </p>
        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          or click to browse · PDF only · up to 20 MB
        </p>

        {selectedFile ? (
          <p className="mt-4 animate-scale-in rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-brand-700 shadow-sm dark:bg-slate-800 dark:text-brand-300">
            Selected: {selectedFile}
          </p>
        ) : (
          <span className="btn-primary mt-6 pointer-events-none">
            Choose file
          </span>
        )}

        {disabled && (
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
            Uploading isn&apos;t switched on yet.
          </p>
        )}

        <input
          id="circular-upload"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
    </div>
  );
}
