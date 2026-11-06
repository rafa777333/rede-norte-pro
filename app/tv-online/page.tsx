import React from "react";
import type { Metadata } from "next";
import TvOnlineClient from "@/components/TvOnlineClient";

export const revalidate = 60; // ISR

export const metadata: Metadata = {
  title: "TV Rede Apucarana Ao Vivo (1080p) • Transmissão 24 Horas no Vale do Ivaí",
  description:
    "Assista à TV Rede Apucarana ao vivo em alta definição com som digital. Jornalismo regional, entrevistas do RedeCast, plantão policial e entretenimento para Apucarana e as 27 cidades da região.",
  openGraph: {
    title: "TV Rede Apucarana Ao Vivo (HD 1080p) • Vale do Ivaí",
    description:
      "Assista à transmissão oficial da TV Rede Apucarana 24 horas ao vivo. Jornalismo, entrevistas e entretenimento.",
    url: "https://www.redeapucarana.com.br/tv-online",
    siteName: "Rede Apucarana de Comunicação",
    locale: "pt_BR",
    type: "video.other",
  },
  alternates: {
    canonical: "https://www.redeapucarana.com.br/tv-online",
  },
};

export default function TvOnlinePage() {
  return <TvOnlineClient />;
}
