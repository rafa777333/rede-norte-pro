import React from "react";
import type { Metadata } from "next";
import TvOnlineClient from "@/components/TvOnlineClient";

export const revalidate = 60; // ISR

export const metadata: Metadata = {
  title: "Vídeos & Streaming Oficial • TV Apucarana e RedeCast",
  description:
    "Assista aos episódios do RedeCast, reportagens da TV Apucarana, entrevistas e cortes no Hub de Streaming oficial da Rede Apucarana de Comunicação.",
  alternates: {
    canonical: "https://www.redeapucarana.com.br/videos",
  },
  openGraph: {
    title: "Hub de Streaming • TV Apucarana & RedeCast",
    description:
      "Assista aos vídeos oficiais dos canais TV Apucarana e RedeCast sob demanda e ao vivo.",
    url: "https://www.redeapucarana.com.br/videos",
    siteName: "Rede Apucarana de Comunicação",
    locale: "pt_BR",
    type: "video.other",
  },
};

export default function VideosPage() {
  return <TvOnlineClient />;
}
