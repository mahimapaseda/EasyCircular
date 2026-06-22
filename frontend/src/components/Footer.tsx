import Link from "next/link";
import HealthStatus from "@/components/HealthStatus";

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold text-ink-900 dark:text-white">EasyCircular</span>
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
              {["Next.js 14", "FastAPI", "MongoDB", "LangChain"].map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-[11px] font-semibold text-ink-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-400"
                >
                  {tech}
                </span>
              ))}
            </div>
            <p className="mt-5 text-xs font-medium text-ink-300 dark:text-ink-700">
              University of Bedfordshire · Y3 Dissertation Project · Phase 4 MVP
            </p>
          </div>

          {/* System health */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-400 dark:text-ink-600">
              System Health
            </p>
            <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-panel dark:border-ink-800 dark:bg-ink-900">
              <HealthStatus compact />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
