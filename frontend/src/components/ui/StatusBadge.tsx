import type { CircularStatus } from "@/lib/circulars";
import { statusLabel } from "@/lib/circulars";

const STYLES: Record<CircularStatus, string> = {
  uploaded: "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300",
  extracted: "bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300",
  processing: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  failed: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
};

type StatusBadgeProps = {
  status: CircularStatus;
  className?: string;
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span className={`badge ${STYLES[status]} ${className}`}>
      {statusLabel(status)}
    </span>
  );
}
