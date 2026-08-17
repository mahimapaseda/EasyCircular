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

function padIndex(index: number): string {
  return String(index).padStart(2, "0");
}

function isCircularNumberHeading(heading: string): boolean {
  return /^(circular\s*number|circular\s*no\.?)$/i.test(heading.trim());
}

function buildPdfHtml(circular: Circular): string {
  const summary = circular.summary;
  if (!summary) return "";

  const generatedAt = new Date(circular.updatedAt).toLocaleString();
  const numberLabel = summary.circularNumber
    ? escapeHtml(summary.circularNumber)
    : "Brief";

  const metaFields: [string, string | null | undefined][] = [
    ["Circular", summary.circularNumber],
    ["Issued", summary.issuedDate],
    ["Issued by", summary.issuedBy],
    ["Effective", summary.effectiveDate],
    ["Audience", summary.targetAudience],
  ];
  const filledMeta = metaFields.filter(([, value]) => Boolean(value));
  const metaHtml = filledMeta
    .map(
      ([label, value], index) => `
        <tr${index === filledMeta.length - 1 ? ' class="last"' : ""}>
          <td class="meta-label">${escapeHtml(label)}</td>
          <td class="meta-value">${htmlLines(String(value))}</td>
        </tr>`,
    )
    .join("");

  const bodySections = summary.sections.filter(
    (section) => !isCircularNumberHeading(section.heading),
  );

  let sectionIndex = 1;
  const sectionsHtml = bodySections
    .map((section) => {
      const n = padIndex(sectionIndex++);
      return `
        <table class="block" cellpadding="0" cellspacing="0">
          <tr>
            <td class="idx">${n}</td>
            <td>
              <h2>${escapeHtml(section.heading)}</h2>
              <p>${htmlLines(section.content)}</p>
            </td>
          </tr>
        </table>`;
    })
    .join("");

  const actionsHtml =
    summary.actionItems.length > 0
      ? `
        <table class="block" cellpadding="0" cellspacing="0">
          <tr>
            <td class="idx">${padIndex(sectionIndex)}</td>
            <td>
              <h2>Action items</h2>
              <table class="actions" cellpadding="0" cellspacing="0">
                ${summary.actionItems
                  .map(
                    (item, i) => `
                  <tr>
                    <td class="act-n">${i + 1}.</td>
                    <td class="act-t">${htmlLines(item)}</td>
                  </tr>`,
                  )
                  .join("")}
              </table>
            </td>
          </tr>
        </table>`
      : "";

  return `
    <style>
      .ec-brief {
        box-sizing: border-box;
        width: 794px;
        padding: 44px 48px 36px;
        background: #ffffff;
        color: #0f172a;
        font-family: "Segoe UI", "Nirmala UI", "Iskoola Pota", "Noto Sans Sinhala", "Noto Sans Tamil", Arial, sans-serif;
        font-size: 13.5px;
        line-height: 1.55;
      }
      .ec-brief table { width: 100%; border-collapse: collapse; }
      .ec-brief td { vertical-align: top; }
      .masthead { margin-bottom: 22px; border-bottom: 3px solid #0e7490; }
      .masthead td { padding: 0 0 14px; }
      .brand {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #0e7490;
      }
      .doc-type {
        text-align: right;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #64748b;
      }
      .title-wrap { margin: 0 0 18px; }
      .circ-chip {
        display: inline-block;
        margin: 0 0 10px;
        padding: 3px 9px;
        background: #ecfeff;
        border: 1px solid #a5f3fc;
        color: #0e7490;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
      }
      .ec-brief h1 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 22px;
        line-height: 1.28;
        font-weight: 700;
        color: #0f172a;
      }
      .source {
        margin: 10px 0 0;
        font-size: 11px;
        color: #64748b;
      }
      .meta {
        margin: 0 0 22px;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
      }
      .meta td { padding: 8px 14px; }
      .meta tr.last td { border-bottom: none; }
      .meta tr td { border-bottom: 1px solid #e0f2fe; }
      .meta-label {
        width: 118px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #0369a1;
      }
      .meta-value { font-size: 13px; color: #0f172a; }
      .block { margin: 0 0 16px; }
      .idx {
        width: 36px;
        padding-top: 2px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.06em;
        color: #0e7490;
      }
      .ec-brief h2 {
        margin: 0 0 6px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #0f172a;
      }
      .ec-brief p { margin: 0; color: #1e293b; }
      .actions {
        margin-top: 4px;
        background: #f8fafc;
        border-left: 3px solid #0e7490;
      }
      .actions td { padding: 7px 12px; }
      .act-n {
        width: 28px;
        font-weight: 700;
        color: #0e7490;
      }
      .act-t { color: #1e293b; }
      .foot {
        margin-top: 28px;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
        font-size: 10px;
        color: #64748b;
      }
      .foot .muted { color: #94a3b8; }
    </style>
    <div class="ec-brief">
      <table class="masthead" cellpadding="0" cellspacing="0">
        <tr>
          <td class="brand">EasyCircular</td>
          <td class="doc-type">Circular brief</td>
        </tr>
      </table>
      <div class="title-wrap">
        <span class="circ-chip">${numberLabel}</span>
        <h1>${htmlLines(summary.title)}</h1>
        <p class="source">${escapeHtml(circular.originalFilename)} · Generated ${escapeHtml(generatedAt)}</p>
      </div>
      ${metaHtml ? `<table class="meta" cellpadding="0" cellspacing="0">${metaHtml}</table>` : ""}
      ${sectionsHtml}
      ${actionsHtml}
      <p class="foot">
        EasyCircular · For school principals and education officers · Not a substitute for the original circular
        <span class="muted"> · ${escapeHtml(circular.originalFilename)}</span>
      </p>
    </div>
  `;
}

function waitFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export async function exportSummaryAsPdf(circular: Circular): Promise<void> {
  if (!circular.summary || typeof document === "undefined") return;

  const [{ jsPDF }, html2canvasModule] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const html2canvas = html2canvasModule.default;

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "794px",
    background: "#ffffff",
    color: "#0f172a",
    opacity: "1",
    pointerEvents: "none",
  });
  host.innerHTML = buildPdfHtml(circular);
  document.body.appendChild(host);

  const filename = `${safeFilename(circular.originalFilename.replace(/\.pdf$/i, ""))}-summary.pdf`;

  try {
    await waitFrame();
    const canvas = await html2canvas(host, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: host.scrollWidth,
      windowHeight: host.scrollHeight,
      onclone: (_doc, cloned) => {
        cloned.style.left = "0";
        cloned.style.top = "0";
        cloned.style.opacity = "1";
        cloned.style.position = "static";
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let offsetY = 0;

    pdf.addImage(imgData, "JPEG", 0, offsetY, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      offsetY = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, offsetY, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } finally {
    host.remove();
  }
}
