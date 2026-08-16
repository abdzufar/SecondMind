# SecondMind — Aset Merek

Ikon: satu batang sumber, tiga cabang hasil. Simpul teratas selalu **Clay** — itu "pikiran kedua".

## Struktur

```
brand/
  svg/    logo & mark vektor (aset utama)
  png/    favicon, app icon, lockup raster @4x
  tokens.css
  README.md
site.webmanifest
```

## Warna

| Nama | Hex | Token | Pakai untuk |
|---|---|---|---|
| Umber | `#221B14` | `--sm-ink` | Teks utama, mark, latar gelap |
| Ink 70 | `#6E6255` | `--sm-ink-70` | Body text |
| Ink 45 | `#9A8B79` | `--sm-ink-45` | Caption, label |
| Clay | `#C75B39` | `--sm-clay` | Aksen, CTA, tautan |
| Clay Bright | `#E0794F` | `--sm-clay-bright` | Aksen **hanya** di latar gelap |
| Clay Tint | `#F6E7E0` | `--sm-clay-tint` | Highlight lembut |
| Paper | `#F7F1E9` | `--sm-paper` | Latar section |
| Surface | `#FFFFFF` | `--sm-surface` | Kartu, latar utama |
| Line | `#E7D9C6` | `--sm-line` | Border |

## Tipografi

**Plus Jakarta Sans** — 400 body · 500 nav/caption · 700 heading · 800 display.
Wordmark: "Second" 500 + "Mind" 800, tracking `-0.038em`, satu warna.

## Aturan

- Ruang aman di keempat sisi = **setengah tinggi mark**.
- Lockup minimum **120 px** lebar. Mark minimum **28 px**.
- Di **≤24 px** pakai `mark-compact` (dua cabang) — cabang tengah dihapus, bukan ditipiskan.
- Aksen Clay hanya pada simpul teratas. Jangan warnai cabang lain.
- Jangan: putar, regangkan, ganti warna, ganti tipografi, beri bayangan, atau taruh di atas foto ramai tanpa plate solid.

## Pilih varian

| Situasi | Berkas |
|---|---|
| Header website (terang) | `svg/logo-primary.svg` |
| Header/footer gelap | `svg/logo-reversed.svg` |
| Satu warna (stempel, sablon, fax) | `svg/logo-mono-ink.svg` / `logo-mono-white.svg` |
| Avatar, app, badge | `svg/mark.svg` |
| Favicon, ikon ≤24 px | `svg/mark-compact.svg`, `png/favicon-*.png` |
| Cetak / pihak ketiga (font tak terjamin) | `png/logo-primary@4x.png` |

> SVG lockup memakai teks hidup. Kalau Plus Jakarta Sans tidak terpasang di lingkungan target, konversi teks ke outline atau pakai PNG @4x.

## Pasang

```html
<link rel="icon" href="/brand/svg/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/brand/png/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/brand/png/apple-touch-icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#221B14">
<link rel="stylesheet" href="/brand/tokens.css">
```

Wordmark sebagai teks (bisa dipilih & di-index):

```html
<a class="sm-wordmark" href="/" style="font-size:19px">
  <img src="/brand/svg/mark.svg" width="28" height="28" alt="">
  <span>Second</span><b>Mind</b>
</a>
```

Kelas siap pakai di `tokens.css`: `.sm-wordmark`, `.sm-eyebrow`, `.sm-btn` (`--primary` / `--dark` / `--ghost`), `.sm-card`, `.sm-section-paper`, `.sm-section-dark`.
