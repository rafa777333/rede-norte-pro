"use client";

import React from "react";
import Link from "next/link";
import { MOCK_PLACES, isOpenNow } from "@/lib/mock-places";

interface HomeOndeIrSectionProps {
  cidadeAtual?: string;
}

export default function HomeOndeIrSection({ cidadeAtual = "Geral" }: HomeOndeIrSectionProps) {
  // Filtra por cidade se selecionada, senão pega os 4 principais parceiros VIP
  const places = React.useMemo(() => {
    let list = MOCK_PLACES;
    if (cidadeAtual && cidadeAtual !== "Geral" && cidadeAtual !== "Todas") {
      const byCity = list.filter(
        (p) => p.city.toLowerCase() === cidadeAtual.toLowerCase()
      );
      if (byCity.length > 0) list = byCity;
    }
    return list.slice(0, 4);
  }, [cidadeAtual]);

  return (
    <section
      className="w-full my-8 bg-gradient-to-b from-amber-500/5 via-white to-slate-50 border border-amber-500/20 rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden relative"
      aria-label="Onde Ir no Vale do Ivaí - Vitrine Gastronômica & Cupons"
    >
      {/* Detalhe estético no fundo */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-amber-500/15">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-6 rounded-full bg-amber-500 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase text-amber-600 tracking-wider">
                Guia Gastronômico, Lazer & Comércio
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                🔥 CUPONS ATIVOS
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans tracking-tight">
              Onde Ir no Vale do Ivaí
            </h3>
          </div>
        </div>

        <Link
          href="/onde-ir"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm hover:shadow transition-all group shrink-0"
        >
          <span>Abrir Vitrine Completa (Vídeos & Pedidos)</span>
          <span className="group-hover:translate-x-0.5 transition-transform font-black">→</span>
        </Link>
      </div>

      {/* Grid de Cards dos Estabelecimentos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {places.map((place) => {
          const open = isOpenNow(place.openHours);

          return (
            <Link
              key={place.id}
              href={`/onde-ir?local=${place.slug}`}
              className="group flex flex-col rounded-xl overflow-hidden border border-slate-200/90 bg-white hover:border-amber-400 hover:shadow-lg transition-all duration-200"
            >
              {/* Imagem de Capa com Badges */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                <img
                  src={place.coverImage}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Selo 9:16 Video Review */}
                {place.videoUrl && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-black/75 backdrop-blur-md text-amber-400 border border-amber-400/30 flex items-center gap-1">
                    <span>▶</span> Vídeo 9:16
                  </span>
                )}

                {/* Status Aberto/Fechado */}
                <span
                  className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md ${
                    open
                      ? "bg-emerald-600/90 text-white"
                      : "bg-slate-900/80 text-slate-300"
                  }`}
                >
                  {open ? "🟢 Aberto Agora" : `🔴 Abre ${place.openHours.open}`}
                </span>

                {/* Cidade e Categoria */}
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white/90 drop-shadow">
                  <span className="font-semibold">{place.city} · {place.neighborhood}</span>
                  <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white/80">
                    {place.category}
                  </span>
                </div>
              </div>

              {/* Informações & Cupom */}
              <div className="p-3.5 flex flex-col flex-1 justify-between bg-white">
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                    {place.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-snug">
                    {place.tagline}
                  </p>
                </div>

                {/* Cupom em Destaque */}
                {place.activePromo && (
                  <div className="mt-3 pt-2.5 border-t border-dashed border-amber-200 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      {place.activePromo.discountBadge}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-700">
                      Cupom: {place.activePromo.couponCode}
                    </span>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-amber-600 font-bold group-hover:underline">
                  <span>Ver Cardápio & Pedir no Zap</span>
                  <span>📲</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Faixa Inferior de Chamada Comercial */}
      <div className="mt-5 pt-3 border-t border-amber-500/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <span>
          💡 <b>Tem um restaurante, bar ou comércio na região?</b> Divulgue seu cardápio com pedido no WhatsApp e tour em vídeo 9:16.
        </span>
        <Link
          href="/anuncie"
          className="text-amber-700 font-bold hover:underline shrink-0 flex items-center gap-1"
        >
          <span>Quero destacar meu negócio</span>
          <span>→</span>
        </Link>
      </div>
    </section>
  );
}
