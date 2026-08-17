import { create } from "zustand";
import { applyEdgeChanges, applyNodeChanges, type EdgeChange, type NodeChange } from "@xyflow/react";
import type { MindmapEdge, MindmapNode } from "@/lib/types";
import { DEFAULT_MINDMAP_ID, getMindmap } from "@/lib/api";
import { getLayoutedElements } from "@/lib/canvas/layout";

type CanvasState = {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  selectedNodeId: string | null;
  onNodesChange: (changes: NodeChange<MindmapNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<MindmapEdge>[]) => void;
  selectNode: (id: string | null) => void;
  clearSelection: () => void;
  toggleNodeComplete: (id: string) => void;
  setGraph: (nodes: MindmapNode[], edges: MindmapEdge[]) => void;
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
  setGraph: (nodes, edges) => set(getLayoutedElements(nodes, edges)),
}));

getMindmap(DEFAULT_MINDMAP_ID).then((mindmap) => {
  useCanvasStore.getState().setGraph(mindmap.nodes, mindmap.edges);
});
