import type { Metadata, Viewport } from "next";
import { Newsreader, Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import AppVersionWatcher from "@/components/AppVersionWatcher";
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

export const viewport: Viewport = {
  themeColor: "#0a192f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.redeapucarana.com.br"),
  title: {
    default: "Rede Apucarana - Notícias e TV ao Vivo no Vale do Ivaí",
    template: "%s | Rede Apucarana",
  },
  description: "Portal de notícias, TV ao vivo 24h, podcasts e guia de comércios de Apucarana e todo o Vale do Ivaí.",
  keywords: [
    "Rede Apucarana",
    "notícias Apucarana",
    "Vale do Ivaí",
    "TV online Apucarana",
    "RedeCast",
    "rádio web",
    "jornalismo Apucarana",
    "TV ao vivo Apucarana",
  ],
  alternates: {
    canonical: "https://www.redeapucarana.com.br",
  },
  manifest: "/manifest.webmanifest",
  applicationName: "Rede Apucarana",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rede Apucarana",
  },
  icons: {
    icon: "/logo-rede-apucarana.png",
    apple: "/logo-rede-apucarana.png",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
  openGraph: {
    title: "Rede Apucarana - Notícias e TV ao Vivo no Vale do Ivaí",
    description: "Portal de notícias, TV ao vivo 24h, podcasts e guia de comércios de Apucarana e todo o Vale do Ivaí.",
    url: "https://www.redeapucarana.com.br",
    siteName: "Rede Apucarana",
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "https://www.redeapucarana.com.br/logo-rede-apucarana.png",
        width: 1200,
        height: 630,
        alt: "Rede Apucarana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rede Apucarana - Notícias e TV ao Vivo no Vale do Ivaí",
    description: "Portal de notícias, TV ao vivo 24h, podcasts e guia de comércios de Apucarana e todo o Vale do Ivaí.",
    images: ["https://www.redeapucarana.com.br/logo-rede-apucarana.png"],
  },
};

const brandSchemaJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "NewsMediaOrganization",
      "@id": "https://www.redeapucarana.com.br/#organization",
      name: "Rede Apucarana",
      alternateName: [
        "Rede Apucarana de Comunicação",
        "Portal Rede Apucarana",
        "RedeApucarana",
      ],
      url: "https://www.redeapucarana.com.br",
      logo: {
        "@type": "ImageObject",
        url: "https://www.redeapucarana.com.br/logo-rede-apucarana.png",
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://www.instagram.com/redeapucarana",
        "https://www.facebook.com/redeapucarana",
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Apucarana",
        addressRegion: "PR",
        addressCountry: "BR",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://www.redeapucarana.com.br/#website",
      url: "https://www.redeapucarana.com.br",
      name: "Rede Apucarana",
      description:
        "Portal de notícias, TV ao vivo 24h, podcasts e guia de comércios de Apucarana e todo o Vale do Ivaí.",
      publisher: {
        "@id": "https://www.redeapucarana.com.br/#organization",
      },
      inLanguage: "pt-BR",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-G93D6398W3";

  return (
    <html lang="pt-BR" className={`${newsreader.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchemaJsonLd) }}
        />
      </head>
      <body className="bg-slate-50 text-slate-800 antialiased font-sans">
        <AppVersionWatcher />
        {children}
        <GoogleAnalytics gaId={gaId} />
      </body>
    </html>
  );
}
