"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./canvas.css";
import { STAGES, DOC_META } from "./data";
import { Drawer, type Selected } from "./Drawer";

export default function CanvasPage() {
  const [selected, setSelected] = useState<Selected | null>(null);

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
            <strong>{DOC_META.title}</strong>
            <span>{DOC_META.meta}</span>
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

      <div className={`canvas-body${selected ? " has-drawer" : ""}`}>
        <main className="canvas-area">
          <div className="roadmap">
            {STAGES.map((stage) => (
              <div className="rm-stage" key={stage.id}>
                {stage.side === "left" && (
                  <div className="rm-cluster rm-cluster--left">
                    {stage.branches.map((branch) => (
                      <button
                        key={branch.id}
                        type="button"
                        className={`rm-branch${branch.isActive ? " is-active" : ""}${
                          selected?.kind === "branch" && selected.branchId === branch.id ? " is-selected" : ""
                        }`}
                        onClick={() => setSelected({ kind: "branch", stageId: stage.id, branchId: branch.id })}
                      >
                        {branch.label}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className={`rm-step${selected?.kind === "step" && selected.stageId === stage.id ? " is-selected" : ""}`}
                  onClick={() => setSelected({ kind: "step", stageId: stage.id })}
                >
                  <span className="rm-step-num">{stage.num}</span>
                  <span className="rm-step-body">
                    <span className="rm-step-time">{stage.time}</span>
                    <span className="rm-step-label">{stage.label}</span>
                  </span>
                </button>

                {stage.side === "right" && (
                  <div className="rm-cluster rm-cluster--right">
                    {stage.branches.map((branch) => (
                      <button
                        key={branch.id}
                        type="button"
                        className={`rm-branch${branch.isActive ? " is-active" : ""}${
                          selected?.kind === "branch" && selected.branchId === branch.id ? " is-selected" : ""
                        }`}
                        onClick={() => setSelected({ kind: "branch", stageId: stage.id, branchId: branch.id })}
                      >
                        {branch.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>

        {selected && <Drawer selected={selected} onSelect={setSelected} onClose={() => setSelected(null)} />}
      </div>

      {!selected && (
        <>
          <div className="canvas-legend" aria-hidden="true">
            <span>
              <span className="legend-chip legend-chip--step"></span>Langkah roadmap
            </span>
            <span>
              <span className="legend-chip legend-chip--branch"></span>Cabang mindmap
            </span>
          </div>

          <div className="canvas-toolbar" aria-hidden="true">
            <button type="button" aria-label="Zoom in">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
                <path d="M11 8v6" />
                <path d="M8 11h6" />
              </svg>
            </button>
            <button type="button" aria-label="Zoom out">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
                <path d="M8 11h6" />
              </svg>
            </button>
            <button type="button" aria-label="Fit view">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
            </button>
            <button type="button" aria-label="Export">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
            </button>
          </div>

          <form className="command-bar" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Tanya atau perintahkan sesuatu tentang roadmap ini…" />
            <button type="submit" aria-label="Kirim">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
}
