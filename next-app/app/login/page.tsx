"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/PasswordInput";
import "../auth.css";

export default function LoginPage() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/composer");
  }

  return (
    <div className="page-auth">
      <main className="auth-main">
        <div className="auth-form-wrap">
          <Link className="brand" href="/">
            <Image src="/brand/svg/mark.svg" width={32} height={32} alt="Second Mind" />
            <span className="sm-wordmark">
              <span>Second</span>
              <b>Mind</b>
            </span>
          </Link>

          <div className="card-head">
            <span className="sm-eyebrow">Selamat datang kembali</span>
            <h1>Masuk ke akun kamu</h1>
            <p>Lanjutkan bikin mindmap dari dokumenmu.</p>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="email">
                Email
              </label>
              <div className="input-wrap">
                <span className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 6-10 7L2 6" />
                  </svg>
                </span>
                <input className="input" type="email" id="email" name="email" placeholder="kamu@email.com" autoComplete="email" required />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="password">
                Password
              </label>
              <PasswordInput id="password" name="password" placeholder="Masukkan password" autoComplete="current-password" />
            </div>

            <button type="submit" className="sm-btn sm-btn--primary sm-btn--block">
              Masuk
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </form>

          <p className="switch">
            Belum punya akun? <Link href="/register">Daftar di sini</Link>
          </p>
          <p className="footnote">© 2026 Second Mind</p>
        </div>
      </main>
    </div>
  );
}
