import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import "../legal.css";

export const metadata: Metadata = {
  title: "Ketentuan Layanan",
};

export default function TermsPage() {
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
        <h1>Ketentuan Layanan</h1>
        <p className="legal-updated">Terakhir diperbarui: 19 Agustus 2026</p>

        <p className="legal-intro">
          SecondMind adalah proyek akhir program bootcamp Hacktiv8, dibangun sebagai portofolio pembelajaran —
          bukan layanan komersial dengan jaminan uptime atau dukungan pelanggan formal. Dengan menggunakan
          SecondMind, kamu setuju dengan ketentuan di bawah ini.
        </p>

        <section>
          <h2>1. Tentang layanan</h2>
          <p>
            SecondMind mengubah topik atau dokumen yang kamu kirim menjadi peta pembelajaran (roadmap + mindmap)
            menggunakan model AI (Google Gemini). Hasilnya bisa berbeda-beda tergantung input dan bukan jaminan
            kebenaran mutlak — selalu verifikasi informasi penting lewat sumber lain sebelum diandalkan.
          </p>
        </section>

        <section>
          <h2>2. Akun kamu</h2>
          <p>
            Kamu bisa mendaftar pakai email &amp; kata sandi, atau lewat akun Google. Kamu bertanggung jawab
            menjaga kerahasiaan kredensial akunmu dan aktivitas apa pun yang terjadi lewat akun tersebut.
          </p>
        </section>

        <section>
          <h2>3. Konten yang kamu kirim</h2>
          <p>
            Kamu tetap pemilik topik, dokumen, atau teks yang kamu kirim. Dengan mengirimkannya, kamu memberi
            izin ke SecondMind untuk memproses konten itu — termasuk mengirimkannya ke penyedia AI pihak
            ketiga — demi menghasilkan peta pembelajaranmu.
          </p>
        </section>

        <section>
          <h2>4. Berbagi publik</h2>
          <p>
            Kamu bisa mengaktifkan mode &quot;publik&quot; pada sebuah mindmap untuk menghasilkan tautan yang
            bisa dibuka siapa saja tanpa perlu masuk akun. Jangan aktifkan mode ini untuk konten yang berisi
            informasi sensitif atau pribadi.
          </p>
        </section>

        <section>
          <h2>5. Batasan penggunaan</h2>
          <p>
            Jangan gunakan SecondMind untuk menghasilkan konten yang ilegal, berbahaya, atau melanggar hak
            pihak lain. Sistem berhak menolak permintaan yang dianggap tidak sesuai.
          </p>
        </section>

        <section>
          <h2>6. Tanpa jaminan</h2>
          <p>
            Karena ini proyek edukasi, layanan disediakan &quot;apa adanya&quot; tanpa jaminan ketersediaan,
            keandalan, atau bebas dari kesalahan.
          </p>
        </section>

        <section>
          <h2>7. Perubahan ketentuan</h2>
          <p>
            Ketentuan ini bisa berubah sewaktu-waktu. Perubahan akan tercermin di halaman ini dengan tanggal
            pembaruan yang baru.
          </p>
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
