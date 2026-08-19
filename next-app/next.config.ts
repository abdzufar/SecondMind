import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // `withPWA()` di bawah selalu nempelin key `webpack()` ke config yang
  // di-export, walau lagi `disable: true` (dev) — Next.js 16 (Turbopack
  // default) nge-warning ERROR-level tiap kali lihat itu pas Turbopack aktif
  // ("might be a mistake"). `turbopack: {}` kosong ini nyatain eksplisit ke
  // Next.js: iya, Turbopack emang sengaja dipakai di sini (`next dev`, gak
  // ada `--webpack`), key `webpack` yang nempel itu bukan kesalahan.
  turbopack: {},
};

// next-pwa cuma jalan pas `next build --webpack` (package.json) — Turbopack
// (bundler default Next.js 16) gak support hook `webpack()` sama sekali, jadi
// plugin ini diem-diem gak ngefek kalau build tetap pakai Turbopack. Dev tetap
// Turbopack penuh karena next-pwa udah `disable` sendiri di development.
export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Fallback pas navigasi (reload/tab baru/ketik URL langsung) gagal total
  // karena offline DAN halamannya belum ke-precache — tanpa ini, gagalnya
  // jatuh ke halaman error native browser (dinosaurus Chrome), bukan sesuatu
  // yang di bawah kendali app. Nama route default next-pwa (`/_offline`)
  // gak dipakai — App Router nganggep folder berawalan `_` sebagai "private
  // folder" (dikecualikan dari routing), jadi `app/_offline/` gak akan
  // pernah bisa diakses sebagai halaman sama sekali.
  fallbacks: {
    document: "/offline",
  },
})(nextConfig);
