import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Orbitron } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Jukubox.ai",
  description: "AI を活用したインターネット塾サービス",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={cn("h-full", "font-sans", orbitron.variable)}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
