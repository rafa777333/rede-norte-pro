"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../lib/supabase";
import {
  type VideoPortalItem,
  getVideoThumbnail,
  getYoutubeId,
  getInstagramCode,
  getInstagramEmbedUrl,
  getTikTokId,
} from "./DarkMediaStrip";

interface VideosHubPageProps {
  videos?: VideoPortalItem[];
  cidade?: string;
}

export default function VideosHubPage({
  videos = [],
  cidade = "Geral",
}: VideosHubPageProps) {
  const [dbVideos, setDbVideos] = useState<VideoPortalItem[]>(videos);
  const [loading, setLoading] = useState(false);
  const [activePlatform, setActivePlatform] = useState<string>("todas");
  const [search, setSearch] = useState("");
  const [activeVideo, setActiveVideo] = useState<VideoPortalItem | null>(null);

  // Sincroniza se a prop videos for atualizada pelo componente pai
  useEffect(() => {
    if (videos && videos.length > 0) {
      setDbVideos(videos);
    }
  }, [videos]);

  // Carrega vídeos atualizados da tabela public.videos_portal
  useEffect(() => {
    let cancel = false;
    const carregar = async () => {
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
      } catch (e) {
        console.warn("Erro ao buscar vídeos_portal:", e);
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    void carregar();
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

  // Lista combinada (prioriza dados do Supabase)
  const allList: VideoPortalItem[] = useMemo(() => {
    if (dbVideos.length > 0) return dbVideos;
    if (videos.length > 0) return videos;
    return [];
  }, [dbVideos, videos]);

  // Filtragem por plataforma e busca
  const filteredList = useMemo(() => {
    return allList.filter((v) => {
      const matchPlataforma =
        activePlatform === "todas" ||
        v.plataforma?.toLowerCase() === activePlatform.toLowerCase();
      const matchBusca =
        !search.trim() ||
        v.titulo.toLowerCase().includes(search.toLowerCase());
      return matchPlataforma && matchBusca;
    });
  }, [allList, activePlatform, search]);

  const getPlatformBadge = (plat: string) => {
    switch (plat?.toLowerCase()) {
      case "youtube":
        return { label: "YouTube Shorts", color: "bg-red-600 text-white" };
      case "instagram":
        return {
          label: "Instagram Reels",
          color: "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
        };
      case "tiktok":
        return {
          label: "TikTok",
          color: "bg-black text-cyan-400 border border-cyan-500/40",
        };
      case "nativo":
        return { label: "Vídeo Rede Norte", color: "bg-blue-600 text-white" };
      default:
        return { label: plat || "Vídeo", color: "bg-slate-800 text-slate-200" };
    }
  };

  return (
    <div className="container py-6 sm:py-10 animate-in fade-in duration-300">
      <section
        className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800 relative overflow-hidden"
        aria-label="Central de Vídeos e Cortes"
      >
        {/* Glows de Fundo Atmosféricos */}
        <div
          className="absolute -top-16 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Topo / Header da Seção */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                CORTES & VÍDEOS DIGITAIS
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                Padrão Vertical 9:16
              </span>
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl lg:text-5xl tracking-tight text-white leading-tight">
              Vídeos, Cortes e Entrevistas
              {cidade !== "Geral" && (
                <span className="text-red-500"> em {cidade}</span>
              )}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Assista aos destaques da redação, vídeos virais e reportagens exclusivas de Apucarana e todo o Vale do Ivaí em formato dinâmico.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/tv-online"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-red-600/30 transition-all transform hover:scale-105"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Assistir TV Online ao Vivo ▶
            </a>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="relative z-10 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80">
          {/* Filtros por Plataforma */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {[
              { id: "todas", label: "Todos", count: allList.length },
              {
                id: "youtube",
                label: "YouTube Shorts",
                count: allList.filter((v) => v.plataforma?.toLowerCase() === "youtube").length,
              },
              {
                id: "instagram",
                label: "Instagram Reels",
                count: allList.filter((v) => v.plataforma?.toLowerCase() === "instagram").length,
              },
              {
                id: "tiktok",
                label: "TikTok",
                count: allList.filter((v) => v.plataforma?.toLowerCase() === "tiktok").length,
              },
              {
                id: "nativo",
                label: "Vídeos Próprios",
                count: allList.filter((v) => v.plataforma?.toLowerCase() === "nativo").length,
              },
            ].map((p) => {
              const active = activePlatform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePlatform(p.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "bg-slate-800/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
                  }`}
                >
                  <span>{p.label}</span>
                  {p.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {p.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar vídeos por título..."
              className="w-full bg-slate-950/80 text-white placeholder-slate-500 text-xs sm:text-sm rounded-xl px-4 py-2 border border-slate-700/80 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Grid de Vídeos Verticais 9:16 (Padrão Faixa Multimídia) */}
        <div className="relative z-10 pt-8">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                🎬
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Nenhum vídeo encontrado
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {search
                  ? `Nenhum resultado corresponde à busca "${search}".`
                  : "Novos cortes e vídeos serão adicionados pela equipe da redação em breve."}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {filteredList.map((v) => {
                const thumb = getVideoThumbnail(v);
                const badge = getPlatformBadge(v.plataforma);

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveVideo(v)}
                    className="group relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl text-left focus:outline-none cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 p-0"
                  >
                    {/* Imagem de Capa / Thumbnail */}
                    <img
                      src={thumb}
                      alt={v.titulo}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />

                    {/* Gradiente escuro para legibilidade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                    {/* Tag Superior da Plataforma */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-slate-300 font-medium px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md">
                        HD
                      </span>
                    </div>

                    {/* Botão de Play Centralizado com Glow */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-12 h-12 rounded-full bg-red-600/90 group-hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transform group-hover:scale-115 transition-all duration-300 backdrop-blur-xs">
                        <svg
                          className="w-6 h-6 fill-current translate-x-0.5"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>

                    {/* Informações na Base do Card */}
                    <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4 z-10">
                      <h3 className="font-heading font-bold text-white text-xs sm:text-sm leading-snug line-clamp-3 group-hover:text-red-300 transition-colors">
                        {v.titulo}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-medium mt-2">
                        <span>▶ Assistir corte</span>
                        <span>•</span>
                        <span className="text-slate-500">
                          {v.created_at
                            ? new Date(v.created_at).toLocaleDateString("pt-BR")
                            : "Recente"}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* MODAL INTERATIVO DE REPRODUÇÃO (Exatamente igual ao DarkMediaStrip) */}
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
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1 ${
                    getPlatformBadge(activeVideo.plataforma).color
                  }`}
                >
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
              {/* Player do YouTube Shorts */}
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
                    <a
                      href={activeVideo.url_video}
                      target="_blank"
                      rel="noreferrer"
                      className="text-red-400 underline text-sm mt-2 inline-block"
                    >
                      Abrir link original ➔
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
                      <span>Bloqueio de áudio ou restrição Meta?</span>
                      <a
                        href={activeVideo.url_video}
                        target="_blank"
                        rel="noreferrer"
                        className="text-pink-400 hover:text-pink-300 font-bold underline"
                      >
                        Abrir no Instagram ➔
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    <p>Post do Instagram.</p>
                    <a
                      href={activeVideo.url_video}
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-400 underline text-sm mt-2 inline-block"
                    >
                      Assistir no Instagram ➔
                    </a>
                  </div>
                );
              })()}

              {/* Player do TikTok */}
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
                        Abrir no App ➔
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-300 flex flex-col items-center justify-center h-full">
                    <div className="w-14 h-14 rounded-full bg-black border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-xl mb-3 font-bold">
                      ♪
                    </div>
                    <strong className="text-white text-base mb-1">
                      Vídeo no TikTok
                    </strong>
                    <p className="text-xs text-slate-400 mb-4 max-w-xs">
                      Assista a este corte diretamente no perfil oficial da Rede Apucarana no TikTok.
                    </p>
                    <a
                      href={activeVideo.url_video}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105"
                    >
                      Abrir no TikTok ➔
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
                  className="w-full h-full object-contain bg-black"
                />
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400 truncate">
                Rede Apucarana de Comunicação
              </span>
              <a
                href={activeVideo.url_video}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors shrink-0"
              >
                Abrir link externo ➔
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
