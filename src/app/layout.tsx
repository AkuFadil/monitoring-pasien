import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Monitoring Antrian - RS dr. Soebandi",
  description:
    "Dashboard real-time pemantauan antrian pelayanan pasien Rawat Jalan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-900 text-white antialiased`}>
        <div className="mx-auto max-w-[1920px] px-3 sm:px-4 lg:px-6 py-3 sm:py-4">{children}</div>
      </body>
    </html>
  );
}
