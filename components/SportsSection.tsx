"use client";

import React from "react";
import Link from "next/link";
import FootballScoreboardTicker, { ScoreboardMatch } from "./FootballScoreboardTicker";

export interface SportsNewsItem {
  id: string;
  slug?: string;
  titulo: string;
  cat?: string;
  resumo?: string;
  img?: string;
  hora?: string;
  autor?: string;
}

interface SportsSectionProps {
  news?: SportsNewsItem[];
  cidadeAtual?: string;
  initialMatches?: ScoreboardMatch[];
}

const FALLBACK_SPORTS_NEWS: SportsNewsItem[] = [
  {
    id: "sp-1",
    titulo: "Campeonato Paranaense 2026: Rodada decisiva agita os clubes do interior e capital",
    cat: "Esportes",
    resumo: "Disputa acirrada pela classificação movimenta torcedores no norte e no Vale do Ivaí com clássicos regionais.",
    img: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80",
    autor: "Redação Esportes Rede Apucarana",
    hora: "Hoje",
  },
  {
    id: "sp-2",
    titulo: "Brasileirão Série A: Análise das escalações e próximos confrontos da tabela",
    cat: "Futebol",
    resumo: "Clubes ajustam táticas para a sequência de jogos decisivos nesta semana.",
    img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
    autor: "Central de Jogos RA",
    hora: "Hoje",
  },
  {
    id: "sp-3",
    titulo: "Esporte Amador e Regional: Taça do Vale do Ivaí reúne equipes de 15 municípios",
    cat: "Regional",
    resumo: "Competição promove integração de jovens talentos e atletas da nossa região.",
    img: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&q=80",
    autor: "Esportes Vale do Ivaí",
    hora: "Ontem",
  },
  {
    id: "sp-4",
    titulo: "Futsal do Norte do Paraná mantém campanha invicta na Liga Estadual",
    cat: "Futsal",
    resumo: "Equipes de Apucarana e Arapongas se destacam com vitórias expressivas na rodada.",
    img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    autor: "Rede Apucarana Esportes",
    hora: "Ontem",
  },
];

export default function SportsSection({
  news,
  cidadeAtual = "Geral",
  initialMatches,
}: SportsSectionProps) {
  // Filtra matérias esportivas da lista geral
  const filteredSports = (news || []).filter((n) => {
    const cat = (n.cat || "").toLowerCase();
    const titulo = (n.titulo || "").toLowerCase();
    return (
      cat.includes("esporte") ||
      cat.includes("futebol") ||
      cat.includes("futsal") ||
      titulo.includes("futebol") ||
      titulo.includes("jogos") ||
      titulo.includes("brasileirão") ||
      titulo.includes("paranaense") ||
      titulo.includes("campeonato") ||
      titulo.includes("gol") ||
      titulo.includes("copa") ||
      titulo.includes("libertadores")
    );
  });

  const displayNews =
    filteredSports.length >= 4
      ? filteredSports.slice(0, 4)
      : [
          ...filteredSports,
          ...FALLBACK_SPORTS_NEWS.slice(0, 4 - filteredSports.length),
        ];

  return (
    <section
      className="w-full my-8 bg-gradient-to-b from-slate-900 to-[#0b1322] border border-emerald-950/70 rounded-2xl p-4 sm:p-6 shadow-xl text-white overflow-hidden"
      aria-label="Central de Esportes e Placares ao Vivo"
    >
      {/* Cabeçalho da Seção de Esportes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-6 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Central de Esportes & Placares ao Vivo
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-sans tracking-tight">
              Futebol, Campeonatos & Esportes do Vale
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/esportes"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-800/80 px-3.5 py-1.5 rounded-xl border border-emerald-700/50 transition-all shadow-sm"
          >
            <span>Ver Tabela & Classificação Completa</span>
            <span>➔</span>
          </Link>
        </div>
      </div>

      {/* A BARRA DE TIMES / PLACARES AO VIVO MOVIDA PARA CÁ */}
      <div className="mb-5 rounded-xl overflow-hidden border border-slate-800/80 shadow-md">
        <div className="bg-slate-950/80 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <span>⚽</span> Placares em Tempo Real · Brasileirão & Paranaense
          </span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            Atualização Ao Vivo
          </span>
        </div>
        <FootballScoreboardTicker initialMatches={initialMatches} />
      </div>

      {/* GRADE DE NOTÍCIAS DE ESPORTE (4 COLUNAS ELEGANTES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayNews.map((n) => {
          const href = n.slug ? `/noticias/${n.slug}` : `/noticias/${n.id}`;

          return (
            <Link
              key={n.id}
              href={href}
              className="group flex flex-col rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/90 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                {n.img ? (
                  <img
                    src={n.img}
                    alt={n.titulo}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-950 text-emerald-400 font-bold text-xs">
                    ⚽ Rede Apucarana Esportes
                  </div>
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
                  {n.cat || "Esportes"}
                </span>
              </div>

              <div className="p-3.5 flex flex-col flex-1 justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm sm:text-base text-slate-100 group-hover:text-emerald-400 line-clamp-3 leading-snug tracking-tight transition-colors">
                    {n.titulo}
                  </h4>
                  {n.resumo && (
                    <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {n.resumo}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[140px] font-medium text-slate-400">
                    {n.autor || "Rede Apucarana"}
                  </span>
                  <span className="text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Ler matéria →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
