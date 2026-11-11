"use client";

import React, { useEffect, useRef, useState } from "react";
import { getSupabase } from "../lib/supabase";
import LiveTvPlayer from "./LiveTvPlayer";

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
  return "/banner-rede-apucarana.png";
}

const DEFAULT_VIDEOS: VideoPortalItem[] = [
  {
    id: "default-1",
    titulo: "Cortes & Entrevistas: Bastidores da Política Regional",
    url_video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    plataforma: "youtube",
    thumbnail_url: "/banner-rede-apucarana.png",
    status: "publicado",
    created_at: new Date().toISOString(),
  },
  {
    id: "default-2",
    titulo: "Reportagem Especial: Obras e Infraestrutura no Vale do Ivaí",
    url_video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    plataforma: "youtube",
    thumbnail_url: "/banner-rede-apucarana.png",
    status: "publicado",
    created_at: new Date().toISOString(),
  },
  {
    id: "default-3",
    titulo: "Esportes em Ação: Melhores Lances da Rodada",
    url_video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    plataforma: "youtube",
    thumbnail_url: "/banner-rede-apucarana.png",
    status: "publicado",
    created_at: new Date().toISOString(),
  },
  {
    id: "default-4",
    titulo: "Comunidade Viva: Eventos e Feiras Culturais",
    url_video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    plataforma: "youtube",
    thumbnail_url: "/banner-rede-apucarana.png",
    status: "publicado",
    created_at: new Date().toISOString(),
  },
];

export default function DarkMediaStrip({ videos, cidade = "Geral" }: DarkMediaStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dbVideos, setDbVideos] = useState<VideoPortalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoPortalItem | null>(null);
  const [isLiveTvOpen, setIsLiveTvOpen] = useState(false);

  useEffect(() => {
    let cancel = false;
    const fetchPortalVideos = async () => {
      try {
        setLoading(true);
        // Primeiro tenta buscar da API do hub (que aplica a regra show_on_home)
        const res = await fetch("/api/videos?home=true", { cache: "no-store" });
        const json = await res.json();
        if (!cancel && json.success && Array.isArray(json.videos) && json.videos.length > 0) {
          const mapped: VideoPortalItem[] = json.videos.map((v: any) => ({
            id: String(v.id),
            titulo: v.title || v.titulo || "Vídeo",
            url_video: v.video_url || v.youtube_url || "",
            plataforma: v.video_type === "mp4" ? "nativo" : (v.video_type || "youtube"),
            thumbnail_url: v.thumbnail_url || "",
            status: "publicado",
            created_at: v.created_at || new Date().toISOString(),
          }));
          setDbVideos(mapped);
          return;
        }

        // Fallback para Supabase direto
        const supabase = getSupabase();
        if (!supabase) return;
        const { data, error } = await supabase
          .from("videos_portal")
          .select("*")
          .eq("status", "publicado")
          .order("created_at", { ascending: false });

        if (!cancel && !error && data && data.length > 0) {
          setDbVideos(data as VideoPortalItem[]);
        }
      } catch (err) {
        console.warn("DarkMediaStrip: erro ao carregar vídeos do portal", err);
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
      if (e.key === "Escape") {
        setActiveVideo(null);
        setIsLiveTvOpen(false);
      }
    };
    if (activeVideo || isLiveTvOpen) {
      window.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [activeVideo, isLiveTvOpen]);

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

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsLiveTvOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              title="Assistir TV Rede Apucarana Ao Vivo"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>Assistir TV Ao Vivo ▶</span>
            </button>

            <a
              href="/tv-online"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              <span>Grade Completa →</span>
            </a>

            <div className="hidden sm:flex items-center gap-1 ml-1">
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
          {/* CARD DESTAQUE: TV REDE APUCARANA AO VIVO */}
          <button
            type="button"
            onClick={() => setIsLiveTvOpen(true)}
            className="group relative w-56 sm:w-64 shrink-0 aspect-[9/16] rounded-2xl overflow-hidden bg-gradient-to-b from-red-950/80 via-slate-950 to-black border-2 border-red-600/80 shadow-2xl snap-start text-left focus:outline-none cursor-pointer transform hover:-translate-y-1.5 transition-all duration-300 p-0"
            title="Sintonizar TV Rede Apucarana Ao Vivo em HD"
          >
            {/* Imagem de Fundo de Estúdio / Broadcast */}
            <img
              src="/banner-rede-apucarana.png"
              alt="TV Rede Apucarana Ao Vivo"
              className="w-full h-full object-cover object-center opacity-65 group-hover:scale-105 group-hover:opacity-85 transition-all duration-500 ease-out"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-950/60 to-red-950/40" />

            {/* Header do Card */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                AO VIVO
              </span>
              <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 backdrop-blur-md">
                HD 1080p
              </span>
            </div>

            {/* Botão de Play Central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
              <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-all duration-300 ring-4 ring-red-500/30">
                <svg className="w-7 h-7 fill-current translate-x-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-xs font-black text-white mt-3 uppercase tracking-wider drop-shadow-md">
                Assistir Transmissão
              </span>
            </div>

            {/* Base do Card */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10 bg-gradient-to-t from-black via-black/80 to-transparent">
              <h3 className="font-heading font-black text-white text-base leading-snug drop-shadow-md">
                TV Rede Apucarana
              </h3>
              <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                Sinal oficial 24h: notícias, RedeCast e cobertura das 27 cidades.
              </p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10 text-[10px] text-red-400 font-bold">
                <span>🔴 No Ar 24h</span>
                <span>·</span>
                <span>Toque para assistir</span>
              </div>
            </div>
          </button>
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
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10 bg-gradient-to-t from-black via-black/90 to-transparent">
                  <h3 className="font-heading font-bold text-white text-sm sm:text-base leading-snug line-clamp-3 group-hover:text-red-300 transition-colors">
                    {v.titulo}
                  </h3>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <span>▶ Assistir corte</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const shareUrl = `https://www.redeapucarana.com.br/tv-online?v=${encodeURIComponent(v.id)}`;
                        const text = encodeURIComponent(`🎬 Assista agora na *Rede Apucarana*: *${v.titulo}* 👉 ${shareUrl}`);
                        window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
                      }}
                      className="p-1 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white shadow transition-transform hover:scale-110 active:scale-95"
                      title="Compartilhar no WhatsApp"
                    >
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.898-.788-3.118-2.73-3.212-2.857-.095-.128-.772-1.026-.772-1.956s.487-1.386.66-1.574c.174-.189.38-.236.507-.236.126 0 .253.001.364.007.118.006.277-.045.433.329.162.388.555 1.353.604 1.452.049.1.082.216.016.347-.066.13-.099.213-.198.327-.099.115-.208.257-.297.345-.1.098-.204.205-.088.404.116.199.516.852 1.108 1.38.764.681 1.408.892 1.609.992.201.1.32.083.438-.052.119-.136.508-.592.644-.795.136-.204.272-.17.458-.101.187.068 1.183.558 1.387.66.204.102.34.152.39.238.051.085.051.493-.093.898z" />
                      </svg>
                    </button>
                  </div>
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
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <a
                href={`/tv-online?v=${activeVideo.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-all shadow-md active:scale-95"
              >
                <span>▶</span> Assistir no Hub da TV
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const shareUrl = `https://www.redeapucarana.com.br/tv-online?v=${encodeURIComponent(activeVideo.id)}`;
                    const text = encodeURIComponent(`🎬 Assista agora na *Rede Apucarana*: *${activeVideo.titulo}* 👉 ${shareUrl}`);
                    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  title="Compartilhar no WhatsApp"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.898-.788-3.118-2.73-3.212-2.857-.095-.128-.772-1.026-.772-1.956s.487-1.386.66-1.574c.174-.189.38-.236.507-.236.126 0 .253.001.364.007.118.006.277-.045.433.329.162.388.555 1.353.604 1.452.049.1.082.216.016.347-.066.13-.099.213-.198.327-.099.115-.208.257-.297.345-.1.098-.204.205-.088.404.116.199.516.852 1.108 1.38.764.681 1.408.892 1.609.992.201.1.32.083.438-.052.119-.136.508-.592.644-.795.136-.204.272-.17.458-.101.187.068 1.183.558 1.387.66.204.102.34.152.39.238.051.085.051.493-.093.898z" />
                  </svg>
                  <span>Zap</span>
                </button>

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
        </div>
      )}

      {/* MODAL AO VIVO DA TV APUCARANA */}
      {isLiveTvOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsLiveTvOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    TV Rede Apucarana • Ao Vivo HD
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Conectando todo o Vale do Ivaí em alta definição 1080p
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/tv-online"
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 transition-colors"
                >
                  <span>Grade Completa</span>
                  <span>↗</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsLiveTvOpen(false)}
                  className="w-9 h-9 shrink-0 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Player de TV HLS com Aspect-Video e Object-Cover */}
            <div className="p-3 sm:p-5 bg-black">
              <LiveTvPlayer
                streamUrl="https://Stmv1.samcast.com.br/tvapucarana/tvapucarana/playlist.m3u8"
                showTheaterButton={false}
              />
            </div>

            {/* Rodapé do Modal */}
            <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Transmissão Oficial Estável 1080p</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/tv-online"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors"
                >
                  Assistir na Página da Emissora →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
