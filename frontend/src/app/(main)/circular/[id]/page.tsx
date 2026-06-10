import ProcessingStatus from "@/components/ProcessingStatus";
import Link from "next/link";

type CircularPageProps = {
  params: { id: string };
};

export default function CircularPage({ params }: CircularPageProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-8">
        <Link
          href="/circulars"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
        >
          ← Back to circulars
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
          Circular workflow
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Reference ID: <span className="font-mono">{params.id}</span>
        </p>
      </div>

      <ProcessingStatus currentStep={2} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Extracted text
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Read through the text pulled from the PDF and fix anything that came
            out wrong.
          </p>
          <div className="mt-4 min-h-[200px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-500">
            The circular text will show up here once it&apos;s ready.
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Summary &amp; entities
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            The purpose, deadlines, and action items, with key entities
            highlighted.
          </p>
          <div className="mt-4 min-h-[200px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-500">
            The summary will appear here after the circular is processed.
          </div>
        </section>
      </div>
    </div>
  );
}
