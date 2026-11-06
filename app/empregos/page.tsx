import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";
import { MOCK_AUTONOMOS, AutonomoItem } from "@/lib/autonomos-data";
import EmpregosHubClient from "@/components/EmpregosHubClient";
import MobileBottomNav from "@/components/MobileBottomNav";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Vagas de Emprego & Autônomos no Vale do Ivaí | Rede Apucarana",
  description:
    "Encontre vagas de emprego em Apucarana e região e contrate prestadores de serviço autônomos (pedreiros, eletricistas, diaristas, pintores, fretes) no Vale do Ivaí.",
  openGraph: {
    title: "Vagas de Emprego & Autônomos no Vale do Ivaí | Rede Apucarana",
    description:
      "Balcão oficial de empregos e serviços autônomos de Apucarana, Arapongas e 27 cidades do Vale do Ivaí. Contato direto no WhatsApp.",
    url: "https://www.redeapucarana.com.br/empregos",
    siteName: "Rede Apucarana",
    locale: "pt_BR",
    type: "website",
  },
  alternates: {
    canonical: "https://www.redeapucarana.com.br/empregos",
  },
};

export default async function EmpregosPage() {
  const supabase = getSupabase();
  let vagas: any[] = [];
  let autonomosReais: AutonomoItem[] = [];

  if (supabase) {
    try {
      // 1. Vagas Reais
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(50);
      vagas = jobsData || [];

      // 2. Prestadores Reais
      const { data: servData } = await supabase
        .from("service_providers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (servData && servData.length > 0) {
        autonomosReais = servData.map((s: any) => {
          let prof = s.categoria || "Profissional Autônomo";
          let desc = s.descricao || "";
          if (desc.startsWith("[") && desc.includes("]")) {
            const match = desc.match(/^\[(.*?)\]\s*(.*)$/);
            if (match) {
              prof = match[1];
              desc = match[2];
            }
          }

          return {
            id: s.id,
            nome: s.nome,
            profissao: prof,
            categoria: s.categoria || "Construção & Reforma",
            cidade: s.cidade_slug
              ? s.cidade_slug.charAt(0).toUpperCase() + s.cidade_slug.slice(1).replace(/-/g, " ")
              : "Apucarana",
            cidade_slug: s.cidade_slug || "apucarana",
            descricao: desc,
            whatsapp: s.whatsapp || "",
            verificado: s.verificado ?? true,
            nota: s.nota || 5,
            created_at: s.created_at || new Date().toISOString(),
          };
        });
      }
    } catch (e) {
      console.warn("[EmpregosPage SSR] Erro ao carregar dados do Supabase:", e);
    }
  }

  // Combina autônomos reais do banco + mocks
  const realIds = new Set(autonomosReais.map((a) => a.id));
  const mocksFiltered = MOCK_AUTONOMOS.filter((m) => !realIds.has(m.id));
  const initialAutonomos = [...autonomosReais, ...mocksFiltered];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between pb-20 md:pb-0">
      {/* Topline com atalhos */}
      <div className="bg-[#0b1120] text-white border-b border-slate-800/80 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-bold flex items-center gap-1.5 text-blue-400">
            <span>💼</span>
            <span>VAGAS DE EMPREGO & AUTÔNOMOS DO VALE DO IVAÍ · REDE APUCARANA</span>
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
              src="/logo-rede-apucarana.png"
              alt="Logo Rede Apucarana"
              className="w-10 h-10 object-contain rounded-lg shadow-xs"
            />
            <div>
              <span className="block font-black tracking-tight text-base sm:text-lg text-slate-900 leading-none">
                REDE APUCARANA
              </span>
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                Vagas & Autônomos · Vale do Ivaí
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/comprasevendas"
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              🛒 Compras & Vendas
            </Link>
            <Link
              href="/ofertas"
              className="hidden sm:inline-flex text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              🏷️ Ofertas
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Editorial */}
      <section className="bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white py-10 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <span className="text-xs font-black uppercase tracking-widest text-blue-400 bg-blue-950/80 border border-blue-800/80 px-3.5 py-1 rounded-full">
            Balcão de Empregos & Serviços Regionais
          </span>
          <h1 className="editorial-headline text-white mt-4 mb-2 text-2xl sm:text-3xl md:text-4xl font-black">
            Vagas de Trabalho & Profissionais Autônomos
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Contrate profissionais locais de confiança ou candidate-se a vagas abertas em comércios e indústrias de todo o Vale do Ivaí.
          </p>
        </div>
      </section>

      {/* Componente Client com Abas Duplas, Filtros e Modais de Auto-Publicação */}
      <div className="flex-1">
        <EmpregosHubClient
          initialVagas={vagas}
          initialAutonomos={initialAutonomos}
        />
      </div>

      {/* Rodapé Informativo */}
      <footer className="bg-slate-950 text-slate-400 py-8 px-4 text-center text-xs border-t border-slate-800 mt-12">
        <p>© 2026 Rede Apucarana de Comunicação. Conectando trabalhadores e empresas no Vale do Ivaí.</p>
      </footer>

      {/* Barra de Navegação Inferior Fixa no Celular */}
      <MobileBottomNav currentTab="servicos" />
    </main>
  );
}
