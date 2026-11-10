import React from "react";
import type { Metadata } from "next";
import PortalClient from "../PortalClient";
import { getInitialPortalData } from "@/lib/portal-data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Notícias de Apucarana, Arapongas e Vale do Ivaí | Rede Apucarana",
  description:
    "Últimas notícias de Apucarana, Arapongas, Vale do Ivaí e Paraná. Plantão policial, política regional, cotidiano, tempo e esportes.",
  openGraph: {
    title: "Notícias de Apucarana, Arapongas e Vale do Ivaí | Rede Apucarana",
    description:
      "Acompanhe o jornalismo regional em tempo real com a equipe da Rede Apucarana de Comunicação.",
    url: "https://www.redeapucarana.com.br/noticias",
    siteName: "Rede Apucarana de Comunicação",
    locale: "pt_BR",
    type: "website",
  },
  alternates: {
    canonical: "https://www.redeapucarana.com.br/noticias",
  },
};

export default async function NoticiasPage() {
  const initialData = await getInitialPortalData("Geral");

  return (
    <PortalClient
      initialCity="Geral"
      initialData={initialData}
    />
  );
}
