import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { siteUrl } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Autostore — Concessionario auto ad Aprilia (LT)",
    template: "%s | Autostore Aprilia",
  },
  description:
    "Autostore S.r.l. è il concessionario di auto usate, km 0 e aziendali ad Aprilia, in provincia di Latina. Parco auto selezionato, valutazione dell'usato e permuta.",
};

export const viewport: Viewport = {
  themeColor: "#080808",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`dark ${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className="style-nova">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
