"use client";

import React, { useEffect, useRef, useState } from "react";
import { getSupabase } from "../lib/supabase";

export interface VideoPortalItem {
  id: string;
  titulo: string;
  url_video: string;
  plataforma: "youtube" | "tiktok" | "instagram" | "nativo" | string;
  thumbnail_url?: string;
  status?: "publicado" | "rascunho" | string;
  created_at?: string;
}

interface DarkMediaStripProps {
  videos?: VideoPortalItem[] | any[];
  cidade?: string;
}

export function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const matchShorts = url.match(/shorts\/([a-zA-Z0-9_-]+)/);
  if (matchShorts) return matchShorts[1];
  const matchWatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (matchWatch) return matchWatch[1];
  const matchShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (matchShort) return matchShort[1];
  const matchEmbed = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (matchEmbed) return matchEmbed[1];
  return null;
}

export function getInstagramCode(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/(reel|p|tv)\/([^/?#]+)/i);
  return match ? match[2] : null;
}

export function getInstagramEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/(reel|p|tv)\/([^/?#]+)/i);
  if (!match) return null;
  const type = match[1].toLowerCase();
  const code = match[2];
  return `https://www.instagram.com/${type}/${code}/embed/`;
}

export function getTikTokId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/video\/(\d+)/i) || url.match(/\/v\/(\d+)/i);
  return match ? match[1] : null;
}

export function getVideoThumbnail(video: { url_video?: string; videoUrl?: string; plataforma?: string; thumbnail_url?: string; thumbnailUrl?: string }): string {
  const thumb = (video.thumbnail_url || video.thumbnailUrl || "").trim();
  const isPostUrl = thumb.includes("instagram.com/") || thumb.includes("facebook.com/") || thumb.includes("tiktok.com/") || thumb.includes("youtube.com/");
  if (thumb && !isPostUrl) {
    return thumb;
  }
  const url = video.url_video || video.videoUrl || "";
  const ytId = getYoutubeId(url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80";
}

const DEFAULT_VIDEOS: VideoPortalItem[] = [
  {
    id: "default-1",
    titulo: "Cortes & Entrevistas: Bastidores da Política Regional",
    url_video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    plataforma: "youtube",
    thumbnail_url: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80",
    status: "publicado",
    created_at: new Date().toISOString(),
  },
  {
    id: "default-2",
    titulo: "Reportagem Especial: Obras e Infraestrutura no Vale do Ivaí",
    url_video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    plataforma: "youtube",
    thumbnail_url: "https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=600&auto=format&fit=crop&q=80",
    status: "publicado",
    created_at: new Date().toISOString(),
  },
  {
    id: "default-3",
    titulo: "Esportes em Ação: Melhores Lances da Rodada",
    url_video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    plataforma: "youtube",
    thumbnail_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80",
    status: "publicado",
    created_at: new Date().toISOString(),
  },
  {
    id: "default-4",
    titulo: "Comunidade Viva: Eventos e Feiras Culturais",
    url_video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    plataforma: "youtube",
    thumbnail_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
    status: "publicado",
    created_at: new Date().toISOString(),
  },
];

export default function DarkMediaStrip({ videos, cidade = "Geral" }: DarkMediaStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dbVideos, setDbVideos] = useState<VideoPortalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoPortalItem | null>(null);

  useEffect(() => {
    let cancel = false;
    const fetchPortalVideos = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase
          .from("videos_portal")
          .select("*")
          .eq("status", "publicado")
          .order("created_at", { ascending: false });

        if (!cancel && !error && data && data.length > 0) {
          setDbVideos(data as VideoPortalItem[]);
        }
      } catch (err) {
        console.warn("DarkMediaStrip: erro ao carregar videos_portal do Supabase", err);
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    void fetchPortalVideos();
    return () => {
      cancel = true;
    };
  }, []);

  // Fechar modal no ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveVideo(null);
    };
    if (activeVideo) {
      window.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [activeVideo]);

  // Lista a exibir: Supabase dbVideos > props.videos > DEFAULT_VIDEOS
  const displayList: VideoPortalItem[] =
    dbVideos.length > 0
      ? dbVideos
      : videos && videos.length > 0
      ? videos.map((v: any) => ({
          id: String(v.id),
          titulo: v.titulo || "Vídeo",
          url_video: v.url_video || v.videoUrl || "",
          plataforma: v.plataforma || (v.tipo === "instagram" ? "instagram" : "youtube"),
          thumbnail_url: v.thumbnail_url || v.thumbnailUrl || "",
          status: v.status || "publicado",
          created_at: v.created_at || v.publishedAt || new Date().toISOString(),
        }))
      : DEFAULT_VIDEOS;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  const getPlatformBadge = (plat: string) => {
    switch (plat?.toLowerCase()) {
      case "youtube":
        return { label: "YouTube Shorts", color: "bg-red-600 text-white" };
      case "instagram":
        return { label: "Instagram Reels", color: "bg-gradient-to-r from-purple-600 to-pink-600 text-white" };
      case "tiktok":
        return { label: "TikTok", color: "bg-black text-cyan-400 border border-cyan-500/40" };
      case "nativo":
        return { label: "Vídeo Rede Norte", color: "bg-blue-600 text-white" };
      default:
        return { label: plat || "Vídeo", color: "bg-slate-800 text-slate-200" };
    }
  };

  return (
    <>
      <section
        className="bg-slate-900 text-white py-10 sm:py-12 my-10 rounded-3xl px-5 sm:px-8 relative overflow-hidden shadow-2xl border border-slate-800"
        aria-label="Faixa de Vídeos e Cortes da Rede Apucarana"
      >
        {/* Glow de fundo */}
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

        {/* Carrossel Horizontal de Vídeos */}
        <div
          ref={scrollRef}
          className="relative z-10 flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {displayList.map((v) => {
            const thumb = getVideoThumbnail(v);
            const badge = getPlatformBadge(v.plataforma);

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setActiveVideo(v)}
                className="group relative w-52 sm:w-60 shrink-0 aspect-[9/16] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg snap-start text-left focus:outline-none cursor-pointer transform hover:-translate-y-1.5 transition-all duration-300 p-0"
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

                {/* Tag Superior da Plataforma */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-slate-300 font-medium px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md">
                    HD
                  </span>
                </div>

                {/* Botão de Play Centralizado */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-12 h-12 rounded-full bg-red-600/90 group-hover:bg-red-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300 backdrop-blur-xs">
                    <svg className="w-6 h-6 fill-current translate-x-0.5" viewBox="0 0 24 24">
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
                      {v.created_at ? new Date(v.created_at).toLocaleDateString("pt-BR") : "Recente"}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* MODAL INTERATIVO DE REPRODUÇÃO */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setActiveVideo(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950">
              <div className="min-w-0">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1 ${getPlatformBadge(activeVideo.plataforma).color}`}>
                  {getPlatformBadge(activeVideo.plataforma).label}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {activeVideo.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="w-9 h-9 shrink-0 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Corpo do Player */}
            <div className="relative aspect-[9/16] max-h-[65vh] w-full bg-black flex items-center justify-center overflow-hidden">
              {/* Player do YouTube Shorts / Vídeo */}
              {activeVideo.plataforma === "youtube" && (() => {
                const ytId = getYoutubeId(activeVideo.url_video);
                return ytId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`}
                    className="w-full h-full border-0"
                    title={activeVideo.titulo}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    <p>URL do YouTube inválida.</p>
                    <a href={activeVideo.url_video} target="_blank" rel="noreferrer" className="text-red-400 underline text-sm mt-2 inline-block">
                      Abrir link original ↗
                    </a>
                  </div>
                );
              })()}

              {/* Player do Instagram Reel / Post */}
              {activeVideo.plataforma === "instagram" && (() => {
                const embedUrl = getInstagramEmbedUrl(activeVideo.url_video);
                return embedUrl ? (
                  <div className="relative w-full h-full flex flex-col">
                    <iframe
                      src={embedUrl}
                      className="w-full flex-1 border-0 bg-white"
                      title={activeVideo.titulo}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen
                    />
                    <div className="bg-slate-900 border-t border-slate-800 p-2 text-center text-[11px] text-slate-300 flex items-center justify-between px-3">
                      <span>Bloqueio de áudio ou DRM?</span>
                      <a
                        href={activeVideo.url_video}
                        target="_blank"
                        rel="noreferrer"
                        className="text-pink-400 hover:text-pink-300 font-bold underline"
                      >
                        Abrir no Instagram ↗
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    <p>Post do Instagram.</p>
                    <a href={activeVideo.url_video} target="_blank" rel="noreferrer" className="text-pink-400 underline text-sm mt-2 inline-block">
                      Assistir no Instagram ↗
                    </a>
                  </div>
                );
              })()}

              {/* Player Nativo MP4 */}
              {activeVideo.plataforma === "nativo" && (
                <video
                  src={activeVideo.url_video}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}

              {/* Player TikTok */}
              {activeVideo.plataforma === "tiktok" && (() => {
                const tiktokId = getTikTokId(activeVideo.url_video);
                return tiktokId ? (
                  <div className="relative w-full h-full flex flex-col">
                    <iframe
                      src={`https://www.tiktok.com/player/v1/${tiktokId}?autoplay=1`}
                      className="w-full flex-1 border-0 bg-black"
                      title={activeVideo.titulo}
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    <div className="bg-slate-900 border-t border-slate-800 p-2 text-center text-[11px] text-slate-300 flex items-center justify-between px-3">
                      <span>Vídeo oficial TikTok</span>
                      <a
                        href={activeVideo.url_video}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 font-bold underline"
                      >
                        Abrir no App ↗
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-300">
                    <div className="w-16 h-16 rounded-2xl bg-black border border-cyan-500/50 mx-auto flex items-center justify-center mb-4 text-2xl shadow-lg">
                      🎵
                    </div>
                    <strong className="block text-white text-base mb-2">Vídeo do TikTok</strong>
                    <p className="text-xs text-slate-400 mb-4">Clique abaixo para assistir ao corte no aplicativo ou navegador:</p>
                    <a
                      href={activeVideo.url_video}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm transition-colors"
                    >
                      Abrir no TikTok ↗
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <a
                href={activeVideo.url_video}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>↗</span> Abrir no aplicativo/site oficial
              </a>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
