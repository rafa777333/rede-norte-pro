"use client";

import React from "react";
import { PlaceItem } from "@/types/places";
import { trackPlaceCouponClick } from "@/lib/places-analytics";

interface PromoHeroCarouselProps {
  places: PlaceItem[];
  onSelectPlace?: (place: PlaceItem) => void;
}

export default function PromoHeroCarousel({
  places,
  onSelectPlace,
}: PromoHeroCarouselProps) {
  // Filtra locais com promoções (dando prioridade para os com promo_highlight)
  const promoPlaces = places
    .filter((p) => Boolean(p.activePromo || p.promoText))
    .sort((a, b) => {
      const aHigh = Boolean(a.promoHighlight || a.activePromo?.isHighlight);
      const bHigh = Boolean(b.promoHighlight || b.activePromo?.isHighlight);
      if (aHigh && !bHigh) return -1;
      if (!aHigh && bHigh) return 1;

      const aEsg = a.promoActive === false || a.activePromo?.isActive === false;
      const bEsg = b.promoActive === false || b.activePromo?.isActive === false;
      if (!aEsg && bEsg) return -1;
      if (aEsg && !bEsg) return 1;
      return 0;
    });

  if (promoPlaces.length === 0) return null;

  return (
    <section className="w-full mb-10" aria-label="Promoções e Cupons de Hoje">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-sans">
            🔥 Promoções & Cupons de Hoje no Vale
          </h2>
        </div>
        <span className="text-xs font-bold text-orange-600 uppercase tracking-wider hidden sm:inline">
          Exclusivo Rede Apucarana
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {promoPlaces.map((place) => {
          const promo = place.activePromo;
          const isPromoAtiva = place.promoActive !== false && promo?.isActive !== false;
          const isHighlight = Boolean(place.promoHighlight || promo?.isHighlight);
          const promoTitle = place.promoText || promo?.title || "Promoção Especial";
          const promoDiscount = promo?.discountBadge || "OFERTA";
          const couponCode = promo?.couponCode || "CUPOM";

          const waMsg = encodeURIComponent(
            `Olá! Vi a promoção *${promoTitle}* no portal Rede Apucarana (Cupom: *${couponCode}*) e quero aproveitar!`
          );
          const waUrl = `https://wa.me/55${place.whatsapp.replace(/\D/g, "")}?text=${waMsg}`;

          return (
            <div
              key={place.id}
              className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                isHighlight
                  ? "border-amber-400 ring-2 ring-amber-400 shadow-md shadow-amber-500/10"
                  : "border-slate-200/90 shadow-sm hover:shadow-lg"
              }`}
            >
              {/* Imagem com Badge Flutuante */}
              <div
                className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900 cursor-pointer"
                onClick={() => onSelectPlace && onSelectPlace(place)}
              >
                <img
                  src={place.coverImage}
                  alt={place.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                {/* Selo Pulsante de Desconto ou Oferta Limitada */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {isHighlight ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white shadow-lg border border-amber-300/60 animate-pulse">
                      <span>🔥</span>
                      <span>OFERTA LIMITADA</span>
                    </span>
                  ) : isPromoAtiva ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg border border-red-400/40 animate-pulse">
                      <span>⚡</span>
                      <span>{promoDiscount}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-800 text-slate-300 shadow-md border border-slate-700">
                      <span>🚫</span>
                      <span>COTA ESGOTADA</span>
                    </span>
                  )}
                </div>

                {/* Cidade / Categoria */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[11px] font-semibold text-orange-300 uppercase tracking-wider block">
                    {place.city} · {place.neighborhood}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1 leading-tight group-hover:text-orange-300 transition-colors">
                    {place.name}
                  </h3>
                </div>
              </div>

              {/* Informações da Oferta */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-xs font-black line-clamp-1 ${isPromoAtiva ? "text-slate-800" : "text-slate-500 line-through"}`}>
                      {promoTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200 shrink-0">
                      {isPromoAtiva ? couponCode : "ESGOTADO"}
                    </span>
                  </div>
                  {promo?.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {promo.description}
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  {isPromoAtiva ? (
                    <button
                      type="button"
                      onClick={() => {
                        trackPlaceCouponClick(place.id);
                        if (onSelectPlace) onSelectPlace(place);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                      title="Resgatar desconto de hoje"
                    >
                      <span>🎯 RESGATAR DESCONTO NO CAIXA</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2 px-3 rounded-xl bg-slate-300 text-slate-500 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed select-none shadow-none"
                    >
                      <span>🚫 PROMOÇÃO ESGOTADA</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectPlace && onSelectPlace(place)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center transition-colors"
                    >
                      Ver Cardápio
                    </button>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => isPromoAtiva && trackPlaceCouponClick(place.id)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>Pedir no Zap</span>
                      <span>📲</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
