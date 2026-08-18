"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { saveMindmap, getMindmap } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const OPEN_DELAY_MS = 1500;

type ShareButtonProps = {
  mindmapId: string;
  isPublic: boolean;
  shareId: string | null;
  onUpdate: (update: { isPublic: boolean; shareId: string | null }) => void;
};

export function ShareButton({ mindmapId, isPublic, shareId, onUpdate }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = shareId && typeof window !== "undefined" ? `${window.location.origin}/share/${shareId}` : null;

  function handleOpenClick() {
    setIsOpening(true);
    setTimeout(() => {
      setIsOpening(false);
      setOpen(true);
    }, OPEN_DELAY_MS);
  }

  function handleToggle(checked: boolean) {
    setIsSaving(true);
    setError(null);
    saveMindmap(mindmapId, { isPublic: checked })
      .then(() => getMindmap(mindmapId))
      .then((updated) => {
        onUpdate({ isPublic: updated.isPublic, shareId: updated.shareId });
      })
      .catch(() => setError("Gagal mengubah status berbagi. Coba lagi."))
      .finally(() => setIsSaving(false));
  }

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <button
        type="button"
        className="sm-btn sm-btn--ghost"
        onClick={handleOpenClick}
        disabled={isOpening}
        aria-label="Bagikan"
      >
        <Share2 />
        <span className="btn-label">{isOpening ? "Menyiapkan…" : "Bagikan"}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader className="items-center text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-clay-tint text-clay">
              <Share2 className="size-5" strokeWidth={1.5} />
            </div>
            <DialogTitle>Bagikan mindmap ini</DialogTitle>
            <DialogDescription>
              Aktifkan supaya siapa pun dengan link ini bisa lihat mindmap kamu (read-only), tanpa perlu login.
            </DialogDescription>
          </DialogHeader>

          <div className="share-toggle-row">
            <span>Publik</span>
            <Switch checked={isPublic} onCheckedChange={handleToggle} disabled={isSaving} />
          </div>

          {error && <p className="field-error">{error}</p>}

          {isPublic && shareUrl && (
            <div className="share-url-row">
              <input
                className="share-url-input"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button type="button" size="lg" onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Tersalin" : "Salin"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
