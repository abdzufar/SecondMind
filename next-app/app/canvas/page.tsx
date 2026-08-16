"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "./canvas.css";
import { MOCK_MINDMAP } from "@/lib/mock/mindmap";
import { useCanvasStore } from "@/store/canvasStore";
import { CanvasView } from "@/components/canvas/CanvasView";
import { Drawer } from "@/components/canvas/Drawer";

export default function CanvasPage() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
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
        <div className="header-actions">
          <button type="button" className="sm-btn sm-btn--ghost">
            Bagikan
          </button>
          <button type="button" className="sm-btn sm-btn--dark">
            Export
          </button>
        </div>
      </header>

      <div className={`canvas-body${selectedNodeId ? " has-drawer" : ""}`}>
        <div className="canvas-area">
          <ReactFlowProvider>
            <CanvasView />
          </ReactFlowProvider>
        </div>

        {selectedNodeId && <Drawer />}
      </div>
    </div>
  );
}
