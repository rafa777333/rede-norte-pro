import React from "react";
import type { Metadata } from "next";
import PortalClient from "./PortalClient";
import SuperAppHome from "@/components/SuperAppHome";
import { getInitialPortalData } from "@/lib/portal-data";

export const revalidate = 60; // ISR - revalidação inteligente a cada 60 segundos

export const metadata: Metadata = {
  title: "Rede Apucarana - Notícias e TV ao Vivo no Vale do Ivaí",
  description:
    "Portal de notícias, TV ao vivo 24h, podcasts e guia de comércios de Apucarana e todo o Vale do Ivaí.",
  keywords: [
    "Rede Apucarana",
    "notícias Apucarana",
    "Vale do Ivaí",
    "TV online Apucarana",
    "RedeCast",
    "rádio web",
  ],
  alternates: {
    canonical: "https://www.redeapucarana.com.br",
  },
  openGraph: {
    title: "Rede Apucarana - Notícias e TV ao Vivo no Vale do Ivaí",
    description:
      "Portal de notícias, TV ao vivo 24h, podcasts e guia de comércios de Apucarana e todo o Vale do Ivaí.",
    url: "https://www.redeapucarana.com.br",
    siteName: "Rede Apucarana",
    locale: "pt_BR",
    type: "website",
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
    description:
      "Portal de notícias, TV ao vivo 24h, podcasts e guia de comércios de Apucarana e todo o Vale do Ivaí.",
    images: ["https://www.redeapucarana.com.br/logo-rede-apucarana.png"],
  },
};

export default async function HomePage() {
  const initialData = await getInitialPortalData("Geral");

  return (
    <div className="w-full min-h-screen">
      {/* ========================================================================= */}
      {/* 1. MODO MOBILE (Smartphones < 768px): Super App Nativo Exclusivo           */}
      {/* ========================================================================= */}
      <div className="block md:hidden w-full">
        <SuperAppHome />
      </div>

      {/* ========================================================================= */}
      {/* 2. MODO DESKTOP (Computadores / Telas >= 768px): Portal Tradicional Completo */}
      {/* ========================================================================= */}
      <div className="hidden md:block w-full">
        <PortalClient
          initialCity="Geral"
          initialData={initialData}
        />
      </div>
    </div>
  );
}
