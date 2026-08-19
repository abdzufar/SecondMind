import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyEdgeChanges, applyNodeChanges, addEdge as reactFlowAddEdge, reconnectEdge as reactFlowReconnectEdge, type EdgeChange, type NodeChange, type Connection, type Edge } from "@xyflow/react";
import type { MindmapEdge, MindmapNode, WireTodo } from "@/lib/types";
import { getLayoutedElements, pruneOrphanedBranches, removeNodeCascade } from "@/lib/canvas/layout";
import { getTodos } from "@/lib/api";

type CanvasState = {
  // `mindmapId` nandain mindmap mana yang lagi ke-cache di `nodes`/`edges`/`todos`
  // (dipersist lewat `persist` middleware di bawah) — dipakai buat validasi pas
  // offline: kalau id yang lagi dibuka BEDA sama `mindmapId` yang ke-cache, cache-nya
  // gak boleh dipakai (bisa aja sisa dari mindmap lain yang terakhir dibuka).
  mindmapId: string | null;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  todos: WireTodo[];
  todosStatus: "idle" | "loading" | "ready" | "error";
  selectedNodeId: string | null;
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
  onNodesChange: (changes: NodeChange<MindmapNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<MindmapEdge>[]) => void;
  selectNode: (id: string | null) => void;
  clearSelection: () => void;
  renameNode: (id: string, newLabel: string) => void;
  updateNodeNotes: (id: string, notes: string) => void;
  toggleNodeComplete: (id: string) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setGraph: (nodes: MindmapNode[], edges: MindmapEdge[], mindmapId?: string) => void;
  appendNodes: (newNodes: MindmapNode[], newEdges: MindmapEdge[]) => void;
  applyLayout: () => void;
  connectEdge: (connection: Connection) => void;
  reconnectEdge: (oldEdge: Edge, newConnection: Connection) => void;
  fetchTodos: (mindmapId: string) => Promise<void>;
  setTodos: (todos: WireTodo[]) => void;
  addTodo: (todo: WireTodo) => void;
  updateTodoInStore: (id: string, updates: Partial<WireTodo>) => void;
};

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      mindmapId: null,
      nodes: [],
      edges: [],
      todos: [],
      todosStatus: "idle",
      selectedNodeId: null,
      // Default `true` (bukan `navigator.onLine`) biar gak ada mismatch SSR/hydration
      // — nilai asli langsung dikoreksi di client oleh listener di OfflineSupport.tsx
      // sesaat setelah mount.
      isOnline: true,
      setIsOnline: (isOnline) => set({ isOnline }),
      onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
      onEdgesChange: (changes) =>
        set((state) => pruneOrphanedBranches(state.nodes, applyEdgeChanges(changes, state.edges))),
      selectNode: (id) => set({ selectedNodeId: id }),
      clearSelection: () => set({ selectedNodeId: null }),
      toggleNodeComplete: (id) =>
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, isCompleted: !n.data.isCompleted } } : n
          ),
        }),
      renameNode: (id, newLabel) =>
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n)),
        })),
      updateNodeNotes: (id, notes) =>
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, userNotes: notes } } : n)),
        })),
      deleteNode: (id) => set((state) => removeNodeCascade(state.nodes, state.edges, id)),
      deleteEdge: (id) =>
        set((state) => pruneOrphanedBranches(state.nodes, state.edges.filter((e) => e.id !== id))),
      setGraph: (nodes, edges, mindmapId) =>
        set({ ...getLayoutedElements(nodes, edges), mindmapId: mindmapId ?? get().mindmapId }),
      appendNodes: (newNodes, newEdges) =>
        set((state) => ({
          nodes: [...state.nodes, ...newNodes],
          edges: [...state.edges, ...newEdges],
        })),
      applyLayout: () => set((state) => getLayoutedElements(state.nodes, state.edges)),
      connectEdge: (connection) =>
        set((state) => {
          const newEdges = reactFlowAddEdge(connection, state.edges);
          const uniqueEdges = newEdges.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
          return { edges: uniqueEdges };
        }),
      reconnectEdge: (oldEdge, newConnection) =>
        set((state) => {
          const newEdges = reactFlowReconnectEdge(oldEdge, newConnection, state.edges);
          const uniqueEdges = newEdges.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
          return pruneOrphanedBranches(state.nodes, uniqueEdges);
        }),
      fetchTodos: async (mindmapId) => {
        set({ todosStatus: "loading" });
        try {
          const todos = await getTodos(mindmapId);
          set({ todos, todosStatus: "ready" });
        } catch {
          // Offline + mindmap yang sama kayak yang lagi ke-cache (dipersist barengan
          // `nodes`/`edges` lewat `mindmapId`) → todos lama yang udah ke-persist tetap
          // valid buat ditampilin, bukan error kosong. Kalau beda mindmap (belum
          // pernah ke-cache), gak ada yang bisa ditampilin — tetap "error".
          if (get().mindmapId === mindmapId && get().todos.length > 0) {
            set({ todosStatus: "ready" });
          } else {
            set({ todosStatus: "error" });
          }
        }
      },
      setTodos: (todos) => set({ todos }),
      addTodo: (todo) => set((state) => ({ todos: [...state.todos, todo] })),
      updateTodoInStore: (id, updates) =>
        set((state) => ({
          todos: state.todos.map((t) => (t._id === id ? { ...t, ...updates } : t)),
        })),
    }),
    {
      name: "secondmind-canvas-cache",
      // Cuma data mindmap yang lagi dibuka yang dipersist buat offline — bukan
      // `selectedNodeId` (state UI sesaat, gak berguna disimpan lintas sesi) dan
      // bukan `isOnline` (ke-derive ulang dari `navigator.onLine` tiap boot).
      partialize: (state) => ({
        mindmapId: state.mindmapId,
        nodes: state.nodes,
        edges: state.edges,
        todos: state.todos,
      }),
    }
  )
);
