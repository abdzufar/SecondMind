import type { Mindmap, MindmapEdge, MindmapNode, WireMindmap, WireTodo } from "@/lib/types";
import { MOCK_MINDMAP } from "@/lib/mock/mindmap";
import { MOCK_TODOS } from "@/lib/mock/todo";

const MOCK_LATENCY_MS = 300;

function delay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

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

type MindmapRecord = WireMindmap & { createdAt: string };

export type MindmapSummary = Pick<WireMindmap, "_id" | "title" | "topic" | "timeframe" | "isPublic" | "shareId"> & {
  createdAt: string;
};

// "Database" mock di memori — reset tiap reload halaman, cukup buat demo lokal.
const mindmapsDb: MindmapRecord[] = [{ ...MOCK_MINDMAP, createdAt: MOCK_MINDMAP.startDate }];
let todosDb: WireTodo[] = [...MOCK_TODOS];

// Dev-only default: canvas page belum punya route [id] (M11), jadi sementara
// selalu load mindmap mock ini.
export const DEFAULT_MINDMAP_ID = MOCK_MINDMAP._id;

function findMindmapOrThrow(id: string): MindmapRecord {
  const mindmap = mindmapsDb.find((m) => m._id === id);
  if (!mindmap) throw new Error(`Mindmap ${id} tidak ditemukan`);
  return mindmap;
}

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

  // Bridge sementara selama getMindmap()/getMindmaps() masih mock: taruh hasil
  // generate asli ke "database" lokal juga, supaya alur baca abis generate tetap
  // jalan sampai fungsi baca itu ikut dipindah ke fetch asli.
  mindmapsDb.push({ ...wire, createdAt: wire.startDate });

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
  const newNodeId = `${input.nodeId}-branch-${Date.now()}`;
  const newNodes: MindmapNode[] = [
    {
      id: newNodeId,
      type: "mindmap-branch",
      position: { x: 0, y: 0 },
      data: {
        label: input.concept,
        description: `Penjelasan tambahan soal "${input.concept}" akan muncul di sini.`,
        timeOffsetDays: null,
        timeMark: null,
      },
    },
  ];
  const newEdges: MindmapEdge[] = [{ id: `${input.nodeId}-${newNodeId}`, source: input.nodeId, target: newNodeId }];
  return delay({ newNodes, newEdges });
}

export async function getMindmaps(): Promise<MindmapSummary[]> {
  return delay(
    mindmapsDb.map(({ _id, title, topic, timeframe, isPublic, shareId, createdAt }) => ({
      _id,
      title,
      topic,
      timeframe,
      isPublic,
      shareId,
      createdAt,
    }))
  );
}

export async function getMindmap(id: string): Promise<Mindmap> {
  return delay(toMindmap(findMindmapOrThrow(id)));
}

export type SaveMindmapInput = {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
};

export async function saveMindmap(id: string, input: SaveMindmapInput): Promise<void> {
  const mindmap = findMindmapOrThrow(id);
  mindmap.nodes = input.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    data: { label: node.data.label, description: node.data.description, timeOffsetDays: node.data.timeOffsetDays },
  }));
  mindmap.edges = input.edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target }));
  await delay(undefined);
}

export async function deleteMindmap(id: string): Promise<void> {
  const index = mindmapsDb.findIndex((m) => m._id === id);
  if (index !== -1) mindmapsDb.splice(index, 1);
  todosDb = todosDb.filter((todo) => todo.mindmapId !== id);
  await delay(undefined);
}

export async function getTodos(mindmapId: string): Promise<WireTodo[]> {
  return delay(todosDb.filter((todo) => todo.mindmapId === mindmapId));
}

export type CreateTodoInput = {
  mindmapId: string;
  taskText: string;
  dueDate: string;
};

export async function createTodo(input: CreateTodoInput): Promise<WireTodo> {
  const todo: WireTodo = {
    _id: `todo-${Date.now()}`,
    mindmapId: input.mindmapId,
    taskText: input.taskText,
    dueDate: input.dueDate,
    isCompleted: false,
  };
  todosDb.push(todo);
  return delay(todo);
}

export async function updateTodo(id: string, input: { isCompleted: boolean }): Promise<void> {
  const todo = todosDb.find((t) => t._id === id);
  if (todo) todo.isCompleted = input.isCompleted;
  await delay(undefined);
}
