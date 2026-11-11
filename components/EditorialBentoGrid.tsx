"use client";

import React from "react";
import Link from "next/link";
import {
  formatNewsTime,
  isNoticiaRegional,
  detectCityGeoTag,
  hasVideoContent,
  truncateWords,
} from "../lib/text-utils";
import WhatsAppShareButton from "./WhatsAppShareButton";

export interface BentoNewsItem {
  id: string;
  slug?: string;
  cidade?: string;
  cidade_slug?: string;
  cat?: string;
  titulo: string;
  sub?: string;
  resumo?: string;
  img?: string;
  cover_image?: string;
  video_format?: string;
  hora?: string;
  autor?: string;
  published_at?: string;
  video_url?: string;
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
  news = [],
  manchetePrincipal,
  subManchetes = [],
  destaquesRegionais = [],
  plantaoUltimas = [],
  cidadeAtual,
  currentCity,
}: EditorialBentoGridProps) {
  const activeCity = cidadeAtual || currentCity || "Geral";

  // Priorização Regional no Topo:
  // Notícias locais e do Vale do Ivaí ganham a capa principal e os destaques.
  // Notícias nacionais (Agência Brasil, etc.) entram como fallback caso faltem regionais.
  const regionais = news.filter(isNoticiaRegional);
  const outras = news.filter((n) => !isNoticiaRegional(n));
  const poolPrioritario = [...regionais, ...outras];

  // 1. Super-Manchete Principal
  const regComImg = regionais.find((n) => Boolean(n.img && n.img.startsWith("http")));
  const finalPrincipal =
    manchetePrincipal ||
    regComImg ||
    regionais[0] ||
    poolPrioritario.find((n) => Boolean(n.img && n.img.startsWith("http"))) ||
    poolPrioritario[0] ||
    null;

  if (!finalPrincipal) return null;

  const poolRestante = poolPrioritario.filter((n) => n.id !== finalPrincipal.id);

  // 2. Sub-Manchetes (3 itens prioritários)
  const finalSubManchetes =
    subManchetes.length > 0 ? subManchetes : poolRestante.slice(0, 3);

  const usedIds = new Set([
    finalPrincipal.id,
    ...finalSubManchetes.map((s) => s.id),
  ]);

  // 3. Destaques Regionais (prioriza 2 notícias regionais com imagem)
  const remainingReg = regionais.filter((n) => !usedIds.has(n.id) && Boolean(n.img));
  const poolAfterSub = poolRestante.filter((n) => !usedIds.has(n.id));
  const finalDestaques =
    destaquesRegionais.length > 0
      ? destaquesRegionais
      : (remainingReg.length >= 2 ? remainingReg : poolAfterSub).slice(0, 2);
  finalDestaques.forEach((d) => usedIds.add(d.id));

  // 4. Plantão & Últimas (próximas 5 notícias)
  const finalPlantao =
    plantaoUltimas.length > 0
      ? plantaoUltimas
      : news.filter((n) => !usedIds.has(n.id)).slice(0, 5);

  const mainHref = finalPrincipal.slug
    ? `/noticias/${finalPrincipal.slug}`
    : `/noticias/${finalPrincipal.id}`;

  const mainGeoTag = detectCityGeoTag(finalPrincipal);
  const mainHasVideo = hasVideoContent(finalPrincipal);
  const mainHoraFormatada = formatNewsTime(finalPrincipal.published_at, finalPrincipal.hora);
  const mainResumo = truncateWords(finalPrincipal.resumo || finalPrincipal.sub || "", 180);

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
              {(() => {
                const fotoPrincipal = finalPrincipal.cover_image || finalPrincipal.img;
                const temFotoValida = Boolean(
                  fotoPrincipal &&
                  fotoPrincipal !== "/logo-rede-apucarana.png" &&
                  !fotoPrincipal.includes("obama") &&
                  !fotoPrincipal.includes("photo-1529107386315")
                );

                if (temFotoValida) {
                  return (
                    <img
                      src={fotoPrincipal}
                      alt={finalPrincipal.titulo}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      // @ts-ignore - Next.js / HTML5 priority
                      fetchPriority="high"
                      loading="eager"
                      onError={(e) => {
                        e.currentTarget.src = "/logo-rede-apucarana.png";
                        e.currentTarget.className = "w-full h-full object-contain p-8 bg-slate-900";
                      }}
                    />
                  );
                }

                return (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white p-6">
                    <img
                      src="/logo-rede-apucarana.png"
                      alt="Rede Apucarana"
                      className="w-24 h-24 object-contain drop-shadow-xl"
                    />
                    <span className="text-xs uppercase tracking-widest text-slate-400 mt-2 font-bold">
                      Rede Apucarana de Comunicação
                    </span>
                  </div>
                );
              })()}

              {/* Tags Flutuantes: Categoria + Geo-Tag + Selo de Vídeo */}
              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-red-600 text-white shadow-md">
                  {finalPrincipal.cat || "Vale do Ivaí"}
                </span>

                {mainGeoTag && (
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-black tracking-wider text-amber-300 bg-slate-950/85 backdrop-blur-sm border border-amber-400/30 flex items-center gap-1 shadow-md">
                    <span>📍</span>
                    <span>{mainGeoTag}</span>
                  </span>
                )}

                {mainHasVideo && (
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold text-white bg-black/80 backdrop-blur-sm border border-white/20 flex items-center gap-1 shadow-md">
                    <span>▶️</span>
                    <span>Vídeo</span>
                  </span>
                )}
              </div>
            </Link>

            {/* Conteúdo da Super-Manchete */}
            <div className="p-4 sm:p-6">
              <span className="editorial-kicker mb-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                {activeCity !== "Geral" ? `Destaque em ${activeCity}` : "Destaque Principal do Vale"}
              </span>

              <h2 className="editorial-headline group-hover:text-red-700 transition-colors">
                <Link href={mainHref}>
                  {finalPrincipal.titulo}
                </Link>
              </h2>

              {mainResumo && (
                <p className="mt-3 text-sm sm:text-base text-slate-600 font-sans leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {mainResumo}
                </p>
              )}

              {/* Metadados Limpos: Sem autor longo, apenas tempo relativo e compartilhamento WhatsApp */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">
                    {finalPrincipal.cidade && finalPrincipal.cidade !== "Geral"
                      ? finalPrincipal.cidade
                      : "Vale do Ivaí"}
                  </span>
                  <span>•</span>
                  <span className="tabular-nums font-semibold text-slate-500">{mainHoraFormatada}</span>
                </div>

                <WhatsAppShareButton
                  titulo={finalPrincipal.titulo}
                  href={mainHref}
                />
              </div>
            </div>
          </article>

          {/* 3 Sub-Manchetes com Bullet Points: 🔥 Em Alta & Destaques */}
          {finalSubManchetes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-800">
                <span className="text-red-600 text-sm">🔥</span>
                <span className="font-black text-slate-900">Em Alta & Destaques</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {finalSubManchetes.slice(0, 3).map((sub) => {
                  const href = sub.slug ? `/noticias/${sub.slug}` : `/noticias/${sub.id}`;
                  const subGeo = detectCityGeoTag(sub);
                  const subHora = formatNewsTime(sub.published_at, sub.hora);
                  const subHasVideo = hasVideoContent(sub);

                  return (
                    <article key={sub.id} className="group flex flex-col justify-between">
                      <Link href={href} className="editorial-bullet-lead block">
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase text-red-600 tracking-wider">
                            {sub.cat || "Região"}
                          </span>

                          {subGeo && (
                            <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                              <span>📍</span> {subGeo}
                            </span>
                          )}

                          {subHasVideo && (
                            <span className="text-[9px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              ▶️ Vídeo
                            </span>
                          )}
                        </div>

                        <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 group-hover:text-red-600 line-clamp-3 leading-snug tracking-tight transition-colors">
                          {sub.titulo}
                        </h3>
                      </Link>

                      {/* Metadados limpos: apenas horário e compartilhamento WhatsApp */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-50 font-sans">
                        <span className="tabular-nums font-semibold text-slate-500">
                          {subHora}
                        </span>

                        <WhatsAppShareButton
                          titulo={sub.titulo}
                          href={href}
                          variant="icon"
                        />
                      </div>
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
            const regGeo = detectCityGeoTag(reg);
            const regHora = formatNewsTime(reg.published_at, reg.hora);
            const regHasVideo = hasVideoContent(reg);

            return (
              <article
                key={reg.id}
                className="group bg-white rounded-xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-row items-center gap-3 p-3"
              >
                {/* Foto miniatura 100x80 com selo de vídeo opcional */}
                <Link
                  href={href}
                  className="w-24 sm:w-28 h-20 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-slate-900 block relative"
                >
                  {(() => {
                    const regFoto = reg.cover_image || reg.img;
                    const temRegFoto = Boolean(
                      regFoto &&
                      regFoto !== "/logo-rede-apucarana.png" &&
                      !regFoto.includes("obama") &&
                      !regFoto.includes("photo-1529107386315")
                    );

                    if (temRegFoto) {
                      return (
                        <img
                          src={regFoto}
                          alt={reg.titulo}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = "/logo-rede-apucarana.png";
                            e.currentTarget.className = "w-full h-full object-contain p-2 bg-slate-900";
                          }}
                        />
                      );
                    }

                    return (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-2">
                        <img
                          src="/logo-rede-apucarana.png"
                          alt="Rede Apucarana"
                          className="w-10 h-10 object-contain drop-shadow"
                        />
                      </div>
                    );
                  })()}

                  {regHasVideo && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      ▶️
                    </span>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-[9px] font-black uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                      {reg.cat || "Região"}
                    </span>

                    {regGeo && (
                      <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                        <span>📍</span> {regGeo}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-xs sm:text-sm text-slate-900 group-hover:text-red-600 line-clamp-2 leading-snug tracking-tight transition-colors">
                    <Link href={href}>
                      {reg.titulo}
                    </Link>
                  </h3>

                  <div className="flex items-center justify-between mt-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-sans tabular-nums font-medium">
                      {regHora}
                    </span>

                    <WhatsAppShareButton
                      titulo={reg.titulo}
                      href={href}
                      variant="icon"
                    />
                  </div>
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
                const pHora = formatNewsTime(p.published_at, p.hora);
                const pGeo = detectCityGeoTag(p);

                return (
                  <article key={p.id} className="group py-2.5 first:pt-0 last:pb-0">
                    <Link href={href} className="block">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 flex-wrap">
                        <span className="font-bold text-red-600">{p.cat || "Urgente"}</span>
                        {pGeo && (
                          <span className="font-bold text-amber-700">📍 {pGeo}</span>
                        )}
                        <span>•</span>
                        <span className="tabular-nums font-semibold text-slate-500">{pHora}</span>
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
