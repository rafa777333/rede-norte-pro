"use client";

import React, { useEffect, useState, useRef } from "react";
import { PlaceItem, MenuItem } from "@/types/places";
import { isOpenNow } from "@/lib/mock-places";
import { trackPlaceCouponClick } from "@/lib/places-analytics";

interface PlaceModalProps {
  place: PlaceItem | null;
  onClose: () => void;
}

export default function PlaceModal({ place, onClose }: PlaceModalProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [cupomResgatado, setCupomResgatado] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleResgatarNoCaixa = () => {
    if (!place?.activePromo) return;
    trackPlaceCouponClick(place.id);
    setCupomResgatado(true);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(place.activePromo.couponCode).catch(() => {});
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (place) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [place, onClose]);

  if (!place) return null;

  const status = isOpenNow(place.openHours);
  const cleanPhone = place.whatsapp.replace(/\D/g, "");

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleSound = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleOrderWhatsapp = (item: MenuItem) => {
    const msg = encodeURIComponent(
      `Olá! Vi o cardápio de vocês no portal *Rede Apucarana* e gostaria de pedir: *${item.name}* (R$ ${item.price.toFixed(2).replace(".", ",")}).`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, "_blank");
  };

  const handleGeneralWhatsapp = () => {
    const msg = encodeURIComponent(
      `Olá! Vi vocês no portal *Rede Apucarana* e gostaria de informações e fazer uma reserva em *${place.name}*.`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================
            COLUNA 1 (45%): EXPERIÊNCIA EM VÍDEO VERTICAL 9:16 & LOCAL
           ========================================================= */}
        <div className="md:w-5/12 bg-slate-950 text-white flex flex-col justify-between overflow-y-auto border-r border-slate-800">
          {/* Container de Vídeo 9:16 */}
          <div className="relative aspect-[9/16] max-h-[480px] md:max-h-[580px] w-full bg-slate-900 overflow-hidden shrink-0 mx-auto">
            {place.videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={place.videoUrl}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={togglePlay}
                />
                {/* Controles de Som & Pausa */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={toggleSound}
                    className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md text-xs font-bold transition-all"
                    title={isMuted ? "Ativar Áudio" : "Mutar Áudio"}
                  >
                    {isMuted ? "🔇 Mudo" : "🔊 Som"}
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md text-xs font-bold transition-all"
                  >
                    {isPlaying ? "⏸" : "▶️"}
                  </button>
                </div>
              </>
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={place.coverImage}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-4 text-center">
                  <span className="text-3xl mb-2">🎬</span>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Espaço para Vídeo Review 9:16
                  </span>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Grave o tour do seu restaurante com a equipe da Rede Apucarana
                  </p>
                </div>
              </div>
            )}

            {/* Selo 9:16 Tour Oficial */}
            <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-600/90 text-white backdrop-blur-sm shadow-md">
                <span>📹</span>
                <span>Tour do Estabelecimento (9:16)</span>
              </span>
            </div>
          </div>

          {/* Dados de Contato e Localização */}
          <div className="p-4 sm:p-5 space-y-3 text-xs bg-slate-950 shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Endereço
              </span>
              <p className="text-slate-200 font-medium mt-0.5 leading-snug">
                📍 {place.address}
              </p>
              {place.googleMapsUrl && (
                <a
                  href={place.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:text-sky-300 text-[11px] font-semibold mt-1 inline-flex items-center gap-1"
                >
                  Abrir no Google Maps ↗
                </a>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Funcionamento
                </span>
                <span className="text-slate-200">
                  {place.openHours.days || "Terça a Domingo"}: {place.openHours.open} às {place.openHours.close}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  status.isOpen
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : "bg-red-950 text-red-400 border border-red-800"
                }`}
              >
                {status.label}
              </span>
            </div>

            {place.instagram && (
              <div className="pt-2 border-t border-slate-800">
                <a
                  href={`https://instagram.com/${place.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 font-semibold inline-flex items-center gap-1.5"
                >
                  <span>📷</span>
                  <span>{place.instagram}</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            COLUNA 2 (55%): CARDÁPIO / CATÁLOGO & PEDIDO DIRETO NO ZAP
           ========================================================= */}
        <div className="md:w-7/12 flex flex-col justify-between overflow-y-auto max-h-[85vh] md:max-h-[92vh] bg-white">
          {/* Cabeçalho do Local */}
          <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-10 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                  {place.category}
                </span>
                {place.isVip && (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 font-bold shadow-xs">
                    ★ Parceiro Verificado
                  </span>
                )}
                <span className="text-xs text-slate-500 font-semibold">
                  {place.city}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-sans leading-tight">
                {place.name}
              </h2>
              {place.tagline && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {place.tagline}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0 transition-colors"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          {/* Conteúdo com Promoção e Cardápio */}
          <div className="p-5 sm:p-6 pt-3 flex-1 overflow-y-auto space-y-6">
            {/* Faixa de Promoção: ATIVA vs ESGOTADA */}
            {(place.activePromo || place.promoText) && (
              place.promoActive !== false && place.activePromo?.isActive !== false ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white shadow-md flex flex-col gap-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">⚡</span>
                        <span className="text-xs font-black uppercase tracking-wider text-orange-100">
                          Promoção Exclusiva Rede Apucarana
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-bold mt-0.5">
                        {place.promoText || place.activePromo?.title}
                      </h4>
                      {place.activePromo?.description && (
                        <p className="text-xs text-orange-100 mt-0.5">
                          {place.activePromo.description}
                        </p>
                      )}
                    </div>

                    {place.activePromo?.couponCode && (
                      <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-center shrink-0 border border-white/20">
                        <span className="text-[10px] uppercase font-bold block opacity-90">
                          Cupom
                        </span>
                        <span className="font-mono font-black text-sm tracking-wider">
                          {place.activePromo.couponCode}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botão Oficial: 🎯 RESGATAR DESCONTO NO CAIXA */}
                  <button
                    type="button"
                    onClick={handleResgatarNoCaixa}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-orange-50 text-orange-700 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <span>🎯 RESGATAR DESCONTO NO CAIXA</span>
                    {place.activePromo?.couponCode && (
                      <span className="bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                        {place.activePromo.couponCode}
                      </span>
                    )}
                  </button>

                  {/* Voucher de Confirmação para Apresentar no Caixa */}
                  {cupomResgatado && place.activePromo && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/90 text-white border border-emerald-400/50 flex flex-col gap-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          <span>✅</span>
                          <span>Desconto Ativado! Código Copiado</span>
                        </span>
                        <span className="font-mono font-black text-sm bg-white text-emerald-800 px-2 py-0.5 rounded">
                          {place.activePromo.couponCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-100">
                        Mostre esta tela para o atendente no caixa ou garçom de <strong>{place.name}</strong> para aplicar seu desconto!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Promoção Esgotada: Cinza desativado, FOMO */
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">🚫</span>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Cota de Cupons Encerrada
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-bold mt-0.5 text-slate-600 line-through">
                        {place.promoText || place.activePromo?.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Todos os cupons promocionais disponibilizados para esta oferta foram 100% resgatados hoje.
                      </p>
                    </div>

                    <div className="bg-slate-200 px-3 py-1.5 rounded-xl text-center shrink-0 border border-slate-300">
                      <span className="text-[10px] uppercase font-bold block text-slate-500">
                        Status
                      </span>
                      <span className="font-mono font-black text-xs text-slate-600">
                        ESGOTADO
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-300 text-slate-500 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed select-none shadow-none"
                  >
                    <span>🚫 PROMOÇÃO ESGOTADA</span>
                  </button>
                </div>
              )
            )}

            {/* Aba do Cardápio / Tarifas */}
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span>🍽️</span>
                  <span>Destaques do Cardápio & Pratos</span>
                </h3>
                <span className="text-xs text-emerald-600 font-semibold">
                  Peça direto pelo WhatsApp
                </span>
              </div>

              <div className="space-y-3">
                {place.menuHighlights.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 sm:p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-slate-200"
                          loading="lazy"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {item.name}
                          </h4>
                          {item.badge && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                        <span className="text-sm font-black text-slate-900 mt-1 block">
                          R$ {item.price.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOrderWhatsapp(item)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 self-stretch sm:self-auto"
                      title="Pedir este prato diretamente no WhatsApp do estabelecimento"
                    >
                      <span>Pedir no Zap</span>
                      <span>📲</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rodapé Fixo do Modal com Ação de Contato Geral */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold text-slate-800 block">
                Prefere tirar dúvidas ou reservar mesa?
              </span>
              <span className="text-[11px] text-slate-500">
                Atendimento rápido pelo canal oficial do estabelecimento
              </span>
            </div>

            <button
              type="button"
              onClick={handleGeneralWhatsapp}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Falar com o Local no WhatsApp</span>
              <span>💬</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
