"use client";

import { useEffect, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";
import { Background, Controls, Panel, ReactFlow, type Connection, type Edge } from "@xyflow/react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const isOnline = useCanvasStore((s) => s.isOnline);

  const [chatDraft, setChatDraft] = useState("");
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  // Pesan baru bisa masuk dari 2 sumber (command bar sendiri, atau handoff dari
  // Drawer.tsx pas submit chat lewat node) — daripada tracking manual di tiap
  // titik pengiriman, cukup buka lagi otomatis begitu jumlah pesan nambah,
  // biar user gak ketinggalan balasan pas panelnya lagi diminimize.
  const prevMessageCountRef = useRef(chatMessages.length);
  useEffect(() => {
    if (chatMessages.length > prevMessageCountRef.current) {
      setIsChatMinimized(false);
    }
    prevMessageCountRef.current = chatMessages.length;
  }, [chatMessages.length]);

  function handleSubmitChat(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = chatDraft.trim();
    if (!trimmed || !onSendChat || !isOnline) return;
    onSendChat(trimmed);
    setChatDraft("");
  }

  function handleConnect(connection: Connection) {
    if (!isOnline) return;
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
    if (!isOnline) return;
    if (mindmapId) {
      setTimeout(() => {
        const { edges: currentEdges } = useCanvasStore.getState();
        saveMindmap(mindmapId, { edges: currentEdges });
      }, 0);
    }
  }

  function handleReconnect(oldEdge: Edge, newConnection: Connection) {
    if (!isOnline) return;
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
    if (!isOnline) return;
    deleteEdge(edge.id);
    if (mindmapId) {
      setTimeout(() => {
        const { edges: currentEdges } = useCanvasStore.getState();
        saveMindmap(mindmapId, { edges: currentEdges });
      }, 0);
    }
  }

  // Klik cabang (mindmap-branch) → seluruh jalur ke atas ikut nyala (§ user request:
  // "satu jalur menyala semua") — tiap cabang perantara sampai roadmap-step akarnya,
  // bukan cuma step-nya doang. Cabang sekarang bisa nested berlapis (multi-level
  // layout), jadi jalan ke atas terus lewat rantai edge, catat SEMUA node yang
  // dilewatin (bukan cuma yang terakhir).
  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined;
  const activePathIds = new Set<string>();
  if (selectedNode?.type === "mindmap-branch") {
    // `visited` (cycle guard) dipisah dari `activePathIds` (hasil) — kalau dua-duanya
    // dijadiin satu Set, node yang baru ditambahin di iterasi ini bakal ke-anggep
    // "udah pernah dikunjungi" pas dicek ulang di iterasi berikutnya, bikin loop
    // berhenti satu langkah lebih awal (gak sampai ke roadmap-step akarnya).
    const visited = new Set<string>([selectedNode.id]);
    let currentId: string | undefined = selectedNode.id;
    while (currentId) {
      const parentId: string | undefined = edges.find((e) => e.target === currentId)?.source;
      const parentNode = parentId ? nodes.find((n) => n.id === parentId) : undefined;
      if (!parentNode || visited.has(parentNode.id)) break;
      visited.add(parentNode.id);
      activePathIds.add(parentNode.id);
      if (parentNode.type === "roadmap-step") break; // sampai akar, jangan lanjut naik ke spine step sebelumnya
      currentId = parentNode.id;
    }
  }

  // Status "dipilih" dihitung sendiri dari selectedNodeId (canvasStore), bukan dari
  // prop `selected` bawaan React Flow — soalnya React Flow nyimpen status seleksi
  // internal sendiri yang gak ikut ke-clear kalau selection dibersihin dari luar
  // canvas (mis. tombol close di drawer manggil clearSelection(), yang cuma update
  // canvasStore, gak pernah ngirim event ke React Flow).
  const displayNodes = nodes.map((n) => ({
    ...n,
    data: { ...n.data, isActive: activePathIds.has(n.id), isSelected: n.id === selectedNodeId },
  }));

  return (
    <ReactFlow<MindmapNode, MindmapEdge>
      nodes={displayNodes}
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
      nodesConnectable={isOnline}
      edgesReconnectable={isOnline}
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
              {chatMessages.length > 0 &&
                (isChatMinimized ? (
                  <button
                    type="button"
                    className="chat-history-collapsed"
                    onClick={() => setIsChatMinimized(false)}
                  >
                    <ChevronUp />
                    {chatMessages.length} pesan
                  </button>
                ) : (
                  <div className="chat-history">
                    <div className="chat-history-head">
                      <span>Percakapan</span>
                      <button
                        type="button"
                        aria-label="Minimalkan percakapan"
                        onClick={() => setIsChatMinimized(true)}
                      >
                        <ChevronDown />
                      </button>
                    </div>
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
                ))}
              {chatError && <p className="field-error">{chatError}</p>}
              <form className="command-bar" onSubmit={handleSubmitChat}>
                <input
                  type="text"
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  placeholder={isOnline ? "Tanya atau perintahkan sesuatu tentang roadmap ini…" : "Mode offline — chat AI dinonaktifkan"}
                  disabled={isChatSending || !isOnline}
                />
                <button type="submit" aria-label="Kirim" disabled={isChatSending || !isOnline}>
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
