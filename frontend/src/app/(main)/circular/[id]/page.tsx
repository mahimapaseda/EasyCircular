import CircularWorkflow from "@/components/CircularWorkflow";
import Link from "next/link";

type CircularPageProps = {
  params: { id: string };
};

export default function CircularPage({ params }: CircularPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/circulars"
            className="text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300"
          >
            ← Back to library
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-ink-900 dark:text-white">
            Document workspace
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Reference <span className="font-mono text-xs">{params.id}</span>
          </p>
        </div>
      </div>

      <CircularWorkflow id={params.id} />
    </div>
  );
}
