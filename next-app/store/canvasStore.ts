import { create } from "zustand";
import { applyEdgeChanges, applyNodeChanges, addEdge as reactFlowAddEdge, reconnectEdge as reactFlowReconnectEdge, type EdgeChange, type NodeChange, type Connection, type Edge } from "@xyflow/react";
import type { MindmapEdge, MindmapNode } from "@/lib/types";
import { getLayoutedElements, removeNodeCascade } from "@/lib/canvas/layout";

type CanvasState = {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  selectedNodeId: string | null;
  onNodesChange: (changes: NodeChange<MindmapNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<MindmapEdge>[]) => void;
  selectNode: (id: string | null) => void;
  clearSelection: () => void;
  toggleNodeComplete: (id: string) => void;
  renameNode: (id: string, label: string) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setGraph: (nodes: MindmapNode[], edges: MindmapEdge[]) => void;
  appendNodes: (newNodes: MindmapNode[], newEdges: MindmapEdge[]) => void;
  applyLayout: () => void;
  connectEdge: (connection: Connection) => void;
  reconnectEdge: (oldEdge: Edge, newConnection: Connection) => void;
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
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
  renameNode: (id, label) =>
    set({
      nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)),
    }),
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
}));
