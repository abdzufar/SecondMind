"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import "../auth.css";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak sama");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error === "User already exists" ? "Email sudah terdaftar" : "Gagal membuat akun. Coba lagi.");
        setIsSubmitting(false);
        return;
      }

      router.push("/login");
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
      setIsSubmitting(false);
    }
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
            <span className="sm-eyebrow">Mulai gratis</span>
            <h1>Buat akun baru</h1>
            <p>Gratis, cuma butuh semenit.</p>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="name">
                Nama
              </label>
              <div className="input-wrap">
                <span className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input className="input" type="text" id="name" name="name" placeholder="Nama lengkap" autoComplete="name" required />
              </div>
            </div>

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
              <PasswordInput id="password" name="password" placeholder="Minimal 8 karakter" autoComplete="new-password" />
              <span className="hint">Kombinasikan huruf, angka, dan simbol biar makin aman.</span>
            </div>

            <div className="field">
              <label className="label" htmlFor="confirm-password">
                Konfirmasi password
              </label>
              <PasswordInput id="confirm-password" name="confirm-password" placeholder="Ulangi password" autoComplete="new-password" />
            </div>

            <div className="checkbox-row">
              <input type="checkbox" id="terms" name="terms" required />
              <label htmlFor="terms">
                Saya setuju dengan <a href="#">Syarat &amp; Ketentuan</a> dan <a href="#">Kebijakan Privasi</a>.
              </label>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="sm-btn sm-btn--primary sm-btn--block" disabled={isSubmitting}>
              {isSubmitting ? "Membuat akun…" : "Buat akun"}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </form>

          <p className="switch">
            Sudah punya akun? <Link href="/login">Masuk di sini</Link>
          </p>
          <p className="footnote">© 2026 Second Mind</p>
        </div>
      </main>
    </div>
  );
}
