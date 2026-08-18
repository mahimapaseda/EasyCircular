import type { CircularStatus } from "@/lib/circulars";
import { statusLabel } from "@/lib/circulars";

const STYLES: Record<CircularStatus, string> = {
  uploaded: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300",
  extracted: "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-400/30 dark:bg-purple-400/10 dark:text-purple-300",
  processing: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
  failed: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300",
};

type StatusBadgeProps = {
  status: CircularStatus;
  className?: string;
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STYLES[status]} ${className}`}>
      {statusLabel(status)}
    </span>
  );
}
