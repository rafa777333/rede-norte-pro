"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  Settings,
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
  emoji: string;
  image3dSrc: string;
  description?: string;
  icon?: React.ReactNode;
}

interface SuperAppHomeProps {
  customCards?: SuperAppCardItem[];
  showPortalLink?: boolean;
}

/**
 * Subcomponente para renderizar a imagem 3D com fallback automático em Emoji
 */
function SuperAppCardIcon({
  image3dSrc,
  emoji,
  title,
}: {
  image3dSrc: string;
  emoji: string;
  title: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="flex-1 flex items-center justify-center my-auto w-full transition-transform duration-200 group-hover:scale-110 group-hover:rotate-1">
      {!imageFailed && image3dSrc ? (
        <img
          src={image3dSrc}
          alt={title}
          className="w-20 h-20 object-contain drop-shadow-xl"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span
          className="text-6xl drop-shadow-lg select-none leading-none flex items-center justify-center animate-in fade-in zoom-in-75 duration-200"
          role="img"
          aria-label={title}
        >
          {emoji}
        </span>
      )}
    </div>
  );
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

  // Lista Padrão dos 6 Botões Gigantes com Imagens 3D e Fallback em Emojis
  const defaultCards: SuperAppCardItem[] = [
    {
      id: "noticias",
      title: "NOTÍCIAS",
      href: "/noticias",
      bgColor: "bg-red-500 hover:bg-red-600 bg-gradient-to-br from-red-500 via-red-500 to-red-600",
      shadowColor: "shadow-red-500/25",
      emoji: "📰",
      image3dSrc: "/icons/3d/noticias.png",
      description: "Jornalismo regional, giro policial e política",
    },
    {
      id: "tv-ao-vivo",
      title: "TV AO VIVO",
      href: "/tv-online",
      bgColor: "bg-blue-400 hover:bg-blue-500 bg-gradient-to-br from-blue-400 via-sky-400 to-blue-500",
      shadowColor: "shadow-blue-400/25",
      badge: "AO VIVO",
      emoji: "🎥",
      image3dSrc: "/icons/3d/tv.png",
      description: "Transmissão 24h, RedeCast e estúdio ao vivo",
    },
    {
      id: "compras-e-vendas",
      title: "COMPRAS E VENDAS",
      href: "/comprasevendas",
      bgColor: "bg-green-500 hover:bg-green-600 bg-gradient-to-br from-green-500 via-emerald-500 to-green-600",
      shadowColor: "shadow-green-500/25",
      emoji: "🤝",
      image3dSrc: "/icons/3d/classificados.png",
      description: "Classificados locais, carros, imóveis e produtos",
    },
    {
      id: "empregos",
      title: "EMPREGOS",
      href: "/empregos",
      bgColor: "bg-orange-400 hover:bg-orange-500 bg-gradient-to-br from-orange-400 via-amber-500 to-orange-500",
      shadowColor: "shadow-orange-400/25",
      emoji: "💼",
      image3dSrc: "/icons/3d/empregos.png",
      description: "Vagas de trabalho e profissionais autônomos",
    },
    {
      id: "para-onde-ir",
      title: "PARA ONDE IR",
      href: "/onde-ir",
      bgColor: "bg-purple-400 hover:bg-purple-500 bg-gradient-to-br from-purple-400 via-violet-400 to-purple-500",
      shadowColor: "shadow-purple-400/25",
      emoji: "🍽️",
      image3dSrc: "/icons/3d/onde-ir.png",
      description: "Gastronomia, bares, hotéis, lazer e cupons",
    },
    {
      id: "promocoes",
      title: "PROMOÇÕES",
      href: "/ofertas",
      bgColor: "bg-yellow-400 hover:bg-yellow-500 bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500",
      shadowColor: "shadow-yellow-400/25",
      emoji: "🛒",
      image3dSrc: "/icons/3d/ofertas.png",
      description: "Encartes de supermercados e farmácias",
    },
  ];

  const cardsToRender = customCards || defaultCards;

  return (
    // 1. ESTRUTURA GERAL: Mobile Puro em tela cheia (w-full min-h-screen)
    <div className="w-full min-h-screen bg-slate-50 flex flex-col justify-between relative pb-28 font-sans antialiased selection:bg-red-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 2. CABEÇALHO (HEADER): Fixo no topo, Fundo Azul Escuro Marca Rede Apucarana */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-[#0a192f] text-white border-b border-blue-950/80 shadow-md">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Indicador sutil de transmissão online à esquerda */}
          <div className="w-9 flex items-center justify-start">
            <span className="relative flex h-3 w-3" title="Rede Apucarana Online">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          </div>

          {/* Logotipo Centralizado da "Rede Apucarana" */}
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
      {/* 3. CONTEÚDO PRINCIPAL: Grid de 2 Colunas com Cards 3D Centralizados       */}
      {/* ========================================================================= */}
      <section className="p-4 flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
        {/* Subtítulo e status */}
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-3">
          <span>Vale do Ivaí • Paraná</span>
          <span className="text-emerald-600 flex items-center gap-1 font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Super App Oficial
          </span>
        </div>

        {/* Grid de 2 Colunas (grid-cols-2) com alinhamento interno centralizado */}
        <div className="grid grid-cols-2 gap-4">
          {cardsToRender.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className={`group relative flex flex-col items-center justify-between text-center p-4 aspect-square rounded-2xl sm:rounded-3xl ${card.bgColor} text-white shadow-lg ${card.shadowColor} hover:shadow-xl hover:scale-[1.03] active:scale-95 transition-all duration-200 overflow-hidden cursor-pointer select-none`}
              title={`Acessar ${card.title}`}
            >
              {/* Efeito de brilho de luz no canto do card */}
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-white/15 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform" />

              {/* Badge opcional no topo (ex: "AO VIVO" na TV) */}
              {card.badge && (
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-red-900/40 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>{card.badge}</span>
                </div>
              )}

              {/* =============================================================== */}
              {/* SLOT DO ÍCONE 3D CENTRALIZADO (com fallback automático em Emoji) */}
              {/* =============================================================== */}
              <SuperAppCardIcon
                image3dSrc={card.image3dSrc}
                emoji={card.emoji}
                title={card.title}
              />

              {/* Título Grande e Negrito Centralizado na Base */}
              <div className="w-full mt-auto pt-1 z-10">
                <h3 className="font-heading font-black text-base sm:text-lg tracking-tight uppercase leading-tight drop-shadow-xs">
                  {card.title}
                </h3>
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
      <footer className="fixed bottom-0 left-0 right-0 w-full z-40 bg-[#0a192f] text-white shadow-[0_-8px_25px_rgba(0,0,0,0.3)] border-t border-blue-900/60 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
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
    </div>
  );
}
