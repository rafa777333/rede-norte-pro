import React from "react";
import type { Metadata } from "next";
import { fetchOfertasData } from "@/lib/ofertas-service";
import OfertasClient from "@/components/ofertas/OfertasClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Central de Ofertas & Encartes no Vale | Supermercados, Açougues e Farmácias | Rede Apucarana",
  description:
    "Consulte o menor preço da cesta básica e folheie encartes em formato Stories de supermercados, atacarejos, açougues, farmácias e distribuidoras de gás em Apucarana e Vale do Ivaí.",
  alternates: {
    canonical: "https://www.redeapucarana.com.br/ofertas",
  },
  openGraph: {
    title: "Central de Ofertas & Encartes Digitais | Rede Apucarana",
    description:
      "Termômetro da cesta básica, encartes em Stories e pedidos diretos no WhatsApp dos supermercados e açougues da região.",
    url: "https://www.redeapucarana.com.br/ofertas",
    siteName: "Rede Apucarana de Comunicação",
    locale: "pt_BR",
    type: "website",
  },
};

export default async function OfertasPage() {
  const { thermometer, retailers } = await fetchOfertasData();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Central de Ofertas e Economia do Vale do Ivaí",
    description:
      "Termômetro semanal de preços da cesta básica e encartes dos maiores supermercados, açougues e farmácias de Apucarana e região.",
    url: "https://www.redeapucarana.com.br/ofertas",
    itemListElement: retailers.map((r, i) => ({
      "@type": "ItemList",
      position: i + 1,
      name: r.name,
      description: `Ofertas de ${r.category} em ${r.city} - ${r.validUntil}`,
      url: `https://www.redeapucarana.com.br/ofertas#${r.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OfertasClient
        initialThermometer={thermometer}
        initialRetailers={retailers}
      />
    </>
  );
}
