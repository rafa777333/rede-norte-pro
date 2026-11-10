import React from "react";
import type { Metadata } from "next";
import PortalClient from "./PortalClient";
import SuperAppHome from "@/components/SuperAppHome";
import { getInitialPortalData } from "@/lib/portal-data";

export const revalidate = 60; // ISR - revalidação inteligente a cada 60 segundos

export const metadata: Metadata = {
  title: "Rede Apucarana de Comunicação | Super App & Jornalismo Regional",
  description:
    "Super-Portal e Super App de notícias de Apucarana, Arapongas e Vale do Ivaí. Jornalismo regional em tempo real, rádio ao vivo, web TV 24h, previsão do tempo e classificados.",
  alternates: {
    canonical: "https://www.redeapucarana.com.br",
  },
  openGraph: {
    title: "Rede Apucarana de Comunicação | Super App & Notícias do Paraná",
    description:
      "Tudo sobre Apucarana e região em tempo real com jornalismo, rádio ao vivo, TV 24h, empregos e utilidades.",
    url: "https://www.redeapucarana.com.br",
    siteName: "Rede Apucarana de Comunicação",
    locale: "pt_BR",
    type: "website",
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
