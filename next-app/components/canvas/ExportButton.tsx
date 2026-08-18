"use client";

import { useState } from "react";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";
import { ImageDown } from "lucide-react";
import { getNodesBounds, getViewportForBounds, useReactFlow } from "@xyflow/react";
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

type ExportFormat = "png" | "pdf";
type ExportStatus = "idle" | "checking" | "exporting";

const BUTTON_LABEL: Record<ExportStatus, string> = {
  idle: "Export",
  checking: "Menyiapkan…",
  exporting: "Mengekspor…",
};

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "canvas"
  );
}

export function ExportButton({ filename }: { filename: string }) {
  const { getNodes } = useReactFlow();
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [dialogOpen, setDialogOpen] = useState(false);

  function runExport(format: ExportFormat) {
    const nodes = getNodes();
    if (nodes.length === 0) return Promise.resolve();

    const bounds = getNodesBounds(nodes);
    const width = Math.min(bounds.width, MAX_EXPORT_WIDTH);
    const height = (width / bounds.width) * bounds.height;
    const viewport = getViewportForBounds(bounds, width, height, 0.5, 2, 0.1);

    const viewportEl = document.querySelector<HTMLElement>(".react-flow__viewport");
    if (!viewportEl) return Promise.resolve();

    const captureOptions = {
      backgroundColor: "#F7F1E9",
      width,
      height,
      pixelRatio: 2,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    };

    if (format === "png") {
      return toPng(viewportEl, captureOptions).then((dataUrl) => {
        const a = document.createElement("a");
        a.setAttribute("download", `${slugify(filename)}.png`);
        a.setAttribute("href", dataUrl);
        a.click();
      });
    }

    // PDF: pakai JPEG (bukan PNG) buat gambar yang di-embed — jsPDF nge-decode
    // ulang PNG jadi raw bitmap terus flate-compress sendiri (gak reuse
    // kompresi PNG aslinya), hasilnya bisa 40x lebih gede dari PNG sumbernya.
    // JPEG quality 0.92 ukurannya jauh lebih kecil dan tetap tajam buat teks/garis.
    return toJpeg(viewportEl, { ...captureOptions, quality: 0.92 }).then((dataUrl) => {
      // Halaman PDF ngikutin aspect ratio canvas, bukan ukuran kertas standar
      // (A4 dst) — roadmap-nya lebar/panjang, biar gak kepotong atau nyisain white space.
      const pdf = new jsPDF({
        orientation: width >= height ? "landscape" : "portrait",
        unit: "px",
        format: [width, height],
      });
      pdf.addImage(dataUrl, "JPEG", 0, 0, width, height);
      pdf.save(`${slugify(filename)}.pdf`);
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
      >
        {BUTTON_LABEL[status]}
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader className="items-center text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-clay-tint text-clay">
              <ImageDown className="size-5" strokeWidth={1.5} />
            </div>
            <DialogTitle>Export canvas roadmap</DialogTitle>
            <DialogDescription>
              Roadmap dan cabang mindmap yang lagi tampil akan diunduh. Pilih formatnya.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-center" style={{ justifyContent: "center", alignItems: "center", gap: 20 }}>
            <Button
              variant="outline"
              size="lg"
              className="px-7"
              style={{ height: 40, paddingLeft: 28, paddingRight: 28 }}
              onClick={() => setDialogOpen(false)}
            >
              Batal
            </Button>
            <div style={{ width: 1, height: 28, background: "var(--sm-line)" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                variant="outline"
                size="lg"
                className="px-7"
                style={{ height: 40, paddingLeft: 28, paddingRight: 28 }}
                onClick={() => handleConfirm("pdf")}
              >
                PDF
              </Button>
              <Button
                size="lg"
                className="px-7"
                style={{ height: 40, paddingLeft: 28, paddingRight: 28 }}
                onClick={() => handleConfirm("png")}
              >
                PNG
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
