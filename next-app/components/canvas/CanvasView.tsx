"use client";

import "@xyflow/react/dist/style.css";
import { Background, Controls, Panel, ReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/store/canvasStore";
import type { MindmapEdge, MindmapNode } from "@/lib/types";
import { RoadmapStepNode } from "./nodes/RoadmapStepNode";
import { MindmapBranchNode } from "./nodes/MindmapBranchNode";

const nodeTypes = {
  "roadmap-step": RoadmapStepNode,
  "mindmap-branch": MindmapBranchNode,
};

export function CanvasView() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);

  return (
    <ReactFlow<MindmapNode, MindmapEdge>
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_event, node) => selectNode(node.id)}
      onPaneClick={() => selectNode(null)}
      nodesConnectable={false}
      fitView
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ type: "smoothstep", style: { stroke: "#e7d9c6", strokeWidth: 1.5 } }}
    >
      <Background gap={22} size={1.5} color="#e0d4c3" />
      <Controls showInteractive={false} position="bottom-right" />

      {!selectedNodeId && (
        <>
          <Panel position="top-left" className="canvas-legend">
            <span>
              <span className="legend-chip legend-chip--step"></span>Langkah roadmap
            </span>
            <span>
              <span className="legend-chip legend-chip--branch"></span>Cabang mindmap
            </span>
          </Panel>

          <Panel position="bottom-center">
            <form className="command-bar" onSubmit={(e) => e.preventDefault()}>
              <input type="text" placeholder="Tanya atau perintahkan sesuatu tentang roadmap ini…" />
              <button type="submit" aria-label="Kirim">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </form>
          </Panel>
        </>
      )}
    </ReactFlow>
  );
}
