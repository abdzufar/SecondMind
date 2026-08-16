"use client";

import { BRANCH_DETAILS, DEFAULT_BRANCH_DETAIL, STEP_SUMMARY, findStage, type Stage } from "./data";

export type Selected = { kind: "step"; stageId: string } | { kind: "branch"; stageId: string; branchId: string };

export function Drawer({
  selected,
  onSelect,
  onClose,
}: {
  selected: Selected;
  onSelect: (s: Selected) => void;
  onClose: () => void;
}) {
  const stage = findStage(selected.stageId) as Stage;
  const isBranch = selected.kind === "branch";
  const branch = isBranch ? stage.branches.find((b) => b.id === selected.branchId) : undefined;

  const title = isBranch && branch ? branch.label : stage.label;
  const typeLabel = isBranch ? "Cabang mindmap" : "Langkah roadmap";
  const detail = isBranch && branch ? (BRANCH_DETAILS[branch.id] ?? DEFAULT_BRANCH_DETAIL) : { summary: STEP_SUMMARY, note: "" };
  const siblings = isBranch ? stage.branches.filter((b) => b.id !== branch?.id) : stage.branches;
  const siblingsLabel = isBranch ? "Cabang lain di langkah ini" : "Cabang di langkah ini";
  const nodeKey = isBranch ? `branch-${stage.id}-${branch?.id}` : `step-${stage.id}`;

  return (
    <aside className="drawer">
      <div className="drawer-head">
        <span className="drawer-head-title">Detail node</span>
        <button type="button" className="icon-btn" aria-label="Tutup panel" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div className="drawer-body">
        {isBranch && (
          <button type="button" className="parent-step" onClick={() => onSelect({ kind: "step", stageId: stage.id })}>
            <span className="parent-step-num">{stage.num}</span>
            <span className="parent-step-body">
              <span className="parent-step-time">{stage.time}</span>
              <span className="parent-step-label">{stage.label}</span>
            </span>
          </button>
        )}

        <div className="node-head">
          <input key={nodeKey} className="node-title" defaultValue={title} aria-label="Judul node" />
          <span className={`node-type${isBranch ? "" : " is-step"}`}>{typeLabel}</span>
        </div>

        <div className="drawer-divider"></div>

        <div className="drawer-section">
          <h4>Ringkasan</h4>
          <p>{detail.summary}</p>
        </div>

        <div className="drawer-section">
          <h4>Catatan</h4>
          <textarea key={nodeKey} placeholder="Tambahkan catatan buat cabang ini…" defaultValue={detail.note}></textarea>
        </div>

        <div className="drawer-divider"></div>

        <div className="drawer-section">
          <h4>{siblingsLabel}</h4>
          <div className="sibling-list">
            {siblings.map((s) => (
              <button type="button" key={s.id} className="sibling" onClick={() => onSelect({ kind: "branch", stageId: stage.id, branchId: s.id })}>
                {s.label}
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

        <p className="drawer-meta">Dibuat otomatis dari riset-pasar.pdf · diperbarui 2 jam lalu</p>
      </div>
    </aside>
  );
}
