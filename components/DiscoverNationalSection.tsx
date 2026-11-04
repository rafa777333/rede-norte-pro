"use client";

import React from "react";
import Link from "next/link";
import ImpostometroWidget from "./ImpostometroWidget";

export interface NationalNewsItem {
  id: string;
  slug?: string;
  titulo: string;
  cat?: string;
  resumo?: string;
  img?: string;
  hora?: string;
  autor?: string;
}

interface DiscoverNationalSectionProps {
  news?: NationalNewsItem[];
  noticiasNacionais?: NationalNewsItem[];
  cidadeAtual?: string;
}

export default function DiscoverNationalSection({
  news,
  noticiasNacionais = [],
  cidadeAtual = "Geral",
}: DiscoverNationalSectionProps) {
  // Pega matérias nacionais/economia/mundo ou até 6 da lista geral
  const filteredFromNews = (news || []).filter((n) => {
    const cat = (n.cat || "").toLowerCase();
    return ["brasil", "economia", "mundo", "política", "paraná"].includes(cat);
  });

  const candidates = noticiasNacionais.length > 0
    ? noticiasNacionais
    : (filteredFromNews.length >= 3 ? filteredFromNews : (news || []));

  const items = candidates.slice(0, 6);

  return (
    <section
      className="w-full my-8 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm"
      aria-label="Brasil, Economia e Mundo"
    >
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-6 rounded-full bg-blue-600 shrink-0" />
          <div>
            <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
              Motor Nacional & Global · Google Discover
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans tracking-tight">
              Brasil, Economia & Mundo
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hidden sm:inline">Notícias de alto impacto no seu bolso e no país</span>
        </div>
      </div>

      {/* Grade com 1 Card de Economia (Impostômetro compacto) + 5 a 6 matérias nacionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Card de Economia / Impostômetro Compacto Integrado */}
        <div className="md:col-span-1 flex flex-col">
          <div className="h-full rounded-xl border border-amber-200/90 bg-gradient-to-b from-amber-50/70 to-slate-50 p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Economia & Cidadania
                </span>
                <span className="text-sm">🪙</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 font-sans tracking-tight">
                Impostômetro em Tempo Real
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Acompanhe o total de tributos federais, estaduais e municipais arrecadados no Brasil neste ano.
              </p>
            </div>

            <div className="my-3">
              <ImpostometroWidget cidadeAtual={cidadeAtual} variant="card" />
            </div>

            <span className="text-[10px] text-slate-500 font-medium">
              Fonte: IBPT / Associação Comercial
            </span>
          </div>
        </div>

        {/* Matérias Nacionais / Discover */}
        {items.map((n) => {
          const href = n.slug ? `/noticias/${n.slug}` : `/noticias/${n.id}`;

          return (
            <Link
              key={n.id}
              href={href}
              className="group flex flex-col rounded-xl overflow-hidden border border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-md transition-all duration-200"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                {n.img ? (
                  <img
                    src={n.img}
                    alt={n.titulo}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-bold text-xs">
                    Rede Apucarana
                  </div>
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                  {n.cat || "Brasil"}
                </span>
              </div>

              <div className="p-3.5 flex flex-col flex-1 justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 line-clamp-3 leading-snug tracking-tight transition-colors">
                    {n.titulo}
                  </h4>
                  {n.resumo && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed font-sans">
                      {n.resumo}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                  <span>{n.autor || "Redação Nacional"}</span>
                  <span className="tabular-nums">{n.hora || "Recente"}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
