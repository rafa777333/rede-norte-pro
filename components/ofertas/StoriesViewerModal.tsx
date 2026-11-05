"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RetailerItem, PromoProduct } from "@/types/ofertas";

interface StoriesViewerModalProps {
  retailer: RetailerItem | null;
  onClose: () => void;
  onAddToList?: (product: PromoProduct, retailer: RetailerItem) => void;
}

export default function StoriesViewerModal({
  retailer,
  onClose,
  onAddToList,
}: StoriesViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const items = retailer?.storiesItems || [];
  const currentProduct = items[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, items.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Auto-play de 5 segundos por oferta
  useEffect(() => {
    if (!retailer || isPaused || items.length === 0) return;
    const timer = setTimeout(() => {
      handleNext();
    }, 5000);
    return () => clearTimeout(timer);
  }, [retailer, currentIndex, isPaused, items.length, handleNext]);

  // Navegação por teclado (Escape, Seta Esquerda, Seta Direita)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  if (!retailer || !currentProduct) return null;

  const formatMoney = (val?: number) =>
    (val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const cleanZap = (retailer.whatsapp || "").replace(/\D/g, "");
  const msgZap = encodeURIComponent(
    `Olá! Vi o encarte digital do *${retailer.name}* no portal Rede Apucarana e gostaria de pedir a oferta: *${currentProduct.productName}* (${formatMoney(
      currentProduct.promoPrice
    )} / ${currentProduct.unit}).`
  );
  const zapUrl = cleanZap ? `https://wa.me/55${cleanZap}?text=${msgZap}` : "#";

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      {/* Container Stories 9:16 Responsivo */}
      <div
        className="relative w-full max-w-md aspect-[9/16] max-h-[94vh] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between border border-slate-800"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Barras de Progresso no Topo */}
        <div className="absolute top-2 left-3 right-3 z-30 flex items-center gap-1">
          {items.map((_, idx) => (
            <div
              key={idx}
              className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  idx < currentIndex
                    ? "w-full"
                    : idx === currentIndex
                    ? "w-full animate-[progress_5s_linear]"
                    : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Cabeçalho do Estabelecimento */}
        <div className="relative z-30 p-4 pt-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={retailer.logo}
              alt={retailer.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/80"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white drop-shadow">
                  {retailer.name}
                </span>
                {retailer.isVip && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[9px]">
                    VIP
                  </span>
                )}
              </div>
              <span className="text-[10px] text-white/80 drop-shadow block">
                {retailer.city} · {retailer.validUntil}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white font-bold flex items-center justify-center border border-white/20 transition"
          >
            ✕
          </button>
        </div>

        {/* Zonas de Toque para Voltar / Avançar */}
        <div className="absolute inset-0 z-20 flex">
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={handlePrev}
            title="Voltar oferta"
          />
          <div
            className="w-2/3 h-full cursor-pointer"
            onClick={handleNext}
            title="Próxima oferta"
          />
        </div>

        {/* Imagem do Produto em Destaque */}
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900">
          <img
            src={currentProduct.productImage}
            alt={currentProduct.productName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40 pointer-events-none" />
        </div>

        {/* Detalhes do Produto e Ações na Base */}
        <div className="relative z-30 p-4 sm:p-5 space-y-3.5 bg-gradient-to-t from-black via-black/90 to-transparent">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {currentProduct.discountPercent && (
                <span className="px-2 py-0.5 rounded-md font-black text-xs bg-red-600 text-white uppercase tracking-wider animate-pulse">
                  -{currentProduct.discountPercent}% OFF
                </span>
              )}
              {currentProduct.categoryTag && (
                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-white/20 text-white">
                  {currentProduct.categoryTag}
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow">
              {currentProduct.productName}
            </h3>

            {/* Preço de / por */}
            <div className="flex items-baseline gap-2.5 mt-2">
              {currentProduct.oldPrice && (
                <span className="text-sm text-slate-400 line-through">
                  De {formatMoney(currentProduct.oldPrice)}
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-emerald-400 uppercase">Por</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow">
                  {formatMoney(currentProduct.promoPrice)}
                </span>
                <span className="text-xs text-slate-300">/ {currentProduct.unit}</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação Rápida */}
          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <a
                href={zapUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg"
              >
                <span>Pedir no WhatsApp</span>
                <span>📲</span>
              </a>

              {onAddToList && (
                <button
                  type="button"
                  onClick={() => onAddToList(currentProduct, retailer)}
                  className="py-2.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-1 border border-white/30 transition"
                  title="Salvar na Lista de Compras"
                >
                  <span>+ Lista</span>
                  <span>🛒</span>
                </button>
              )}
            </div>

            {retailer.vipGroupUrl && (
              <a
                href={retailer.vipGroupUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-1.5 px-2 rounded-lg bg-emerald-950/70 hover:bg-emerald-950 text-emerald-300 border border-emerald-600/50 font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
              >
                <span>Entrar no Grupo VIP de Ofertas deste Mercado</span>
                <span>🟢</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
