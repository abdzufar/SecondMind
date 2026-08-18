"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import "../canvas.css";
import { getMindmap } from "@/lib/api";
import type { Mindmap } from "@/lib/types";
import { useCanvasStore } from "@/store/canvasStore";
import { CanvasView } from "@/components/canvas/CanvasView";
import { Drawer, type DrawerTab } from "@/components/canvas/Drawer";
import { ExportButton } from "@/components/canvas/ExportButton";
import { ShareButton } from "@/components/canvas/ShareButton";

export default function CanvasPage() {
  const { id } = useParams<{ id: string }>();
  const setGraph = useCanvasStore((s) => s.setGraph);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const nodes = useCanvasStore((s) => s.nodes);
  const [mindmap, setMindmap] = useState<Mindmap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showFeasibilityWarning, setShowFeasibilityWarning] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<DrawerTab>("detail");
  const [todoPanelOpen, setTodoPanelOpen] = useState(false);
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
    getMindmap(id)
      .then((loaded) => {
        setMindmap(loaded);
        setGraph(loaded.nodes, loaded.edges);
      })
      .catch((err) => {
        console.error("[CANVAS] gagal load mindmap:", err);
        setLoadError("Mindmap tidak ditemukan atau gagal dimuat.");
      });
  }, [id, setGraph]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

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

          <div className="header-progress">
            <div className="header-progress-bar">
              <div className="header-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="header-progress-label">
              {completedSteps}/{stepNodes.length} selesai
            </span>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="sm-btn sm-btn--ghost"
              disabled={!mindmap}
              onClick={() => {
                setSidebarTab("todo");
                setTodoPanelOpen(true);
              }}
            >
              To-Do
            </button>
            {mindmap ? (
              <ShareButton
                mindmapId={mindmap._id}
                isPublic={mindmap.isPublic}
                shareId={mindmap.shareId}
                onUpdate={(update) => setMindmap((prev) => (prev ? { ...prev, ...update } : prev))}
              />
            ) : (
              <button type="button" className="sm-btn sm-btn--ghost" disabled>
                Bagikan
              </button>
            )}
            <ExportButton filename={mindmap?.title ?? "canvas"} />
          </div>
        </header>

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
              <CanvasView />
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
