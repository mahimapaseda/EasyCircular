import Link from "next/link";
import HealthStatus from "@/components/HealthStatus";

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-brand-100 bg-gradient-to-b from-white to-brand-50/40 dark:border-ink-800 dark:from-ink-950 dark:to-ink-950">
      {/* Top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-600 shadow-sm">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-black text-ink-900 dark:text-white">EasyCircular</span>
            </div>
            <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-ink-500 dark:text-ink-400">
              AI-powered document intelligence for Sri Lankan Ministry of Education circulars.
              Helping school principals and administrative staff understand circulars faster.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/" className="text-xs font-semibold text-ink-400 hover:text-brand-600 dark:text-ink-600 dark:hover:text-brand-400">
                Home
              </Link>
              <span className="text-ink-200 dark:text-ink-800">·</span>
              <Link href="/circulars" className="text-xs font-semibold text-ink-400 hover:text-brand-600 dark:text-ink-600 dark:hover:text-brand-400">
                Library
              </Link>
              <span className="text-ink-200 dark:text-ink-800">·</span>
              <Link href="/sign-in" className="text-xs font-semibold text-ink-400 hover:text-brand-600 dark:text-ink-600 dark:hover:text-brand-400">
                Sign in
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                Next.js 14
              </span>
              <span className="rounded-full bg-fuchsia-100 px-2.5 py-0.5 text-[11px] font-bold text-fuchsia-600 dark:bg-fuchsia-950/50 dark:text-fuchsia-400">
                FastAPI
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                MongoDB
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                LangChain
              </span>
            </div>
            <p className="mt-5 text-xs font-medium text-ink-300 dark:text-ink-700">
              University of Bedfordshire · Y3 Dissertation Project · Phase 4 MVP
            </p>
          </div>

          {/* System health */}
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-ink-400 dark:text-ink-600">
              System Health
            </p>
            <div className="rounded-2xl border-2 border-brand-100 bg-white p-4 shadow-panel dark:border-ink-800 dark:bg-ink-900">
              <HealthStatus compact />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
