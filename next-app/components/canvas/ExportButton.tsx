"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
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

  function runExport() {
    const nodes = getNodes();
    if (nodes.length === 0) return Promise.resolve();

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

  function handleConfirm() {
    setDialogOpen(false);
    setStatus("exporting");
    setTimeout(() => {
      runExport().finally(() => setStatus("idle"));
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
            <DialogTitle>Export canvas jadi PNG?</DialogTitle>
            <DialogDescription>
              Roadmap dan cabang mindmap yang lagi tampil akan diunduh sebagai file gambar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-center" style={{ justifyContent: "center" }}>
            <Button
              variant="outline"
              size="lg"
              className="px-7"
              style={{ height: 40, paddingLeft: 28, paddingRight: 28 }}
              onClick={() => setDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              size="lg"
              className="px-7"
              style={{ height: 40, paddingLeft: 28, paddingRight: 28 }}
              onClick={handleConfirm}
            >
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
