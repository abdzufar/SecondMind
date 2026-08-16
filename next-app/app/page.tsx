"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import "./landing.css";

export default function LandingPage() {
  const artRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reveals = document.querySelectorAll(".page-landing .reveal");
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let observer: IntersectionObserver | undefined;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-visible"));
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      reveals.forEach((el) => observer?.observe(el));
    }

    const nav = document.querySelector(".page-landing .site-nav");
    const art = artRef.current;
    let ticking = false;

    function onScroll() {
      if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 4);

      if (art && !prefersReduced && !ticking) {
        window.requestAnimationFrame(() => {
          const rect = art.getBoundingClientRect();
          let offset = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * -0.04;
          offset = Math.max(-14, Math.min(14, offset));
          art.style.setProperty("--drift", offset + "px");
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="page-landing">
      <nav className="site-nav">
        <div className="in">
          <Link className="brand" href="/">
            <Image src="/brand/svg/mark.svg" width={26} height={26} alt="Second Mind" />
            <span className="sm-wordmark">
              <span>Second</span>
              <b>Mind</b>
            </span>
          </Link>
          <div className="nav-links">
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#fitur">Fitur</a>
            <a href="#contoh">Contoh peta</a>
          </div>
          <div className="nav-cta">
            <Link href="/login" className="sm-btn sm-btn--ghost">
              Masuk
            </Link>
            <Link href="/register" className="sm-btn sm-btn--primary">
              Coba gratis
            </Link>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="in">
          <div>
            <span className="sm-eyebrow sm-rise">Dari dokumen jadi peta pikiran</span>
            <h1 className="sm-rise" style={{ animationDelay: "40ms" }}>
              Baca strukturnya <em>sebelum</em> baca isinya.
            </h1>
            <p className="lede sm-rise" style={{ animationDelay: "80ms" }}>
              Tempel catatan kuliah atau unggah PDF. Isinya dipecah jadi cabang yang bisa kamu telusuri, lengkap
              dengan tempat bertanya kalau ada yang belum jelas.
            </p>
            <div className="cta-row sm-rise" style={{ animationDelay: "80ms" }}>
              <Link href="/register" className="sm-btn sm-btn--primary">
                Buat peta pertama
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h13M12 5l7 7-7 7" />
                </svg>
              </Link>
              <a href="#contoh" className="sm-btn sm-btn--ghost">
                Lihat contoh jadi
              </a>
            </div>
            <p className="under sm-rise" style={{ animationDelay: "120ms" }}>
              gratis · tanpa kartu kredit · pdf dan teks
            </p>
          </div>

          <div className="art art-rise" style={{ animationDelay: "120ms" }} ref={artRef}>
            <div className="mm-illustration" aria-hidden="true">
              <svg className="mm-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M50,10 L50,45" />
                <path d="M50,45 L50,85" />

                <path d="M50,10 L17,5" />
                <path d="M50,10 L17,15" />

                <path d="M50,45 L83,36" />
                <path d="M50,45 L83,45" />
                <path d="M50,45 L83,54" />

                <path d="M50,85 L17,80" />
                <path d="M50,85 L17,90" />
              </svg>

              <div className="mm-node mm-node--spine" style={{ left: "50%", top: "10%" }}>
                Riset Pasar
              </div>
              <div className="mm-node mm-node--spine" style={{ left: "50%", top: "45%" }}>
                Strategi Konten
              </div>
              <div className="mm-node mm-node--spine" style={{ left: "50%", top: "85%" }}>
                Distribusi &amp; Channel
              </div>

              <div className="mm-node mm-node--branch" style={{ left: "17%", top: "5%" }}>
                Analisis Kompetitor
              </div>
              <div className="mm-node mm-node--branch" style={{ left: "17%", top: "15%" }}>
                Segmentasi Audiens
              </div>

              <div className="mm-node mm-node--branch" style={{ left: "83%", top: "36%" }}>
                Kalender Konten Q1
              </div>
              <div className="mm-node mm-node--branch is-active" style={{ left: "83%", top: "45%" }}>
                20 Ide Topik
              </div>
              <div className="mm-node mm-node--branch" style={{ left: "83%", top: "54%" }}>
                Kolaborasi Kreator
              </div>

              <div className="mm-node mm-node--branch" style={{ left: "17%", top: "80%" }}>
                SEO &amp; Email
              </div>
              <div className="mm-node mm-node--branch" style={{ left: "17%", top: "90%" }}>
                Partnership
              </div>
            </div>
            <p className="cap">
              dari riset-pasar.pdf · 8 simpul <span className="tag">siap</span>
            </p>
          </div>
        </div>
      </header>

      <section className="stats">
        <div className="in stats-row reveal">
          <div className="stat">
            <strong>PDF · Docx · Teks</strong>
            <span>format yang didukung</span>
          </div>
          <div className="stat">
            <strong>&lt; 30 detik</strong>
            <span>rata-rata proses dokumen 10 halaman</span>
          </div>
          <div className="stat">
            <strong>Markdown · Gambar</strong>
            <span>format ekspor</span>
          </div>
        </div>
      </section>

      <section className="band" id="cara-kerja">
        <div className="in">
          <p className="kicker">Cara kerja</p>
          <div className="cols">
            <div className="step reveal">
              <span className="num">01</span>
              <h3>Tempel atau unggah</h3>
              <p>Teks apa pun, atau PDF sampai 20 MB. Tidak perlu dirapikan dulu.</p>
            </div>
            <div className="step reveal">
              <span className="num">02</span>
              <h3>Isinya dibaca</h3>
              <p>Gagasan utama dipisahkan dari detail pendukung, lalu disusun jadi cabang.</p>
            </div>
            <div className="step reveal">
              <span className="num">03</span>
              <h3>Telusuri dan tanya</h3>
              <p>Buka cabang yang kamu butuh. Detail yang tak muat di peta bisa ditanyakan langsung.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="feat" id="fitur">
        <div className="in">
          <h2>Yang membedakannya dari ringkasan biasa</h2>
          <p className="lede">
            Ringkasan memaksa kamu membaca dari awal lagi. Peta menunjukkan letak setiap bagian, jadi kamu bisa
            langsung lompat.
          </p>
          <div className="fcards">
            <div className="fc reveal">
              <span className="ic" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="5" cy="12" r="2.5" />
                  <circle cx="19" cy="6" r="2.5" />
                  <circle cx="19" cy="18" r="2.5" />
                  <path d="M7.5 11C13 11 12 6.5 16.5 6.3M7.5 13C13 13 12 17.5 16.5 17.7" />
                </svg>
              </span>
              <h3>Struktur, bukan paragraf</h3>
              <p>Hubungan antar gagasan terlihat sebagai cabang — bukan tertimbun dalam kalimat panjang.</p>
            </div>
            <div className="fc reveal">
              <span className="ic" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <h3>Tanya isi dokumen</h3>
              <p>Ada yang belum jelas di satu cabang? Tanyakan lewat command bar tanpa buka file aslinya lagi.</p>
            </div>
            <div className="fc reveal">
              <span className="ic" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v13m0 0-5-5m5 5 5-5M4 21h16" />
                </svg>
              </span>
              <h3>Bawa keluar</h3>
              <p>Ekspor jadi Markdown atau gambar, atau bagikan lewat tautan yang bisa dibuka siapa saja.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="showcase" id="contoh">
        <div className="in">
          <div className="section-head reveal">
            <span className="sm-eyebrow">Bukti, bukan janji</span>
            <h2>Nih, canvasnya.</h2>
            <p className="lede">
              Ini tangkapan layar asli canvas Second Mind, termasuk command bar buat nanya ke AI-nya langsung —
              bukan rekayasa desain.
            </p>
          </div>

          <div className="preview-window reveal">
            <div className="preview-chrome">
              <div className="preview-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="preview-url">app.secondmind.id/canvas</div>
            </div>

            <div className="preview-app-header">
              <div className="preview-back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </div>
              <div className="preview-doc-info">
                <strong>Strategi Growth 2026</strong>
                <span>18 node · diperbarui 2 jam lalu</span>
              </div>
              <div className="preview-app-actions">
                <span className="preview-btn">Bagikan</span>
                <span className="preview-btn preview-btn--dark">Export</span>
              </div>
            </div>

            <div className="preview-canvas">
              <svg className="mm-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M11,50 C27,50 27,16 44,16" />
                <path d="M11,50 L44,50" />
                <path d="M11,50 C27,50 27,78 44,78" />
                <path d="M44,16 L87,16" />
                <path d="M44,50 L87,50" />
                <path d="M44,78 L87,78" />
              </svg>

              <div className="mm-node mm-node--root" style={{ left: "11%", top: "50%" }}>
                <span className="mm-node-eyebrow">Dokumen</span>
                <span className="mm-node-title">Strategi Growth 2026</span>
              </div>

              <div className="mm-node mm-node--spine" style={{ left: "44%", top: "16%" }}>
                Riset Pasar
              </div>
              <div className="mm-node mm-node--spine" style={{ left: "44%", top: "50%" }}>
                Strategi Konten
              </div>
              <div className="mm-node mm-node--spine" style={{ left: "44%", top: "78%" }}>
                Distribusi &amp; Channel
              </div>

              <div className="mm-node mm-node--branch" style={{ left: "87%", top: "16%" }}>
                Analisis Kompetitor
              </div>
              <div className="mm-node mm-node--branch is-active" style={{ left: "87%", top: "50%" }}>
                Kalender Konten Q1
              </div>
              <div className="mm-node mm-node--branch" style={{ left: "87%", top: "78%" }}>
                SEO &amp; Email
              </div>

              <div className="preview-toolbar">
                <span aria-label="Perbesar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <span aria-label="Perkecil">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <span aria-label="Sesuaikan tampilan">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                  </svg>
                </span>
              </div>

              <div className="preview-command">
                <span>Rangkum jadi 3 prioritas utama</span>
                <span className="preview-command-send" aria-label="Kirim">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          <p className="showcase-cap reveal">Tampilan ilustratif — data contoh, bukan akun asli.</p>
        </div>
      </section>

      <section className="final sm-section-dark">
        <div className="in reveal">
          <h2>Satu dokumen, satu menit.</h2>
          <p>Coba dengan bahan yang sedang kamu baca sekarang.</p>
          <Link href="/register" className="sm-btn sm-btn--primary">
            Buat peta pertama
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h13M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      <footer>
        <div className="in">
          <div className="fgrid">
            <div className="reveal">
              <Link href="/" className="brand" style={{ marginBottom: 6 }}>
                <Image src="/brand/svg/mark.svg" width={24} height={24} alt="Second Mind" />
                <span className="sm-wordmark">
                  <span>Second</span>
                  <b>Mind</b>
                </span>
              </Link>
              <p className="fnote">Ubah dokumen jadi peta pikiran yang bisa ditelusuri.</p>
            </div>
            <div className="reveal">
              <h4>Produk</h4>
              <ul>
                <li>
                  <Link href="/composer">Composer</Link>
                </li>
                <li>
                  <Link href="/canvas">Canvas</Link>
                </li>
                <li>
                  <Link href="/composer">Riwayat</Link>
                </li>
              </ul>
            </div>
            <div className="reveal">
              <h4>Sumber</h4>
              <ul>
                <li>
                  <a href="#">Dokumentasi</a>
                </li>
                <li>
                  <a href="#">Repositori</a>
                </li>
                <li>
                  <a href="#">Catatan rilis</a>
                </li>
              </ul>
            </div>
            <div className="reveal">
              <h4>Lainnya</h4>
              <ul>
                <li>
                  <a href="#">Ketentuan</a>
                </li>
                <li>
                  <a href="#">Privasi</a>
                </li>
                <li>
                  <a href="#">Kontak</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="fbottom">
            <span>final project · hacktiv8 · 2026</span>
            <span>dibuat oleh Yogas dan Zufar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
