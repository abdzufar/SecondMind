"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import "./composer.css";
import { WifiOff } from "lucide-react";
import { deleteMindmap, getMindmaps, type GenerateMindmapInput, type MindmapSummary } from "@/lib/api";
import { setPendingGenerateInput } from "@/lib/pendingGenerate";
import { getInitials } from "@/lib/utils";
import { clearOfflineCache } from "@/lib/offlineCache";
import { useCanvasStore } from "@/store/canvasStore";
import { useHistoryStore } from "@/store/historyStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SelectedFile = {
  name: string;
  sizeLabel: string;
  file: File;
};

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

const HISTORY_PREVIEW_LIMIT = 3;

function formatSize(bytes: number) {
  const kb = bytes / 1024;
  return kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : Math.round(kb) + " KB";
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "kemarin";
  if (days < 30) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function ComposerPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeframeRef = useRef<HTMLSelectElement>(null);
  const verbosityRef = useRef<HTMLSelectElement>(null);
  const languageRef = useRef<HTMLSelectElement>(null);
  const [file, setFile] = useState<SelectedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [topic, setTopic] = useState("");
  const [topicError, setTopicError] = useState(false);
  const history = useHistoryStore((s) => s.history);
  const historyStatus = useHistoryStore((s) => s.status);
  const setHistory = useHistoryStore((s) => s.setHistory);
  const applyCachedHistoryFallback = useHistoryStore((s) => s.applyCachedFallback);
  const removeFromHistory = useHistoryStore((s) => s.removeFromHistory);
  const isOnline = useCanvasStore((s) => s.isOnline);
  const [deleteTarget, setDeleteTarget] = useState<MindmapSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    function loadHistory() {
      if (!useCanvasStore.getState().isOnline) {
        applyCachedHistoryFallback();
        return;
      }
      getMindmaps()
        .then((mindmaps) => setHistory(mindmaps))
        .catch(() => applyCachedHistoryFallback());
    }

    loadHistory();

    // Kalau halaman ini dipulihkan dari bfcache browser (mis. tombol back),
    // JS gak jalan ulang sama sekali — riwayat bisa nyangkut versi lama
    // (sebelum generate) sampai di-reload manual. `pageshow` + `persisted`
    // ngedeteksi kejadian itu dan fetch ulang.
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) loadHistory();
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [setHistory, applyCachedHistoryFallback]);

  function handleDeleteConfirm() {
    if (!deleteTarget || !isOnline) return;
    setIsDeleting(true);
    setDeleteError(null);
    deleteMindmap(deleteTarget._id)
      .then(() => {
        removeFromHistory(deleteTarget._id);
        setDeleteTarget(null);
      })
      .catch(() => setDeleteError("Gagal menghapus mindmap. Coba lagi."))
      .finally(() => setIsDeleting(false));
  }

  function validateFile(file: File): boolean {
    setFileError(null);
    if (file.size > 10 * 1024 * 1024) {
      setFileError("Ukuran file maksimal 10MB");
      return false;
    }
    const allowedExtensions = [".pdf", ".docx", ".txt"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setFileError("Tipe file tidak didukung (.pdf, .docx, .txt saja)");
      return false;
    }
    return true;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (validateFile(picked)) {
      setFile({ name: picked.name, sizeLabel: formatSize(picked.size), file: picked });
    } else {
      e.target.value = "";
    }
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    if (validateFile(dropped)) {
      setFile({ name: dropped.name, sizeLabel: formatSize(dropped.size), file: dropped });
    }
  }

  function handleGenerateClick() {
    if (!isOnline) return;
    if (!topic.trim()) {
      setTopicError(true);
      return;
    }
    setTopicError(false);

    const payload: GenerateMindmapInput = {
      topic: topic.trim(),
      file: file?.file ?? null,
      timeframe: timeframeRef.current?.value ?? "1-month",
      verbosity: verbosityRef.current?.value ?? "seimbang",
      language: languageRef.current?.value ?? "id",
    };

    setPendingGenerateInput(payload);
    router.push("/loading");
  }

  // Dipakai di list utama (3 item pertama) dan di modal "Lihat lainnya" (semua
  // item) — biar dua-duanya konsisten tanpa duplikasi JSX.
  function renderHistoryItem(item: MindmapSummary) {
    return (
      <div className="history-item" key={item._id}>
        <Link className="history-item-link" href={`/canvas/${item._id}`}>
          <div className="history-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <div className="history-info">
            <strong>{item.title}</strong>
            <span>
              {item.topic} · {formatRelativeTime(item.createdAt)}
            </span>
          </div>
          <span className="link-sm">Lihat →</span>
        </Link>
        <button
          type="button"
          className="history-delete"
          aria-label={`Hapus ${item.title}`}
          disabled={!isOnline}
          onClick={() => {
            setDeleteError(null);
            setDeleteTarget(item);
          }}
        >
          <TrashIcon className="size-4" />
        </button>
      </div>
    );
  }

  const visibleHistory = history.slice(0, HISTORY_PREVIEW_LIMIT);
  const hasMoreHistory = history.length > HISTORY_PREVIEW_LIMIT;

  return (
    <div className="page-composer">
      <header className="site-header">
        <Link className="brand" href="/">
          <Image src="/brand/svg/mark.svg" width={28} height={28} alt="Second Mind" />
          <span className="sm-wordmark">
            <span>Second</span>
            <b>Mind</b>
          </span>
        </Link>
        <div className="account-chip">
          <a href="#riwayat">Riwayat</a>
          <DropdownMenu>
            <DropdownMenuTrigger className="avatar" aria-label="Menu akun">
              {getInitials(session?.user?.name, session?.user?.email)}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-semibold text-foreground">{session?.user?.name ?? "Akun"}</span>
                    {session?.user?.email && (
                      <span className="truncate font-normal text-xs">{session.user.email}</span>
                    )}
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  clearOfflineCache();
                  signOut({ callbackUrl: "/login" });
                }}
              >
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {!isOnline && (
        <div className="offline-banner">
          <WifiOff />
          <p>Mode offline — bikin mindmap baru dan hapus riwayat dinonaktifkan sampai online lagi.</p>
        </div>
      )}

      <main className="page">
        <div className="page-head">
          <h1>Upload dokumenmu</h1>
          <p>Tempel teks atau upload file, nanti Second Mind yang susun jadi mindmap.</p>
        </div>

        <div className="upload-card">
          <div className="field-row">
            <div className="field field--grow">
              <label className="label" htmlFor="learning-goal">
                Mau belajar apa?
              </label>
              <div className={`input-wrap${topicError ? " has-error" : ""}`}>
                <span className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5A5.5 5.5 0 1 0 7 8c0 2 1 3 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                  </svg>
                </span>
                <input
                  className="input"
                  type="text"
                  id="learning-goal"
                  name="learning-goal"
                  placeholder="Contoh: strategi growth marketing, dasar machine learning"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (topicError) setTopicError(false);
                  }}
                />
              </div>
              {topicError && <span className="field-error">Isi dulu mau belajar apa</span>}
            </div>
            <div className="field field--timeframe">
              <label className="label" htmlFor="timeframe">
                Target waktu
              </label>
              <select className="select" id="timeframe" name="timeframe" defaultValue="1-month" ref={timeframeRef}>
                <option value="1-week">1 minggu (kilat)</option>
                <option value="2-week">2 minggu</option>
                <option value="1-month">1 bulan</option>
                <option value="3-month">3 bulan</option>
                <option value="flexible">Santai, gak buru-buru</option>
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field field--grow">
              <label className="label" htmlFor="verbosity">
                Tingkat detail
              </label>
              <select className="select" id="verbosity" name="verbosity" defaultValue="seimbang" ref={verbosityRef}>
                <option value="ringkas">Ringkas — poin-poin inti aja</option>
                <option value="seimbang">Seimbang</option>
                <option value="detail">Detail — penjelasan lengkap tiap langkah</option>
              </select>
            </div>
            <div className="field field--grow">
              <label className="label" htmlFor="language">
                Bahasa
              </label>
              <select className="select" id="language" name="language" defaultValue="id" ref={languageRef}>
                <option value="id">Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {file ? (
            <div className="file-preview" id="file-preview">
              <div className="file-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 2v6h6" />
                </svg>
              </div>
              <div className="file-info">
                <strong>{file.name}</strong>
                <span>{file.sizeLabel} — siap diproses</span>
              </div>
              <button
                type="button"
                className="file-remove"
                aria-label="Hapus file"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <label
              className={`dropzone${isDragOver ? " is-dragover" : ""}`}
              htmlFor="file-input"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12" />
                <path d="m7 8 5-5 5 5" />
                <path d="M5 21h14" />
              </svg>
              <strong>Tarik &amp; lepas file di sini</strong>
              <span>atau klik untuk pilih file — .pdf, .docx, .txt, maks 10MB</span>
              <input ref={fileInputRef} type="file" id="file-input" accept=".pdf,.docx,.txt" onChange={handleFileChange} />
            </label>
          )}
          
          {fileError && <span className="field-error" style={{ display: "block", marginTop: 8 }}>{fileError}</span>}

          <div className="upload-actions">
            <button type="button" className="sm-btn sm-btn--ghost" onClick={() => fileInputRef.current?.click()}>
              Unggah File
            </button>
            <button type="button" className="sm-btn sm-btn--primary" onClick={handleGenerateClick} disabled={!isOnline}>
              Buat Mindmap
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="history" id="riwayat">
          <h2>Riwayat</h2>

          {historyStatus === "loading" && (
            <div className="history-list" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div className="history-item history-item--skeleton" key={i}>
                  <div className="history-icon skeleton-block" />
                  <div className="history-info">
                    <span className="skeleton-block skeleton-line" />
                    <span className="skeleton-block skeleton-line skeleton-line--sm" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {historyStatus === "error" && <p className="history-empty">Gagal memuat riwayat. Coba muat ulang halaman.</p>}

          {(historyStatus === "ready" || historyStatus === "cached") && history.length === 0 && (
            <p className="history-empty">Belum ada mindmap. Bikin yang pertama lewat form di atas.</p>
          )}

          {(historyStatus === "ready" || historyStatus === "cached") && history.length > 0 && (
            <div className="history-list">
              {historyStatus === "cached" && (
                <p className="history-cached-note">Gak bisa nyambung ke server — nampilin riwayat tersimpan terakhir.</p>
              )}
              {visibleHistory.map(renderHistoryItem)}
              {hasMoreHistory && (
                <button type="button" className="history-more-btn" onClick={() => setIsHistoryModalOpen(true)}>
                  Lihat semua riwayat ({history.length})
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Semua Riwayat</DialogTitle>
            <DialogDescription>Seluruh mindmap yang pernah kamu buat, {history.length} total.</DialogDescription>
          </DialogHeader>
          {historyStatus === "cached" && (
            <p className="history-cached-note">Gak bisa nyambung ke server — nampilin riwayat tersimpan terakhir.</p>
          )}
          <div className="history-list history-list--modal">{history.map(renderHistoryItem)}</div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader className="items-center text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <TrashIcon className="size-5" />
            </div>
            <DialogTitle>Hapus mindmap ini?</DialogTitle>
            <p
              style={{
                marginTop: -4,
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--sm-ink-70)",
              }}
            >
              &quot;{deleteTarget?.title}&quot;
            </p>
            <DialogDescription>Mindmap dan seluruh cabangnya akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.</DialogDescription>
            {deleteError && <p className="field-error">{deleteError}</p>}
          </DialogHeader>
          <DialogFooter className="justify-center" style={{ justifyContent: "center" }}>
            <Button
              variant="outline"
              size="lg"
              className="px-7"
              style={{ height: 40, paddingLeft: 28, paddingRight: 28 }}
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError(null);
              }}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="px-7"
              style={{ height: 40, paddingLeft: 28, paddingRight: 28 }}
              onClick={handleDeleteConfirm}
              disabled={isDeleting || !isOnline}
            >
              {isDeleting ? "Menghapus…" : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
