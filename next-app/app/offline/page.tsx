import Link from "next/link";
import { WifiOff } from "lucide-react";
import "./offline-page.css";

// Fallback yang di-serve service worker (lihat `fallbacks.document` di
// next.config.ts) pas navigasi (reload/buka tab baru/ketik URL langsung) gagal
// total karena offline DAN halaman yang dituju gak ke-precache. Statis —
// gak ada data yang perlu di-fetch, biar bisa di-precache aman pas install.
export default function OfflinePage() {
  return (
    <div className="page-offline">
      <div className="offline-wrap">
        <span className="offline-icon">
          <WifiOff />
        </span>
        <h1>Kamu sedang offline</h1>
        <p>Halaman ini belum pernah dibuka sebelumnya, jadi gak bisa dimuat tanpa koneksi internet.</p>
        <Link href="/" className="sm-btn sm-btn--primary">
          Coba lagi
        </Link>
      </div>
    </div>
  );
}
