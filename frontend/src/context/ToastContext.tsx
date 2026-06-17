"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_CONFIG = {
  success: {
    bar: "bg-gradient-to-r from-emerald-500 to-teal-500",
    border: "border-emerald-200 dark:border-emerald-700/50",
    bg: "bg-white dark:bg-ink-900",
    icon: (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm">
        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    text: "text-emerald-900 dark:text-emerald-100",
  },
  error: {
    bar: "bg-gradient-to-r from-rose-500 to-pink-500",
    border: "border-rose-200 dark:border-rose-700/50",
    bg: "bg-white dark:bg-ink-900",
    icon: (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-sm">
        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    text: "text-rose-900 dark:text-rose-100",
  },
  info: {
    bar: "bg-gradient-to-r from-brand-500 to-fuchsia-500",
    border: "border-brand-200 dark:border-brand-700/50",
    bg: "bg-white dark:bg-ink-900",
    icon: (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-600 shadow-sm">
        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      </div>
    ),
    text: "text-ink-900 dark:text-ink-100",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const config = TOAST_CONFIG[toast.tone];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto animate-fade-up overflow-hidden rounded-2xl border-2 shadow-toast ${config.border} ${config.bg}`}
            >
              {/* Top color bar */}
              <div className={`h-1 w-full ${config.bar}`} />
              <div className="flex items-center gap-3 px-4 py-3.5">
                {config.icon}
                <p className={`text-sm font-semibold leading-tight ${config.text}`}>
                  {toast.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
