"use client";

import React from "react";
import Link from "next/link";

export interface BentoNewsItem {
  id: string;
  slug?: string;
  cidade?: string;
  cat?: string;
  titulo: string;
  sub?: string;
  resumo?: string;
  img?: string;
  hora?: string;
  autor?: string;
}

interface EditorialBentoGridProps {
  news?: BentoNewsItem[];
  manchetePrincipal?: BentoNewsItem | null;
  subManchetes?: BentoNewsItem[];
  destaquesRegionais?: BentoNewsItem[];
  plantaoUltimas?: BentoNewsItem[];
  cidadeAtual?: string;
  currentCity?: string;
}

export default function EditorialBentoGrid({
  news,
  manchetePrincipal,
  subManchetes = [],
  destaquesRegionais = [],
  plantaoUltimas = [],
  cidadeAtual,
  currentCity,
}: EditorialBentoGridProps) {
  const activeCity = cidadeAtual || currentCity || "Geral";
  const finalPrincipal = manchetePrincipal || (news && news.length > 0 ? news[0] : null);
  const finalSubManchetes = subManchetes.length > 0 ? subManchetes : (news ? news.slice(1, 4) : []);
  const finalDestaques = destaquesRegionais.length > 0 ? destaquesRegionais : (news ? news.slice(4, 6) : []);
  const finalPlantao = plantaoUltimas.length > 0 ? plantaoUltimas : (news ? news.slice(6, 12) : []);

  if (!finalPrincipal) return null;

  const mainHref = finalPrincipal.slug
    ? `/noticias/${finalPrincipal.slug}`
    : `/noticias/${finalPrincipal.id}`;

  return (
    <section
      className="w-full my-4"
      aria-label="Manchetes e Cobertura Editorial Principal"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            COLUNA ESQUERDA (60% ~ 7 a 8 cols): SUPER-MANCHETE + SUB-MANCHETES BULLET
           ========================================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Card da Super-Manchete Principal */}
          <article className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200">
            {/* Foto 16:9 com Prioridade de LCP */}
            <Link href={mainHref} className="block relative aspect-video w-full overflow-hidden bg-slate-900">
              {finalPrincipal.img ? (
                <img
                  src={finalPrincipal.img}
                  alt={finalPrincipal.titulo}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  // @ts-ignore - Next.js / HTML5 priority
                  fetchPriority="high"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white font-bold text-lg">
                  Rede Apucarana
                </div>
              )}

              {/* Tag / Chapéu Flutuante */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-red-600 text-white shadow-md">
                  {finalPrincipal.cat || "Vale do Ivaí"}
                </span>
                {finalPrincipal.cidade && finalPrincipal.cidade !== "Geral" && (
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-100 bg-slate-900/80 backdrop-blur-sm border border-white/20">
                    {finalPrincipal.cidade}
                  </span>
                )}
              </div>
            </Link>

            {/* Conteúdo da Super-Manchete */}
            <div className="p-4 sm:p-6">
              <span className="editorial-kicker mb-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                Destaque de Capa {activeCity !== "Geral" ? `· ${activeCity}` : ""}
              </span>

              <h2 className="editorial-headline group-hover:text-red-700 transition-colors">
                <Link href={mainHref}>
                  {finalPrincipal.titulo}
                </Link>
              </h2>

              {finalPrincipal.resumo && (
                <p className="mt-3 text-sm sm:text-base text-slate-600 font-sans leading-relaxed line-clamp-2">
                  {finalPrincipal.resumo}
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-sans">
                <span>{finalPrincipal.autor || "Redação Rede Apucarana"}</span>
                <span className="tabular-nums font-semibold text-slate-500">{finalPrincipal.hora || "Hoje"}</span>
              </div>
            </div>
          </article>

          {/* 3 Sub-Manchetes com Bullet Points (Padrão Folha / G1) */}
          {finalSubManchetes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-700">
                <span className="text-red-600 font-black">●</span>
                <span>Desdobramentos & Notícias Relacionadas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {finalSubManchetes.slice(0, 3).map((sub) => {
                  const href = sub.slug ? `/noticias/${sub.slug}` : `/noticias/${sub.id}`;

                  return (
                    <article key={sub.id} className="group flex flex-col justify-between">
                      <Link href={href} className="editorial-bullet-lead block">
                        <span className="text-[10px] font-black uppercase text-red-600 block mb-1">
                          {sub.cat || "Região"}
                        </span>
                        <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 group-hover:text-red-600 line-clamp-3 leading-snug tracking-tight transition-colors">
                          {sub.titulo}
                        </h3>
                      </Link>
                      <span className="text-[10px] text-slate-400 mt-2 block font-sans">
                        {sub.cidade || "Vale do Ivaí"} · <span className="tabular-nums">{sub.hora || "Recente"}</span>
                      </span>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            COLUNA DIREITA (40% ~ 5 cols): 2 DESTAQUES REGIONAIS + PLANTÃO & ÚLTIMAS
           ========================================================================= */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          {/* 2 Destaques Regionais com Foto Horizontal */}
          {finalDestaques.slice(0, 2).map((reg) => {
            const href = reg.slug ? `/noticias/${reg.slug}` : `/noticias/${reg.id}`;

            return (
              <article
                key={reg.id}
                className="group bg-white rounded-xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-row items-center gap-3 p-3"
              >
                {/* Foto miniatura 100x80 */}
                <Link
                  href={href}
                  className="w-24 sm:w-28 h-20 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-slate-900 block relative"
                >
                  {reg.img ? (
                    <img
                      src={reg.img}
                      alt={reg.titulo}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold">
                      RA
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-black uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                      {reg.cidade || reg.cat || "Região"}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xs sm:text-sm text-slate-900 group-hover:text-red-600 line-clamp-2 leading-snug tracking-tight transition-colors">
                    <Link href={href}>
                      {reg.titulo}
                    </Link>
                  </h3>
                  <span className="text-[10px] text-slate-400 mt-1 block tabular-nums">
                    {reg.hora || "Hoje"}
                  </span>
                </div>
              </article>
            );
          })}

          {/* Bloco Dinâmico: Plantão & Últimas */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-sans">
                  Plantão & Últimas
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Tempo Real</span>
            </div>

            <div className="divide-y divide-slate-100 flex flex-col">
              {finalPlantao.slice(0, 5).map((p) => {
                const href = p.slug ? `/noticias/${p.slug}` : `/noticias/${p.id}`;

                return (
                  <article key={p.id} className="group py-2.5 first:pt-0 last:pb-0">
                    <Link href={href} className="block">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-0.5">
                        <span className="font-bold text-red-600">{p.cat || "Urgente"}</span>
                        <span>•</span>
                        <span className="tabular-nums font-semibold">{p.hora || "Agora"}</span>
                      </div>
                      <h4 className="font-display font-bold text-xs sm:text-sm text-slate-800 group-hover:text-red-600 line-clamp-2 leading-snug tracking-tight transition-colors">
                        {p.titulo}
                      </h4>
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
