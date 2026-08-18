"use client";

import { useState } from "react";
import "@xyflow/react/dist/style.css";
import { Background, Controls, Panel, ReactFlow, type Connection, type Edge } from "@xyflow/react";
import ReactMarkdown from "react-markdown";
import { useCanvasStore } from "@/store/canvasStore";
import type { MindmapEdge, MindmapNode } from "@/lib/types";
import { saveMindmap, type ChatMessage } from "@/lib/api";
import { RoadmapStepNode } from "./nodes/RoadmapStepNode";
import { MindmapBranchNode } from "./nodes/MindmapBranchNode";

const nodeTypes = {
  "roadmap-step": RoadmapStepNode,
  "mindmap-branch": MindmapBranchNode,
};

type CanvasViewProps = {
  showCommandBar?: boolean;
  chatMessages?: ChatMessage[];
  isChatSending?: boolean;
  chatError?: string | null;
  onSendChat?: (message: string) => void;
  mindmapId?: string;
};

export function CanvasView({
  showCommandBar = true,
  chatMessages = [],
  isChatSending = false,
  chatError = null,
  onSendChat,
  mindmapId,
}: CanvasViewProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const connectEdge = useCanvasStore((s) => s.connectEdge);
  const reconnectEdge = useCanvasStore((s) => s.reconnectEdge);
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);

  const [chatDraft, setChatDraft] = useState("");

  function handleSubmitChat(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = chatDraft.trim();
    if (!trimmed || !onSendChat) return;
    onSendChat(trimmed);
    setChatDraft("");
  }

  function handleConnect(connection: Connection) {
    if (connection.source === connection.target) return; // Prevent self-loops
    connectEdge(connection);
    if (mindmapId) {
      // Small timeout to allow Zustand state to flush before saving
      setTimeout(() => {
        const { edges: currentEdges } = useCanvasStore.getState();
        saveMindmap(mindmapId, { edges: currentEdges });
      }, 0);
    }
  }

  function handleEdgesDelete() {
    if (mindmapId) {
      setTimeout(() => {
        const { edges: currentEdges } = useCanvasStore.getState();
        saveMindmap(mindmapId, { edges: currentEdges });
      }, 0);
    }
  }

  function handleReconnect(oldEdge: Edge, newConnection: Connection) {
    if (newConnection.source === newConnection.target) return; // Prevent self-loops
    reconnectEdge(oldEdge, newConnection);
    if (mindmapId) {
      setTimeout(() => {
        const { edges: currentEdges } = useCanvasStore.getState();
        saveMindmap(mindmapId, { edges: currentEdges });
      }, 0);
    }
  }

  function handleEdgeDoubleClick(_event: React.MouseEvent, edge: Edge) {
    deleteEdge(edge.id);
    if (mindmapId) {
      setTimeout(() => {
        const { edges: currentEdges } = useCanvasStore.getState();
        saveMindmap(mindmapId, { edges: currentEdges });
      }, 0);
    }
  }

  return (
    <ReactFlow<MindmapNode, MindmapEdge>
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_event, node) => selectNode(node.id)}
      onPaneClick={() => selectNode(null)}
      onConnect={handleConnect}
      onReconnect={handleReconnect}
      onEdgeDoubleClick={handleEdgeDoubleClick}
      onEdgesDelete={handleEdgesDelete}
      nodesConnectable={true}
      edgesReconnectable={true}
      elementsSelectable={true}
      edgesFocusable={true}
      nodesDraggable={false}
      fitView
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ type: "smoothstep", interactionWidth: 25, style: { stroke: "#e7d9c6", strokeWidth: 1.5 } }}
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

          {showCommandBar && (
            <Panel position="bottom-center" className="command-bar-panel">
              {chatMessages.length > 0 && (
                <div className="chat-history">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`chat-message chat-message--${msg.role}`}>
                      {msg.nodeLabel && <span className="chat-message-context">Konteks: {msg.nodeLabel}</span>}
                      {msg.role === "assistant" ? (
                        <div className="chat-message-markdown">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  ))}
                  {isChatSending && (
                    <div className="chat-message chat-message--assistant chat-message--pending">
                      <p>Mengetik…</p>
                    </div>
                  )}
                </div>
              )}
              {chatError && <p className="field-error">{chatError}</p>}
              <form className="command-bar" onSubmit={handleSubmitChat}>
                <input
                  type="text"
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  placeholder="Tanya atau perintahkan sesuatu tentang roadmap ini…"
                  disabled={isChatSending}
                />
                <button type="submit" aria-label="Kirim" disabled={isChatSending}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </button>
              </form>
            </Panel>
          )}
        </>
      )}
    </ReactFlow>
  );
}
