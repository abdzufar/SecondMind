"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { PasswordInput } from "@/components/PasswordInput";
import "../auth.css";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A11.99 11.99 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Email atau password salah");
      setIsSubmitting(false);
      return;
    }

    router.push("/composer");
  }

  function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl: "/composer" });
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

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="sm-btn sm-btn--primary sm-btn--block" disabled={isSubmitting}>
              {isSubmitting ? "Memproses…" : "Masuk"}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </form>

          <div className="auth-divider">
            <span>atau</span>
          </div>

          <button
            type="button"
            className="sm-btn sm-btn--ghost sm-btn--block"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            <GoogleIcon />
            {isGoogleLoading ? "Mengalihkan…" : "Masuk dengan Google"}
          </button>

          <p className="switch">
            Belum punya akun? <Link href="/register">Daftar di sini</Link>
          </p>
          <p className="footnote">
            © 2026 Second Mind · <a href="#">Bantuan</a> · <a href="#">Privasi</a>
          </p>
        </div>
      </main>
    </div>
  );
}
