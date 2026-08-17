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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlLines(value: string): string {
  return escapeHtml(value).replace(/\r\n|\n/g, "<br>");
}

function buildPdfHtml(circular: Circular): string {
  const summary = circular.summary;
  if (!summary) return "";

  const metaFields: [string, string | null | undefined][] = [
    ["Circular number", summary.circularNumber],
    ["Issued date", summary.issuedDate],
    ["Issued by", summary.issuedBy],
    ["Audience", summary.targetAudience],
    ["Effective", summary.effectiveDate],
  ];
  const metaHtml = metaFields
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<div class="meta-row"><dt>${escapeHtml(label)}</dt><dd>${htmlLines(String(value))}</dd></div>`,
    )
    .join("");

  const sectionsHtml = summary.sections
    .map(
      (section) =>
        `<section><h2>${escapeHtml(section.heading)}</h2><p>${htmlLines(section.content)}</p></section>`,
    )
    .join("");

  const actionsHtml =
    summary.actionItems.length > 0
      ? `<section><h2>Action items</h2><ul>${summary.actionItems
          .map((item) => `<li>${htmlLines(item)}</li>`)
          .join("")}</ul></section>`
      : "";

  return `
    <style>
      .ec-brief { font-family: "Segoe UI", "Nirmala UI", "Iskoola Pota", "Noto Sans Sinhala", "Noto Sans Tamil", Arial, sans-serif; color: #0f172a; font-size: 13px; line-height: 1.55; }
      .ec-brief .kicker { margin: 0 0 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #64748b; }
      .ec-brief h1 { margin: 0 0 10px; font-size: 18px; line-height: 1.3; font-weight: 700; }
      .ec-brief .source { margin: 0 0 18px; font-size: 11px; color: #475569; }
      .ec-brief dl { margin: 0 0 20px; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; }
      .ec-brief .meta-row { display: flex; gap: 12px; margin: 0 0 6px; }
      .ec-brief .meta-row:last-child { margin-bottom: 0; }
      .ec-brief dt { flex: 0 0 120px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; }
      .ec-brief dd { margin: 0; flex: 1; }
      .ec-brief h2 { margin: 18px 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
      .ec-brief p { margin: 0; white-space: pre-wrap; }
      .ec-brief ul { margin: 0; padding-left: 18px; }
      .ec-brief li { margin: 0 0 6px; }
      .ec-brief .footer { margin-top: 28px; font-size: 10px; color: #94a3b8; }
    </style>
    <div class="ec-brief">
      <p class="kicker">EasyCircular brief</p>
      <h1>${htmlLines(summary.title)}</h1>
      <p class="source">Source: ${escapeHtml(circular.originalFilename)} · ${escapeHtml(new Date(circular.updatedAt).toLocaleString())}</p>
      ${metaHtml ? `<dl>${metaHtml}</dl>` : ""}
      ${sectionsHtml}
      ${actionsHtml}
      <p class="footer">Generated by EasyCircular</p>
    </div>
  `;
}

export async function exportSummaryAsPdf(circular: Circular): Promise<void> {
  if (!circular.summary || typeof document === "undefined") return;

  const [{ jsPDF }] = await Promise.all([import("jspdf"), import("html2canvas")]);

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "absolute",
    left: "0",
    top: "0",
    width: "794px",
    background: "#ffffff",
    color: "#0f172a",
    opacity: "0",
    pointerEvents: "none",
    zIndex: "-1",
  });
  host.innerHTML = buildPdfHtml(circular);
  document.body.appendChild(host);

  const filename = `${safeFilename(circular.originalFilename.replace(/\.pdf$/i, ""))}-summary.pdf`;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  try {
    await doc.html(host, {
      margin: [40, 40, 48, 40],
      autoPaging: "text",
      width: 515,
      windowWidth: 794,
      html2canvas: {
        scale: 0.72,
        backgroundColor: "#ffffff",
        useCORS: true,
      },
    });
    doc.save(filename);
  } finally {
    host.remove();
  }
}
