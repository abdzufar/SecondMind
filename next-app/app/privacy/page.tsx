import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import "../legal.css";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
};

export default function PrivacyPage() {
  return (
    <div className="page-legal">
      <header className="legal-header">
        <Link className="brand" href="/">
          <Image src="/brand/svg/mark.svg" width={26} height={26} alt="Second Mind" />
          <span className="sm-wordmark">
            <span>Second</span>
            <b>Mind</b>
          </span>
        </Link>
        <Link href="/" className="legal-back">
          <ArrowLeft />
          Kembali
        </Link>
      </header>

      <main className="legal-content">
        <span className="sm-eyebrow">Legal</span>
        <h1>Kebijakan Privasi</h1>
        <p className="legal-updated">Terakhir diperbarui: 19 Agustus 2026</p>

        <p className="legal-intro">
          SecondMind adalah proyek akhir program bootcamp Hacktiv8. Halaman ini menjelaskan data apa yang kami
          kumpulkan, buat apa, dan lewat pihak mana data itu diproses — ditulis sejujur mungkin sesuai cara
          aplikasi ini beneran bekerja, bukan teks generik.
        </p>

        <section>
          <h2>1. Bagaimana data digunakan</h2>
          <ul>
            <li>
              Konten yang kamu kirim diproses lewat Google Gemini API untuk menghasilkan mindmap dan menjawab
              pertanyaan lewat fitur chat.
            </li>
            <li>Kami mengirim email pengingat lewat Resend untuk to-do yang mendekati tenggat.</li>
            <li>Data disimpan di MongoDB Atlas, terhubung ke akunmu.</li>
          </ul>
        </section>

        <section>
          <h2>2. Pihak ketiga yang terlibat</h2>
          <p>
            Google (masuk akun &amp; pemrosesan AI), Resend (email pengingat), MongoDB Atlas (basis data), dan
            Vercel (hosting aplikasi).
          </p>
        </section>

        <section>
          <h2>3. Berbagi publik</h2>
          <p>
            Kalau kamu mengaktifkan mode publik pada sebuah mindmap, isinya (bukan info akunmu) bisa diakses
            siapa pun yang punya tautannya, tanpa perlu masuk akun.
          </p>
        </section>

        <section>
          <h2>4. Keamanan</h2>
          <p>
            Kata sandi disimpan dalam bentuk hash, bukan teks asli. Meski begitu, karena ini proyek edukasi,
            kami tidak bisa menjamin keamanan mutlak seperti layanan komersial.
          </p>
        </section>

        <section>
          <h2>5. Hak kamu</h2>
          <p>
            Kamu bisa menghapus mindmap kapan saja lewat aplikasi — cabang dan to-do yang terkait ikut
            terhapus otomatis. Untuk permintaan penghapusan akun atau data lain, hubungi kami lewat tautan di
            bawah.
          </p>
        </section>

        <section>
          <h2>6. Perubahan kebijakan</h2>
          <p>Kebijakan ini bisa diperbarui sewaktu-waktu, dengan tanggal pembaruan tercantum di atas.</p>
        </section>

        <section>
          <h2>Pertanyaan?</h2>
          <p>
            Hubungi kami lewat{" "}
            <a href="https://github.com/abdzufar/SecondMind" target="_blank" rel="noopener noreferrer">
              repositori GitHub proyek ini
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
