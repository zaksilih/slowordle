import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "SloWordle - Slovenska uganka z besedami",
  description: "Ugani slovensko besedo v 6 poskusih. Vsak dan nova uganka!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sl" className={`${inter.className} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-gray-900 text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
