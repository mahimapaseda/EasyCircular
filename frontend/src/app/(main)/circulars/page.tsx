"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AnimateIn from "@/components/AnimateIn";
import { useAuth } from "@/context/AuthContext";
import {
  listCirculars,
  statusLabel,
  type Circular,
} from "@/lib/circulars";

function statusClasses(status: Circular["status"]) {
  switch (status) {
    case "extracted":
      return "bg-mint-100 text-mint-800 dark:bg-mint-500/15 dark:text-mint-300";
    case "failed":
      return "bg-coral-100 text-coral-800 dark:bg-coral-500/15 dark:text-coral-300";
    case "processing":
      return "bg-sun-100 text-sun-800 dark:bg-sun-500/15 dark:text-sun-300";
    case "completed":
      return "bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

export default function CircularsPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await listCirculars();
        if (!cancelled) {
          setItems(data.items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load circulars");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!authLoading) {
      void load();
    }

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <AnimateIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              My Circulars
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Everything you&apos;ve uploaded, with its current status.
            </p>
          </div>
          <Link href="/#upload" className="btn-primary w-full sm:w-auto">
            Upload new circular
          </Link>
        </div>

        {!authLoading && !user && (
          <div className="card mt-6 border-brand-200 bg-brand-50/50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <Link
                href="/sign-in"
                className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                Sign in
              </Link>{" "}
              to keep circulars across devices. Without an account, uploads from
              this browser are listed here temporarily.
            </p>
          </div>
        )}

        {error && (
          <div className="card mt-6 border-coral-200 bg-coral-50 p-4 text-sm text-coral-800 dark:border-coral-500/30 dark:bg-coral-500/10 dark:text-coral-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="card mt-8 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading circulars…
          </div>
        ) : items.length === 0 ? (
          <div className="card mt-8 flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 via-grape-500 to-coral-500 text-white shadow-glow">
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
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
              Nothing here yet
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Upload your first circular to pull out the text, review it, and get a
              clear summary. Your uploads will show up on this page.
            </p>
            <Link href="/#upload" className="btn-primary mt-6">
              Upload your first circular
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/circular/${item.id}`}
                  className="card flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-glow sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                      {item.originalFilename}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(item.status)}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AnimateIn>
    </div>
  );
}
