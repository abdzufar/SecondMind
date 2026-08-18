"use client";

import { useCanvasStore } from "@/store/canvasStore";

export function PublicNodePanel() {
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const clearSelection = useCanvasStore((s) => s.clearSelection);

  const node = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined;
  if (!node) return null;

  const isBranch = node.type === "mindmap-branch";
  const typeLabel = isBranch ? "Cabang mindmap" : "Langkah roadmap";

  return (
    <>
      {/* Sama kayak Drawer.tsx — cuma kepake di layar kecil (<900px, lihat
          canvas.css), biar bottom-sheet di halaman share konsisten sama canvas asli. */}
      <div className="drawer-backdrop" onClick={clearSelection} aria-hidden="true" />
      <aside className="drawer">
        <div className="drawer-handle" aria-hidden="true" />
        <div className="drawer-head">
          <span className="drawer-head-label">Detail node</span>
          <button type="button" className="icon-btn" aria-label="Tutup panel" onClick={clearSelection}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          <div className="node-head">
            <strong className="node-title-static">{node.data.label}</strong>
            <span className={`node-type${isBranch ? "" : " is-step"}`}>{typeLabel}</span>
          </div>

          <div className="drawer-divider"></div>

          <div className="drawer-section">
            <h4>Ringkasan</h4>
            <p>{node.data.description}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
