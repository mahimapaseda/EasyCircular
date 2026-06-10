import CircularWorkflow from "@/components/CircularWorkflow";
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

      <CircularWorkflow id={params.id} />
    </div>
  );
}
