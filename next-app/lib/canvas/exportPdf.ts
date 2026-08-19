import jsPDF from "jspdf";
import type { MindmapEdge, MindmapNode } from "@/lib/types";
import { collectBranches, getSortedSteps, type RoadmapExportMeta } from "@/lib/canvas/exportOutline";

// Warna brand (§4 CLAUDE.md) sebagai RGB tuple — format yang dipakai jsPDF.
const INK: [number, number, number] = [34, 27, 20]; // #221B14
const INK_SECONDARY: [number, number, number] = [110, 98, 85]; // #6E6255
const CLAY: [number, number, number] = [199, 91, 57]; // #C75B39
const LINE: [number, number, number] = [231, 217, 198]; // #E7D9C6

const MARGIN_X = 56;
const MARGIN_TOP = 64;
const MARGIN_BOTTOM = 56;

type WriteOptions = {
  fontSize: number;
  bold?: boolean;
  italic?: boolean;
  color?: [number, number, number];
  indent?: number;
  spacingAfter?: number;
};

// Bikin dokumen PDF terstruktur — teks asli (bisa di-select/di-search),
// bukan screenshot canvas di-embed sebagai gambar (beda dari export PNG).
// Strukturnya sama persis kayak `buildRoadmapDocx()` (`exportDocx.ts`),
// cuma jsPDF gak punya word-wrap/pagination otomatis kayak `docx` — dua
// hal itu ditangani manual lewat `splitTextToSize()` + `ensureSpace()`.
export function buildRoadmapPdf(meta: RoadmapExportMeta, nodes: MindmapNode[], edges: MindmapEdge[]): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN_X * 2;

  let y = MARGIN_TOP;

  function ensureSpace(lineHeight: number) {
    if (y + lineHeight > pageHeight - MARGIN_BOTTOM) {
      doc.addPage();
      y = MARGIN_TOP;
    }
  }

  function divider() {
    ensureSpace(14);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.75);
    doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);
    y += 14;
  }

  function writeText(text: string, opts: WriteOptions) {
    const { fontSize, bold, italic, color = INK, indent = 0, spacingAfter = 0 } = opts;
    const lineHeight = fontSize * 1.35;
    doc.setFont("helvetica", bold ? "bold" : italic ? "italic" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);

    const lines: string[] = doc.splitTextToSize(text, contentWidth - indent);
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, MARGIN_X + indent, y);
      y += lineHeight;
    }
    y += spacingAfter;
  }

  writeText(meta.title, { fontSize: 22, bold: true, spacingAfter: 8 });
  writeText(`Topik: ${meta.topic}`, { fontSize: 10, color: INK_SECONDARY, spacingAfter: 2 });

  const steps = getSortedSteps(nodes);
  writeText(`Target waktu: ${meta.timeframe} · ${steps.length} langkah roadmap`, {
    fontSize: 10,
    color: INK_SECONDARY,
    spacingAfter: 16,
  });

  for (const step of steps) {
    divider();
    writeText(`${step.data.num ?? ""} · ${step.data.label}`.trim(), { fontSize: 14, bold: true, color: CLAY, spacingAfter: 4 });

    const metaBits = [step.data.timeMark, step.data.isCompleted ? "Selesai" : null].filter(Boolean).join("   ·   ");
    if (metaBits) {
      writeText(metaBits, { fontSize: 9, italic: true, color: INK_SECONDARY, spacingAfter: 6 });
    }

    if (step.data.description) {
      writeText(step.data.description, { fontSize: 10.5, spacingAfter: 10 });
    }

    for (const { node: branch, depth } of collectBranches(step.id, edges, nodes)) {
      const indent = 14 + depth * 18;
      writeText(`•  ${branch.data.label}`, {
        fontSize: 10.5,
        bold: true,
        color: CLAY,
        indent,
        spacingAfter: branch.data.description ? 2 : 8,
      });
      if (branch.data.description) {
        writeText(branch.data.description, { fontSize: 9.5, color: INK_SECONDARY, indent: indent + 12, spacingAfter: 8 });
      }
    }

    y += 4;
  }

  divider();
  writeText(
    `Dibuat dengan SecondMind · ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    { fontSize: 8.5, italic: true, color: INK_SECONDARY },
  );

  return doc;
}
