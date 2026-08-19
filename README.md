# SecondMind 🧠

SecondMind adalah aplikasi web cerdas yang membantu Anda merencanakan dan mengatur proses belajar. Dengan bantuan AI, SecondMind dapat mengubah topik belajar apa pun atau dokumen PDF menjadi sebuah **mindmap interaktif (peta konsep)** dan **roadmap (peta jalan)** yang dilengkapi dengan daftar tugas (to-do list) yang terstruktur.

Proyek ini adalah _Final Project_ untuk program Hacktiv8 batch RMT-74 yang beranggotakan:

1. Abdurrahman Zufar
2. Septiana Yogasmara

## ✨ Fitur Utama

- **AI-Powered Roadmap Generation**: Masukkan topik yang ingin Anda pelajari atau unggah dokumen PDF, dan AI (Google Gemini) akan secara otomatis menghasilkan mindmap serta langkah-langkah belajar yang terstruktur.
- **Interactive Canvas**: Lihat dan modifikasi peta konsep belajar Anda menggunakan antarmuka canvas interaktif yang mulus (dibangun dengan React Flow).
- **Auto-Generated To-Do List**: Setiap langkah di dalam mindmap dapat diubah menjadi daftar tugas (to-do) yang memiliki tenggat waktu (due date) otomatis berdasarkan jangka waktu target Anda.
- **Email Reminders**: Pengingat tugas harian yang dikirim otomatis melalui email (Resend) agar Anda tidak pernah ketinggalan jadwal belajar. Opsi pengingat ini dapat diaktifkan atau dinonaktifkan sesuai preferensi Anda.
- **Shareable Mindmaps**: Bagikan roadmap publik Anda kepada teman-teman melalui tautan unik.

## 🛠️ Teknologi yang Digunakan

- **Frontend & Backend**: Next.js, React, TypeScript
- **Database**: MongoDB (Mongoose)
- **Autentikasi**: NextAuth.js (Google OAuth & Email/Password)
- **Styling**: Tailwind CSS & shadcn/ui
- **State Management**: Zustand
- **Schema Validation**: Zod
- **AI Integration**: Google Generative AI (Gemini 3.5 Flash-Lite)
- **Interactive Graph**: React Flow & Dagre
- **Exporting**: jsPDF, html-to-image, docx
- **Email Service**: Resend
- **PDF Processing**: pdf-parse
- **PWA**: next-pwa

_Dibuat untuk mempermudah proses belajar Anda. Selamat bereksplorasi dengan SecondMind!_
