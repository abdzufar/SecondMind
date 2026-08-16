"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./composer.css";

type SelectedFile = {
  name: string;
  sizeLabel: string;
};

const HISTORY = [
  {
    id: "1",
    title: "Strategi Growth 2026",
    meta: "riset-pasar.pdf — diproses 2 jam lalu",
  },
  {
    id: "2",
    title: "Fondasi Machine Learning",
    meta: "catatan-kuliah.docx — diproses kemarin",
  },
  {
    id: "3",
    title: "Notulen Rapat Q1",
    meta: "notulen-q1.txt — diproses 3 hari lalu",
  },
];

function formatSize(bytes: number) {
  const kb = bytes / 1024;
  return kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : Math.round(kb) + " KB";
}

export default function ComposerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<SelectedFile | null>({
    name: "riset-pasar.pdf",
    sizeLabel: "2.4 MB",
  });
  const [isDragOver, setIsDragOver] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setFile({ name: picked.name, sizeLabel: formatSize(picked.size) });
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    setFile({ name: dropped.name, sizeLabel: formatSize(dropped.size) });
  }

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
          <div className="avatar">AP</div>
        </div>
      </header>

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
              <div className="input-wrap">
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
                />
              </div>
            </div>
            <div className="field field--timeframe">
              <label className="label" htmlFor="timeframe">
                Target waktu
              </label>
              <select className="select" id="timeframe" name="timeframe" defaultValue="1-month">
                <option value="1-week">1 minggu (kilat)</option>
                <option value="2-week">2 minggu</option>
                <option value="1-month">1 bulan</option>
                <option value="3-month">3 bulan</option>
                <option value="flexible">Santai, gak buru-buru</option>
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
              <input ref={fileInputRef} type="file" id="file-input" onChange={handleFileChange} />
            </label>
          )}

          <div className="field">
            <label className="label" htmlFor="instruction">
              Instruksi tambahan (opsional)
            </label>
            <textarea id="instruction" placeholder="Contoh: fokus ke bagian strategi konten"></textarea>
          </div>

          <div className="upload-actions">
            <button type="button" className="sm-btn sm-btn--ghost" onClick={() => fileInputRef.current?.click()}>
              Unggah File
            </button>
            <button type="button" className="sm-btn sm-btn--primary" onClick={() => router.push("/loading")}>
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
          <div className="history-list">
            {HISTORY.map((item) => (
              <Link className="history-item" href="/canvas" key={item.id}>
                <div className="history-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </div>
                <div className="history-info">
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </div>
                <span className="link-sm">Lihat →</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
