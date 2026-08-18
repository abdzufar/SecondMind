import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/components/AuthProvider";
import { OfflineSupport } from "@/components/OfflineSupport";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Second Mind — Ubah dokumen jadi mindmap",
    template: "%s — Second Mind",
  },
  description:
    "Second Mind mengubah dokumen atau topik yang kamu masukkan jadi roadmap dan mindmap yang gampang dipahami dan dikerjakan.",
  icons: {
    icon: [
      { url: "/brand/svg/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/png/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/brand/png/apple-touch-icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#221B14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={cn("h-full", "antialiased", "font-sans", plusJakartaSans.variable)}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <OfflineSupport />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
