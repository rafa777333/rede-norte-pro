"use client";

import React, { useRef } from "react";

export interface VideoItem {
  id: string;
  titulo: string;
  descricao: string;
  cidade: string;
  categoria: string;
  videoUrl: string;
  thumbnailUrl: string;
  instagramUrl: string;
  materiaUrl?: string;
  tipo: "upload" | "instagram";
  publishedAt?: string;
}

interface DarkMediaStripProps {
  videos: VideoItem[];
  cidade?: string;
  onSelectVideo?: (video: VideoItem) => void;
}

const DEFAULT_VIDEOS: VideoItem[] = [
  {
    id: "default-1",
    titulo: "Cortes & Entrevistas: Bastidores da Política Regional",
    descricao: "Debates e os principais acontecimentos de Apucarana e cidades vizinhas.",
    cidade: "Apucarana",
    categoria: "Política",
    videoUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80",
    instagramUrl: "",
    tipo: "upload",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "default-2",
    titulo: "Reportagem Especial: Obras e Infraestrutura no Vale do Ivaí",
    descricao: "Acompanhe as melhorias e novos investimentos no Paraná.",
    cidade: "Vale do Ivaí",
    categoria: "Cidade",
    videoUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=600&auto=format&fit=crop&q=80",
    instagramUrl: "",
    tipo: "upload",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "default-3",
    titulo: "Esportes em Ação: Melhores Lances da Rodada",
    descricao: "Gols, placares e as jogadas decisivas dos times paranaenses.",
    cidade: "Arapongas",
    categoria: "Esportes",
    videoUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80",
    instagramUrl: "",
    tipo: "upload",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "default-4",
    titulo: "Comunidade Viva: Eventos e Feiras Culturais",
    descricao: "A tradição e a força da gente de Apucarana e região.",
    cidade: "Apucarana",
    categoria: "Geral",
    videoUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
    instagramUrl: "",
    tipo: "upload",
    publishedAt: new Date().toISOString(),
  },
];

export default function DarkMediaStrip({
  videos,
  cidade = "Geral",
  onSelectVideo,
}: DarkMediaStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayList = videos && videos.length > 0 ? videos : DEFAULT_VIDEOS;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <section
      className="bg-slate-900 text-white py-10 sm:py-12 my-10 rounded-3xl px-5 sm:px-8 relative overflow-hidden shadow-2xl border border-slate-800"
      aria-label="Faixa de Vídeos e Cortes da Rede Apucarana"
    >
      {/* Background radial glow */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Cabeçalho da Faixa */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Cortes & Reels
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Formato Vertical 9:16
            </span>
          </div>

          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-white leading-tight">
            Vídeos, Cortes e Entrevistas
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Assista aos destaques da nossa redação e cortes dinâmicos do Vale do Ivaí sem sair da página.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/tv-online"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Assistir TV Online →
          </a>

          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
              aria-label="Rolar para a esquerda"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
              aria-label="Rolar para a direita"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Carrossel Horizontal de Vídeos Verticais (9:16) */}
      <div
        ref={scrollRef}
        className="relative z-10 flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {displayList.map((v) => {
          const thumb =
            v.thumbnailUrl ||
            "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80";

          return (
            <a
              key={v.id}
              href={`/videos/${v.id}`}
              className="group relative w-52 sm:w-60 shrink-0 aspect-[9/16] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg snap-start block text-decoration-none focus:outline-none cursor-pointer transform hover:-translate-y-1.5 transition-all duration-300"
            >
              {/* Imagem de Fundo / Thumbnail */}
              <img
                src={thumb}
                alt={v.titulo}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />

              {/* Degradê escuro para legibilidade */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

              {/* Tag Superior */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 uppercase tracking-wider">
                  {v.categoria || "Vídeo"}
                </span>
                <span className="text-[10px] text-slate-300 font-medium px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md">
                  {v.cidade}
                </span>
              </div>

              {/* Botão de Play Centralizado */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-12 h-12 rounded-full bg-red-600/90 group-hover:bg-red-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300 backdrop-blur-xs">
                  <svg
                    className="w-6 h-6 fill-current translate-x-0.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* Informações na Base do Card */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <h3 className="font-heading font-bold text-white text-sm sm:text-base leading-snug line-clamp-3 group-hover:text-red-300 transition-colors">
                  {v.titulo}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-2">
                  <span>▶ Assistir corte</span>
                  <span>·</span>
                  <span className="text-slate-500">
                    {v.publishedAt
                      ? new Date(v.publishedAt).toLocaleDateString("pt-BR")
                      : "Hoje"}
                  </span>
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
