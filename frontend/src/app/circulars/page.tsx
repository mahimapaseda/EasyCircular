import Link from "next/link";

export default function CircularsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
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
    </div>
  );
}
