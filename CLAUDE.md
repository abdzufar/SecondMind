# SecondMind — Konteks Frontend

Claude Code membacanya otomatis tiap sesi.

---

## 1. Produk

SecondMind mengubah sebuah topik atau dokumen (silabus PDF) menjadi **satu tampilan hybrid roadmap + mindmap** untuk belajar. Gaya visualnya terinspirasi roadmap.sh: batang utama vertikal berisi langkah bernomor dari atas ke bawah, dengan cabang penjelas selang-seling di kiri dan kanan. Bukan dua view terpisah.

Ini final project bootcamp Hacktiv8, dikerjakan berdua.

## 2. Pembagian kerja

**Aku hanya mengerjakan frontend.** Backend (route handler, Mongoose, integrasi Gemini, next-auth, Resend, Vercel Cron) dikerjakan partnerku secara paralel dan belum selesai.

Jangan menulis route handler, skema Mongoose, atau kode integrasi Gemini. Kalau butuh data dari backend, pakai mock.

## 3. Stack

- **Framework:** Next.js (App Router) + React, PWA lewat `next-pwa` terpasang tapi **belum dikonfigurasi** (manifest/ikon/wrap `next.config.ts` — itu M10, bukan sekadar install)
- **Styling:** Tailwind CSS v4 (config CSS-first lewat `@theme` di `app/globals.css`, **bukan** `tailwind.config.*`) + `shadcn/ui` (CLI `shadcn@latest`, style `base-nova`, primitive `@base-ui/react` — bukan Radix). Token semantik shadcn (`--background`, `--primary`, `--border`, dst di `:root`) di-alias ke token `--sm-*` di §4, bukan palet abu-abu default shadcn — komponen baru ditambah lewat `npx shadcn add <nama>`, bukan ditulis manual
- **Canvas:** `@xyflow/react` (reactflow di-rename mulai v12) untuk render node, `@dagrejs/dagre` (bukan paket `dagre` lama) untuk hitung koordinat X/Y
- **State:** `zustand` (middleware `persist` untuk cache offline belum dipasang — bagian M10)
- **Auth:** `next-auth` — komponen dan session provider punya partner, aku hanya memakai `useSession`
- **Export gambar:** `html-to-image` terpasang, belum dipakai (M9)

## 4. Design token

Semua nilai ini dikunci di `app/globals.css` (`:root` + `@theme inline` — Tailwind v4 CSS-first, lihat §3). Jangan pakai warna atau font di luar daftar ini.

| Peran | Variabel | Nilai |
|---|---|---|
| Ink utama | `--sm-ink` | `#221B14` |
| Ink sekunder | `--sm-ink-70` | `#6E6255` |
| Ink tersier | `--sm-ink-45` | `#9A8B79` |
| Aksen (clay) | `--sm-clay` | `#C75B39` |
| Aksen hover/bright | `--sm-clay-bright` | `#E0794F` |
| Aksen tint (background lembut) | `--sm-clay-tint` | `#F6E7E0` |
| Paper / permukaan lembut | `--sm-paper` | `#F7F1E9` |
| Surface / permukaan utama | `--sm-surface` | `#FFFFFF` |
| Garis / border | `--sm-line` | `#E7D9C6` |

- **Font:** Plus Jakarta Sans (`--font-plus-jakarta-sans`) — satu keluarga font untuk display, body, dan metadata/angka/timeMark.

Spacing pakai skala `--sm-space-1` s/d `--sm-space-9` (4px s/d 96px, grid 4pt). Radius tiga nilai: `--sm-radius-sm` (8px), `--sm-radius-md` (12px), `--sm-radius-lg` (22px), plus `--sm-radius-pill` (999px) untuk tombol/chip. Elevasi dua nilai: `--sm-shadow-sm`, `--sm-shadow-md`.

**Token shadcn/ui:** `components/ui/*` (mis. `Button`) pakai class Tailwind semantik (`bg-primary`, `text-foreground`, `border-input`, dst), bukan `--sm-*` langsung. Supaya konsisten, `--primary` → `--sm-clay`, `--background`/`--card`/`--popover` → `--sm-surface`, `--secondary`/`--muted` → `--sm-paper`, `--accent` → `--sm-clay-tint`, `--border`/`--input` → `--sm-line`, `--ring` → `--sm-clay`, `--radius-sm/md/lg` → `--sm-radius-sm/md/lg`. Satu-satunya token shadcn yang **tidak** dipetakan ke brand: `--destructive` (masih default merah shadcn, karena belum ada warna danger di token brand). Belum ada dark mode — `.dark` sengaja tidak didefinisikan.

## 5. Kontrak data

`lib/types.ts` memisahkan dua lapis tipe:

- **Wire type** (`WireMindmap`, `WireMindmapNode`, `WireMindmapEdge`, `WireTodo`): persis kontrak backend yang sudah disepakati dengan partner. Jangan tambah field di sini kecuali partner konfirmasi field itu memang dikirim backend.
- **UI type** (`Mindmap`, `MindmapNode`, `MindmapEdge`): turunan buat reactflow. Boleh punya field tambahan yang **dihitung di frontend** — bukan field baru dari backend.

```ts
// lib/types.ts
import type { Edge, Node } from "@xyflow/react";

export type WireNodeType = "roadmap-step" | "mindmap-branch";

export type WireMindmapNode = {
  id: string;
  type: WireNodeType;
  data: {
    label: string;
    description: string;
    timeMark: string | null;
  };
};

export type WireMindmapEdge = {
  id: string;
  source: string;
  target: string;
};

export type WireMindmap = {
  _id: string;
  title: string;
  topic: string;
  timeframe: string;
  language: string;
  feasibilityWarning: string | null;
  isPublic: boolean;
  shareId: string | null;
  startDate: string;
  nodes: WireMindmapNode[];
  edges: WireMindmapEdge[];
};

export type WireTodo = {
  _id: string;
  mindmapId: string;
  taskText: string;
  dueDate: string;
  isCompleted: boolean;
};

// UI types
export type MindmapNodeData = WireMindmapNode["data"] & {
  num?: string; // nomor urut roadmap-step, dihitung dari index — bukan dari backend
  isActive?: boolean; // state highlight lokal (mis. cabang lagi di-elaborate) — bukan dari backend
};

export type MindmapNode = Node<MindmapNodeData, WireNodeType>; // Node<> mewajibkan `position`
export type MindmapEdge = Edge;

export type Mindmap = Omit<WireMindmap, "nodes" | "edges"> & {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
};
```

**Penting:** node dari backend **tidak** punya field `position`. Koordinat dihitung di frontend pakai dagre setiap kali graph di-load atau bertambah, lewat `lib/canvas/layout.ts`. Kalau backend mengirim `position`, abaikan.

**Konversi wire→UI** ditaruh di dua tempat, bukan di komponen:
- `lib/api.ts` (belum ada, lihat backlog M2): memetakan `WireMindmap` → `Mindmap`, mengisi `num` (index roadmap-step + 1) dan `position` placeholder awal.
- `lib/canvas/layout.ts`: mengisi `position` final dari hasil dagre.

## 6. Endpoint backend

Semua dipanggil hanya lewat `lib/api.ts`, tidak pernah langsung dari komponen.

| Endpoint | Kegunaan |
|---|---|
| `POST /api/mindmap/generate` | Kirim `FormData` (topik, PDF, timeframe, verbosity, language). Bisa makan waktu sampai 60 detik. |
| `POST /api/mindmap/elaborate` | JSON `{ nodeId, concept, action, language }` → balik `{ newNodes, newEdges }` |
| `GET /api/mindmap` | Daftar ringkas untuk dashboard |
| `GET /api/mindmap/:id` | Mindmap lengkap |
| `PUT /api/mindmap/:id` | Simpan `{ nodes, edges }` hasil edit manual |
| `DELETE /api/mindmap/:id` | Hapus |
| `GET /api/mindmap/share/:shareId` | Publik, tanpa session — untuk halaman read-only |
| `POST /api/todo`, `GET /api/todo?mindmapId=`, `PUT /api/todo/:id` | CRUD to-do |

Error yang perlu ditangani di UI: `400` (format file salah), `413` (PDF terlalu besar), `404` (mindmap tidak ditemukan).

## 7. Aturan arsitektur

1. **Semua akses data lewat `lib/api.ts`.** Selama backend belum siap, isinya mengembalikan mock dari `lib/mock/`. Integrasi nanti cukup mengganti isi file ini, bukan menyisir komponen. *(Belum ditegakkan sekarang — `store/canvasStore.ts` masih import `MOCK_MINDMAP` langsung karena `lib/api.ts` belum dibuat.)*
2. **Logika dagre diisolasi di `lib/canvas/layout.ts`**, tidak boleh ada di dalam komponen.
3. **Store zustand dikonsumsi dengan selector spesifik** (`useStore(s => s.nodes)`), bukan mengambil seluruh store. Kalau tidak, canvas re-render tiap klik satu node.
4. **Drag node dimatikan.** Pan, zoom, dan fit view tetap aktif. *(Belum ditegakkan sekarang — `CanvasView.tsx` tidak set `nodesDraggable={false}`, jadi node masih bisa di-drag.)*
5. **Status online/offline dipegang satu listener di root** dan disimpan di store. Jangan menaruh `navigator.onLine` di tiap komponen.

Bentuk store yang disepakati — state: `nodes`, `edges`, `selectedNodeId`, `status`, `isOnline`. Actions: `setGraph`, `selectNode`, `clearSelection`, `toggleNodeComplete`, `appendNodes`, `applyLayout`. *(Store nyata sekarang cuma punya `nodes, edges, selectedNodeId` + `onNodesChange, onEdgesChange, selectNode` — lihat backlog M3.)*

## 8. Cara kerja yang aku harapkan

- Kerjakan **satu milestone per sesi**, lalu berhenti dan laporkan sebelum lanjut.
- Kalau ada keputusan yang mahal untuk dibalik (bentuk store, struktur folder komponen, bentuk props node, token desain/identitas visual), tanya dulu sebelum menulis kode.
- Untuk hal kecil, langsung kerjakan saja tanpa bertanya.
- Jelaskan singkat praktik yang kamu pakai kalau itu konvensi tim profesional yang mungkin belum aku tahu.
- Jangan menulis kode backend.

---

## 9. Backlog

Status per 2026-08-16, dicek ulang terhadap working tree — bukan cuma niat.

### M0 — Setup
- [x] Init Next.js App Router + Tailwind
- [x] Install shadcn/ui, reactflow, dagre, zustand, next-pwa, html-to-image — semua terpasang. `shadcn/ui` sudah di-`init` dan token semantiknya dipetakan ke `--sm-*` (lihat §4); `next-pwa` baru package-nya, konfigurasi manifest/service-worker masih M10
- [x] Struktur folder: `components/`, `store/`, `lib/`, `lib/mock/`
- [x] Tulis `lib/types.ts` sesuai bagian 5 (wire/UI split)
- [x] Masukkan design token bagian 4 ke `app/globals.css` — sudah ada lewat `@theme inline`, §4 sudah dikoreksi supaya dokumen ikut kode

### M1 — Kerangka halaman
- [~] Header: tombol kembali ✓, judul ✓, tombol aksi ✓ — **progress bar belum ada**
- [~] Canvas reactflow kosong — pan/zoom/fit view aktif ✓ — **drag node belum dimatikan** (lihat §7 poin 4)
- [x] Sidebar kanan (bisa buka-tutup) — `components/canvas/Drawer.tsx`
- [x] Input chat di bawah canvas — ada di `CanvasView.tsx`, belum wired ke aksi (wajar, itu M7)

### M2 — Lapisan data
- [x] Mock mindmap di `lib/mock/` — 5 roadmap-step + 13 branch, `timeMark` terisi
- [ ] `lib/api.ts`: `generateMindmap`, `elaborateNode`, `getMindmaps`, `getMindmap`, `saveMindmap`, `deleteMindmap`, `getTodos`, `createTodo`, `updateTodo` — **belum dibuat sama sekali**
- [ ] Komponen tidak boleh fetch langsung — saat ini `store/canvasStore.ts` import mock langsung, bukan lewat `lib/api.ts`

### M3 — Store zustand
- [ ] State dan actions sesuai bagian 7 — store nyata belum sesuai (lihat §7)
- [x] Konsumsi pakai selector spesifik — semua pemakaian sudah `useCanvasStore(s => s.x)`

### M4 — Node dan layout
- [~] Komponen `roadmap-step`: bernomor ✓, lebih besar ✓, tampil `timeMark` ✓ — **warna berubah kalau selesai: belum ada**
- [x] Komponen `mindmap-branch`: lebih kecil, tanpa nomor
- [x] `lib/canvas/layout.ts`: spine vertikal (dagre TB, step-only) + cabang tiap step di-fan manual ke kiri/kanan gantian per step, sesuai hero illustration di `app/page.tsx`
- [x] Daftarkan keduanya ke `nodeTypes`

### M5 — Interaksi
- [x] Klik node → sidebar tampilkan label, description, timeMark
- [ ] Tombol tandai selesai — belum ada (butuh `toggleNodeComplete` di store dulu, M3)
- [ ] Progress bar dihitung dari node `roadmap-step` saja — belum ada
- [x] Tutup sidebar → seleksi hilang

### M6 — Alur generate
- [~] Form: topik ✓, upload PDF ✓ (drag-drop + file preview), timeframe ✓ — **verbosity dan bahasa belum ada input-nya**
- [~] Loading state — `app/loading/page.tsx` sudah ada teks progres bertahap (bukan spinner polos) ✓, tapi masih `setTimeout` 4 detik, belum terhubung ke pemanggilan `generateMindmap` yang sungguhan
- [ ] Error state + tombol coba lagi untuk 400 dan 413 — belum ada
- [ ] Banner `feasibilityWarning` di atas canvas — belum ada

### M7 — Alur elaborate
- [ ] Input chat mengirim node yang sedang dipilih (chip konteks) — command bar ada tapi belum kirim konteks node
- [ ] Node baru masuk lewat `appendNodes`, lalu `applyLayout` dipanggil ulang — action-nya belum ada di store
- [ ] Viewport jangan lompat setelah node bertambah

### M8 — To-do dan reminder
- [ ] Panel to-do per mindmap (tab kedua di sidebar) — belum ada
- [ ] Bikin task dari node — belum ada
- [ ] Date picker due date, checkbox selesai — belum ada
- [ ] Tandai visual node yang sudah punya task — belum ada

### M9 — Share dan export
- [x] Export PNG (`toPng` + `getNodesBounds` dari reactflow) — `components/canvas/ExportButton.tsx`, tombol Export di header
- [ ] Toggle publik → tampilkan URL share + tombol copy — belum ada
- [ ] Halaman `/share/[shareId]` — belum ada

### M10 — PWA dan offline
- [ ] Konfigurasi `next-pwa`, manifest, ikon, tombol install — belum ada (`next-pwa` belum terpasang)
- [ ] Zustand `persist` untuk cache mindmap dan index dashboard — belum ada
- [ ] Satu listener `online`/`offline` di root, simpan ke store — belum ada
- [ ] Saat offline: disable semua tombol AI, simpan, dan hapus; tampilkan banner mode offline — belum ada
- [ ] Wipe cache sebelum `signOut()`, cek `userId` cocok saat boot — belum ada

### M11 — Halaman pendukung dan perapian
- [~] Halaman login (Google + email/password) — `app/login/page.tsx` dan `app/register/page.tsx` sudah ada (form email/password + `PasswordInput`), tapi **belum pakai komponen next-auth partner** — `handleSubmit` cuma `router.push`, tidak ada tombol Google, tidak ada pemanggilan auth sungguhan
- [~] Dashboard daftar mindmap + tombol hapus — `app/composer/page.tsx` punya seksi "Riwayat" tapi masih data statis (`HISTORY` const), tanpa tombol hapus
- [~] Empty state dan loading skeleton — `app/loading/page.tsx` punya skeleton bar; empty state dashboard belum ada
- [ ] Layar kecil: sidebar jadi bottom sheet — belum diverifikasi, drawer saat ini cuma jadi full-width di `<900px`, bukan bottom sheet
- [ ] Ganti isi `lib/api.ts` dari mock ke fetch asli — belum relevan, `lib/api.ts` sendiri belum ada

---

## 10. Rencana sesi berikutnya

**Milestone pertama yang benar-benar belum dikerjakan: M2 — `lib/api.ts`.** Beda dengan M0/M1/M3/M4/M6/M11 yang masing-masing sudah punya kode nyata dengan gap parsial, M2 punya nol baris kode untuk deliverable utamanya, dan ini blocker struktural: aturan arsitektur §7 poin 1 saat ini dilanggar by construction karena store import mock langsung. M6 (generate), M7 (elaborate), M8 (todo), dan M11 (swap mock→fetch asli) semua butuh file ini ada duluan.

Urutan kerja yang disarankan:

1. **M2 — `lib/api.ts`** (prioritas pertama)
   - Buat `lib/api.ts` dengan 9 fungsi mock: `generateMindmap`, `elaborateNode`, `getMindmaps`, `getMindmap`, `saveMindmap`, `deleteMindmap`, `getTodos`, `createTodo`, `updateTodo`
   - Refactor `store/canvasStore.ts` supaya baca lewat `lib/api.ts`, bukan import `MOCK_MINDMAP` langsung dari `lib/mock/`
2. **M3 — Benahi bentuk store**, begitu M2 selesai (beberapa action baru masuk akal setelah `lib/api.ts` ada):
   - Tambah state `status`, `isOnline`
   - Tambah actions `setGraph`, `clearSelection`, `toggleNodeComplete`, `appendNodes`, `applyLayout`

**Satu bug kecil yang sudah ketahuan tapi belum diperbaiki:**
- `CanvasView.tsx` — `nodesDraggable` belum di-set `false`, jadi node masih bisa di-drag padahal §7 poin 4 bilang harus mati

**Kalau waktu mepet, yang boleh dipotong:** M10 seluruhnya, export PNG di M9, dan upload PDF di M6 — sisakan input topik saja.
