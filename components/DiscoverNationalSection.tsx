"use client";

import React from "react";
import Link from "next/link";
import ImpostometroWidget from "./ImpostometroWidget";
import { formatNewsTime, hasVideoContent, truncateWords } from "../lib/text-utils";
import WhatsAppShareButton from "./WhatsAppShareButton";

export interface NationalNewsItem {
  id: string;
  slug?: string;
  titulo: string;
  cat?: string;
  resumo?: string;
  sub?: string;
  img?: string;
  hora?: string;
  autor?: string;
  published_at?: string;
  video_url?: string;
}

interface DiscoverNationalSectionProps {
  news?: NationalNewsItem[];
  noticiasNacionais?: NationalNewsItem[];
  cidadeAtual?: string;
  excludeIds?: string[] | Set<string>;
}

export default function DiscoverNationalSection({
  news,
  noticiasNacionais = [],
  cidadeAtual = "Geral",
  excludeIds,
}: DiscoverNationalSectionProps) {
  const excludeSet = excludeIds instanceof Set ? excludeIds : new Set(excludeIds || []);

  // Filtra matérias excluindo as que já apareceram no Topo (Desduplicação Estrita)
  const sourceList = (news || []).filter((n) => !excludeSet.has(n.id) && (!n.slug || !excludeSet.has(n.slug)));

  const filteredFromNews = sourceList.filter((n) => {
    const cat = (n.cat || "").toLowerCase();
    return ["brasil", "economia", "mundo", "política", "politica", "justiça", "agronegócio", "paraná", "parana"].some((c) => cat.includes(c));
  });

  const candidatesSource = noticiasNacionais.length > 0
    ? noticiasNacionais.filter((n) => !excludeSet.has(n.id) && (!n.slug || !excludeSet.has(n.slug)))
    : [];

  const candidates = candidatesSource.length > 0
    ? candidatesSource
    : (filteredFromNews.length >= 4 ? filteredFromNews : sourceList);

  // Pega exatamente 4 ou 8 matérias para formar colunas completas e alinhadas
  const items = candidates.length >= 8 ? candidates.slice(0, 8) : candidates.slice(0, 4);

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
              Giro Nacional & Internacional
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

      {/* FAIXA HORIZONTAL DO IMPOSTÔMETRO (ESTILO INFOGRÁFICO DE ECONOMIA) */}
      <ImpostometroWidget cidadeAtual={cidadeAtual} variant="banner" />

      {/* GRADE HARMONIOSA DE NOTÍCIAS (4 COLUNAS SEM ESTICAMENTO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((n) => {
          const href = n.slug ? `/noticias/${n.slug}` : `/noticias/${n.id}`;
          const horaFormatada = formatNewsTime(n.published_at, n.hora);
          const resumoFormatado = truncateWords(n.resumo || n.sub || "", 140);
          const hasVideo = hasVideoContent(n);

          return (
            <article
              key={n.id}
              className="group flex flex-col justify-between rounded-xl overflow-hidden border border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-md transition-all duration-200"
            >
              <Link href={href} className="block relative aspect-video w-full overflow-hidden bg-slate-100">
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

                {hasVideo && (
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                    ▶️ Vídeo
                  </span>
                )}
              </Link>

              <div className="p-3.5 flex flex-col flex-1 justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 line-clamp-3 leading-snug tracking-tight transition-colors">
                    <Link href={href}>
                      {n.titulo}
                    </Link>
                  </h4>
                  {resumoFormatado && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed font-sans">
                      {resumoFormatado}
                    </p>
                  )}
                </div>

                {/* Metadados limpos: categoria sutil e tempo relativo dinâmico, sem autor longo */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                  <span className="tabular-nums font-semibold text-slate-500">
                    {horaFormatada}
                  </span>

                  <WhatsAppShareButton
                    titulo={n.titulo}
                    href={href}
                    variant="icon"
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
