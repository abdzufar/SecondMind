"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { Eye } from "lucide-react";
import "../../canvas/canvas.css";
import { getSharedMindmap } from "@/lib/api";
import type { Mindmap } from "@/lib/types";
import { useCanvasStore } from "@/store/canvasStore";
import { CanvasView } from "@/components/canvas/CanvasView";

export default function SharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const setGraph = useCanvasStore((s) => s.setGraph);
  const [mindmap, setMindmap] = useState<Mindmap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getSharedMindmap(shareId)
      .then((loaded) => {
        setMindmap(loaded);
        setGraph(loaded.nodes, loaded.edges);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Mindmap tidak ditemukan.");
      });
  }, [shareId, setGraph]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <ReactFlowProvider>
      <div className="page-canvas page-share">
        <header className="canvas-header">
          <div className="header-left">
            <Link className="brand" href="/">
              <Image src="/brand/svg/mark.svg" width={24} height={24} alt="Second Mind" />
            </Link>
            <div className="doc-info">
              <div className="doc-info-title-row">
                <strong>{mindmap?.title ?? (loadError ? "Gagal memuat" : "Memuat…")}</strong>
                <span className="share-badge">
                  <Eye className="size-3.5" strokeWidth={2} />
                  Tampilan publik
                </span>
              </div>
              <span>{mindmap ? `Roadmap ${mindmap.timeframe} · ${mindmap.nodes.length} node` : ""}</span>
            </div>
          </div>
        </header>

        <div className="canvas-body">
          <div className="canvas-area">
            {mindmap ? (
              <CanvasView showCommandBar={false} />
            ) : loadError ? (
              <div className="canvas-loading canvas-loading--error">
                <p>{loadError}</p>
                <Link href="/">Kembali ke beranda</Link>
              </div>
            ) : (
              <div className="canvas-loading">Memuat mindmap…</div>
            )}
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
