import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Barlow_Condensed, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

const perandory = localFont({
  src: [
    {
      path: "../../public/Perandory-Font/PERSONAL/PERANDORY/Perandory-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/Perandory-Font/PERSONAL/PERANDORY/Perandory-Condensed.otf",
      weight: "400",
      style: "condensed",
    },
  ],
  variable: "--font-perandory",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-condensed",
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Illustris — 10 Years Anniversary",
  description: "Website kỷ niệm 10 năm hành trình phát triển của Câu lạc bộ Nhiếp ảnh Illustris",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${perandory.variable} ${barlowCondensed.variable} ${playfair.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col noise-overlay bg-black text-white font-sans">{children}</body>
    </html>
  );
}
