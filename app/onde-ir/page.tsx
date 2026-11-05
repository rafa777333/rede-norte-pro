import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { PlaceItem } from "@/types/places";
import { fetchOndeIrPlaces } from "@/lib/places-service";
import OndeIrClient from "@/components/places/OndeIrClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Onde Ir no Vale do Ivaí | Guia Gastronômico, Lazer e Comércio | Rede Apucarana",
  description:
    "Descubra os melhores restaurantes, pizzarias napolitanas, bares, cafeterias e hotéis de Apucarana, Arapongas e Vale do Ivaí. Tours em vídeo 9:16, cardápio com pedido no WhatsApp e cupons de desconto.",
  alternates: {
    canonical: "https://www.redeapucarana.com.br/onde-ir",
  },
  openGraph: {
    title: "Onde Ir no Vale do Ivaí | Guia Gastronômico e de Experiências",
    description:
      "Tours em vídeo 9:16, cardápios interativos com pedidos no WhatsApp e cupons exclusivos da Rede Apucarana.",
    url: "https://www.redeapucarana.com.br/onde-ir",
    siteName: "Rede Apucarana de Comunicação",
    locale: "pt_BR",
    type: "website",
  },
};

export default async function OndeIrPage() {
  const allPlaces: PlaceItem[] = await fetchOndeIrPlaces();

  // Schema Markup JSON-LD para SEO Local
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Guia Onde Ir no Vale do Ivaí - Rede Apucarana",
    description: "Guia gastronômico, turístico e comercial de Apucarana e cidades do Vale do Ivaí.",
    itemListElement: allPlaces.slice(0, 10).map((place, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "LocalBusiness",
        name: place.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: place.address,
          addressLocality: place.city,
          addressRegion: "PR",
          addressCountry: "BR",
        },
        telephone: place.whatsapp,
        image: place.coverImage,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER LIMPO E ELEGANTE */}
      <header className="sticky top-0 z-40 bg-[#0d131f]/95 backdrop-blur-md text-white border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo-rede-apucarana.png?v=2"
              alt="Logo Rede Apucarana"
              className="w-9 h-9 object-cover rounded-md group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-black tracking-wider text-sm sm:text-base leading-tight">
                REDE APUCARANA
              </span>
              <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">
                Guia Onde Ir
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
          >
            ← Início
          </Link>

          <Link
            href="/anuncie"
            className="hidden sm:inline-flex text-xs font-bold text-amber-300 hover:text-white px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
          >
            Anuncie seu Restaurante
          </Link>
        </div>
      </header>

      {/* VITRINE INTERATIVA CLIENT */}
      <div className="flex-1">
        <OndeIrClient initialPlaces={allPlaces} />
      </div>

      {/* RODAPÉ INSTITUCIONAL */}
      <footer className="bg-slate-950 text-slate-400 py-10 px-4 border-t border-slate-800 text-xs">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-rede-apucarana.png?v=2"
              alt="Logo Rede Apucarana"
              className="w-7 h-7 object-cover rounded"
            />
            <span className="font-bold text-slate-200">
              Rede Apucarana de Comunicação
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <Link href="/" className="hover:text-white">Início</Link>
            <Link href="/clima" className="hover:text-white">Clima</Link>
            <Link href="/esportes" className="hover:text-white">Esportes</Link>
            <Link href="/tv-online" className="hover:text-white">TV Online</Link>
            <Link href="/anuncie" className="hover:text-amber-400 font-semibold">Anuncie Conosco</Link>
          </div>

          <p>© 2026 Rede Apucarana. Guia Gastronômico e Comercial do Vale do Ivaí.</p>
        </div>
      </footer>
    </main>
  );
}
