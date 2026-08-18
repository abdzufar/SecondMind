"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMindmaps } from "@/lib/api";

export default function CanvasIndexPage() {
  const router = useRouter();

  useEffect(() => {
    getMindmaps()
      .then((mindmaps) => {
        if (mindmaps.length > 0) {
          router.replace(`/canvas/${mindmaps[0]._id}`);
        } else {
          router.replace("/composer");
        }
      })
      .catch(() => router.replace("/composer"));
  }, [router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--sm-ink-45)" }}>
      Memuat…
    </div>
  );
}
