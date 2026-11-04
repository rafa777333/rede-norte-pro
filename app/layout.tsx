import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rede Apucarana de Comunicação | Jornalismo, Rádio, TV e Esportes",
  description: "Notícias de Apucarana, Arapongas e Vale do Ivaí com informação local, esportes ao vivo, rádio, vídeos e utilidade pública.",
  metadataBase: new URL("https://www.redeapucarana.com.br"),
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
  openGraph: {
    title: "Rede Apucarana de Comunicação | Jornalismo, Rádio, TV e Esportes",
    description: "Informação local, serviço e notícias do Paraná.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-G93D6398W3";

  return (
    <html lang="pt-BR" className={`${newsreader.variable} ${inter.variable}`}>
      <body className="bg-slate-50 text-slate-800 antialiased font-sans">{children}</body>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
