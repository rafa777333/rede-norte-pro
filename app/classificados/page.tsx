import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";
import {
  MOCK_CLASSIFICADOS,
  normalizeClassifiedAd,
  ClassifiedAdItem,
} from "@/lib/classificados-data";
import ClassificadosMarketplace from "@/components/ClassificadosMarketplace";
import MobileBottomNav from "@/components/MobileBottomNav";

export const revalidate = 30; // ISR inteligente

export const metadata: Metadata = {
  title: "Classificados & Rolo do Vale do Ivaí | Compra e Venda Regional",
  description:
    "O maior marketplace regional das 27 cidades do Vale do Ivaí. Carros, motos, casas para alugar, celulares, ferramentas e móveis com negociação direta no WhatsApp.",
  openGraph: {
    title: "Classificados & Rolo do Vale do Ivaí | Rede Apucarana",
    description:
      "Anuncie grátis e negocie direto no WhatsApp. Carros, motos, imóveis e eletrônicos em Apucarana, Arapongas e região.",
    url: "https://www.redeapucarana.com.br/classificados",
    siteName: "Rede Apucarana",
    locale: "pt_BR",
    type: "website",
  },
};

export default async function ClassificadosPage() {
  const supabase = getSupabase();
  let realAds: ClassifiedAdItem[] = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from("classified_ads")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(40);

      if (data && data.length > 0) {
        realAds = data.map(normalizeClassifiedAd);
      }
    } catch (e) {
      console.warn("Erro ao buscar classificados no servidor:", e);
    }
  }

  // Combina anúncios reais do banco no topo + anúncios demonstrativos da região
  const realIds = new Set(realAds.map((a) => a.id));
  const mocks = MOCK_CLASSIFICADOS.filter((m) => !realIds.has(m.id));
  const initialAds = [...realAds, ...mocks];

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between">
      {/* Topline com link de volta */}
      <div className="bg-[#0b1120] text-white border-b border-slate-800/80 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-bold flex items-center gap-1.5 text-amber-400">
            <span>🛒</span>
            <span>CLASSIFICADOS & ROLO DO VALE DO IVAÍ · REDE APUCARANA</span>
          </span>
          <Link
            href="/"
            className="text-slate-300 hover:text-white font-semibold transition-colors flex items-center gap-1"
          >
            <span>←</span>
            <span>Voltar ao Portal Principal</span>
          </Link>
        </div>
      </div>

      {/* Header com Logo e navegação */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo-rede-apucarana.png?v=2"
              alt="Logo Rede Apucarana"
              className="w-10 h-10 object-cover rounded-lg shadow-xs"
            />
            <div>
              <span className="block font-black tracking-tight text-base sm:text-lg text-slate-900 leading-none">
                REDE APUCARANA
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                Classificados & Negócios
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/ofertas"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>🏷️</span>
              <span>Ofertas dos Mercados</span>
            </Link>

            <Link
              href="/onde-ir"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>🍽️</span>
              <span>Guia Gastronômico</span>
            </Link>

            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              ← Início
            </Link>
          </div>
        </div>
      </header>

      {/* Componente Interativo de Classificados */}
      <div className="flex-1">
        <ClassificadosMarketplace initialAds={initialAds} />
      </div>

      {/* Footer simples institucional */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 border-t border-slate-800 mt-12 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-bold text-slate-200">
              Rede Apucarana de Comunicação © {new Date().getFullYear()}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Classificados locais para Apucarana, Arapongas, Jandaia do Sul e as 27 cidades do Vale do Ivaí.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacidade" className="hover:text-white transition-colors">
              Privacidade & Termos
            </Link>
            <Link href="/contato" className="hover:text-white transition-colors">
              Fale com a Redação
            </Link>
          </div>
        </div>
      </footer>

      {/* Navegação Mobile Fixa */}
      <MobileBottomNav currentTab="classificados" />
    </main>
  );
}
