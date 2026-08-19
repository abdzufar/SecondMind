"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { clearOfflineCache } from "@/lib/offlineCache";
import { getInitials } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import "./landing.css";

export default function LandingPage() {
  const artRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // CTA "Buat peta pertama" (hero + section akhir) ngarah ke /composer kalau
  // udah login — sebelumnya hardcode ke /register terus walau sesi aktif,
  // beda sama nav bar yang udah bener duluan (lihat §11 M11 CLAUDE.md).
  const ctaHref = status === "authenticated" ? "/composer" : "/register";

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
            {status === "authenticated" ? (
              <>
                <Link href="/composer" className="sm-btn sm-btn--primary">
                  Buka Composer
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger className="avatar" aria-label="Menu akun">
                    {getInitials(session?.user?.name, session?.user?.email)}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate font-semibold text-foreground">
                            {session?.user?.name ?? "Akun"}
                          </span>
                          {session?.user?.email && (
                            <span className="truncate font-normal text-xs">{session.user.email}</span>
                          )}
                        </div>
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        clearOfflineCache();
                        signOut({ callbackUrl: "/" });
                      }}
                    >
                      Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : status === "unauthenticated" ? (
              <>
                <Link href="/login" className="sm-btn sm-btn--ghost">
                  Masuk
                </Link>
                <Link href="/register" className="sm-btn sm-btn--primary">
                  Coba gratis
                </Link>
              </>
            ) : null}
          </div>
          <button
            type="button"
            className="nav-hamburger"
            aria-label={mobileNavOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            {mobileNavOpen ? <X /> : <Menu />}
          </button>
        </div>
        <div className={`mobile-nav-panel${mobileNavOpen ? " is-open" : ""}`}>
          <a href="#cara-kerja" onClick={() => setMobileNavOpen(false)}>
            Cara kerja
          </a>
          <a href="#fitur" onClick={() => setMobileNavOpen(false)}>
            Fitur
          </a>
          <a href="#contoh" onClick={() => setMobileNavOpen(false)}>
            Contoh peta
          </a>
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
              Tempel catatan atau unggah PDF. Second Mind memetakannya jadi struktur yang bisa ditelusuri
              dan ditanya — bukan cuma dirangkum.
            </p>
            <div className="cta-row sm-rise" style={{ animationDelay: "80ms" }}>
              <Link href={ctaHref} className="sm-btn sm-btn--primary">
                Buat peta pertama
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h13M12 5l7 7-7 7" />
                </svg>
              </Link>
              <a href="#contoh" className="sm-btn sm-btn--ghost">
                Lihat contoh peta
              </a>
            </div>
            <p className="under sm-rise" style={{ animationDelay: "120ms" }}>
              Gratis · tanpa kartu kredit · PDF &amp; teks
            </p>
          </div>

          <div className="art art-rise" style={{ animationDelay: "120ms" }} ref={artRef}>
            <Image
              src="/screenshots/canvas-full.png"
              alt="Canvas Second Mind menampilkan roadmap dan cabang mindmap"
              width={1400}
              height={816}
              className="art-shot"
              priority
            />
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
              <h3>Second Mind memetakan</h3>
              <p>Gagasan utama dipisahkan dari detail pendukung, lalu disusun jadi cabang berurutan.</p>
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
          <h2>Bukan ringkasan biasa.</h2>
          <p className="lede">
            Ringkasan cuma memangkas panjangnya. Peta menunjukkan letak tiap bagian — kamu tahu persis ke mana
            harus lompat.
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
              <h3>Ekspor dan bagikan</h3>
              <p>Ekspor jadi Markdown atau gambar, atau bagikan lewat tautan yang bisa dibuka siapa saja.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="showcase" id="contoh">
        <div className="in">
          <div className="section-head reveal">
            <span className="sm-eyebrow">Bukti, bukan janji</span>
            <h2>Bukan mockup — ini aplikasinya.</h2>
            <p className="lede">
              Tangkapan layar canvas Second Mind, lengkap dengan command bar buat nanya ke AI-nya langsung.
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

            <Image
              src="/screenshots/canvas-full.png"
              alt="Tangkapan layar canvas Second Mind: roadmap Strategi Growth 2026 dengan cabang mindmap"
              width={1400}
              height={816}
              className="preview-shot"
            />
          </div>

          <p className="showcase-cap reveal">Data contoh dari akun demo — bukan akun pengguna asli.</p>
        </div>
      </section>

      <section className="final sm-section-dark">
        <div className="in reveal">
          <h2>Satu dokumen, satu menit.</h2>
          <p>Coba dengan bahan yang sedang kamu baca sekarang.</p>
          <Link href={ctaHref} className="sm-btn sm-btn--primary">
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
              <h4>Aplikasi</h4>
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
              <h4>Lainnya</h4>
              <ul>
                <li>
                  <a href="https://github.com/abdzufar/SecondMind" target="_blank" rel="noopener noreferrer">
                    Repositori
                  </a>
                </li>
                <li>
                  <Link href="/terms">Ketentuan</Link>
                </li>
                <li>
                  <Link href="/privacy">Privasi</Link>
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
