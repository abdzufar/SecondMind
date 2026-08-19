"use client";

import { Download } from "lucide-react";
import { useInstallPromptStore } from "@/store/installPromptStore";

// Cuma nge-render apa pun kalau ada `beforeinstallprompt` yang ke-tangkep
// (lihat OfflineSupport.tsx) — gak installable / udah ke-install / browser
// gak dukung (mis. Safari) berarti komponen ini gak nampilin apa-apa.
export function InstallAppButton() {
  const deferredPrompt = useInstallPromptStore((s) => s.deferredPrompt);
  const setDeferredPrompt = useInstallPromptStore((s) => s.setDeferredPrompt);

  if (!deferredPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // Event cuma bisa dipakai sekali (spec) — diterima atau ditolak,
    // dua-duanya bikin event ini gak valid lagi buat dipanggil ulang.
    setDeferredPrompt(null);
  }

  return (
    <button type="button" className="sm-btn sm-btn--ghost" onClick={handleInstall} aria-label="Install aplikasi">
      <Download />
      <span className="btn-label">Install App</span>
    </button>
  );
}
