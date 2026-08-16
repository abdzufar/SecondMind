"use client";

import { useCanvasStore } from "@/store/canvasStore";
import { MOCK_MINDMAP } from "@/lib/mock/mindmap";

export function Drawer() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);

  const node = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined;
  if (!node) return null;

  const isBranch = node.type === "mindmap-branch";
  const parentEdge = isBranch ? edges.find((e) => e.target === node.id) : undefined;
  const parentStep = parentEdge ? nodes.find((n) => n.id === parentEdge.source) : undefined;

  const stepId = isBranch ? parentStep?.id : node.id;
  const siblingIds = edges.filter((e) => e.source === stepId && e.target !== node.id).map((e) => e.target);
  const siblings = nodes.filter((n) => siblingIds.includes(n.id));

  const typeLabel = isBranch ? "Cabang mindmap" : "Langkah roadmap";
  const siblingsLabel = isBranch ? "Cabang lain di langkah ini" : "Cabang di langkah ini";

  return (
    <aside className="drawer">
      <div className="drawer-head">
        <span className="drawer-head-title">Detail node</span>
        <button type="button" className="icon-btn" aria-label="Tutup panel" onClick={() => selectNode(null)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div className="drawer-body">
        {isBranch && parentStep && (
          <button type="button" className="parent-step" onClick={() => selectNode(parentStep.id)}>
            <span className="parent-step-num">{parentStep.data.num}</span>
            <span className="parent-step-body">
              <span className="parent-step-time">{parentStep.data.timeMark}</span>
              <span className="parent-step-label">{parentStep.data.label}</span>
            </span>
          </button>
        )}

        <div className="node-head">
          <input key={node.id} className="node-title" defaultValue={node.data.label} aria-label="Judul node" />
          <span className={`node-type${isBranch ? "" : " is-step"}`}>{typeLabel}</span>
        </div>

        <div className="drawer-divider"></div>

        <div className="drawer-section">
          <h4>Ringkasan</h4>
          <p>{node.data.description}</p>
        </div>

        <div className="drawer-section">
          <h4>Catatan</h4>
          <textarea key={node.id} placeholder="Tambahkan catatan buat cabang ini…"></textarea>
        </div>

        <div className="drawer-divider"></div>

        <div className="drawer-section">
          <h4>{siblingsLabel}</h4>
          <div className="sibling-list">
            {siblings.map((s) => (
              <button type="button" key={s.id} className="sibling" onClick={() => selectNode(s.id)}>
                {s.data.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ai-zone">
          <span className="ai-zone-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v4" />
              <path d="M12 17v4" />
              <path d="M3 12h4" />
              <path d="M17 12h4" />
              <path d="m6.3 6.3 2.8 2.8" />
              <path d="m14.9 14.9 2.8 2.8" />
              <path d="m17.7 6.3-2.8 2.8" />
              <path d="m9.1 14.9-2.8 2.8" />
            </svg>
            Aksi AI
          </span>
          <form className="ask-ai" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Tanya soal cabang ini…" />
            <button type="submit" aria-label="Kirim">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
          <button type="button" className="expand-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Pecah jadi sub-cabang
          </button>
        </div>

        <p className="drawer-meta">Topik: {MOCK_MINDMAP.topic}</p>
      </div>
    </aside>
  );
}
