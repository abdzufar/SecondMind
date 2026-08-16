import { create } from "zustand";
import { applyEdgeChanges, applyNodeChanges, type EdgeChange, type NodeChange } from "@xyflow/react";
import type { MindmapEdge, MindmapNode } from "@/lib/types";
import { MOCK_MINDMAP } from "@/lib/mock/mindmap";
import { getLayoutedElements } from "@/lib/canvas/layout";

type CanvasState = {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  selectedNodeId: string | null;
  onNodesChange: (changes: NodeChange<MindmapNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<MindmapEdge>[]) => void;
  selectNode: (id: string | null) => void;
};

const { nodes: initialNodes, edges: initialEdges } = getLayoutedElements(MOCK_MINDMAP.nodes, MOCK_MINDMAP.edges);

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  selectNode: (id) => set({ selectedNodeId: id }),
}));
