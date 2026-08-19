"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { ListChecks, Share2, WifiOff } from "lucide-react";
import "../canvas.css";
import { getMindmap, sendChatMessage, type ChatMessage } from "@/lib/api";
import type { Mindmap } from "@/lib/types";
import { useCanvasStore } from "@/store/canvasStore";
import { useHistoryStore } from "@/store/historyStore";
import { CanvasView } from "@/components/canvas/CanvasView";
import { Drawer, type DrawerTab } from "@/components/canvas/Drawer";
import { ExportButton } from "@/components/canvas/ExportButton";
import { ShareButton } from "@/components/canvas/ShareButton";

export default function CanvasPage() {
  const { id } = useParams<{ id: string }>();
  const setGraph = useCanvasStore((s) => s.setGraph);
  const fetchTodos = useCanvasStore((s) => s.fetchTodos);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const nodes = useCanvasStore((s) => s.nodes);
  const isOnline = useCanvasStore((s) => s.isOnline);
  const [mindmap, setMindmap] = useState<Mindmap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOfflineCache, setIsOfflineCache] = useState(false);
  const [showFeasibilityWarning, setShowFeasibilityWarning] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<DrawerTab>("detail");
  const [todoPanelOpen, setTodoPanelOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [prevSelectedNodeId, setPrevSelectedNodeId] = useState(selectedNodeId);

  if (selectedNodeId !== prevSelectedNodeId) {
    setPrevSelectedNodeId(selectedNodeId);
    if (selectedNodeId) setSidebarTab("detail");
  }

  const stepNodes = nodes.filter((n) => n.type === "roadmap-step");
  const completedSteps = stepNodes.filter((n) => n.data.isCompleted).length;
  const progress = stepNodes.length > 0 ? Math.round((completedSteps / stepNodes.length) * 100) : 0;
  const isSidebarOpen = !!selectedNodeId || todoPanelOpen;

  useEffect(() => {
    // Fallback ke cache lokal (zustand `persist`, lihat canvasStore.ts) cuma
    // kalau BENERAN offline dan cache-nya emang buat mindmap yang sama (`mindmapId`
    // yang ke-persist harus cocok sama `id` route ini) — gagal fetch karena alasan
    // lain (404, sesi habis, dll) pas online tetap jatuh ke error biasa, gak nyoba
    // nampilin data lama yang bisa aja udah gak akurat.
    function loadFromCache(): boolean {
      const cached = useCanvasStore.getState();
      if (cached.mindmapId !== id || cached.nodes.length === 0) return false;

      const summary = useHistoryStore.getState().history.find((h) => h._id === id);
      setMindmap({
        _id: id,
        title: summary?.title ?? "Mindmap (tersimpan offline)",
        topic: summary?.topic ?? "",
        timeframe: summary?.timeframe ?? "",
        language: "id",
        feasibilityWarning: null,
        isPublic: summary?.isPublic ?? false,
        shareId: summary?.shareId ?? null,
        startDate: "",
        createdAt: summary?.createdAt ?? new Date().toISOString(),
        nodes: cached.nodes,
        edges: cached.edges,
      });
      setIsOfflineCache(true);
      fetchTodos(id);
      return true;
    }

    getMindmap(id)
      .then((loaded) => {
        setMindmap(loaded);
        setIsOfflineCache(false);
        setGraph(loaded.nodes, loaded.edges, id);
        fetchTodos(id);
      })
      .catch((err) => {
        console.error("[CANVAS] gagal load mindmap:", err);
        if (!useCanvasStore.getState().isOnline && loadFromCache()) return;
        setLoadError("Mindmap tidak ditemukan atau gagal dimuat.");
      });
  }, [id, setGraph, fetchTodos]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function handleSendChat(message: string, nodeId?: string, nodeLabel?: string) {
    if (!mindmap || !isOnline) return;

    setChatMessages((prev) => [...prev, { role: "user", content: message, nodeLabel }]);
    setIsChatSending(true);
    setChatError(null);
    sendChatMessage({ mindmapId: mindmap._id, message, nodeId })
      .then((reply) => setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]))
      .catch(() => setChatError("Gagal mengirim pesan. Coba lagi."))
      .finally(() => setIsChatSending(false));
  }

  return (
    <ReactFlowProvider>
      <div className="page-canvas">
        <header className="canvas-header">
          <div className="header-left">
            <Link className="icon-btn" href="/composer" aria-label="Kembali ke composer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <div className="doc-info">
              <strong>{mindmap?.title ?? (loadError ? "Gagal memuat" : "Memuat…")}</strong>
              <span>{mindmap ? `Roadmap ${mindmap.timeframe} · ${mindmap.nodes.length} node` : ""}</span>
            </div>
          </div>

          <div className="header-actions">
            <span className="header-progress-label">
              {completedSteps}/{stepNodes.length} selesai
            </span>
            <button
              type="button"
              className="sm-btn sm-btn--ghost"
              disabled={!mindmap}
              aria-label="To-Do"
              onClick={() => {
                setSidebarTab("todo");
                setTodoPanelOpen(true);
              }}
            >
              <ListChecks />
              <span className="btn-label">To-Do</span>
            </button>
            {mindmap ? (
              <ShareButton
                mindmapId={mindmap._id}
                isPublic={mindmap.isPublic}
                shareId={mindmap.shareId}
                onUpdate={(update) => setMindmap((prev) => (prev ? { ...prev, ...update } : prev))}
              />
            ) : (
              <button type="button" className="sm-btn sm-btn--ghost" disabled aria-label="Bagikan">
                <Share2 />
                <span className="btn-label">Bagikan</span>
              </button>
            )}
            <ExportButton
              filename={mindmap?.title ?? "canvas"}
              topic={mindmap?.topic ?? ""}
              timeframe={mindmap?.timeframe ?? ""}
            />
          </div>
        </header>

        <div className="header-progress-track">
          <div className="header-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {!isOnline && (
          <div className="offline-banner">
            <WifiOff />
            <p>
              {isOfflineCache
                ? "Mode offline — nampilin versi tersimpan terakhir. Ubah/simpan/hapus dinonaktifkan sampai online lagi."
                : "Mode offline — aksi yang butuh koneksi (AI, simpan, hapus) dinonaktifkan sementara."}
            </p>
          </div>
        )}

        {mindmap?.feasibilityWarning && showFeasibilityWarning && (
          <div className="feasibility-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <p>{mindmap.feasibilityWarning}</p>
            <button type="button" aria-label="Tutup peringatan" onClick={() => setShowFeasibilityWarning(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className={`canvas-body${isSidebarOpen ? " has-drawer" : ""}`}>
          <div className="canvas-area">
            {mindmap ? (
              <CanvasView
                chatMessages={chatMessages}
                isChatSending={isChatSending}
                chatError={chatError}
                onSendChat={(message) => handleSendChat(message)}
                mindmapId={mindmap._id}
              />
            ) : loadError ? (
              <div className="canvas-loading canvas-loading--error">
                <p>{loadError}</p>
                <Link href="/composer">Kembali ke composer</Link>
              </div>
            ) : (
              <div className="canvas-loading">Memuat canvas…</div>
            )}
          </div>

          {isSidebarOpen && mindmap && (
            <Drawer
              mindmapId={mindmap._id}
              mindmapCreatedAt={mindmap.createdAt}
              mindmapTopic={mindmap.topic}
              activeTab={sidebarTab}
              onTabChange={setSidebarTab}
              onSendChat={handleSendChat}
              onClose={() => {
                clearSelection();
                setTodoPanelOpen(false);
              }}
            />
          )}
        </div>
      </div>
    </ReactFlowProvider>
  );
}
