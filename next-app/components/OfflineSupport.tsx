"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCanvasStore } from "@/store/canvasStore";
import { clearOfflineCache, getCachedUserId, setCachedUserId } from "@/lib/offlineCache";
import { useInstallPromptStore, type BeforeInstallPromptEvent } from "@/store/installPromptStore";

// Satu listener online/offline di root (§7 aturan arsitektur) + guard cache
// per-user, dua-duanya digabung di sini karena sama-sama "sekali di boot,
// gak per-komponen". Dipasang di app/layout.tsx sebagai child AuthProvider
// (butuh useSession(), jadi harus di dalam SessionProvider).
export function OfflineSupport() {
  const setIsOnline = useCanvasStore((s) => s.setIsOnline);
  const setDeferredPrompt = useInstallPromptStore((s) => s.setDeferredPrompt);
  const { data: session, status } = useSession();

  useEffect(() => {
    setIsOnline(navigator.onLine);
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline]);

  useEffect(() => {
    // next-pwa v5 (dipasang di next.config.ts) ngasumsiin Pages Router — fitur
    // "auto register"-nya nyuntik lewat _document.js, yang gak ada padanannya
    // di App Router, jadi `sw.js` ke-generate pas build tapi gak pernah
    // kedaftar sendiri di browser. Register manual di sini. `sw.js` cuma ada
    // hasil `next build --webpack` (next-pwa `disable: true` pas development,
    // lihat next.config.ts) — coba register di dev bakal 404, makanya di-skip.
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("[PWA] gagal register service worker:", err);
    });
  }, []);

  useEffect(() => {
    // Browser nembak ini pas situsnya installable DAN belum di-install —
    // `preventDefault()` nyetop UI generik bawaan browser, event-nya
    // disimpan biar bisa dipicu belakangan dari tombol custom kita sendiri
    // (`InstallAppButton.tsx`), bukan langsung ditampilin di sini.
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    // Nembak abis instalasi beneran kelar (baik lewat tombol kita atau ikon
    // install generik browser kalau usernya gak sempat lihat tombol kita) —
    // clear biar tombol ilang, gak ada state usang yang nyangkut.
    function handleAppInstalled() {
      setDeferredPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [setDeferredPrompt]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const currentUserId = session.user?.id;
    if (!currentUserId) return;

    const cachedUserId = getCachedUserId();
    if (cachedUserId && cachedUserId !== currentUserId) {
      clearOfflineCache();
    }
    setCachedUserId(currentUserId);
  }, [status, session?.user?.id]);

  return null;
}
