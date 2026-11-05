"use client";

import React from "react";
import { PlaceItem } from "@/types/places";

interface PromoHeroCarouselProps {
  places: PlaceItem[];
  onSelectPlace?: (place: PlaceItem) => void;
}

export default function PromoHeroCarousel({
  places,
  onSelectPlace,
}: PromoHeroCarouselProps) {
  // Filtra locais com promoções ativas
  const promoPlaces = places.filter((p) => p.activePromo);

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
          const promo = place.activePromo!;
          const waMsg = encodeURIComponent(
            `Olá! Vi a promoção *${promo.title}* no portal Rede Apucarana (Cupom: *${promo.couponCode}*) e quero aproveitar!`
          );
          const waUrl = `https://wa.me/55${place.whatsapp.replace(/\D/g, "")}?text=${waMsg}`;

          return (
            <div
              key={place.id}
              className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
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

                {/* Selo Pulsante de Desconto */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg border border-red-400/40 animate-pulse">
                    <span>⚡</span>
                    <span>{promo.discountBadge}</span>
                  </span>
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
                    <span className="text-xs font-black text-slate-800 line-clamp-1">
                      {promo.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200 shrink-0">
                      {promo.couponCode}
                    </span>
                  </div>
                  {promo.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {promo.description}
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectPlace && onSelectPlace(place)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center transition-colors"
                  >
                    Ver Cardápio
                  </button>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Resgatar no Zap</span>
                    <span>📲</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
