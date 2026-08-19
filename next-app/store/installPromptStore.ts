import { create } from "zustand";

// `beforeinstallprompt` bukan event standar — gak ada di lib.dom.d.ts bawaan
// TypeScript, jadi tipenya didefinisiin manual di sini (dipakai bareng oleh
// listener di OfflineSupport.tsx dan tombolnya di InstallAppButton.tsx).
export type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
};

type InstallPromptState = {
  // Event `beforeinstallprompt` yang di-`preventDefault()` terus disimpan —
  // browser cuma nembak event ini kalau situsnya emang "installable" (manifest
  // valid, service worker aktif) DAN belum ke-install. Null berarti gak ada
  // yang bisa ditawarin sekarang (belum installable, udah ke-install, atau
  // browser-nya emang gak dukung, mis. Safari/iOS).
  deferredPrompt: BeforeInstallPromptEvent | null;
  setDeferredPrompt: (event: BeforeInstallPromptEvent | null) => void;
};

// Store terpisah dari canvasStore (bukan cuma nambah field) — sengaja gak
// di-`persist`: `BeforeInstallPromptEvent` bukan objek yang bisa
// di-serialize (ada method `.prompt()`), dan event-nya emang cuma valid
// buat sesi/page-load itu doang.
export const useInstallPromptStore = create<InstallPromptState>((set) => ({
  deferredPrompt: null,
  setDeferredPrompt: (deferredPrompt) => set({ deferredPrompt }),
}));
