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

1. **Semua akses data lewat `lib/api.ts`.** Selama backend belum siap, isinya mengembalikan mock dari `lib/mock/`. Integrasi nanti cukup mengganti isi file ini, bukan menyisir komponen. *(Berlaku untuk `nodes`/`edges` — `store/canvasStore.ts` sekarang load lewat `getMindmap()`. Metadata mindmap (`title`/`topic`/`timeframe`/`createdAt`) gak disimpan di store — tetap gak ada rencana nambah field ke store buat ini, karena udah terbukti cukup diteruskan sebagai props biasa dari `page.tsx` yang nyimpen `mindmap` di state lokal, turun ke `Drawer`/`ExportButton`/`ShareButton` yang butuh. `Drawer.tsx` sempat jadi satu-satunya sisa yang masih import `MOCK_MINDMAP` langsung buat `topic` — udah dibenerin, sekarang nerima `mindmapTopic` sebagai prop kayak yang lain.)*
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
- [~] State dan actions sesuai bagian 7 — `clearSelection`, `toggleNodeComplete`, `setGraph`, `appendNodes`, `applyLayout` (lihat M7) sudah ada; `status`, `isOnline` masih ditunda ke M10 (offline-related, belum kepake sampai fitur itu jalan)
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
- [x] Loading state — `app/loading/page.tsx` sekarang manggil `generateMindmap()` sungguhan (dari `lib/pendingGenerate`'s payload) sambil teks progres bertahap tetap jalan; sukses → `router.replace(\`/canvas/${mindmap._id}\`)` (bukan `/canvas` statis lagi). Teks progres (6 tahap, `MESSAGES` di `app/loading/page.tsx`) berhenti di pesan terakhir alih-alih muter balik ke awal (`Math.min`, bukan `% length`) — biar gak kelihatan ngulang pas prosesnya lama. Animasi di bawah teks: progress bar (`.build-progress`/`.build-progress-fill`) dengan fill lebar dinamis dari `messageIndex` dikapsulasi max 90% (baru ke 100% pas sukses) supaya gak kesan "selesai" padahal masih proses, plus shimmer halus di dalam fill-nya.
- [x] Error state + tombol coba lagi — kalau `generateMindmap()` reject, tampil pesan gagal + tombol "Coba Lagi" (retry pakai payload yang sama, disimpan di `useRef`) dan link "Kembali ke form". *(Belum spesifik nge-parse status 400/413 dari response — mock gak pernah reject dengan kode itu; penanganan pesan per-status baru masuk akal pas `lib/api.ts` beneran fetch ke backend, M11.)*
- [x] Banner `feasibilityWarning` di atas canvas — `app/canvas/[id]/page.tsx` nampilin banner clay-tint (ikon warning + teks + tombol tutup) tepat di bawah header, cuma muncul kalau `mindmap.feasibilityWarning` gak `null` (field udah ada di kontrak wire, diisi Gemini pas generate). Dismiss-nya `useState` lokal (`showFeasibilityWarning`), gak persisted — reset otomatis tiap mindmap baru dimuat karena page-nya remount. Sengaja gak pakai warna kuning/amber (gak ada di token brand §4) — pakai `--sm-clay-tint` sebagai nada "heads up" yang lebih lembut dari `--destructive` (merah, disimpan buat aksi destruktif/error beneran). Diverifikasi lewat Playwright route interception (inject `feasibilityWarning` ke response `GET /api/mindmap/:id`, karena gak bisa kontrol kapan Gemini beneran nge-flag topik) — banner muncul dan tombol tutup jalan.
- **Gotcha yang kena pas implementasi** (dicatat buat referensi M7, polanya bakal muncul lagi): React Strict Mode di dev **double-invoke** `useEffect` — efek mount `app/loading/page.tsx` yang manggil `takePendingGenerateInput()` (queue "ambil sekali abis itu kosong") kena panggil dua kali, panggilan kedua dapat `null` dan langsung `router.replace("/composer")`, balapan sama hasil generate yang asli. Fix: guard `useRef` (`hasStartedRef`) di dalam efek supaya badan efek cuma bener-bener jalan sekali walau React manggil fungsinya dua kali.

### M7 — Alur elaborate
- [ ] Input chat mengirim node yang sedang dipilih (chip konteks) — command bar ada tapi belum kirim konteks node
- [x] Node baru masuk lewat `appendNodes`, lalu `applyLayout` dipanggil ulang — `store/canvasStore.ts` sekarang punya dua action baru: `appendNodes(newNodes, newEdges)` (nambahin ke array `nodes`/`edges` yang ada, tanpa re-layout) dan `applyLayout()` (manggil ulang `getLayoutedElements(state.nodes, state.edges)` dari `lib/canvas/layout.ts` yang sama dipakai `setGraph`, jadi cabang baru ikut di-fan ulang bareng cabang lama di step yang sama).
  - **Contoh pemakaian nyata**: tombol "Pecah jadi sub-cabang" di `Drawer.tsx` (dulu no-op) sekarang manggil `elaborateNode()` (masih **mock**, belum backend asli — kontrak `{ newNodes, newEdges }` sama kayak yang bakal dipakai beneran nanti) lalu `appendNodes()` + `applyLayout()`. Dikasih state `isExpanding` (teks tombol jadi "Memproses…", disabled selagi jalan) dan `expandError` (pesan `.field-error` kalau gagal — class baru, alias ke style yang sama kayak `.todo-form-error` tapi generik gak nyebut "todo", dipisah biar gak aneh dipake di luar konteks form to-do).
- [x] Viewport jangan lompat setelah node bertambah — gak butuh kode tambahan sama sekali, ternyata udah otomatis aman: React Flow cuma manggil ulang `fitView` pas mount awal (gotcha yang udah dicatat di §9 M1), dan `appendNodes`/`applyLayout` cuma nge-set ulang `nodes`/`edges` di store, gak ada kode yang manggil `fitView()` lagi atau remount `<CanvasView />`. Diverifikasi lewat Playwright: pan viewport ke posisi custom → baca `.react-flow__viewport`'s inline `transform` → klik "Pecah jadi sub-cabang" → baca transform lagi → **identik persis** sebelum dan sesudah, plus jumlah node nambah tepat 1.

### M8 — To-do dan reminder
- [x] Panel to-do per mindmap (tab kedua di sidebar) — `Drawer.tsx` sekarang punya tab bar ("Detail" / "To-Do") di `drawer-head`, gantiin label statis "Detail node". **Perubahan struktural**: Drawer gak lagi `return null` kalau gak ada node dipilih — visibility-nya sekarang dikontrol `app/canvas/[id]/page.tsx` lewat `isSidebarOpen = !!selectedNodeId || todoPanelOpen` (state baru), jadi sidebar bisa kebuka buat lihat to-do walau lagi gak ada node yang diklik. Tombol header baru "To-Do" (`sm-btn sm-btn--ghost`, sejajar Bagikan/Export) buka drawer langsung ke tab To-Do. Klik node di canvas otomatis balik ke tab "Detail" (state `sidebarTab` disesuaikan langsung pas render — bukan lewat `useEffect`, ngikutin pola React "adjusting state during prop change" biar gak kena lint `react-hooks/set-state-in-effect`). Tombol tutup (X) sekarang nutup dua-duanya sekaligus (`clearSelection()` + `setTodoPanelOpen(false)`), gak peduli tab mana yang lagi aktif.
- [x] Bikin task dari node — komponen baru `components/canvas/TodoPanel.tsx`, kalau ada node yang lagi dipilih pas buka tab To-Do, muncul chip "+ Tambah dari node "​{label}"" yang prefill input taskText pakai label node itu (user masih bisa edit sebelum submit).
- [x] Date picker due date, checkbox selesai — `TodoPanel.tsx` pakai `<input type="date">` native (bukan komponen shadcn baru, biar gak nambah risiko Tailwind-JIT-miss buat class yang belum pernah dipakai) dan `<input type="checkbox">` di-style lewat `accent-color: var(--sm-clay)`. Checkbox toggle optimistic (langsung keliatan di UI, revert kalau `updateTodo()` gagal).
  - **Fix kecil setelah dicoba**: submit form tambah-todo tanpa isi nama task atau due date awalnya silent-fail (gak ada feedback, tombol "Tambah" kelihatan gak ngapa-ngapain). Sekarang `handleSubmit` nampilin pesan spesifik ("Isi dulu nama tasknya." / "Pilih due date dulu.") lewat `.todo-form-error`, dan otomatis ke-clear begitu user mulai ngisi input yang kosong tadi.
- [ ] Tandai visual node yang sudah punya task — **gak bisa diimplementasi dengan kontrak wire yang ada sekarang.** `WireTodo` (`lib/types.ts`) cuma punya `_id, mindmapId, taskText, dueDate, isCompleted` — **gak ada field `nodeId`**, jadi gak ada cara valid buat tau todo mana yang terkait ke node mana selain nebak dari kecocokan teks (`taskText === node.label`), yang rapuh. Sesuai §5 CLAUDE.md ("jangan tambah field di sini kecuali partner konfirmasi field itu memang dikirim backend"), item ini ditunda sampai ada konfirmasi partner soal field `nodeId` di skema `Todo`.

**`getTodos`/`createTodo`/`updateTodo` udah dimigrasi dari mock ke fetch asli** (nyusul saran partner soal fitur auto-generate to-do di bawah, sekalian nutup gap migrasi M11 yang sempat ditunda):
- `lib/api.ts`: ketiga fungsi sekarang manggil `GET /api/todo?mindmapId=`, `POST /api/todo`, `PUT /api/todo/:id` beneran. `CreateTodoInput` berubah dari `{ mindmapId, taskText, dueDate }` jadi `{ mindmapId, taskText, timeOffsetDays: number | null }` — ngikutin kontrak backend asli yang ke-temu pas eksplorasi sebelumnya (`CreateTodoSchema` di `lib/validations.ts` konfirmasi `timeOffsetDays` optional+nullable). Backend yang hitung `dueDate = mindmap.createdAt + timeOffsetDays` sendiri.
- `todosDb`/`MOCK_TODOS`/`lib/mock/todo.ts` dihapus total — gak ada pemanggil lagi.
- **Field baru di wire type**: `WireMindmap.createdAt: string` ditambahin ke `lib/types.ts` — dikonfirmasi bukan cuma nebak, tapi lewat baca langsung `models/Mindmap.ts` (`createdAt: { type: Date, default: Date.now }`, field eksplisit di schema, bukan Mongoose `timestamps:true` implisit) dan `app/api/mindmap/[id]/route.ts` (`NextResponse.json(mindmap)` — seluruh dokumen dikirim, termasuk `createdAt`). `MindmapSummary` di `lib/api.ts` disederhanain jadi `Pick<WireMindmap, ... | "createdAt">`, gak perlu lagi intersection field terpisah kayak sebelumnya.
- **Form manual tambah-todo** (`TodoPanel.tsx`) tetap pakai `<input type="date">` (UX gak berubah, user tetap milih tanggal absolut) — tapi sekarang dikonversi ke `timeOffsetDays` relatif ke `mindmap.createdAt` (`dateToOffsetDays()`) sebelum dikirim ke `createTodo()`. `mindmapCreatedAt` diteruskan sebagai prop baru: `page.tsx` → `Drawer` → `TodoPanel`.
- **Fitur baru: tombol "Auto-generate N to-do dari roadmap"** — sesuai saran partner (gak butuh Gemini tambahan): loop `nodes` yang `type === "roadmap-step"` (dibaca langsung dari `useCanvasStore` di `TodoPanel.tsx`, bukan lewat prop), lalu `Promise.allSettled` bikin satu `createTodo()` per step pakai `data.label` sebagai `taskText` dan `data.timeOffsetDays` apa adanya (backend udah terima `null`). Style pakai class `.expand-btn` yang udah ada (dashed clay border), gak nulis CSS section baru. **Proteksi duplikat best-effort**: node yang labelnya udah persis sama dengan salah satu `taskText` todo yang ada di-skip dari batch — bukan solusi sempurna (masih rawan kalau user ganti nama todo manual jadi sama kayak label node lain), tapi cukup buat kasus normal (klik tombolnya berkali-kali gak bikin duplikat). Tombol otomatis disabled + ganti teks jadi "Semua langkah roadmap udah punya to-do" kalau gak ada step yang tersisa buat di-generate — `.expand-btn:disabled` (opacity + cursor) baru ditambahin ke CSS, sebelumnya gak ada state disabled sama sekali di situ.
- Diverifikasi end-to-end lewat Playwright: generate mindmap asli → tab To-Do kosong (beneran dari `GET` asli, bukan array mock) → klik auto-generate → 5 todo kebuat sesuai 5 `roadmap-step` dengan due date yang bener (dihitung dari `timeOffsetDays`) → tombol auto-generate disabled abis semua step ke-cover → tambah manual dengan tanggal custom → toggle checkbox → **reload halaman** → semua todo dan status selesainya tetap ada (konfirmasi beneran persisted ke MongoDB, bukan lagi in-memory mock yang reset).
- **List udah ke-sort by `dueDate` ascending** (`sorted = [...todos].sort(...)`, udah ada sejak awal, bukan tambahan baru) — dikonfirmasi ke user pas ditanya. Tambahan atas permintaan user: item yang tanggalnya **udah lewat** (`new Date(t.dueDate) < now`) tetap di posisi atas (ngikutin urutan tanggal alami, gak dipindah paksa), dipisah dari item yang akan datang pakai divider berlabel di tengah list (`.todo-divider`, teks "Sudah lewat tenggat"), muncul cuma kalau dua-duanya (`overdueItems` dan `upcomingItems`) sama-sama ada isinya.
  - **Iterasi pertama** (reuse `.drawer-divider`, garis polos 1px warna `--sm-line` tanpa label) ditolak user — kekontrasannya sama kayak border kartu to-do biasa, jadi nyaris gak keliatan sebagai pemisah section, bukan cuma gap antar-item biasa.
  - **Iterasi kedua** (disetujui lewat pilihan eksplisit): class baru `.todo-divider` — garis pakai `::before`/`::after` (2px, warna `--sm-ink-45`, lebih gelap dari `--sm-line`) di kiri-kanan label kecil uppercase, pola "section divider with label" standar. Tapi posisi awalnya SALAH: label "SUDAH LEWAT TENGGAT" ditaruh **di antara** dua kelompok (nutup `overdueItems`, buka `upcomingItems`) — user nunjukin screenshot nyata di mana item tanggal 25 Agu/September (jelas belum lewat) muncul persis di bawah label itu, kebaca seolah label itu judul buat item-item yang BELUM lewat (terbalik).
  - **Iterasi final (fix)**: restrukturisasi jadi dua header terpisah, masing-masing di ATAS kelompoknya sendiri — `.todo-divider` "Sudah lewat tenggat" muncul SEBELUM `overdueItems` (kalau ada), lalu `.todo-divider` "Akan datang" muncul SEBELUM `upcomingItems` (cuma kalau dua-duanya sama-sama ada isinya). Gak ada lagi ambiguitas arah baca. Diverifikasi lewat Playwright dengan skenario yang sama persis kayak screenshot user (1 item lewat tenggat + beberapa item masa depan) — struktur JSON dan screenshot ter-crop `.todo-list` konfirmasi label sekarang nempel bener ke kelompok yang dimaksud.

### M9 — Share dan export
- [x] Export PNG (`toPng` + `getNodesBounds` dari reactflow) — `components/canvas/ExportButton.tsx`, tombol Export di header
- [x] Toggle publik → tampilkan URL share + tombol copy — `components/canvas/ShareButton.tsx` (baru), dipicu tombol "Bagikan" di header canvas (`app/canvas/[id]/page.tsx`). Isinya `Switch` (shadcn, `npx shadcn add switch` — primitive `@base-ui/react/switch`, baru dipasang pertama kali) buat toggle `isPublic`, dan kalau publik nampilin input read-only berisi URL share + tombol salin (`navigator.clipboard`). **Gotcha Base UI**: elemen switch-nya dirender sebagai `<span role="switch">`, bukan `<button>` — kepake pas nulis test, gak ngaruh ke pemakaian normal.
  - `saveMindmap()` di `lib/api.ts` **sudah** manggil `PUT /api/mindmap/:id` beneran, input-nya diperluas jadi `{ nodes?, edges?, isPublic? }` (semua optional, cocok sama backend) — sebelumnya cuma nerima `nodes`/`edges` wajib padahal belum pernah dipanggil komponen manapun. **Gotcha kontrak**: respons `PUT` cuma `{ success: true, message }`, **gak balikin** dokumen yang ke-update (jadi `shareId` baru yang di-generate backend gak langsung kebaca dari situ) — makanya `ShareButton` manggil `getMindmap(id)` lagi tepat setelah `saveMindmap()` sukses, buat nangkep `shareId` barunya.
  - Sekalian beres-beres: `mindmapsDb`/`findMindmapOrThrow`/`MindmapRecord` di `lib/api.ts` dihapus — udah gak ada pemanggil sama sekali sejak `deleteMindmap`/`getMindmap`/`getMindmaps` semua pindah ke fetch asli. `todosDb` dan `DEFAULT_MINDMAP_ID` tetap ada (masih kepake).
- [x] Halaman `/share/[shareId]` (baru) — konsumsi `getSharedMindmap()` (fungsi baru di `lib/api.ts`, `GET /api/mindmap/share/:shareId`, gak butuh session). Header beda dari canvas biasa: gak ada tombol back/account chip (gak ada sesi buat visitor publik), badge "Tampilan publik" (ikon mata + teks) nempel langsung di sebelah judul (`.doc-info-title-row`) — bukan lagi pill sendirian di kanan header, ditambah tombol CTA "Buat mindmap sendiri" yang **udah dicabut lagi** (lihat catatan perbaikan di bawah). **Keputusan scope (awal)**: reuse `CanvasView` (pan/zoom/fit tetap jalan) tapi **tanpa** `Drawer` — Drawer punya input judul yang bisa diedit, tombol "tandai selesai", zona AI, dan (belakangan) tab To-Do, semua gak pantas buat visitor publik yang lihat mindmap orang lain; klik node di halaman share jadi gak ada efek visual (`selectedNodeId` ke-set di store tapi gak ada yang render-nya) — cukup buat MVP, bukan bug fatal.

**Update — panel read-only ditambahin**: user minta klik node di halaman share tetap nampilin sesuatu, khusus deskripsi node-nya doang. Daripada nambah flag "public mode" ke `Drawer.tsx` (yang bakal maksa hampir seluruh body-nya dibungkus kondisional — title-input, complete-btn, notes, siblings, AI zone, tab bar — jadi rawan berantakan), dibikin komponen terpisah `components/canvas/PublicNodePanel.tsx`: baca `selectedNodeId`/`nodes` dari `canvasStore` yang sama, tapi cuma render label (`.node-title-static`, class baru — typografi sama kayak `.node-title` tapi teks statis, bukan input) + tipe node + `Ringkasan`/deskripsi. Gak ada tombol edit/selesai/AI/to-do sama sekali. `app/share/[shareId]/page.tsx` render `<PublicNodePanel />` di `.canvas-body` (sejajar `.canvas-area`, sama pola kayak canvas asli), dipicu `selectedNodeId` truthy, plus class `has-drawer` buat `.canvas-body` biar responsive <900px konsisten sama canvas asli. CSS baru: `.drawer-head-label` (reintroduce label eyebrow yang sempat kehapus pas `.drawer-head-title` diganti jadi tab bar di Drawer asli) dan `.node-title-static`. Diverifikasi lewat Playwright: toggle mindmap jadi publik → buka share link di browser context baru tanpa login sama sekali → klik node → panel muncul isinya cuma judul+ringkasan, dikonfirmasi gak ada `input.node-title`/`.complete-btn`/`.ai-zone`/`textarea`/`.drawer-tabs` di DOM-nya → tombol tutup (X) jalan.
  - **Perbaikan setelah user coba langsung**: (1) tombol "Bagikan" sekarang ada jeda loading 1.5 detik (`OPEN_DELAY_MS` di `ShareButton.tsx`, pola sama kayak `ExportButton`) sebelum dialog kebuka, biar berasa "nyiapin sesuatu" bukan instan. (2) **Bug nyata ketemu**: input URL share ketiban tombol "Salin" — akar masalahnya, `Dialog` (Base UI) di-*portal* ke luar `.page-canvas` (ke `document.body`), jadi rule CSS `.page-canvas .share-url-row`/`.share-url-input`/`.share-toggle-row` **gak pernah match sama sekali** (dead CSS), input-nya kerender polos tanpa box. Fix: rule-rule itu di-unscope dari `.page-canvas` (dikasih komentar penjelasan kenapa), plus nambah `text-overflow: ellipsis` di input biar URL panjang gak dobel sama tombol. (3) Tombol CTA "Buat mindmap sendiri" dicabut dari halaman share (kepenuhan/kurang perlu), badge "Tampilan publik" dipindah nempel ke judul + dikasih ikon `Eye` kecil biar gak keliatan nyendiri sebagai pill kosong di header. (4) Command bar chat ("Tanya atau perintahkan sesuatu...") sekarang disembunyiin khusus di halaman share — `CanvasView` dapet prop baru `showCommandBar?: boolean` (default `true`), dipanggil `<CanvasView showCommandBar={false} />` di halaman share aja; canvas asli tetap nampilin command bar-nya seperti biasa.
  - **Redesign header (round 2)**: header halaman share pakai `.canvas-header` yang sama kayak canvas asli — tinggi 56px fixed, `padding: 0 24px` (cuma horizontal, nol vertikal). Karena `.doc-info` di halaman share sekarang 2 baris (judul+badge, lalu subtitle) nyaris pas 52.78px, sisa ruang di header cuma ~1.6px atas-bawah — mepet banget, itu yang bikin kerasa "kurang rapih". Masalahnya `.canvas-header` dan `.canvas-body` (`height: calc(100vh - 56px)`) saling gantung di canvas asli, jadi gak bisa asal diubah tingginya (bakal ganggu canvas asli). Fix: halaman share dikasih class pembeda `.page-share` di wrapper terluar, override khusus di situ — `.page-share .canvas-header { height: 72px }`, `.page-share .canvas-body { height: calc(100vh - 72px) }` (ikut nambah biar tetap pas), plus `.page-share .doc-info { display:flex; flex-direction:column; gap:4px }` buat kasih jarak antara judul dan subtitle yang sebelumnya nempel tanpa gap. Diverifikasi: header share sekarang 72px dengan jarak atas-bawah ~10-11px (dari ~1.6px), canvas asli tetap persis 56px gak berubah sama sekali.
  - **Redesign badge "Tampilan publik" (round 3-4)**: mula-mula badge-nya kerender setinggi 25.8px — nyaris menyamai tinggi judul bold di sebelahnya (26.39px), kelihatan gembung/berat padahal cuma teks 11px. Akar masalahnya `.share-badge` mewarisi `line-height: 1.65` dari `body` (global, `app/globals.css`) — 11px × 1.65 ≈ 18px baris teks, ditambah padding, jadinya nyaris setinggi judul, tapi TIDAK TERKONTROL (ukurannya kebetulan, bukan didesain). Iterasi pertama: `line-height: 1` bikin badge jadi 19px — proporsional tapi user bilang kekecilan/kurang berasa. Iterasi kedua (final): font-size dinaikin ke `--sm-fs-small` (13.5px, token yang sama dipakai label form), padding dilebarin (`--sm-space-3` kiri-kanan), ikon `Eye` naik ke `size-3.5` (14px), `line-height:1` tetap dipertahankan biar tingginya terkontrol presisi (bukan produk sampingan inheritance). Hasil akhir: badge 25px (rasio 0.95 ke judul) — kali ini SENGAJA sebesar itu lewat font-size+padding yang didesain, bukan kebetulan dari line-height yang gak diatur, sesuai arahan user ("lebih besar yang masih proporsional").
  - Diverifikasi lewat Playwright penuh: generate → toggle publik → buka link dari context browser baru tanpa login → mindmap muncul; toggle balik privat → visitor yang sama kena pesan "Mindmap ini gak lagi dibagikan secara publik."

### M10 — PWA dan offline
- [ ] Konfigurasi `next-pwa`, manifest, ikon, tombol install — belum ada (`next-pwa` belum terpasang)
- [ ] Zustand `persist` untuk cache mindmap dan index dashboard — belum ada
- [ ] Satu listener `online`/`offline` di root, simpan ke store — belum ada
- [ ] Saat offline: disable semua tombol AI, simpan, dan hapus; tampilkan banner mode offline — belum ada
- [ ] Wipe cache sebelum `signOut()`, cek `userId` cocok saat boot — belum ada

### M11 — Halaman pendukung dan perapian
- [x] Halaman login (Google + email/password) — backend partner udah kelar sisi mereka: `lib/auth.ts` (Google OAuth + Credentials provider, auto-register user Google baru, session JWT ada `user.id`), `POST /api/auth/register`, `types/next-auth.d.ts`. Frontend: `components/AuthProvider.tsx` (`SessionProvider` wrapper) dipasang di `app/layout.tsx`. `app/register/page.tsx` wired ke `POST /api/auth/register` — validasi password vs konfirmasi di klien, banner error (`.form-error` di `auth.css`) buat email sudah terdaftar, sukses → redirect ke `/login`. `app/login/page.tsx` wired ke `signIn("credentials", { redirect: false })` — salah password nampilin `.form-error` "Email atau password salah" tanpa pindah halaman, sukses → redirect ke `/composer`; tombol "Masuk dengan Google" (`GoogleIcon` lokal, divider `.auth-divider`) manggil `signIn("google", { callbackUrl: "/composer" })`. Semua diverifikasi lewat Playwright end-to-end pakai akun asli di MongoDB Atlas (bukan mock): register→login salah password→login benar→sesi kebaca lewat `/api/auth/session`→klik Google beneran nyampe ke `accounts.google.com` dengan `client_id`/`redirect_uri` yang benar.
- [x] Proteksi route — `middleware.ts` (baru, root `next-app/`) pakai `withAuth` dari `next-auth/middleware`, `matcher: ["/composer/:path*", "/canvas/:path*", "/loading/:path*"]`, `pages.signIn: "/login"`. Belum login akses salah satu route itu → redirect `307` ke `/login?callbackUrl=<path-asal>`; `/`, `/login`, `/register` tetap publik. **Gotcha yang kena pas verifikasi**: `router.push(callbackUrl)` abis `signIn()` sukses kadang gak pindah halaman (~50% kejadian pas ditest beruntun) — root cause-nya Next.js App Router client-side router cache: kunjungan pertama ke `/composer` (sebelum login, kena redirect) ke-cache, jadi `router.push` abis login kadang masih mainin hasil cache lama alih-alih re-check middleware ke cookie session yang baru. Fix: `router.refresh()` dipanggil tepat setelah `router.push(callbackUrl)` di `app/login/page.tsx` buat bust cache-nya. Diverifikasi 5x percobaan login berturut-turut (context baru tiap kali) — konsisten berhasil.
- [x] Tombol logout — avatar di `app/composer/page.tsx` (dulu `<div className="avatar">AP</div>` statis) sekarang `DropdownMenu` (shadcn, `npx shadcn add dropdown-menu` — primitive `@base-ui/react/menu`, baru dipasang pertama kali di project ini) dipicu `DropdownMenuTrigger`. Isi dropdown: nama/email user asli dari `useSession()` (`DropdownMenuLabel`, inisial avatar dihitung dari `session.user.name`/`email` lewat `getInitials()`), lalu item "Keluar" (`variant="destructive"`) manggil `signOut({ callbackUrl: "/login" })`. **Gotcha Base UI vs Radix**: shadcn dropdown-menu yang biasa (Radix-based) bisa taruh `DropdownMenuLabel` langsung sebagai child `DropdownMenuContent`, tapi versi Base UI project ini nge-throw runtime error ("MenuGroupContext is missing") kalau gitu — `GroupLabel` wajib dibungkus `<DropdownMenuGroup>` dulu. Juga `asChild` (pola Radix buat custom trigger element) gak ada di Base UI; `DropdownMenuTrigger` render elemennya sendiri (button), tinggal kasih `className`/children langsung. Diverifikasi end-to-end: initial dropdown, klik "Keluar" → redirect ke `/login`, sesi kebukti kosong (`/api/auth/session` balik `{}`), akses `/composer` lagi abis logout → kepental ke `/login` (middleware tetap jalan).
  - **Styling dropdown dirapikan** — versi mentah hasil `shadcn add` kepadatannya gak nyambung sama rythm spacing app ini (`p-1`/`text-xs` Tailwind default) plus `rounded-lg` di project ini otomatis ke-remap jadi 22px (`--sm-radius-lg`, lihat §4) yang kegedean buat menu sekecil itu — kombinasinya kelihatan sempit dan gak matching. Diperbaiki di `components/ui/dropdown-menu.tsx`: radius diturunin ke `rounded-md` (12px), padding dilongarin (`p-1.5`, item `px-2 py-1.5`), border eksplisit `border-border` (bukan `ring-1`) biar konsisten sama pola border elemen lain, shadow diganti pakai token brand (`shadow-(--sm-shadow-md)`, sebelumnya Tailwind default shadow yang gak ke-remap ke token `--sm-shadow-*`). Label akun di composer sekarang dua baris (nama tebal + email `truncate` di bawahnya, bukan satu baris gabungan) — perlu `min-w-0` di flex child-nya biar `truncate` beneran motong, bukan malah maksa lebar. **Gotcha kecil**: sempat coba `min-w-64` (belum pernah dipakai di codebase ini) dan Tailwind gak generate CSS-nya sama sekali (`min-width` komputed jadi `0px`, ke-override sama `w-(--anchor-width)` dari Base UI yang ngikutin lebar trigger/avatar ~34px, bikin menu-nya collapse jadi sempit banget) — balik ke `min-w-56` (udah pernah dipakai & ke-generate) langsung jalan normal lagi. Kalau butuh lebar lain di masa depan, kemungkinan perlu restart dev server biar Tailwind JIT nangkep class barunya.
- [x] Dashboard daftar mindmap + tombol hapus — `app/composer/page.tsx` "Riwayat" baca `getMindmaps()`, link tiap item ke `/canvas/${item._id}` (route `app/canvas/[id]/page.tsx`, `getMindmap(id)` dipanggil per-id lewat `useParams`). `app/canvas/page.tsx` (tanpa id) redirect ke `DEFAULT_MINDMAP_ID`. Tombol hapus per item (ikon trash) buka dialog konfirmasi (pola sama kayak `ExportButton`, pakai `Button variant="destructive"`) → panggil `deleteMindmap()` → hapus dari state lokal.
  - **Bug ketemu & di-fix**: abis generate mindmap terus balik ke composer pakai **tombol back browser**, mindmap barunya kadang gak nongol di "Riwayat" sampai di-reload manual. Bukan soal Next.js router cache (dicoba navigasi via `<Link>` biasa, itu udah fetch ulang dengan benar) — ternyata browser's **back-forward cache (bfcache)**: tombol back memulihkan halaman dari snapshot beku tanpa JS jalan ulang sama sekali, jadi `useEffect` mount gak pernah ke-trigger lagi, nyangkut nampilin state lama (sebelum generate). Fix: listener `pageshow` yang ngecek `event.persisted` — kalau `true` (artinya halaman dipulihkan dari bfcache), `getMindmaps()` dipanggil ulang. Diverifikasi lewat Playwright: generate → `page.goBack()` beneran (bukan simulasi) → mindmap baru langsung muncul tanpa reload manual.
- [x] Empty state dan loading skeleton — `app/loading/page.tsx` punya skeleton bar; dashboard "Riwayat" sekarang juga punya skeleton row + empty state (`.history-empty`) pas `getMindmaps()` kosong/gagal
- [ ] Layar kecil: sidebar jadi bottom sheet — belum diverifikasi, drawer saat ini cuma jadi full-width di `<900px`, bukan bottom sheet
- [~] Ganti isi `lib/api.ts` dari mock ke fetch asli — dikerjakan satu fungsi per satu, bukan sekaligus.
  - `generateMindmap()` **sudah** manggil `POST /api/mindmap/generate` beneran (`FormData`: topic/timeframe/verbosity/language/file, sesuai kontrak §6).
  - `getMindmap(id)` **sudah** manggil `GET /api/mindmap/:id` beneran. `app/canvas/[id]/page.tsx` juga dapat state error baru (`loadError` + `.canvas-loading--error`) — sebelum ini, kegagalan `getMindmap` cuma `console.error` dan macet selamanya di "Memuat canvas…"; sekarang tampil pesan "Mindmap tidak ditemukan atau gagal dimuat." + link balik ke composer.
  - `getMindmaps()` **sudah** manggil `GET /api/mindmap` beneran (dashboard "Riwayat"). Bridge sementara di `generateMindmap()` (`mindmapsDb.push`) udah dicabut, gak dibutuhin lagi. **Ini nutup bug nyata**: sebelumnya "Strategi Growth 2026" (mock seed) nongol di Riwayat semua akun tanpa terkecuali, karena mock array itu gak difilter per-user. Diverifikasi lewat Playwright: akun baru gak lagi lihat mock itu (`.history-empty` yang muncul), dan dua akun berbeda yang masing-masing generate mindmap gak saling lihat punya orang lain (`userId` filter di backend jalan bener).
  - `deleteMindmap()` **sudah** manggil `DELETE /api/mindmap/:id` beneran. **Nutup bug nyata**: sebelumnya tombol hapus cuma ngapus dari state lokal React, gak beneran manggil backend — jadi abis reload, mindmap yang "dihapus" muncul lagi (soalnya di MongoDB gak pernah kehapus). Diverifikasi lewat Playwright: hapus → hard reload → tetap gak muncul lagi (beneran hilang dari MongoDB, cascade-delete todo terkait juga jalan di backend). Sekalian nambah `deleteError` state di `app/composer/page.tsx` — dialog konfirmasi sekarang bisa gagal beneran (401/404/500), jadi kalau gagal tampilkan pesan error + dialog tetap kebuka (gak langsung nutup kayak sukses), diverifikasi lewat mock response 404 via Playwright route interception.
  - `saveMindmap()` **sudah** (lihat M9), `getTodos()`/`createTodo()`/`updateTodo()` **sudah** (lihat M8) — semua manggil endpoint asli. Tinggal `elaborateNode()` yang masih mock, nunggu giliran (ditunda — kontraknya masih mau disesuaikan ke backend dulu).
- [x] Bug background `.page-composer` setengah putih setengah krem — sama kayak bug halaman auth sebelumnya, tapi mekanismenya beda: `body` (`app/layout.tsx`) itu `display:flex; flex-direction:column`, dan `.page-composer { min-height: 100% }` (eksplisit, bukan `auto`) ngebatalin proteksi bawaan flexbox yang biasanya nyegah elemen nyusut lebih kecil dari kontennya — pas konten (form + Riwayat panjang) butuh lebih tinggi dari viewport, `.page-composer` malah dipaksa nyusut pas ke tinggi viewport, sisanya kerender pakai background putih `body`. Fix: `flex-shrink: 0` di `.page-composer`. Diverifikasi: tinggi elemen sekarang ngikutin konten asli (1231px), bukan ke-cap 700px. **Catatan buat nanti**: `.page-loading` (`loading-page.css`) punya pola `min-height:100%` yang sama persis, belum kena bug ini cuma karena kontennya selalu pendek (spinner/progress bar) — kalau kontennya pernah jadi lebih panjang dari viewport, kemungkinan besar bakal kena bug yang sama, fix-nya sama (`flex-shrink: 0`).
  - **✅ Blocker `pdf-parse` sebelumnya — partner sudah fix** (commit `fix: pdf-parse importing`): `import pdfParse from "pdf-parse"` di top-level dipindah jadi `require('pdf-parse')` di dalam blok kondisional pas ada file PDF. Diverifikasi ulang lewat Playwright: request sekarang beneran nembus ke Gemini (dibuktikan dari server log, errornya udah pindah lokasi).
  - **⚠️ Gemini API kadang balikin 503 "high demand"** buat model `gemini-3.7-flash` — ini eksternal (Google lagi overload), bukan bug siapa pun, biasanya reda sendiri. Bukan 404 (model salah nama), jadi model-nya valid.
  - **⚠️ Bug baru ketemu, backend, belum di-fix** — `GET /api/mindmap/:id` (`app/api/mindmap/[id]/route.ts`) **selalu 404 walau record-nya beneran ada**. Dibuktikan: abis generate sukses, `GET /api/mindmap` (list, tanpa filter id) nemu record-nya dengan benar; tapi `GET /api/mindmap/<id yang sama persis>` 404, konsisten walau di-hard-reload beberapa detik kemudian (nyingkirin kemungkinan replication lag). Root cause: Next.js 16 mewajibkan `params` di route handler jadi `Promise<{id: string}>`, bukan `{id: string}` langsung (`tsc --noEmit` udah nunjukin error ini dari lama, tapi baru sekarang kebukti jadi bug runtime beneran, bukan cuma cosmetic type error) — `params.id` diakses tanpa `await`, jadi `undefined` pas runtime, bikin query `findOne({ _id: undefined, userId: ... })` gak pernah match apa pun. File yang kena pola sama (dicek dari `tsc` sebelumnya): `app/api/mindmap/[id]/route.ts` (GET/PUT/DELETE — PUT/DELETE belum dites langsung tapi kemungkinan besar sama-sama kena), `app/api/mindmap/share/[shareId]/route.ts`, `app/api/todo/[id]/route.ts`. Fix-nya `{ params }: { params: { id: string } }` → `{ params }: { params: Promise<{ id: string }> }` lalu `const { id } = await params;` di awal handler — tapi itu keputusan partner, bukan sesuatu yang aku benerin sendiri.
  - **✅ Dampak ke `/canvas` (tanpa id) — udah dibenerin.** `app/canvas/page.tsx` dulu redirect statis ke `DEFAULT_MINDMAP_ID` (id mock lama, `"strategi-growth-2026"`) yang gak ada di MongoDB asli → 500 (Mongoose gagal cast string non-ObjectId ke `_id`). Sekarang jadi client component: manggil `getMindmaps()` (list udah ke-sort `createdAt: -1` dari backend, jadi index `[0]` = mindmap terbaru), redirect ke `/canvas/${mindmaps[0]._id}` kalau user punya mindmap, atau ke `/composer` kalau belum punya sama sekali / kalau fetch-nya gagal. `DEFAULT_MINDMAP_ID` (di `lib/api.ts`) dan `lib/mock/mindmap.ts` dihapus total — gak ada pemanggil lagi. Diverifikasi lewat Playwright dua skenario: akun baru tanpa mindmap → `/canvas` → `200` lalu `/composer` (bukan lagi 500); akun yang baru generate 1 mindmap → `/canvas` → `200` lalu ke `/canvas/<id mindmap itu>` persis.

---

## 10. Rencana sesi berikutnya

Sejak M2 kelar, beberapa hal udah nyusul: routing `/canvas/[id]` (M11), tombol hapus + wiring `getMindmaps()` di dashboard "Riwayat" (M11), input verbosity+bahasa di composer (M6), fix bug fitView-vs-async-load di canvas (lihat catatan gotcha di §9 M1), dan migrasi `timeMark` → `timeOffsetDays` (§5, §9 M2) — semua kelar dan ke-verifikasi di browser.

**Satu keputusan yang masih menunggu:** nasib "tandai selesai" per-node (§9 M4) — tetap visual lokal, atau digeser ke status To-Do (M8) yang persisted. Belum ada urgensi mendesak buat mutusin ini.

~~Gap kecil dari §7 poin 1: `Drawer.tsx` baris "Topik: {MOCK_MINDMAP.topic}" masih baca mock statis langsung~~ — **udah dibenerin**: `Drawer` sekarang nerima prop `mindmapTopic` dari `app/canvas/[id]/page.tsx` (`mindmap.topic`), gak import `MOCK_MINDMAP` sama sekali lagi. Diverifikasi lewat Playwright: generate mindmap dengan topik custom → buka detail node → baris "Topik: ..." di bawah panel cocok persis sama topik yang diketik user, bukan lagi teks mock "Strategi growth marketing".

Kandidat milestone berikutnya:
- **Wiring tombol "Buat Mindmap"** — baca form (topik/timeframe/verbosity/bahasa/file), panggil `generateMindmap()`, redirect ke `/canvas/[id]` hasilnya. Ini yang nyambungin M6 loading state ke alur nyata.
- **M3 sisa**: `status`, `isOnline`, `appendNodes`, `applyLayout` — paling masuk akal digabung barengan M7 (elaborate) atau M10 (offline).
- **Nasib "tandai selesai"** (keputusan di atas) kalau user mau ambil sekarang.

**Kalau waktu mepet, yang boleh dipotong:** M10 seluruhnya, dan upload PDF di M6 — sisakan input topik saja.
