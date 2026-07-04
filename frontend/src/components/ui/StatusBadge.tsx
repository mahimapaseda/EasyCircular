import type { CircularStatus } from "@/lib/circulars";
import { statusLabel } from "@/lib/circulars";

const STYLES: Record<CircularStatus, string> = {
  uploaded: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  extracted: "border-purple-400/30 bg-purple-400/10 text-purple-300",
  processing: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  failed: "border-rose-400/30 bg-rose-400/10 text-rose-300",
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
