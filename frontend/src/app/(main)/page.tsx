import Link from "next/link";
import HealthStatus from "@/components/HealthStatus";
import UploadDropzone from "@/components/UploadDropzone";
import WorkflowStepper from "@/components/workflow/WorkflowStepper";

export default function HomePage() {
  return (
    <div>
      <section className="border-b border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              Sri Lanka Ministry of Education
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl lg:text-5xl">
              Turn long circulars into clear, actionable summaries
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-600 dark:text-ink-300">
              Upload an official school circular, verify extracted text, and
              generate a structured summary with dates, legal references, and
              action items — with human review at every step.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="#upload" className="btn-primary">
                Upload circular
              </Link>
              <Link href="/circulars" className="btn-secondary">
                Open library
              </Link>
            </div>
          </div>

          <div className="panel">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-white">
              System status
            </h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              API, database, and AI pipeline health.
            </p>
            <div className="mt-4">
              <HealthStatus />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-ink-900 dark:text-white">
            Processing workflow
          </h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            A guided four-step pipeline designed for school administrators.
          </p>
        </div>
        <WorkflowStepper currentStep={1} />
      </section>

      <section
        id="upload"
        className="border-t border-ink-200 bg-ink-50/60 dark:border-ink-800 dark:bg-ink-950/40"
      >
        <div className="mx-auto max-w-3xl scroll-mt-24 px-4 py-12 sm:px-6">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-ink-900 dark:text-white">
              Upload a circular
            </h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              PDF only · up to 20 MB · digital or scanned documents supported
            </p>
          </div>
          <UploadDropzone />
        </div>
      </section>
    </div>
  );
}
