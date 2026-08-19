"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { FileText, ImageDown } from "lucide-react";
import { getNodesBounds, getViewportForBounds, useReactFlow } from "@xyflow/react";
import { buildRoadmapDocx } from "@/lib/canvas/exportDocx";
import { buildRoadmapPdf } from "@/lib/canvas/exportPdf";
import type { MindmapEdge, MindmapNode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_EXPORT_WIDTH = 2400;
const CHECK_DELAY_MS = 1000;
const EXPORT_DELAY_MS = 1500;

type ExportFormat = "png" | "pdf" | "docx";
type ExportStatus = "idle" | "checking" | "exporting";

const BUTTON_LABEL: Record<ExportStatus, string> = {
  idle: "Export",
  checking: "Menyiapkan…",
  exporting: "Mengekspor…",
};

const FORMAT_BTN_STYLE: React.CSSProperties = { height: 40, paddingLeft: 28, paddingRight: 28 };
const GROUP_LABEL_STYLE: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--sm-ink-45)",
  textAlign: "center",
};

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "canvas"
  );
}

type ExportButtonProps = {
  filename: string;
  topic: string;
  timeframe: string;
};

export function ExportButton({ filename, topic, timeframe }: ExportButtonProps) {
  const { getNodes, getEdges } = useReactFlow<MindmapNode, MindmapEdge>();
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [dialogOpen, setDialogOpen] = useState(false);

  function runExport(format: ExportFormat) {
    const nodes = getNodes();
    if (nodes.length === 0) return Promise.resolve();

    // Dokumen (Word/PDF): teks asli disusun dari data node — bukan
    // screenshot canvas, jadi gak butuh capture DOM sama sekali.
    if (format === "docx") {
      return buildRoadmapDocx({ title: filename, topic, timeframe }, nodes, getEdges()).then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("download", `${slugify(filename)}.docx`);
        a.setAttribute("href", url);
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    if (format === "pdf") {
      const pdf = buildRoadmapPdf({ title: filename, topic, timeframe }, nodes, getEdges());
      pdf.save(`${slugify(filename)}.pdf`);
      return Promise.resolve();
    }

    // PNG: satu-satunya format yang masih screenshot canvas apa adanya.
    const bounds = getNodesBounds(nodes);
    const width = Math.min(bounds.width, MAX_EXPORT_WIDTH);
    const height = (width / bounds.width) * bounds.height;
    const viewport = getViewportForBounds(bounds, width, height, 0.5, 2, 0.1);

    const viewportEl = document.querySelector<HTMLElement>(".react-flow__viewport");
    if (!viewportEl) return Promise.resolve();

    return toPng(viewportEl, {
      backgroundColor: "#F7F1E9",
      width,
      height,
      pixelRatio: 2,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    }).then((dataUrl) => {
      const a = document.createElement("a");
      a.setAttribute("download", `${slugify(filename)}.png`);
      a.setAttribute("href", dataUrl);
      a.click();
    });
  }

  function handleClick() {
    setStatus("checking");
    setTimeout(() => {
      setStatus("idle");
      setDialogOpen(true);
    }, CHECK_DELAY_MS);
  }

  function handleConfirm(format: ExportFormat) {
    setDialogOpen(false);
    setStatus("exporting");
    setTimeout(() => {
      runExport(format).finally(() => setStatus("idle"));
    }, EXPORT_DELAY_MS);
  }

  return (
    <>
      <button
        type="button"
        className="sm-btn sm-btn--dark"
        onClick={handleClick}
        disabled={status !== "idle"}
        aria-label="Export"
      >
        <ImageDown />
        <span className="btn-label">{BUTTON_LABEL[status]}</span>
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader className="items-center text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-clay-tint text-clay">
              <ImageDown className="size-5" strokeWidth={1.5} />
            </div>
            <DialogTitle>Export canvas roadmap</DialogTitle>
            <DialogDescription>
              Pilih format unduhan — gambar canvas apa adanya, atau dokumen teks rapi yang bisa dibaca/diedit/di-search.
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p style={GROUP_LABEL_STYLE}>Gambar</p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button size="lg" className="px-7" style={FORMAT_BTN_STYLE} onClick={() => handleConfirm("png")}>
                  PNG
                </Button>
              </div>
            </div>

            <div style={{ height: 1, background: "var(--sm-line)" }} />

            <div>
              <p style={GROUP_LABEL_STYLE}>Dokumen</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-7"
                  style={{ ...FORMAT_BTN_STYLE, display: "inline-flex", alignItems: "center", gap: 8 }}
                  onClick={() => handleConfirm("pdf")}
                >
                  <FileText className="size-4" strokeWidth={1.5} />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-7"
                  style={{ ...FORMAT_BTN_STYLE, display: "inline-flex", alignItems: "center", gap: 8 }}
                  onClick={() => handleConfirm("docx")}
                >
                  <FileText className="size-4" strokeWidth={1.5} />
                  Word (.docx)
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="justify-center" style={{ justifyContent: "center" }}>
            <Button
              variant="ghost"
              size="lg"
              className="px-7"
              style={FORMAT_BTN_STYLE}
              onClick={() => setDialogOpen(false)}
            >
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
