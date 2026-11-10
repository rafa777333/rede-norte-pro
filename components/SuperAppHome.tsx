"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Play, Pause, Settings } from "lucide-react";

/**
 * URL Oficial do Streaming da Rádio Rede Apucarana FM
 */
const RADIO_STREAM_URL = "https://servidor34-2.brlogic.com:7016/live?source=website";

interface SuperAppButton {
  id: string;
  title: string;
  href: string;
  imageSrc: string;
}

const SUPER_APP_BUTTONS: SuperAppButton[] = [
  {
    id: "noticias",
    title: "Notícias",
    href: "/noticias",
    imageSrc: "/icons/3d/noticias.png",
  },
  {
    id: "tv-ao-vivo",
    title: "TV ao Vivo",
    href: "/tv-online",
    imageSrc: "/icons/3d/tv.png",
  },
  {
    id: "compras-e-vendas",
    title: "Compras e Vendas",
    href: "/comprasevendas",
    imageSrc: "/icons/3d/classificados.png",
  },
  {
    id: "empregos",
    title: "Empregos",
    href: "/empregos",
    imageSrc: "/icons/3d/empregos.png",
  },
  {
    id: "para-onde-ir",
    title: "Para Onde Ir",
    href: "/onde-ir",
    imageSrc: "/icons/3d/onde-ir.png",
  },
  {
    id: "promocoes",
    title: "Promoções",
    href: "/ofertas",
    imageSrc: "/icons/3d/ofertas.png",
  },
];

// Alturas padrão da onda sonora da rádio (espelhando a imagem de referência)
const EQUALIZER_BARS = [8, 14, 20, 32, 24, 40, 48, 30, 52, 42, 28, 36, 22, 30, 16, 10];

export default function SuperAppHome() {
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

  return (
    <div className="w-full min-h-screen bg-[#0b2249] flex flex-col justify-between selection:bg-red-500 selection:text-white font-sans antialiased">
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO (TOPO AZUL MARINHO)                                          */}
      {/* ========================================================================= */}
      <header className="pt-6 pb-2 px-5 max-w-md mx-auto w-full flex items-center justify-between">
        {/* Lado Esquerdo: Logo RA + Textos empilhados */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="shrink-0 transition-transform active:scale-95"
            title="Rede Apucarana"
          >
            <img
              src="/logo-rede-apucarana.png"
              alt="Rede Apucarana"
              className="w-13 h-13 sm:w-14 sm:h-14 object-contain drop-shadow-md rounded-2xl"
            />
          </Link>

          <div className="flex flex-col">
            <span className="text-white text-base sm:text-lg font-light tracking-[0.22em] leading-none uppercase">
              REDE
            </span>
            <span className="text-white text-2xl sm:text-3xl font-black tracking-tight leading-none uppercase mt-0.5 font-heading">
              APUCARANA
            </span>
            <span className="text-slate-300 text-[11px] font-medium text-right leading-none mt-1 mr-0.5 tracking-wide">
              Vale do Ivaí
            </span>
          </div>
        </div>

        {/* Lado Direito: Ícone de engrenagem apontando para /admin */}
        <Link
          href="/admin"
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors active:scale-90"
          title="Administração e Configurações"
          aria-label="Administração"
        >
          <Settings className="w-7 h-7 stroke-[1.8]" />
        </Link>
      </header>

      {/* ========================================================================= */}
      {/* 2. QUADRO BRANCO CENTRAL (CONTAINER DOS 6 BOTÕES GIGANTES)                */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col justify-center px-4 py-2 max-w-md mx-auto w-full">
        <div className="bg-white rounded-3xl p-4 shadow-2xl flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-3.5">
            {SUPER_APP_BUTTONS.map((btn) => (
              <Link
                key={btn.id}
                href={btn.href}
                className="group relative block w-full aspect-square rounded-2xl overflow-hidden shadow-md hover:scale-[1.02] active:scale-95 transition-transform duration-200 cursor-pointer select-none bg-slate-100"
                title={btn.title}
              >
                <img
                  src={btn.imageSrc}
                  alt={btn.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="eager"
                  onError={(e) => {
                    // Fallback para caso o arquivo esteja com extensão .png.jpeg
                    const target = e.currentTarget;
                    if (!target.src.endsWith(".png.jpeg")) {
                      target.src = `${btn.imageSrc}.jpeg`;
                    }
                  }}
                />
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. RODAPÉ (PLAYER FUNCIONAL DA RÁDIO APUCARANA FM)                        */}
      {/* ========================================================================= */}
      <footer className="px-6 pt-2 pb-8 max-w-md mx-auto w-full flex items-center justify-between gap-4">
        {/* Lado Esquerdo: Título, Tag de Status e Botão Play/Pause Branco */}
        <div className="flex flex-col items-start gap-1.5">
          <h3 className="font-heading font-black text-sm tracking-wider text-white uppercase leading-none">
            RÁDIO APUCARANA FM
          </h3>

          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isPlaying
                  ? "bg-red-600/90 text-white animate-pulse"
                  : "bg-blue-900/60 text-sky-200 border border-sky-400/30"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPlaying ? "bg-white" : "bg-sky-400"
                }`}
              />
              <span>{isPlaying ? "NO AR • AO VIVO" : "AO VIVO"}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={toggleRadio}
            className="bg-white text-[#0b2249] font-black text-sm px-7 py-2 rounded-full flex items-center gap-2 shadow-xl hover:bg-slate-100 active:scale-95 transition-all cursor-pointer mt-0.5"
            title={isPlaying ? "Pausar rádio" : "Ouvir rádio ao vivo"}
          >
            {isLoadingAudio ? (
              <span className="w-4 h-4 border-2 border-[#0b2249] border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-[#0b2249]" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-[#0b2249] translate-x-0.5" />
                <span>Play</span>
              </>
            )}
          </button>
        </div>

        {/* Lado Direito: Gráfico de Ondas Sonoras / Equalizador Azul Claro */}
        <div
          className="flex items-center gap-[3px] h-14 shrink-0 select-none pr-1"
          title={isPlaying ? "Rádio transmitindo áudio" : "Rádio pausada"}
          aria-hidden="true"
        >
          {EQUALIZER_BARS.map((h, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full bg-sky-400 transition-all duration-300 ${
                isPlaying ? "animate-pulse" : "opacity-85"
              }`}
              style={{
                height: isPlaying
                  ? `${Math.max(6, h * (0.55 + ((i % 4) * 0.15)))}px`
                  : `${h}px`,
                animationDuration: `${0.35 + (i % 5) * 0.12}s`,
                animationDelay: `${(i % 4) * 0.08}s`,
              }}
            />
          ))}
        </div>

        {/* Elemento de áudio nativo da Rádio */}
        <audio ref={audioRef} src={RADIO_STREAM_URL} preload="none" />
      </footer>
    </div>
  );
}
