import { Document, Packer, Paragraph, TextRun } from "docx";
import type { MindmapEdge, MindmapNode } from "@/lib/types";
import { collectBranches, getSortedSteps, type RoadmapExportMeta } from "@/lib/canvas/exportOutline";

// Warna brand (§4 CLAUDE.md) sebagai hex tanpa "#" — format yang dipakai `docx`.
const BRAND = {
  ink: "221B14",
  inkSecondary: "6E6255",
  clay: "C75B39",
  line: "E7D9C6",
};

// Bikin dokumen Word (.docx) terstruktur — bukan screenshot canvas. Teks
// asli (bisa di-select/di-search/diedit di Word), disusun sebagai outline:
// tiap roadmap-step jadi heading, cabang-cabangnya (termasuk yang nested)
// jadi bullet list berindentasi di bawahnya.
export async function buildRoadmapDocx(
  meta: RoadmapExportMeta,
  nodes: MindmapNode[],
  edges: MindmapEdge[],
): Promise<Blob> {
  const steps = getSortedSteps(nodes);

  const children: Paragraph[] = [
    new Paragraph({ style: "RoadmapTitle", text: meta.title }),
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: `Topik: ${meta.topic}`, color: BRAND.inkSecondary, size: 20 })],
    }),
    new Paragraph({
      spacing: { after: 320 },
      children: [
        new TextRun({
          text: `Target waktu: ${meta.timeframe} · ${steps.length} langkah roadmap`,
          color: BRAND.inkSecondary,
          size: 20,
        }),
      ],
    }),
  ];

  for (const step of steps) {
    children.push(new Paragraph({ style: "StepHeading", text: `${step.data.num ?? ""} · ${step.data.label}`.trim() }));

    const metaBits = [step.data.timeMark, step.data.isCompleted ? "Selesai" : null].filter(Boolean).join("   ·   ");
    if (metaBits) {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: metaBits, italics: true, color: BRAND.inkSecondary, size: 19 })],
        }),
      );
    }

    if (step.data.description) {
      children.push(
        new Paragraph({
          spacing: { after: 160 },
          children: [new TextRun({ text: step.data.description, size: 21 })],
        }),
      );
    }

    for (const { node: branch, depth } of collectBranches(step.id, edges, nodes)) {
      const indentBase = 260 + depth * 320;
      children.push(
        new Paragraph({
          indent: { left: indentBase },
          spacing: { after: branch.data.description ? 30 : 90 },
          children: [
            new TextRun({ text: "● ", bold: true, color: BRAND.clay, size: 18 }),
            new TextRun({ text: branch.data.label, bold: true, size: 21 }),
          ],
        }),
      );
      if (branch.data.description) {
        children.push(
          new Paragraph({
            indent: { left: indentBase + 200 },
            spacing: { after: 130 },
            children: [new TextRun({ text: branch.data.description, color: BRAND.inkSecondary, size: 20 })],
          }),
        );
      }
    }
  }

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      border: { top: { color: BRAND.line, space: 8, style: "single", size: 4 } },
      children: [
        new TextRun({
          text: `Dibuat dengan SecondMind · ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
          italics: true,
          color: BRAND.inkSecondary,
          size: 17,
        }),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: BRAND.ink } },
      },
      paragraphStyles: [
        {
          id: "RoadmapTitle",
          name: "Roadmap Title",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 40, bold: true, color: BRAND.ink },
          paragraph: { spacing: { after: 40 } },
        },
        {
          id: "StepHeading",
          name: "Step Heading",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, color: BRAND.clay },
          paragraph: {
            spacing: { before: 320, after: 100 },
            border: { bottom: { color: BRAND.line, space: 4, style: "single", size: 4 } },
          },
        },
      ],
    },
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}
