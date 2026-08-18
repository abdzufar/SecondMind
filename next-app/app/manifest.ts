import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Second Mind — Ubah dokumen jadi mindmap",
    short_name: "Second Mind",
    description:
      "Second Mind mengubah dokumen atau topik yang kamu masukkan jadi roadmap dan mindmap yang gampang dipahami dan dikerjakan.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F1E9",
    theme_color: "#221B14",
    icons: [
      { src: "/brand/png/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/png/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/png/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
