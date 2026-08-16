import type { Mindmap, MindmapEdge, MindmapNode } from "@/lib/types";

const BRANCH_DETAILS: Record<string, string> = {
  seo: "Rencana optimasi pencarian buat konten yang udah dibuat — target kata kunci, backlink, dan halaman mana yang diprioritaskan dulu.",
};

const DEFAULT_BRANCH_DESCRIPTION = "Ringkasan otomatis buat cabang ini akan muncul di sini setelah dokumen diproses.";
const STEP_DESCRIPTION = "Ringkasan langkah roadmap ini akan disusun dari cabang-cabang di bawahnya setelah dokumen diproses.";

type StageSeed = {
  id: string;
  num: string;
  time: string;
  label: string;
  branches: { id: string; label: string; isActive?: boolean }[];
};

const STAGE_SEEDS: StageSeed[] = [
  {
    id: "step-1",
    num: "01",
    time: "Minggu 1",
    label: "Riset Pasar",
    branches: [
      { id: "analisis-kompetitor", label: "Analisis Kompetitor" },
      { id: "segmentasi-audiens", label: "Segmentasi Audiens" },
    ],
  },
  {
    id: "step-2",
    num: "02",
    time: "Minggu 2",
    label: "Strategi Konten",
    branches: [
      { id: "kalender-konten-q1", label: "Kalender Konten Q1" },
      { id: "20-ide-topik", label: "20 Ide Topik" },
      { id: "kolaborasi-kreator", label: "Kolaborasi Kreator" },
    ],
  },
  {
    id: "step-3",
    num: "03",
    time: "Minggu 3",
    label: "Distribusi & Channel",
    branches: [
      { id: "email-marketing", label: "Email Marketing" },
      { id: "seo", label: "SEO", isActive: true },
      { id: "media-sosial", label: "Media Sosial" },
      { id: "partnership", label: "Partnership" },
    ],
  },
  {
    id: "step-4",
    num: "04",
    time: "Minggu 4",
    label: "Anggaran",
    branches: [{ id: "estimasi-biaya", label: "Estimasi Biaya" }],
  },
  {
    id: "step-5",
    num: "05",
    time: "Minggu 5",
    label: "Evaluasi & KPI",
    branches: [
      { id: "kpi-engagement", label: "KPI Engagement" },
      { id: "kpi-konversi", label: "KPI Konversi" },
      { id: "review-bulanan", label: "Review Bulanan" },
    ],
  },
];

function buildMindmap(): { nodes: MindmapNode[]; edges: MindmapEdge[] } {
  const nodes: MindmapNode[] = [];
  const edges: MindmapEdge[] = [];

  STAGE_SEEDS.forEach((stage, index) => {
    nodes.push({
      id: stage.id,
      type: "roadmap-step",
      position: { x: 0, y: 0 },
      data: { label: stage.label, description: STEP_DESCRIPTION, timeMark: stage.time, num: stage.num },
    });

    const previous = STAGE_SEEDS[index - 1];
    if (previous) {
      edges.push({ id: `${previous.id}-${stage.id}`, source: previous.id, target: stage.id });
    }

    stage.branches.forEach((branch) => {
      nodes.push({
        id: branch.id,
        type: "mindmap-branch",
        position: { x: 0, y: 0 },
        data: {
          label: branch.label,
          description: BRANCH_DETAILS[branch.id] ?? DEFAULT_BRANCH_DESCRIPTION,
          timeMark: null,
          isActive: branch.isActive,
        },
      });
      edges.push({ id: `${stage.id}-${branch.id}`, source: stage.id, target: branch.id });
    });
  });

  return { nodes, edges };
}

const { nodes, edges } = buildMindmap();

export const MOCK_MINDMAP: Mindmap = {
  _id: "strategi-growth-2026",
  title: "Strategi Growth 2026",
  topic: "Strategi growth marketing",
  timeframe: "5 minggu",
  language: "id",
  feasibilityWarning: null,
  isPublic: false,
  shareId: null,
  startDate: "2026-07-13",
  nodes,
  edges,
};
