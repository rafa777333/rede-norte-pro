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

// 25 barras de altura exatas extraídas da referência visual da imagem
const EQUALIZER_BARS = [
  7, 13, 23, 41, 63, 41, 23, 13, 34, 11, 32, 68, 37, 21, 9, 23, 47, 34, 13, 15,
  40, 61, 37, 19, 9,
];

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
    // CONTAINER GERAL: Fundo Azul Marinho idêntico à referência (#152b52), tela cheia no Mobile
    <div className="w-full min-h-screen bg-[#152b52] flex flex-col justify-between p-4 sm:p-5 selection:bg-red-500 selection:text-white font-sans antialiased overflow-x-hidden">
      <div className="w-full max-w-sm sm:max-w-md mx-auto flex-1 flex flex-col justify-between">
        {/* ========================================================================= */}
        {/* 1. CABEÇALHO HORIZONTAL (Logo RA + Tipografia à esquerda, Engrenagem à direita) */}
        {/* ========================================================================= */}
        <header className="w-full flex items-center justify-between pt-1 pb-2 px-1 select-none">
          {/* Lado Esquerdo: Ícone RA + "REDE APUCARANA / Vale do Ivaí" */}
          <Link
            href="/"
            className="flex items-center gap-3 group active:scale-95 transition-transform"
            title="Rede Apucarana • Início"
          >
            <img
              src="/logo-rede-apucarana.png"
              alt="Logo Rede Apucarana"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0 drop-shadow-md rounded-xl"
              loading="eager"
            />
            <div className="flex flex-col justify-center text-left">
              <span className="text-white text-xs sm:text-sm font-light tracking-[0.24em] uppercase leading-none">
                REDE
              </span>
              <span className="text-white text-xl sm:text-2xl font-black tracking-tight uppercase leading-none font-heading mt-1">
                APUCARANA
              </span>
              <span className="text-sky-300 text-[10px] sm:text-[11px] font-medium tracking-wider uppercase text-right leading-none mt-1">
                Vale do Ivaí
              </span>
            </div>
          </Link>

          {/* Lado Direito: Engrenagem de Configurações / Painel Admin */}
          <Link
            href="/admin"
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/85 hover:text-white active:scale-95 transition-all"
            title="Administração e Configurações"
            aria-label="Administração"
          >
            <Settings className="w-6 h-6" strokeWidth={1.8} />
          </Link>
        </header>

        {/* ========================================================================= */}
        {/* 2. QUADRO BRANCO CENTRAL (Com os 6 Botões 3D no Grid 2x3)                 */}
        {/* ========================================================================= */}
        <main className="w-full my-auto py-2">
          <div className="bg-white rounded-[2.25rem] sm:rounded-[2.5rem] p-3.5 sm:p-4 shadow-2xl shadow-black/25">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {SUPER_APP_BUTTONS.map((btn) => (
                <Link
                  key={btn.id}
                  href={btn.href}
                  className="group relative block w-full aspect-square rounded-2xl overflow-hidden shadow-md active:scale-95 hover:scale-[1.02] transition-transform duration-200 cursor-pointer select-none bg-slate-100"
                  title={btn.title}
                >
                  <img
                    src={btn.imageSrc}
                    alt={btn.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="eager"
                    onError={(e) => {
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
        {/* 3. RODAPÉ (Player de Rádio com Título, Botão Play e Equalizador Visual)   */}
        {/* ========================================================================= */}
        <footer className="w-full pt-2 pb-2 px-1 flex items-center justify-between gap-3 select-none">
          {/* Lado Esquerdo: Título da Rádio e Botão Play/Pause Branco */}
          <div className="flex flex-col items-start gap-2">
            <h3 className="font-heading font-black text-xs sm:text-sm tracking-wider text-white uppercase leading-none">
              RÁDIO APUCARANA FM
            </h3>

            <button
              type="button"
              onClick={toggleRadio}
              className="bg-white text-[#152b52] font-black text-xs sm:text-sm px-6 py-2.5 rounded-full flex items-center gap-2 shadow-xl hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? "Pausar rádio" : "Ouvir rádio ao vivo"}
            >
              {isLoadingAudio ? (
                <span className="w-4 h-4 border-2 border-[#152b52] border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-[#152b52]" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-[#152b52] translate-x-0.5" />
                  <span>Play</span>
                </>
              )}
            </button>
          </div>

          {/* Lado Direito: Gráfico de Ondas Sonoras / Equalizador em tom #6a98ca */}
          <div
            className="flex items-center gap-[2px] sm:gap-[2.5px] h-16 shrink-0 select-none pr-1"
            title={isPlaying ? "Rádio transmitindo áudio" : "Rádio pausada"}
            aria-hidden="true"
          >
            {EQUALIZER_BARS.map((h, i) => (
              <span
                key={i}
                className={`w-[2.5px] sm:w-[3px] rounded-full bg-[#6a98ca] transition-all duration-300 ${
                  isPlaying ? "animate-pulse" : "opacity-85"
                }`}
                style={{
                  height: isPlaying
                    ? `${Math.max(6, Math.round((h * 0.72) * (0.6 + ((i % 5) * 0.12))))}px`
                    : `${Math.round(h * 0.72)}px`,
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
    </div>
  );
}
