import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Panorama Open Scholarly Index",
    template: "%s | POSI",
  },
  description:
    "Panorama Open Scholarly Index is an open journal metadata and policy evidence platform for journal transparency, metadata quality, technical discoverability, and policy verification. All indicators are based on publicly auditable evidence.",
  keywords: ["open access", "scholarly index", "academic search", "citation visibility", "metadata quality", "journal quality"],
  icons: { icon: "/psg-logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${ibmPlexSans.variable} ${geistMono.variable} h-full`}
    >
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ background: "var(--posi-bg)", color: "var(--posi-text)" }}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
