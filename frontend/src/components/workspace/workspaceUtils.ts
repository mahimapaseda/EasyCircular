import { displayText, type Circular } from "@/lib/circulars";

export function extractionConfidence(circular: Circular): number | null {
  const text = displayText(circular);
  if (!text) return null;
  const pages = Math.max(circular.processingMeta.pageCount, 1);
  const density = text.length / pages;
  if (circular.processingMeta.ocrUsed) {
    return Math.min(92, Math.max(72, Math.round(68 + density / 45)));
  }
  return Math.min(98, Math.max(88, Math.round(88 + Math.min(density / 80, 10))));
}

export function wordCount(circular: Circular): number {
  const text = displayText(circular);
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
