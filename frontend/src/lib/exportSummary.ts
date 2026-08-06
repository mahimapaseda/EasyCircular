import type { Circular, CircularSummary } from "@/lib/circulars";

function buildPlainText(
  circular: Circular,
  summary: CircularSummary,
): string {
  const lines = [
    summary.title,
    "=".repeat(Math.min(summary.title.length, 60)),
    "",
    `Source file: ${circular.originalFilename}`,
    `Generated: ${new Date(circular.updatedAt).toLocaleString()}`,
    "",
  ];

  // Metadata block
  const metaFields: [string, string | null | undefined][] = [
    ["Circular Number", summary.circularNumber],
    ["Issued Date", summary.issuedDate],
    ["Issued By", summary.issuedBy],
    ["Target Audience", summary.targetAudience],
    ["Effective Date", summary.effectiveDate],
  ];
  const metaLines = metaFields
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`);
  if (metaLines.length > 0) {
    lines.push("CIRCULAR DETAILS");
    lines.push("----------------");
    for (const line of metaLines) {
      lines.push(line);
    }
    lines.push("");
  }

  for (const section of summary.sections) {
    lines.push(section.heading.toUpperCase());
    lines.push("-".repeat(section.heading.length));
    lines.push(section.content);
    lines.push("");
  }

  if (summary.actionItems.length > 0) {
    lines.push("ACTION ITEMS");
    lines.push("------------");
    for (const item of summary.actionItems) {
      lines.push(`• ${item}`);
    }
    lines.push("");
  }

  if (circular.entities.length > 0) {
    lines.push("KEY ENTITIES");
    lines.push("------------");
    for (const entity of circular.entities) {
      lines.push(`• [${entity.label}] ${entity.text}`);
    }
  }

  return lines.join("\n").trim();
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeFilename(name: string): string {
  return name.replace(/[^\w.\-() ]/g, "_").replace(/\s+/g, "-") || "circular";
}

export function exportSummaryAsTxt(circular: Circular) {
  if (!circular.summary) return;
  const content = buildPlainText(circular, circular.summary);
  const base = safeFilename(circular.originalFilename.replace(/\.pdf$/i, ""));
  downloadBlob(`${base}-summary.txt`, content, "text/plain;charset=utf-8");
}

export function exportSummaryAsMarkdown(circular: Circular) {
  if (!circular.summary) return;
  const content =
    circular.summary.rawMarkdown ||
    buildPlainText(circular, circular.summary).replace(/^/gm, "");
  const base = safeFilename(circular.originalFilename.replace(/\.pdf$/i, ""));
  downloadBlob(`${base}-summary.md`, content, "text/markdown;charset=utf-8");
}
