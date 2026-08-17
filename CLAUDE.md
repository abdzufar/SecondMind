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
    timeOffsetDays: number | null; // integer mentah dari Gemini, frontend format jadi "Hari X"/"Minggu Y"
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
  isCompleted?: boolean; // toggle "tandai selesai" lokal, cuma dipakai roadmap-step — bukan dari backend
  timeMark?: string | null; // "Hari X"/"Minggu Y", diformat dari timeOffsetDays — bukan dari backend
};

export type MindmapNode = Node<MindmapNodeData, WireNodeType>; // Node<> mewajibkan `position`
export type MindmapEdge = Edge;

export type Mindmap = Omit<WireMindmap, "nodes" | "edges"> & {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
};
```

**Penting:** node dari backend **tidak** punya field `position`. Koordinat dihitung di frontend pakai dagre setiap kali graph di-load atau bertambah, lewat `lib/canvas/layout.ts`. Kalau backend mengirim `position`, abaikan.

**Migrasi `timeMark` → `timeOffsetDays` sudah kelar** (matching `database_schema.md`, ditulis partner). Wire type sekarang `timeOffsetDays: number | null`; `lib/api.ts`'s `toMindmap()` yang format jadi tampilan "Hari X"/"Minggu Y" (disimpan balik ke `timeMark` — tapi sekarang field UI-only hasil hitungan, bukan lagi field wire). Komponen (`RoadmapStepNode.tsx`, `MindmapBranchNode.tsx`, `Drawer.tsx`) gak berubah sama sekali karena masih baca `data.timeMark` yang sama, cuma sumbernya sekarang dihitung bukan dikirim mentah. *(Catatan lama yang masih relevan: `api_documentation.md` contoh response `generate` masih nunjukin `timeMark: "Day 1"`, gak sinkron sama `database_schema.md` — kemungkinan dokumen itu belum di-update, worth dikonfirmasi ke partner.)*

**Konversi wire→UI** ditaruh di dua tempat, bukan di komponen:
- `lib/api.ts` (`toMindmap()`): memetakan `WireMindmap` → `Mindmap`, mengisi `num` (index roadmap-step + 1), `timeMark` (format tampilan dari `timeOffsetDays`), dan `position` placeholder awal.
- `lib/canvas/layout.ts`: mengisi `position` final dari hasil dagre.

## 6. Endpoint backend

Semua dipanggil hanya lewat `lib/api.ts`, tidak pernah langsung dari komponen.

| Endpoint | Kegunaan |
|---|---|
| `POST /api/mindmap/generate` | Kirim `FormData` (topik, PDF, timeframe, verbosity, language). Bisa makan waktu sampai 60 detik. Backend langsung auto-save ke MongoDB — response-nya sudah dokumen lengkap dengan `_id`, bukan preview yang perlu di-save terpisah. |
| `POST /api/mindmap/elaborate` | JSON `{ nodeId, concept, action, language }` → balik `{ newNodes, newEdges }` |
| `GET /api/mindmap` | Daftar ringkas untuk dashboard — cuma `_id, title, topic, timeframe, createdAt, isPublic, shareId` (bukan `nodes`/`edges` penuh, hemat bandwidth) |
| `GET /api/mindmap/:id` | Mindmap lengkap |
| `PUT /api/mindmap/:id` | Simpan `{ nodes, edges }` hasil edit manual. Juga nerima `isPublic: boolean` — kalau `true` dan mindmap belum punya `shareId`, backend auto-generate `shareId` baru sendiri (jangan bikin di frontend). |
| `DELETE /api/mindmap/:id` | Hapus. Backend cascade-delete semua `Todo` terkait juga, biar cron gak ngirim reminder buat mindmap yang udah gak ada. |
| `GET /api/mindmap/share/:shareId` | Publik, tanpa session — untuk halaman read-only. `403` kalau mindmap-nya gak `isPublic`. |
| `POST /api/todo`, `GET /api/todo?mindmapId=`, `PUT /api/todo/:id` | CRUD to-do |

Error yang perlu ditangani di UI: `400` (format file salah), `413` (PDF terlalu besar), `401` (session habis/belum login — semua endpoint `/mindmap/*` dan `/todo/*` butuh session), `403` (share link private), `404` (mindmap/todo tidak ditemukan).

## 7. Aturan arsitektur

1. **Semua akses data lewat `lib/api.ts`.** Selama backend belum siap, isinya mengembalikan mock dari `lib/mock/`. Integrasi nanti cukup mengganti isi file ini, bukan menyisir komponen. *(Berlaku untuk `nodes`/`edges` — `store/canvasStore.ts` sekarang load lewat `getMindmap()`. Belum berlaku untuk metadata mindmap: `app/canvas/page.tsx`, `Drawer.tsx`, `ExportButton` masih import `MOCK_MINDMAP` langsung buat `title`/`topic`/`timeframe`, karena store cuma nyimpen `nodes`/`edges`/`selectedNodeId` — belum ada tempat buat metadata level-mindmap. Perlu diputuskan nanti: tambah field ke store, atau state terpisah.)*
2. **Logika dagre diisolasi di `lib/canvas/layout.ts`**, tidak boleh ada di dalam komponen.
3. **Store zustand dikonsumsi dengan selector spesifik** (`useStore(s => s.nodes)`), bukan mengambil seluruh store. Kalau tidak, canvas re-render tiap klik satu node.
4. **Drag node dimatikan.** Pan, zoom, dan fit view tetap aktif.
5. **Status online/offline dipegang satu listener di root** dan disimpan di store. Jangan menaruh `navigator.onLine` di tiap komponen.

Bentuk store yang disepakati — state: `nodes`, `edges`, `selectedNodeId`, `status`, `isOnline`. Actions: `setGraph`, `selectNode`, `clearSelection`, `toggleNodeComplete`, `appendNodes`, `applyLayout`. *(Store nyata sekarang punya `nodes, edges, selectedNodeId` + `onNodesChange, onEdgesChange, selectNode, clearSelection, toggleNodeComplete, setGraph`. `setGraph(nodes, edges)` motong lewat `getLayoutedElements` sekalian — dipanggil sekali pas modul store di-load, dari `getMindmap()` di `lib/api.ts`. Masih kurang `status`, `isOnline`, `appendNodes`, `applyLayout` — ditunda ke M7/M10 karena baru kepake pas ada alur elaborate/offline beneran.)*

## 8. Cara kerja yang aku harapkan

- Kerjakan **satu milestone per sesi**, lalu berhenti dan laporkan sebelum lanjut.
- Kalau ada keputusan yang mahal untuk dibalik (bentuk store, struktur folder komponen, bentuk props node, token desain/identitas visual), tanya dulu sebelum menulis kode.
- Untuk hal kecil, langsung kerjakan saja tanpa bertanya.
- Jelaskan singkat praktik yang kamu pakai kalau itu konvensi tim profesional yang mungkin belum aku tahu.
- Jangan menulis kode backend.

---

## 9. Backlog

Status per 2026-08-17, dicek ulang terhadap working tree — bukan cuma niat.

### M0 — Setup
- [x] Init Next.js App Router + Tailwind
- [x] Install shadcn/ui, reactflow, dagre, zustand, next-pwa, html-to-image — semua terpasang. `shadcn/ui` sudah di-`init` dan token semantiknya dipetakan ke `--sm-*` (lihat §4); `next-pwa` baru package-nya, konfigurasi manifest/service-worker masih M10
- [x] Struktur folder: `components/`, `store/`, `lib/`, `lib/mock/`
- [x] Tulis `lib/types.ts` sesuai bagian 5 (wire/UI split)
- [x] Masukkan design token bagian 4 ke `app/globals.css` — sudah ada lewat `@theme inline`, §4 sudah dikoreksi supaya dokumen ikut kode

### M1 — Kerangka halaman
- [x] Header: tombol kembali ✓, judul ✓, tombol aksi ✓, progress bar ✓ (`header-progress` di `app/canvas/[id]/page.tsx`, dihitung dari node `roadmap-step`)
- [x] Canvas reactflow kosong — pan/zoom/fit view aktif ✓, `nodesDraggable={false}` sudah di-set di `CanvasView.tsx`
- [x] Sidebar kanan (bisa buka-tutup) — `components/canvas/Drawer.tsx`
- [x] Input chat di bawah canvas — ada di `CanvasView.tsx`, belum wired ke aksi (wajar, itu M7)

**Gotcha React Flow + data async** (kena pas M11 wiring `/canvas/[id]`): `<ReactFlow fitView>` cuma nge-fit sekali pas mount. Kalau `<CanvasView />` di-mount duluan sebelum `getMindmap()` selesai (nodes masih `[]`), canvas kejebak di state kosong/rusak biarpun data numpang masuk belakangan — `fitView` gak pernah re-run. Fix-nya: `app/canvas/[id]/page.tsx` sekarang nahan render `<CanvasView />` sampai `mindmap` state kepenuhin (`{mindmap ? <CanvasView /> : <div className="canvas-loading">...</div>}`). **Berlaku juga nanti buat M7**: begitu `appendNodes`/`applyLayout` dibikin, node baru yang nambah ke canvas yang udah ke-mount duluan gak akan otomatis ke-fit — butuh `useReactFlow().fitView()` manual, bukan cuma andelin prop `fitView`.

### M2 — Lapisan data
- [x] Mock mindmap di `lib/mock/mindmap.ts` — bentuk `WireMindmap` murni (bukan `Mindmap`), 5 roadmap-step + 13 branch, `timeOffsetDays` terisi (7/14/21/28/35), tanpa `position`/`num`/`isActive`
- [x] Mock todo di `lib/mock/todo.ts` — 3 `WireTodo` seed, terkait ke mindmap mock
- [x] `lib/api.ts`: `generateMindmap`, `elaborateNode`, `getMindmaps`, `getMindmap`, `saveMindmap`, `deleteMindmap`, `getTodos`, `createTodo`, `updateTodo` — semua ada, return mock lewat "database" in-memory + delay 300ms simulasi network. `getMindmaps` dipakai composer, `saveMindmap` belum dipanggil komponen manapun (wajar, itu M11)
- [x] Komponen tidak boleh fetch langsung — `store/canvasStore.ts` panggil `getMindmap()` dari `lib/api.ts`, bukan import `MOCK_MINDMAP` langsung (lihat §7 poin 1 buat gap yang tersisa: metadata mindmap di halaman lain)
- [x] Migrasi `timeMark: string` → `timeOffsetDays: number` di `lib/types.ts` + format "Hari X"/"Minggu Y" pas mapping wire→UI di `lib/api.ts` (lihat §5) — kelar, `lib/mock/mindmap.ts` dan komponen node/drawer udah konsisten

### M3 — Store zustand
- [~] State dan actions sesuai bagian 7 — `clearSelection`, `toggleNodeComplete`, `setGraph` sudah ada; `status`, `isOnline`, `appendNodes`, `applyLayout` sengaja ditunda ke M7/M10 (lihat §7)
- [x] Konsumsi pakai selector spesifik — semua pemakaian sudah `useCanvasStore(s => s.x)`

### M4 — Node dan layout
- [x] Komponen `roadmap-step`: bernomor ✓, lebih besar ✓, tampil `timeMark` ✓, warna berubah + ikon centang kalau selesai ✓ (`.xf-step.is-complete`)
- [x] Komponen `mindmap-branch`: lebih kecil, tanpa nomor
- [x] `lib/canvas/layout.ts`: spine vertikal (dagre TB, step-only) + cabang tiap step di-fan manual ke kiri/kanan gantian per step, sesuai hero illustration di `app/page.tsx`
- [x] Daftarkan keduanya ke `nodeTypes`

**⚠️ "Tandai selesai" (`isCompleted` di node) gak ada di spec resmi.** Dicek ulang ke `user_flow.md` dan `database_schema.md` (root, punya partner): skema node Mindmap cuma punya `label`, `description`, `timeOffsetDays` — gak ada field completion. `isCompleted` di spec cuma ada di skema `Todo` (M8). Konsekuensinya: state "selesai" di node sekarang **cuma di zustand lokal**, bakal ke-drop diam-diam kalau `PUT /api/mindmap/:id` beneran dipanggil (backend gak punya kolom buat nyimpennya). Belum diputuskan: biarin sebagai visual lokal-saja, atau ganti jadi ngikutin status To-Do (M8) yang emang persisted.

### M5 — Interaksi
- [x] Klik node → sidebar tampilkan label, description, timeMark
- [x] Tombol tandai selesai — `Drawer.tsx`, cuma tampil untuk `roadmap-step`, manggil `toggleNodeComplete` (lihat catatan di M4 soal persistensi)
- [x] Progress bar dihitung dari node `roadmap-step` saja — header `app/canvas/page.tsx`
- [x] Tutup sidebar → seleksi hilang (`clearSelection`)

### M6 — Alur generate
- [x] Form: topik ✓ (controlled + validasi wajib isi), upload PDF ✓ (`File` asli ke-simpen), timeframe/verbosity/bahasa ✓ (dibaca lewat ref pas submit). `handleGenerateClick` di `app/composer/page.tsx` ngerakit `GenerateMindmapInput`, taruh ke `lib/pendingGenerate.ts` (module singleton `setPendingGenerateInput`/`takePendingGenerateInput` — bukan `sessionStorage`, karena `input.file` adalah objek `File` asli yang gak bisa diserialisasi ke string; client-side nav Next.js gak reload JS runtime jadi module state cukup), lalu `router.push("/loading")`.
- [x] Loading state — `app/loading/page.tsx` sekarang manggil `generateMindmap()` sungguhan (dari `lib/pendingGenerate`'s payload) sambil teks progres bertahap tetap jalan; sukses → `router.replace(\`/canvas/${mindmap._id}\`)` (bukan `/canvas` statis lagi).
- [x] Error state + tombol coba lagi — kalau `generateMindmap()` reject, tampil pesan gagal + tombol "Coba Lagi" (retry pakai payload yang sama, disimpan di `useRef`) dan link "Kembali ke form". *(Belum spesifik nge-parse status 400/413 dari response — mock gak pernah reject dengan kode itu; penanganan pesan per-status baru masuk akal pas `lib/api.ts` beneran fetch ke backend, M11.)*
- [ ] Banner `feasibilityWarning` di atas canvas — belum ada, item terpisah dari alur generate ini
- **Gotcha yang kena pas implementasi** (dicatat buat referensi M7, polanya bakal muncul lagi): React Strict Mode di dev **double-invoke** `useEffect` — efek mount `app/loading/page.tsx` yang manggil `takePendingGenerateInput()` (queue "ambil sekali abis itu kosong") kena panggil dua kali, panggilan kedua dapat `null` dan langsung `router.replace("/composer")`, balapan sama hasil generate yang asli. Fix: guard `useRef` (`hasStartedRef`) di dalam efek supaya badan efek cuma bener-bener jalan sekali walau React manggil fungsinya dua kali.

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
- [ ] Toggle publik → tampilkan URL share + tombol copy — belum ada di frontend, tapi **backend-nya udah siap**: `PUT /api/mindmap/:id` dengan `{ isPublic: true }` auto-generate `shareId` sendiri, tinggal wiring lewat `lib/api.ts` (M2)
- [ ] Halaman `/share/[shareId]` — belum ada, konsumsi `GET /api/mindmap/share/:shareId` (publik, balik `403` kalau private)

### M10 — PWA dan offline
- [ ] Konfigurasi `next-pwa`, manifest, ikon, tombol install — belum ada (`next-pwa` belum terpasang)
- [ ] Zustand `persist` untuk cache mindmap dan index dashboard — belum ada
- [ ] Satu listener `online`/`offline` di root, simpan ke store — belum ada
- [ ] Saat offline: disable semua tombol AI, simpan, dan hapus; tampilkan banner mode offline — belum ada
- [ ] Wipe cache sebelum `signOut()`, cek `userId` cocok saat boot — belum ada

### M11 — Halaman pendukung dan perapian
- [x] Halaman login (Google + email/password) — backend partner udah kelar sisi mereka: `lib/auth.ts` (Google OAuth + Credentials provider, auto-register user Google baru, session JWT ada `user.id`), `POST /api/auth/register`, `types/next-auth.d.ts`. Frontend: `components/AuthProvider.tsx` (`SessionProvider` wrapper) dipasang di `app/layout.tsx`. `app/register/page.tsx` wired ke `POST /api/auth/register` — validasi password vs konfirmasi di klien, banner error (`.form-error` di `auth.css`) buat email sudah terdaftar, sukses → redirect ke `/login`. `app/login/page.tsx` wired ke `signIn("credentials", { redirect: false })` — salah password nampilin `.form-error` "Email atau password salah" tanpa pindah halaman, sukses → redirect ke `/composer`; tombol "Masuk dengan Google" (`GoogleIcon` lokal, divider `.auth-divider`) manggil `signIn("google", { callbackUrl: "/composer" })`. Semua diverifikasi lewat Playwright end-to-end pakai akun asli di MongoDB Atlas (bukan mock): register→login salah password→login benar→sesi kebaca lewat `/api/auth/session`→klik Google beneran nyampe ke `accounts.google.com` dengan `client_id`/`redirect_uri` yang benar.
- [x] Proteksi route — `middleware.ts` (baru, root `next-app/`) pakai `withAuth` dari `next-auth/middleware`, `matcher: ["/composer/:path*", "/canvas/:path*", "/loading/:path*"]`, `pages.signIn: "/login"`. Belum login akses salah satu route itu → redirect `307` ke `/login?callbackUrl=<path-asal>`; `/`, `/login`, `/register` tetap publik. **Gotcha yang kena pas verifikasi**: `router.push(callbackUrl)` abis `signIn()` sukses kadang gak pindah halaman (~50% kejadian pas ditest beruntun) — root cause-nya Next.js App Router client-side router cache: kunjungan pertama ke `/composer` (sebelum login, kena redirect) ke-cache, jadi `router.push` abis login kadang masih mainin hasil cache lama alih-alih re-check middleware ke cookie session yang baru. Fix: `router.refresh()` dipanggil tepat setelah `router.push(callbackUrl)` di `app/login/page.tsx` buat bust cache-nya. Diverifikasi 5x percobaan login berturut-turut (context baru tiap kali) — konsisten berhasil.
  - **Belum ada di M11 ini**: tombol logout/avatar dropdown belum kesambung `signOut()`.
- [x] Dashboard daftar mindmap + tombol hapus — `app/composer/page.tsx` "Riwayat" baca `getMindmaps()`, link tiap item ke `/canvas/${item._id}` (route `app/canvas/[id]/page.tsx`, `getMindmap(id)` dipanggil per-id lewat `useParams`). `app/canvas/page.tsx` (tanpa id) redirect ke `DEFAULT_MINDMAP_ID`. Tombol hapus per item (ikon trash) buka dialog konfirmasi (pola sama kayak `ExportButton`, pakai `Button variant="destructive"`) → panggil `deleteMindmap()` → hapus dari state lokal.
- [x] Empty state dan loading skeleton — `app/loading/page.tsx` punya skeleton bar; dashboard "Riwayat" sekarang juga punya skeleton row + empty state (`.history-empty`) pas `getMindmaps()` kosong/gagal
- [ ] Layar kecil: sidebar jadi bottom sheet — belum diverifikasi, drawer saat ini cuma jadi full-width di `<900px`, bukan bottom sheet
- [~] Ganti isi `lib/api.ts` dari mock ke fetch asli — dikerjakan satu fungsi per satu, bukan sekaligus. `generateMindmap()` **sudah** manggil `POST /api/mindmap/generate` beneran (`FormData`: topic/timeframe/verbosity/language/file, sesuai kontrak §6). Hasilnya dibaca lewat `WireMindmap`, terus di-bridge juga ke `mindmapsDb` lokal (`mindmapsDb.push`) — supaya `getMindmap()`/`getMindmaps()` yang **masih mock** tetap bisa nemuin record hasil generate asli itu pas alur redirect ke `/canvas/[id]`. Bridge ini sementara, dicabut pas `getMindmap`/`getMindmaps` ikut dipindah ke fetch asli (fungsi-fungsi lain — `elaborateNode`, `getMindmaps`, `getMindmap`, `saveMindmap`, `deleteMindmap`, todo — masih mock, nunggu giliran masing-masing).
  - **⚠️ Blocker backend, bukan frontend** — dicoba end-to-end lewat Playwright (akun asli, submit form asli), request nyampe ke `POST /api/mindmap/generate` dengan bener (bukti: gagalnya BUKAN di validasi field), tapi route-nya sendiri crash duluan sebelum sempet manggil Gemini: `app/api/mindmap/generate/route.ts:10` — `import pdfParse from "pdf-parse"` gagal resolve ("Export default doesn't exist in target module", paket `pdf-parse` versi yang kepasang cuma punya named export di build ESM-nya, bukan default export), jadi **seluruh route 500 setiap kali dipanggil**, walau requestnya gak upload file sama sekali (error-nya di level import module, bukan kondisional pas ada file). Frontend udah nangkep ini dengan bener — banner error + tombol retry di `/loading` muncul persis sesuai desain (lihat catatan M6). Ini kerjaan partner (`app/api/mindmap/generate/route.ts`), bukan sesuatu yang boleh/perlu aku benerin — perlu dikabarin ke partner buat di-fix (ganti jadi `import * as pdfParse from "pdf-parse"` atau sesuaikan cara importnya, tapi itu keputusan dia).

---

## 10. Rencana sesi berikutnya

Sejak M2 kelar, beberapa hal udah nyusul: routing `/canvas/[id]` (M11), tombol hapus + wiring `getMindmaps()` di dashboard "Riwayat" (M11), input verbosity+bahasa di composer (M6), fix bug fitView-vs-async-load di canvas (lihat catatan gotcha di §9 M1), dan migrasi `timeMark` → `timeOffsetDays` (§5, §9 M2) — semua kelar dan ke-verifikasi di browser.

**Satu keputusan yang masih menunggu:** nasib "tandai selesai" per-node (§9 M4) — tetap visual lokal, atau digeser ke status To-Do (M8) yang persisted. Belum ada urgensi mendesak buat mutusin ini.

Gap kecil yang tersisa dari §7 poin 1: `Drawer.tsx` baris "Topik: {MOCK_MINDMAP.topic}" masih baca mock statis langsung, bukan dari mindmap yang lagi dimuat — satu-satunya sisa metadata yang belum ikut migrasi ke `/canvas/[id]` (header & filename export udah bener).

Kandidat milestone berikutnya:
- **Wiring tombol "Buat Mindmap"** — baca form (topik/timeframe/verbosity/bahasa/file), panggil `generateMindmap()`, redirect ke `/canvas/[id]` hasilnya. Ini yang nyambungin M6 loading state ke alur nyata.
- **M3 sisa**: `status`, `isOnline`, `appendNodes`, `applyLayout` — paling masuk akal digabung barengan M7 (elaborate) atau M10 (offline).
- **Nasib "tandai selesai"** (keputusan di atas) kalau user mau ambil sekarang.

**Kalau waktu mepet, yang boleh dipotong:** M10 seluruhnya, dan upload PDF di M6 — sisakan input topik saja.
