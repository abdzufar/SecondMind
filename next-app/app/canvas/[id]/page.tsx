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
import { Drawer } from "@/components/canvas/Drawer";
import { ExportButton } from "@/components/canvas/ExportButton";

export default function CanvasPage() {
  const { id } = useParams<{ id: string }>();
  const setGraph = useCanvasStore((s) => s.setGraph);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const nodes = useCanvasStore((s) => s.nodes);
  const [mindmap, setMindmap] = useState<Mindmap | null>(null);

  const stepNodes = nodes.filter((n) => n.type === "roadmap-step");
  const completedSteps = stepNodes.filter((n) => n.data.isCompleted).length;
  const progress = stepNodes.length > 0 ? Math.round((completedSteps / stepNodes.length) * 100) : 0;

  useEffect(() => {
    getMindmap(id)
      .then((loaded) => {
        setMindmap(loaded);
        setGraph(loaded.nodes, loaded.edges);
      })
      .catch((err) => console.error("[CANVAS] gagal load mindmap:", err));
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
              <strong>{mindmap?.title ?? "Memuat…"}</strong>
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
            <button type="button" className="sm-btn sm-btn--ghost">
              Bagikan
            </button>
            <ExportButton filename={mindmap?.title ?? "canvas"} />
          </div>
        </header>

        <div className={`canvas-body${selectedNodeId ? " has-drawer" : ""}`}>
          <div className="canvas-area">
            {mindmap ? <CanvasView /> : <div className="canvas-loading">Memuat canvas…</div>}
          </div>

          {selectedNodeId && <Drawer />}
        </div>
      </div>
    </ReactFlowProvider>
  );
}
