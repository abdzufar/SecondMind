import { useCanvasStore } from "@/store/canvasStore";
import { useHistoryStore } from "@/store/historyStore";

const CACHED_USER_ID_KEY = "secondmind-cached-user-id";

// Dipanggil di dua tempat: (1) tombol "Keluar" sebelum `signOut()`, biar device
// yang dipakai gantian gak nyisain data user sebelumnya; (2) OfflineSupport.tsx
// pas boot kalau ketauan `userId` sesi sekarang beda dari yang ke-cache terakhir
// (jaga-jaga kalau wipe di titik #1 gak sempet jalan — sesi expired, tab ditutup
// paksa, dll).
export function clearOfflineCache() {
  useCanvasStore.persist.clearStorage();
  useHistoryStore.persist.clearStorage();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CACHED_USER_ID_KEY);
  }
}

export function getCachedUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CACHED_USER_ID_KEY);
}

export function setCachedUserId(userId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHED_USER_ID_KEY, userId);
}
