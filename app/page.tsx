import React from "react";
import type { Metadata } from "next";
import SuperAppHome from "@/components/SuperAppHome";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Rede Apucarana de Comunicação | Super App • Notícias, Rádio, TV e Serviços",
  description:
    "Super App de Apucarana, Arapongas e Vale do Ivaí: Notícias em tempo real, TV Ao Vivo 24h, Compras e Vendas, Vagas de Emprego, Gastronomia e Ofertas.",
  alternates: {
    canonical: "https://www.redeapucarana.com.br",
  },
  openGraph: {
    title: "Rede Apucarana de Comunicação | Super App Oficial",
    description:
      "Tudo sobre Apucarana e região em um só lugar com interface estilo Super App: Notícias, TV Ao Vivo, Compras e Vendas, Empregos e Rádio FM.",
    url: "https://www.redeapucarana.com.br",
    siteName: "Rede Apucarana de Comunicação",
    locale: "pt_BR",
    type: "website",
  },
};

export default function HomePage() {
  return <SuperAppHome />;
}
