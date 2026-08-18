import type {
  Mindmap,
  MindmapEdge,
  MindmapNode,
  WireMindmap,
  WireMindmapEdge,
  WireMindmapNode,
  WireTodo,
} from "@/lib/types";

// Gemini balikin integer offset hari mentah (§5 CLAUDE.md) — frontend yang format jadi
// "Hari X"/"Minggu Y" sendiri, gak pernah disimpan sebagai string di wire type.
function formatTimeOffset(days: number | null): string | null {
  if (days === null) return null;
  if (days > 0 && days % 7 === 0) return `Minggu ${days / 7}`;
  return `Hari ${days}`;
}

// Mapping WireMindmap → Mindmap: ngisi `num` (index roadmap-step + 1), `timeMark`
// (format tampilan dari timeOffsetDays), dan `position` placeholder — posisi final
// baru diisi lib/canvas/layout.ts (§5 CLAUDE.md).
function toMindmap(wire: WireMindmap): Mindmap {
  let stepCount = 0;
  const nodes: MindmapNode[] = wire.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: { x: 0, y: 0 },
    data: {
      ...node.data,
      num: node.type === "roadmap-step" ? String(++stepCount).padStart(2, "0") : undefined,
      timeMark: formatTimeOffset(node.data.timeOffsetDays),
    },
  }));

  return { ...wire, nodes, edges: wire.edges.map((edge) => ({ ...edge })) };
}

export type MindmapSummary = Pick<
  WireMindmap,
  "_id" | "title" | "topic" | "timeframe" | "isPublic" | "shareId" | "createdAt"
>;

export type GenerateMindmapInput = {
  topic: string;
  file?: File | null;
  timeframe: string;
  verbosity: string;
  language: string;
};

export async function generateMindmap(input: GenerateMindmapInput): Promise<Mindmap> {
  const formData = new FormData();
  formData.append("topic", input.topic);
  formData.append("timeframe", input.timeframe);
  formData.append("verbosity", input.verbosity);
  formData.append("language", input.language);
  if (input.file) formData.append("file", input.file);

  const res = await fetch("/api/mindmap/generate", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Generate gagal (status ${res.status})`);
  }

  const wire: WireMindmap = await res.json();
  return toMindmap(wire);
}

export type ElaborateNodeInput = {
  nodeId: string;
  concept: string;
  action: string;
  language: string;
};

export async function elaborateNode(
  input: ElaborateNodeInput
): Promise<{ newNodes: MindmapNode[]; newEdges: MindmapEdge[] }> {
  const res = await fetch("/api/mindmap/elaborate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Gagal memecah node (status ${res.status})`);
  }

  const wire: { newNodes: WireMindmapNode[]; newEdges: WireMindmapEdge[] } = await res.json();

  const newNodes: MindmapNode[] = wire.newNodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: { x: 0, y: 0 },
    data: {
      ...node.data,
      timeMark: formatTimeOffset(node.data.timeOffsetDays),
    },
  }));

  return { newNodes, newEdges: wire.newEdges.map((edge) => ({ ...edge })) };
}

// nodeLabel itu field UI-only (chip konteks di message bubble) — dihitung di pemanggil
// (app/canvas/[id]/page.tsx), bukan bagian response backend (§5 CLAUDE.md).
export type ChatMessage = { role: "user" | "assistant"; content: string; nodeLabel?: string };

export type SendChatMessageInput = {
  mindmapId: string;
  message: string;
  nodeId?: string;
};

export async function sendChatMessage(input: SendChatMessageInput): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mindmapId: input.mindmapId,
      message: input.message,
      ...(input.nodeId ? { nodeId: input.nodeId } : {}),
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Gagal mengirim pesan (status ${res.status})`);
  }

  const data: { message: string } = await res.json();
  return data.message;
}

export async function getMindmaps(): Promise<MindmapSummary[]> {
  const res = await fetch("/api/mindmap");

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Gagal memuat daftar mindmap (status ${res.status})`);
  }

  return res.json();
}

export async function getMindmap(id: string): Promise<Mindmap> {
  const res = await fetch(`/api/mindmap/${id}`);

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Gagal memuat mindmap (status ${res.status})`);
  }

  const wire: WireMindmap = await res.json();
  return toMindmap(wire);
}

export type SaveMindmapInput = {
  nodes?: MindmapNode[];
  edges?: MindmapEdge[];
  isPublic?: boolean;
};

export async function saveMindmap(id: string, input: SaveMindmapInput): Promise<void> {
  const body: Record<string, unknown> = {};
  if (input.nodes) {
    body.nodes = input.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      data: { label: node.data.label, description: node.data.description, timeOffsetDays: node.data.timeOffsetDays },
    }));
  }
  if (input.edges) {
    body.edges = input.edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target }));
  }
  if (input.isPublic !== undefined) body.isPublic = input.isPublic;

  const res = await fetch(`/api/mindmap/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Gagal menyimpan mindmap (status ${res.status})`);
  }
}

export async function getSharedMindmap(shareId: string): Promise<Mindmap> {
  const res = await fetch(`/api/mindmap/share/${shareId}`);

  if (!res.ok) {
    if (res.status === 403) throw new Error("Mindmap ini gak lagi dibagikan secara publik.");
    if (res.status === 404) throw new Error("Mindmap tidak ditemukan.");
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Gagal memuat mindmap (status ${res.status})`);
  }

  const wire: WireMindmap = await res.json();
  return toMindmap(wire);
}

export async function deleteMindmap(id: string): Promise<void> {
  const res = await fetch(`/api/mindmap/${id}`, { method: "DELETE" });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Gagal menghapus mindmap (status ${res.status})`);
  }
}

export async function getTodos(mindmapId: string): Promise<WireTodo[]> {
  const res = await fetch(`/api/todo?mindmapId=${mindmapId}`);

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Gagal memuat to-do (status ${res.status})`);
  }

  return res.json();
}

export type CreateTodoInput = {
  mindmapId: string;
  taskText: string;
  timeOffsetDays: number | null;
};

export async function createTodo(input: CreateTodoInput): Promise<WireTodo> {
  const res = await fetch("/api/todo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Gagal menambah task (status ${res.status})`);
  }

  return res.json();
}

export async function updateTodo(id: string, input: { isCompleted: boolean }): Promise<void> {
  const res = await fetch(`/api/todo/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Gagal update to-do (status ${res.status})`);
  }
}
