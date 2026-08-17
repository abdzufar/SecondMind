import type { WireMindmap, WireMindmapEdge, WireMindmapNode } from "@/lib/types";

const BRANCH_DETAILS: Record<string, string> = {
  seo: "Rencana optimasi pencarian buat konten yang udah dibuat — target kata kunci, backlink, dan halaman mana yang diprioritaskan dulu.",
};

const DEFAULT_BRANCH_DESCRIPTION = "Ringkasan otomatis buat cabang ini akan muncul di sini setelah dokumen diproses.";
const STEP_DESCRIPTION = "Ringkasan langkah roadmap ini akan disusun dari cabang-cabang di bawahnya setelah dokumen diproses.";

type StageSeed = {
  id: string;
  timeOffsetDays: number;
  label: string;
  branches: { id: string; label: string }[];
};

const STAGE_SEEDS: StageSeed[] = [
  {
    id: "step-1",
    timeOffsetDays: 7,
    label: "Riset Pasar",
    branches: [
      { id: "analisis-kompetitor", label: "Analisis Kompetitor" },
      { id: "segmentasi-audiens", label: "Segmentasi Audiens" },
    ],
  },
  {
    id: "step-2",
    timeOffsetDays: 14,
    label: "Strategi Konten",
    branches: [
      { id: "kalender-konten-q1", label: "Kalender Konten Q1" },
      { id: "20-ide-topik", label: "20 Ide Topik" },
      { id: "kolaborasi-kreator", label: "Kolaborasi Kreator" },
    ],
  },
  {
    id: "step-3",
    timeOffsetDays: 21,
    label: "Distribusi & Channel",
    branches: [
      { id: "email-marketing", label: "Email Marketing" },
      { id: "seo", label: "SEO" },
      { id: "media-sosial", label: "Media Sosial" },
      { id: "partnership", label: "Partnership" },
    ],
  },
  {
    id: "step-4",
    timeOffsetDays: 28,
    label: "Anggaran",
    branches: [{ id: "estimasi-biaya", label: "Estimasi Biaya" }],
  },
  {
    id: "step-5",
    timeOffsetDays: 35,
    label: "Evaluasi & KPI",
    branches: [
      { id: "kpi-engagement", label: "KPI Engagement" },
      { id: "kpi-konversi", label: "KPI Konversi" },
      { id: "review-bulanan", label: "Review Bulanan" },
    ],
  },
];

function buildMindmap(): { nodes: WireMindmapNode[]; edges: WireMindmapEdge[] } {
  const nodes: WireMindmapNode[] = [];
  const edges: WireMindmapEdge[] = [];

  STAGE_SEEDS.forEach((stage, index) => {
    nodes.push({
      id: stage.id,
      type: "roadmap-step",
      data: { label: stage.label, description: STEP_DESCRIPTION, timeOffsetDays: stage.timeOffsetDays },
    });

    const previous = STAGE_SEEDS[index - 1];
    if (previous) {
      edges.push({ id: `${previous.id}-${stage.id}`, source: previous.id, target: stage.id });
    }

    stage.branches.forEach((branch) => {
      nodes.push({
        id: branch.id,
        type: "mindmap-branch",
        data: {
          label: branch.label,
          description: BRANCH_DETAILS[branch.id] ?? DEFAULT_BRANCH_DESCRIPTION,
          timeOffsetDays: null,
        },
      });
      edges.push({ id: `${stage.id}-${branch.id}`, source: stage.id, target: branch.id });
    });
  });

  return { nodes, edges };
}

const { nodes, edges } = buildMindmap();

// Bentuk WireMindmap murni — persis kontrak backend, tanpa position/num/isActive.
// Field UI-only itu diisi lib/api.ts pas mapping wire→UI (§5 CLAUDE.md).
export const MOCK_MINDMAP: WireMindmap = {
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
