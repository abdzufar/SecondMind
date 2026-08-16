"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./loading-page.css";

const MESSAGES = ["Membaca dokumen…", "Menyusun topik utama…", "Menghubungkan cabang…", "Merapikan mindmap…"];

export default function LoadingPage() {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 1100);

    const timeout = setTimeout(() => {
      router.push("/canvas");
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [router]);

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

        <div className="spinner" role="status" aria-label="Memproses"></div>

        <p className="status">{MESSAGES[messageIndex]}</p>

        <div className="skeleton-list" aria-hidden="true">
          <div className="skeleton-bar"></div>
          <div className="skeleton-bar"></div>
          <div className="skeleton-bar"></div>
          <div className="skeleton-bar"></div>
        </div>
      </div>
    </div>
  );
}
