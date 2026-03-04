import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crack The Code",
  description: "Knekkekodespillet – klarer du å avsløre koden?",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Crack The Code",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
