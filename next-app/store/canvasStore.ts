import { create } from "zustand";
import { applyEdgeChanges, applyNodeChanges, addEdge as reactFlowAddEdge, reconnectEdge as reactFlowReconnectEdge, type EdgeChange, type NodeChange, type Connection, type Edge } from "@xyflow/react";
import type { MindmapEdge, MindmapNode, WireTodo } from "@/lib/types";
import { getLayoutedElements, removeNodeCascade } from "@/lib/canvas/layout";
import { getTodos } from "@/lib/api";

type CanvasState = {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  todos: WireTodo[];
  todosStatus: "idle" | "loading" | "ready" | "error";
  selectedNodeId: string | null;
  onNodesChange: (changes: NodeChange<MindmapNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<MindmapEdge>[]) => void;
  selectNode: (id: string | null) => void;
  clearSelection: () => void;
  renameNode: (id: string, newLabel: string) => void;
  updateNodeNotes: (id: string, notes: string) => void;
  toggleNodeComplete: (id: string) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setGraph: (nodes: MindmapNode[], edges: MindmapEdge[]) => void;
  appendNodes: (newNodes: MindmapNode[], newEdges: MindmapEdge[]) => void;
  applyLayout: () => void;
  connectEdge: (connection: Connection) => void;
  reconnectEdge: (oldEdge: Edge, newConnection: Connection) => void;
  fetchTodos: (mindmapId: string) => Promise<void>;
  setTodos: (todos: WireTodo[]) => void;
  addTodo: (todo: WireTodo) => void;
  updateTodoInStore: (id: string, updates: Partial<WireTodo>) => void;
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  todos: [],
  todosStatus: "idle",
  selectedNodeId: null,
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
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
  deleteEdge: (id) => set((state) => ({ edges: state.edges.filter((e) => e.id !== id) })),
  setGraph: (nodes, edges) => set(getLayoutedElements(nodes, edges)),
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
      return { edges: uniqueEdges };
    }),
  fetchTodos: async (mindmapId) => {
    set({ todosStatus: "loading" });
    try {
      const todos = await getTodos(mindmapId);
      set({ todos, todosStatus: "ready" });
    } catch {
      set({ todosStatus: "error" });
    }
  },
  setTodos: (todos) => set({ todos }),
  addTodo: (todo) => set((state) => ({ todos: [...state.todos, todo] })),
  updateTodoInStore: (id, updates) =>
    set((state) => ({
      todos: state.todos.map((t) => (t._id === id ? { ...t, ...updates } : t)),
    })),
}));
