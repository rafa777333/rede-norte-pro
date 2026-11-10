"use client";

import React from "react";
import Link from "next/link";
import {
  formatNewsTime,
  detectCityGeoTag,
  hasVideoContent,
  truncateWords,
  decodeHtmlEntities,
} from "../lib/text-utils";
import WhatsAppShareButton from "./WhatsAppShareButton";
import type { BentoNewsItem } from "./EditorialBentoGrid";

interface MobileNewsFeedProps {
  news: BentoNewsItem[];
  cidade?: string;
  onSelectCity?: (city: string) => void;
  categoria?: string;
  onSelectCategory?: (categoria: string) => void;
  categorias?: string[];
}

export default function MobileNewsFeed({
  news = [],
  cidade = "Geral",
  onSelectCity,
  categoria = "Todas",
  onSelectCategory,
  categorias = [],
}: MobileNewsFeedProps) {
  if (!news || news.length === 0) return null;

  // Manchete principal mobile
  const manchetePrincipal = news[0];
  const proximasNoticias = news.slice(1, 14);

  const getHref = (item: BentoNewsItem) =>
    item.slug ? `/noticias/${item.slug}` : `/noticias/${item.id}`;

  return (
    <div
      id="ultimas-noticias"
      className="block md:hidden bg-white rounded-t-3xl pt-5 px-4 pb-6 shadow-sm border-t border-slate-100 -mt-2 relative z-10"
    >
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-red-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
            </span>
            <span>Breaking News / Tempo Real</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading mt-0.5">
            Últimas Notícias
          </h2>
        </div>
      </div>

      {/* Se houver categorias, exibe pílulas horizontais com scroll suave */}
      {categorias.length > 0 && onSelectCategory && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-3 border-b border-slate-100">
          {categorias.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onSelectCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                categoria === c
                  ? "bg-slate-900 text-white font-bold shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* 1. Super-Manchete Mobile com Imagem Grande */}
      {manchetePrincipal && (() => {
        const mainGeo =
          detectCityGeoTag(manchetePrincipal) ||
          (manchetePrincipal.cidade && manchetePrincipal.cidade !== "Geral"
            ? `📍 ${manchetePrincipal.cidade.toUpperCase()}`
            : cidade && cidade !== "Geral"
            ? `📍 ${cidade.toUpperCase()}`
            : "📍 VALE DO IVAÍ");
        const mainHasVideo = hasVideoContent(manchetePrincipal);
        const mainHora = formatNewsTime(manchetePrincipal.published_at, manchetePrincipal.hora);

        return (
          <article className="mb-6 pb-5 border-b border-slate-100">
            <Link href={getHref(manchetePrincipal)} className="block group">
              {manchetePrincipal.img && (
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 mb-3 shadow-xs">
                  <img
                    src={manchetePrincipal.img}
                    alt={decodeHtmlEntities(manchetePrincipal.titulo)}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    loading="eager"
                  />
                  {/* Badges Flutuantes */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-xs">
                      {mainGeo}
                    </span>
                    {mainHasVideo && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/90 text-amber-400 backdrop-blur-xs">
                        ▶️ Vídeo
                      </span>
                    )}
                  </div>
                </div>
              )}

              <h3 className="text-xl font-black text-slate-900 leading-snug tracking-tight group-hover:text-red-600 transition-colors">
                {decodeHtmlEntities(manchetePrincipal.titulo)}
              </h3>

              {(manchetePrincipal.sub || manchetePrincipal.resumo) && (
                <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {truncateWords(decodeHtmlEntities(manchetePrincipal.sub || manchetePrincipal.resumo || ""), 22)}
                </p>
              )}
            </Link>

            <div className="flex items-center justify-between gap-2 mt-3 pt-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">
                {mainHora}
              </span>
              <WhatsAppShareButton
                titulo={manchetePrincipal.titulo}
                href={getHref(manchetePrincipal)}
                variant="pill"
              />
            </div>
          </article>
        );
      })()}

      {/* 2. Lista Mobile de Cards com leitura limpa e letras maiores */}
      <div className="flex flex-col divide-y divide-slate-100">
        {proximasNoticias.map((item) => {
          const href = getHref(item);
          const geoTag =
            detectCityGeoTag(item) ||
            (item.cidade && item.cidade !== "Geral"
              ? `📍 ${item.cidade.toUpperCase()}`
              : cidade && cidade !== "Geral"
              ? `📍 ${cidade.toUpperCase()}`
              : "📍 VALE DO IVAÍ");
          const hasVideo = hasVideoContent(item);
          const horaFormatada = formatNewsTime(item.published_at, item.hora);

          return (
            <article key={item.id} className="py-4 first:pt-0 group">
              <div className="flex gap-3.5 items-start">
                {/* Lado Esquerdo / Texto com tipografia imponente e legível */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-600">
                      {geoTag}
                    </span>
                    {hasVideo && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">
                        ▶ Vídeo
                      </span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {horaFormatada}
                    </span>
                  </div>

                  <Link href={href} className="block">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-3 group-hover:text-red-600 transition-colors">
                      {decodeHtmlEntities(item.titulo)}
                    </h4>
                  </Link>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {item.cat || "Geral"}
                    </span>
                    <WhatsAppShareButton
                      titulo={item.titulo}
                      href={href}
                      variant="icon"
                    />
                  </div>
                </div>

                {/* Thumbnail à Direita */}
                {item.img && (
                  <Link href={href} className="shrink-0">
                    <div className="w-24 h-20 sm:w-28 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shadow-2xs">
                      <img
                        src={item.img}
                        alt={decodeHtmlEntities(item.titulo)}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
