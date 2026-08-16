export type Branch = {
  id: string;
  label: string;
  isActive?: boolean;
};

export type Stage = {
  id: string;
  num: string;
  time: string;
  label: string;
  side: "left" | "right";
  branches: Branch[];
};

export const STAGES: Stage[] = [
  {
    id: "stage-1",
    num: "01",
    time: "Minggu 1",
    label: "Riset Pasar",
    side: "left",
    branches: [
      { id: "analisis-kompetitor", label: "Analisis Kompetitor" },
      { id: "segmentasi-audiens", label: "Segmentasi Audiens" },
    ],
  },
  {
    id: "stage-2",
    num: "02",
    time: "Minggu 2",
    label: "Strategi Konten",
    side: "right",
    branches: [
      { id: "kalender-konten-q1", label: "Kalender Konten Q1" },
      { id: "20-ide-topik", label: "20 Ide Topik" },
      { id: "kolaborasi-kreator", label: "Kolaborasi Kreator" },
    ],
  },
  {
    id: "stage-3",
    num: "03",
    time: "Minggu 3",
    label: "Distribusi & Channel",
    side: "left",
    branches: [
      { id: "email-marketing", label: "Email Marketing" },
      { id: "seo", label: "SEO", isActive: true },
      { id: "media-sosial", label: "Media Sosial" },
      { id: "partnership", label: "Partnership" },
    ],
  },
  {
    id: "stage-4",
    num: "04",
    time: "Minggu 4",
    label: "Anggaran",
    side: "right",
    branches: [{ id: "estimasi-biaya", label: "Estimasi Biaya" }],
  },
  {
    id: "stage-5",
    num: "05",
    time: "Minggu 5",
    label: "Evaluasi & KPI",
    side: "left",
    branches: [
      { id: "kpi-engagement", label: "KPI Engagement" },
      { id: "kpi-konversi", label: "KPI Konversi" },
      { id: "review-bulanan", label: "Review Bulanan" },
    ],
  },
];

export function findStage(stageId: string) {
  return STAGES.find((s) => s.id === stageId);
}

export function findBranch(stageId: string, branchId: string) {
  return findStage(stageId)?.branches.find((b) => b.id === branchId);
}

export const BRANCH_DETAILS: Record<string, { summary: string; note: string }> = {
  seo: {
    summary:
      "Rencana optimasi pencarian buat konten yang udah dibuat — target kata kunci, backlink, dan halaman mana yang diprioritaskan dulu.",
    note: "Prioritaskan 5 kata kunci dengan volume tertinggi dulu, sisanya nyusul bulan depan.",
  },
};

export const DEFAULT_BRANCH_DETAIL = {
  summary: "Ringkasan otomatis buat cabang ini akan muncul di sini setelah dokumen diproses.",
  note: "",
};

export const STEP_SUMMARY = "Ringkasan langkah roadmap ini akan disusun dari cabang-cabang di bawahnya setelah dokumen diproses.";

export const DOC_META = {
  title: "Strategi Growth 2026",
  meta: "Roadmap 5 minggu · 18 node · diperbarui 2 jam lalu",
  source: "Dibuat otomatis dari riset-pasar.pdf · diperbarui 2 jam lalu",
};
