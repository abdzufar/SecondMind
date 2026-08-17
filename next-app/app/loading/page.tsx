"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./loading-page.css";
import { generateMindmap, type GenerateMindmapInput } from "@/lib/api";
import { takePendingGenerateInput } from "@/lib/pendingGenerate";

const MESSAGES = ["Membaca dokumen…", "Menyusun topik utama…", "Menghubungkan cabang…", "Merapikan mindmap…"];

export default function LoadingPage() {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const payloadRef = useRef<GenerateMindmapInput | null>(null);

  useEffect(() => {
    if (status !== "loading") return;
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 1100);
    return () => clearInterval(interval);
  }, [status]);

  const performGenerate = useCallback(
    (input: GenerateMindmapInput) => {
      generateMindmap(input)
        .then((mindmap) => {
          router.replace(`/canvas/${mindmap._id}`);
        })
        .catch(() => {
          setStatus("error");
        });
    },
    [router]
  );

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const pending = takePendingGenerateInput();
    if (!pending) {
      router.replace("/composer");
      return;
    }
    payloadRef.current = pending;
    performGenerate(pending);
  }, [router, performGenerate]);

  function handleRetry() {
    if (!payloadRef.current) return;
    setStatus("loading");
    performGenerate(payloadRef.current);
  }

  return (
    <div className="page-loading">
      <div className="loading-wrap">
        <div className="brand">
          <Image src="/brand/svg/mark.svg" width={28} height={28} alt="Second Mind" />
          <span className="sm-wordmark">
            <span>Second</span>
            <b>Mind</b>
          </span>
        </div>

        {status === "loading" ? (
          <>
            <div className="spinner" role="status" aria-label="Memproses"></div>
            <p className="status">{MESSAGES[messageIndex]}</p>
            <div className="skeleton-list" aria-hidden="true">
              <div className="skeleton-bar"></div>
              <div className="skeleton-bar"></div>
              <div className="skeleton-bar"></div>
              <div className="skeleton-bar"></div>
            </div>
          </>
        ) : (
          <>
            <p className="status status--error">Gagal membuat mindmap. Coba lagi?</p>
            <div className="loading-actions">
              <button type="button" className="sm-btn sm-btn--primary" onClick={handleRetry}>
                Coba Lagi
              </button>
              <Link href="/composer">Kembali ke form</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
