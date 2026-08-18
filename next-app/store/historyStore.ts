import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MindmapSummary } from "@/lib/api";

type HistoryState = {
  history: MindmapSummary[];
  // "cached" khusus dipakai pas fetch gagal karena offline TAPI ada data lama
  // yang ke-persist — beda dari "ready" (baru aja beneran fetch sukses), biar
  // UI bisa nampilin banner "ini data tersimpan" alih-alih diem-diem nyamain
  // sama data fresh.
  status: "loading" | "ready" | "cached" | "error";
  setHistory: (history: MindmapSummary[]) => void;
  applyCachedFallback: () => boolean;
  removeFromHistory: (id: string) => void;
  setStatus: (status: HistoryState["status"]) => void;
};

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      status: "loading",
      setHistory: (history) => set({ history, status: "ready" }),
      setStatus: (status) => set({ status }),
      // Dipanggil pas fetch dashboard gagal — kalau ada cache lama, pakai itu
      // (status "cached"); kalau gak ada sama sekali, gak ada yang bisa
      // ditampilin (status "error", sama kayak fetch gagal biasa).
      applyCachedFallback: () => {
        const hasCache = get().history.length > 0;
        set({ status: hasCache ? "cached" : "error" });
        return hasCache;
      },
      removeFromHistory: (id) => set((state) => ({ history: state.history.filter((h) => h._id !== id) })),
    }),
    {
      name: "secondmind-history-cache",
      partialize: (state) => ({ history: state.history }),
    }
  )
);
