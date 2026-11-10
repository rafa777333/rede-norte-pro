"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Newspaper,
  Tv,
  ShoppingBag,
  Briefcase,
  Compass,
  Percent,
  Play,
  Pause,
  Settings,
  Radio,
  Volume2,
  ExternalLink,
} from "lucide-react";

/**
 * URL Oficial do Streaming da Rádio Rede Apucarana FM
 */
const RADIO_STREAM_URL = "https://servidor34-2.brlogic.com:7016/live?source=website";

export interface SuperAppCardItem {
  id: string;
  title: string;
  href: string;
  bgColor: string;
  shadowColor: string;
  badge?: string;
  icon: React.ReactNode;
  description?: string;
  /**
   * Slot preparado para receber imagem 3D (ex: /icons/3d/noticias.png)
   * Se preenchido, renderiza a imagem 3D em vez do ícone Lucide
   */
  image3dSrc?: string;
}

interface SuperAppHomeProps {
  customCards?: SuperAppCardItem[];
  showPortalLink?: boolean;
}

export default function SuperAppHome({
  customCards,
  showPortalLink = true,
}: SuperAppHomeProps) {
  // Estado e Controle do Player da Rádio
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleRadio = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        setIsLoadingAudio(true);
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("[SuperApp] Autoplay impedido pelo navegador:", err);
        setIsPlaying(false);
      } finally {
        setIsLoadingAudio(false);
      }
    }
  };

  // Monitora término ou erro do áudio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onError = () => {
      setIsPlaying(false);
      setIsLoadingAudio(false);
    };

    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // Lista Padrão dos 6 Botões Gigantes do Super App
  const defaultCards: SuperAppCardItem[] = [
    {
      id: "noticias",
      title: "NOTÍCIAS",
      href: "/noticias",
      bgColor: "bg-red-500 hover:bg-red-600 bg-gradient-to-br from-red-500 via-red-500 to-red-600",
      shadowColor: "shadow-red-500/25",
      description: "Jornalismo regional, giro policial e política",
      icon: <Newspaper className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.2} />,
      // image3dSrc: "/icons/3d/noticias.png", // Descomente para usar ícone 3D
    },
    {
      id: "tv-ao-vivo",
      title: "TV AO VIVO",
      href: "/tv-online",
      bgColor: "bg-blue-400 hover:bg-blue-500 bg-gradient-to-br from-blue-400 via-sky-400 to-blue-500",
      shadowColor: "shadow-blue-400/25",
      badge: "AO VIVO",
      description: "Transmissão 24h, RedeCast e estúdio ao vivo",
      icon: <Tv className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.2} />,
      // image3dSrc: "/icons/3d/tv.png",
    },
    {
      id: "compras-e-vendas",
      title: "COMPRAS E VENDAS",
      href: "/comprasevendas",
      bgColor: "bg-green-500 hover:bg-green-600 bg-gradient-to-br from-green-500 via-emerald-500 to-green-600",
      shadowColor: "shadow-green-500/25",
      description: "Classificados locais, carros, imóveis e produtos",
      icon: <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.2} />,
      // image3dSrc: "/icons/3d/classificados.png",
    },
    {
      id: "empregos",
      title: "EMPREGOS",
      href: "/empregos",
      bgColor: "bg-orange-400 hover:bg-orange-500 bg-gradient-to-br from-orange-400 via-amber-500 to-orange-500",
      shadowColor: "shadow-orange-400/25",
      description: "Vagas de trabalho e profissionais autônomos",
      icon: <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.2} />,
      // image3dSrc: "/icons/3d/empregos.png",
    },
    {
      id: "para-onde-ir",
      title: "PARA ONDE IR",
      href: "/onde-ir",
      bgColor: "bg-purple-400 hover:bg-purple-500 bg-gradient-to-br from-purple-400 via-violet-400 to-purple-500",
      shadowColor: "shadow-purple-400/25",
      description: "Gastronomia, bares, hotéis, lazer e cupons",
      icon: <Compass className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.2} />,
      // image3dSrc: "/icons/3d/onde-ir.png",
    },
    {
      id: "promocoes",
      title: "PROMOÇÕES",
      href: "/ofertas",
      bgColor: "bg-yellow-400 hover:bg-yellow-500 bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500",
      shadowColor: "shadow-yellow-400/25",
      description: "Encartes de supermercados e farmácias",
      icon: <Percent className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.2} />,
      // image3dSrc: "/icons/3d/ofertas.png",
    },
  ];

  const cardsToRender = customCards || defaultCards;

  return (
    // 1. ESTRUTURA GERAL: Fundo claro e centralizado em max-w-md no Desktop (Simulador Mobile)
    <div className="min-h-screen bg-slate-200/70 sm:py-6 flex items-center justify-center font-sans antialiased selection:bg-red-500 selection:text-white">
      <main className="w-full max-w-md min-h-screen sm:min-h-[844px] bg-slate-50 flex flex-col justify-between relative shadow-2xl sm:rounded-3xl overflow-hidden border-slate-300 sm:border pb-28">
        
        {/* ========================================================================= */}
        {/* 2. CABEÇALHO (HEADER): Fixo no topo, Fundo Azul Escuro Marca Rede Apucarana */}
        {/* ========================================================================= */}
        <header className="sticky top-0 z-30 bg-[#0a192f] text-white border-b border-blue-950/80 shadow-md">
          <div className="flex items-center justify-between px-4 h-16">
            {/* Ícone sutil à esquerda (Sinal Ao Vivo / Rádio) */}
            <div className="w-9 flex items-center justify-start">
              <span className="relative flex h-3 w-3" title="Rede Apucarana Online">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
            </div>

            {/* Espaço centralizado para a Logotipo da "Rede Apucarana" */}
            <Link
              href="/"
              className="flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95"
              title="Rede Apucarana • Página Inicial"
            >
              <img
                src="/logo-rede-apucarana.png"
                alt="Rede Apucarana de Comunicação"
                className="h-10 sm:h-11 w-auto object-contain drop-shadow"
                onError={(e) => {
                  // Fallback se imagem não carregar
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const fallback = target.parentElement?.querySelector(".fallback-text");
                  if (fallback) (fallback as HTMLElement).style.display = "block";
                }}
              />
              <span className="fallback-text hidden font-black text-lg tracking-wider text-white">
                REDE <span className="text-red-500">APUCARANA</span>
              </span>
            </Link>

            {/* Ícone sutil de configurações / perfil no canto direito */}
            <div className="w-9 flex items-center justify-end">
              <Link
                href="/admin"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-slate-200 hover:text-white transition-all"
                title="Painel de Controle e Configurações"
                aria-label="Configurações e Administração"
              >
                <Settings className="w-4 h-4 text-slate-200" />
              </Link>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 3. CONTEÚDO PRINCIPAL: Grid de 2 Colunas com Botões Gigantes              */}
        {/* ========================================================================= */}
        <section className="p-4 flex-1 flex flex-col justify-center">
          {/* Subtítulo sutil e data / status */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-3">
            <span>Vale do Ivaí • Paraná</span>
            <span className="text-emerald-600 flex items-center gap-1 font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Super App Oficial
            </span>
          </div>

          {/* Grid de 2 Colunas (grid-cols-2), gap-4 generoso */}
          <div className="grid grid-cols-2 gap-4">
            {cardsToRender.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className={`group relative flex flex-col justify-between p-4 sm:p-5 aspect-square rounded-2xl sm:rounded-3xl ${card.bgColor} text-white shadow-lg ${card.shadowColor} hover:shadow-xl hover:scale-[1.03] active:scale-95 transition-all duration-200 overflow-hidden cursor-pointer select-none`}
                title={`Acessar ${card.title}`}
              >
                {/* Efeito de brilho de luz no canto do card */}
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-white/15 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform" />

                {/* Badge opcional no topo (ex: "AO VIVO" na TV) */}
                {card.badge && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-red-900/40 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>{card.badge}</span>
                  </div>
                )}

                {/* =============================================================== */}
                {/* SLOT DO ÍCONE (Preparado para Ícones 3D ou SVG / Lucide)        */}
                {/* =============================================================== */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner group-hover:scale-110 group-hover:rotate-1 transition-all duration-200 shrink-0">
                  {card.image3dSrc ? (
                    // Renderiza imagem 3D customizada caso fornecida
                    <img
                      src={card.image3dSrc}
                      alt={card.title}
                      className="w-11 h-11 object-contain drop-shadow-md"
                    />
                  ) : (
                    // Renderiza o ícone SVG / Lucide padrão
                    card.icon
                  )}
                </div>

                {/* Título Grande e Negrito na base do Card */}
                <div className="mt-auto z-10">
                  <h3 className="font-heading font-black text-lg sm:text-xl tracking-tight uppercase leading-none drop-shadow-xs">
                    {card.title}
                  </h3>
                  {card.description && (
                    <p className="hidden text-[10px] font-medium text-white/80 line-clamp-1 mt-1">
                      {card.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Link opcional de rodapé para o Portal Tradicional Completo */}
          {showPortalLink && (
            <div className="mt-5 text-center">
              <Link
                href="/noticias"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-1.5 px-3 rounded-full hover:bg-slate-200/50"
              >
                <span>Acessar portal de notícias tradicional</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 4. RODAPÉ FIXO (PLAYER DA RÁDIO): Fundo Azul Escuro, Play e Ondas Sonoras  */}
        {/* ========================================================================= */}
        <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-[#0a192f] text-white rounded-t-2xl sm:rounded-t-3xl shadow-[0_-8px_25px_rgba(0,0,0,0.3)] border-t border-blue-900/60 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Botão de [Play] / [Pause] evidente à esquerda */}
            <button
              type="button"
              onClick={toggleRadio}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer shrink-0 ${
                isPlaying
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 scale-105 animate-pulse"
                  : "bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 text-white shadow-red-600/25"
              }`}
              title={isPlaying ? "Pausar Rádio Apucarana" : "Ouvir Rádio Apucarana FM ao Vivo"}
              aria-label={isPlaying ? "Pausar rádio ao vivo" : "Tocar rádio ao vivo"}
            >
              {isLoadingAudio ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Informações da Rádio (Centro) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-red-500 animate-ping" : "bg-red-500"}`} />
                  {isPlaying ? "NO AR AGORA" : "RÁDIO AO VIVO"}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">• 98.3 FM</span>
              </div>
              <h4 className="font-heading font-black text-sm text-white truncate leading-tight mt-0.5 tracking-tight">
                RÁDIO APUCARANA FM
              </h4>
              <p className="text-[11px] text-slate-300 truncate">
                {isPlaying ? "Transmitindo ao vivo do estúdio" : "Toque no Play para ouvir ao vivo"}
              </p>
            </div>

            {/* Ícone animado de ondas sonoras à direita */}
            <div
              className="flex items-end gap-1 h-6 shrink-0 pr-1 select-none"
              title={isPlaying ? "Rádio transmitindo áudio" : "Rádio pausada"}
              aria-hidden="true"
            >
              <span
                className={`w-1 bg-amber-400 rounded-full transition-all duration-300 ${
                  isPlaying ? "h-3 animate-[bounce_0.8s_infinite]" : "h-1.5 opacity-40"
                }`}
              />
              <span
                className={`w-1 bg-amber-400 rounded-full transition-all duration-300 ${
                  isPlaying ? "h-6 animate-[bounce_0.6s_infinite_0.1s]" : "h-2.5 opacity-60"
                }`}
              />
              <span
                className={`w-1 bg-amber-400 rounded-full transition-all duration-300 ${
                  isPlaying ? "h-4 animate-[bounce_0.7s_infinite_0.2s]" : "h-1.5 opacity-40"
                }`}
              />
              <span
                className={`w-1 bg-amber-400 rounded-full transition-all duration-300 ${
                  isPlaying ? "h-5 animate-[bounce_0.5s_infinite_0.3s]" : "h-2 opacity-50"
                }`}
              />
            </div>
          </div>

          {/* Elemento de áudio nativo para streaming da rádio */}
          <audio ref={audioRef} src={RADIO_STREAM_URL} preload="none" />
        </footer>
      </main>
    </div>
  );
}
