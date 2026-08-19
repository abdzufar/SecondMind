import type { MindmapEdge, MindmapNode } from "@/lib/types";

// Logic pengumpulan konten roadmap → outline, dipakai bareng oleh dua
// builder dokumen (`exportDocx.ts` dan `exportPdf.ts`) — biar gak duplikat
// antara format Word dan PDF-teks yang strukturnya sama persis, cuma
// output-nya beda (docx Paragraph vs jsPDF text).

export type RoadmapExportMeta = {
  title: string;
  topic: string;
  timeframe: string;
};

export type BranchEntry = { node: MindmapNode; depth: number };

export function getSortedSteps(nodes: MindmapNode[]): MindmapNode[] {
  return nodes
    .filter((n) => n.type === "roadmap-step")
    .sort((a, b) => Number(a.data.num ?? 0) - Number(b.data.num ?? 0));
}

// Jalan turun dari satu roadmap-step lewat rantai edge, ngumpulin SEMUA
// cabang (termasuk nested sub-cabang) sekalian nyimpen depth-nya buat
// indentasi outline. `visited` mencegah loop tak berhenti kalau ada edge
// yang somehow muter balik (mis. hasil drag-wire manual yang aneh).
export function collectBranches(
  parentId: string,
  edges: MindmapEdge[],
  nodes: MindmapNode[],
  depth = 0,
  visited = new Set<string>(),
): BranchEntry[] {
  if (visited.has(parentId)) return [];
  visited.add(parentId);

  const childIds = edges.filter((e) => e.source === parentId).map((e) => e.target);
  const children = nodes.filter((n) => n.type === "mindmap-branch" && childIds.includes(n.id));

  return children.flatMap((child) => [
    { node: child, depth },
    ...collectBranches(child.id, edges, nodes, depth + 1, visited),
  ]);
}
