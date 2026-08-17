"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "./canvas.css";
import { MOCK_MINDMAP } from "@/lib/mock/mindmap";
import { useCanvasStore } from "@/store/canvasStore";
import { CanvasView } from "@/components/canvas/CanvasView";
import { Drawer } from "@/components/canvas/Drawer";
import { ExportButton } from "@/components/canvas/ExportButton";

export default function CanvasPage() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const nodes = useCanvasStore((s) => s.nodes);

  const stepNodes = nodes.filter((n) => n.type === "roadmap-step");
  const completedSteps = stepNodes.filter((n) => n.data.isCompleted).length;
  const progress = stepNodes.length > 0 ? Math.round((completedSteps / stepNodes.length) * 100) : 0;

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
              <strong>{MOCK_MINDMAP.title}</strong>
              <span>
                Roadmap {MOCK_MINDMAP.timeframe} · {MOCK_MINDMAP.nodes.length} node
              </span>
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
            <ExportButton filename={MOCK_MINDMAP.title} />
          </div>
        </header>

        <div className={`canvas-body${selectedNodeId ? " has-drawer" : ""}`}>
          <div className="canvas-area">
            <CanvasView />
          </div>

          {selectedNodeId && <Drawer />}
        </div>
      </div>
    </ReactFlowProvider>
  );
}
