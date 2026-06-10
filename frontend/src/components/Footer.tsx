import HealthStatus from "@/components/HealthStatus";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              EasyCircular
            </p>
            <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Clearer Ministry of Education circulars for school principals and
              administrative staff.
            </p>
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              University of Bedfordshire · Y3 Project
            </p>
          </div>
          <HealthStatus compact />
        </div>
      </div>
    </footer>
  );
}
