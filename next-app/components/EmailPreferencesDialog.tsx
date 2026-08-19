"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { getUserPreferences, updateEmailReminders } from "@/lib/api";
import { useCanvasStore } from "@/store/canvasStore";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EmailPreferencesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EmailPreferencesDialog({ open, onOpenChange }: EmailPreferencesDialogProps) {
  const isOnline = useCanvasStore((s) => s.isOnline);
  const [savedEnabled, setSavedEnabled] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadPreferences() {
      setError(null);
      setIsLoading(true);
      try {
        const prefs = await getUserPreferences();
        if (!cancelled) {
          setSavedEnabled(prefs.emailRemindersEnabled);
          setEnabled(prefs.emailRemindersEnabled);
        }
      } catch {
        if (!cancelled) setError("Gagal memuat status pengingat email tersimpan.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPreferences();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const hasChanges = enabled !== savedEnabled;

  function handleDialogOpenChange(next: boolean) {
    if (!next) {
      // Batal implisit (X, Escape, klik backdrop) — buang draft, balik ke nilai tersimpan.
      setEnabled(savedEnabled);
      setError(null);
    }
    onOpenChange(next);
  }

  function handleCancel() {
    handleDialogOpenChange(false);
  }

  function handleSave() {
    if (!isOnline || !hasChanges) return;
    setIsSaving(true);
    setError(null);
    updateEmailReminders(enabled)
      .then(() => {
        setSavedEnabled(enabled);
        onOpenChange(false);
      })
      .catch(() => setError("Gagal menyimpan preferensi. Coba lagi."))
      .finally(() => setIsSaving(false));
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-clay-tint text-clay">
            <Mail className="size-5" strokeWidth={1.5} />
          </div>
          <DialogTitle>Pengingat email</DialogTitle>
          <DialogDescription>
            Atur apakah Second Mind boleh mengirim email pengingat buat to-do yang mendekati tenggat.
          </DialogDescription>
          {!isOnline && (
            <p className="text-sm text-destructive">Mode offline — simpan pengaturan butuh koneksi internet.</p>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="email-reminders-select">
            Email pengingat
          </label>
          <Select
            value={enabled ? "on" : "off"}
            onValueChange={(value) => setEnabled(value === "on")}
            disabled={isLoading || isSaving}
          >
            <SelectTrigger id="email-reminders-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on">Aktif — kirim email pengingat</SelectItem>
              <SelectItem value="off">Nonaktif — jangan kirim email</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
            Batal
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving || isLoading || !isOnline || !hasChanges}>
            {isSaving ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
