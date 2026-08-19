import type { Edge, Node } from "@xyflow/react";

// ── Wire types: persis kontrak backend. Jangan tambah field di sini
// kecuali sudah dikonfirmasi memang dikirim backend.
export type WireNodeType = "roadmap-step" | "mindmap-branch";

export type WireMindmapNode = {
  id: string;
  type: WireNodeType;
  data: {
    label: string;
    description: string;
    timeOffsetDays: number | null;
    userNotes: string;
    isCompleted: boolean;
  };
};

export type WireMindmapEdge = {
  id: string;
  source: string;
  target: string;
};

export type WireMindmap = {
  _id: string;
  title: string;
  topic: string;
  timeframe: string;
  language: string;
  feasibilityWarning: string | null;
  isPublic: boolean;
  shareId: string | null;
  startDate: string;
  createdAt: string; // dipakai buat konversi due-date todo (absolut) <-> timeOffsetDays (relatif)
  nodes: WireMindmapNode[];
  edges: WireMindmapEdge[];
};

export type WireTodo = {
  _id: string;
  mindmapId: string;
  taskText: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
};

// ── UI types: turunan buat reactflow. Field tambahan di sini DIHITUNG
// di frontend (position, num, isActive) — bukan field baru dari backend.
export type MindmapNodeData = WireMindmapNode["data"] & {
  num?: string;
  isActive?: boolean;
  isSelected?: boolean; // dihitung dari selectedNodeId di CanvasView.tsx, bukan dari backend
  timeMark?: string | null; // "Hari X" / "Minggu Y", diformat dari timeOffsetDays — bukan dari backend
};

export type MindmapNode = Node<MindmapNodeData, WireNodeType>;
export type MindmapEdge = Edge;

export type Mindmap = Omit<WireMindmap, "nodes" | "edges"> & {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
};
