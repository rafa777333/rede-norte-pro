"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Tv,
  Radio,
  Share2,
  MessageCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Play,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Building2,
  Film,
  ExternalLink,
  Volume2,
  ArrowLeft,
  Layers,
  Flame,
  Mic,
  Video as VideoIcon,
  Smartphone,
} from "lucide-react";
import LiveTvPlayer from "./LiveTvPlayer";
import {
  PortalVideoItem,
  ChannelSource,
  VideoCategory,
  MOCK_PORTAL_VIDEOS,
  getYouTubeThumbnail,
} from "@/lib/tv-videos-data";

interface ProgramBlock {
  inicio: string;
  fim: string;
  titulo: string;
  subtitulo: string;
  categoria: string;
  destaque?: boolean;
}

const GRADE_PROGRAMACAO: ProgramBlock[] = [
  {
    inicio: "06:00",
    fim: "08:30",
    titulo: "Despertar do Vale & Agro",
    subtitulo: "Cotações agrícolas, previsão do tempo e primeiras notícias da manhã.",
    categoria: "Jornalismo",
  },
  {
    inicio: "08:30",
    fim: "11:30",
    titulo: "Giro de Notícias do Vale & Plantão",
    subtitulo: "Cobertura regional das 27 cidades, trânsito e utilidade pública.",
    categoria: "Notícias",
    destaque: true,
  },
  {
    inicio: "11:30",
    fim: "13:30",
    titulo: "Jornal da Tarde • Rede Apucarana",
    subtitulo: "O resumo completo dos principais acontecimentos do dia no Vale do Ivaí.",
    categoria: "Ao Vivo",
    destaque: true,
  },
  {
    inicio: "13:30",
    fim: "16:00",
    titulo: "Clipes, Sertanejo & Cultura Paranaense",
    subtitulo: "Os maiores sucessos da música, artistas locais e agenda cultural.",
    categoria: "Entretenimento",
  },
  {
    inicio: "16:00",
    fim: "18:00",
    titulo: "RedeCast • Entrevistas & Debates",
    subtitulo: "Grandes personalidades, líderes comunitários, política e empreendedorismo.",
    categoria: "Talk Show",
    destaque: true,
  },
  {
    inicio: "18:00",
    fim: "19:30",
    titulo: "Plantão Policial & Ronda da Noite",
    subtitulo: "Ocorrências policiais, segurança pública e informações em tempo real.",
    categoria: "Policial",
  },
  {
    inicio: "19:30",
    fim: "22:00",
    titulo: "Noite Viva & Especial Musical",
    subtitulo: "Séries especiais, documentários regionais e apresentações exclusivas.",
    categoria: "Variedades",
  },
  {
    inicio: "22:00",
    fim: "06:00",
    titulo: "Madrugada AutoVJ 24h • Melhores Momentos",
    subtitulo: "Programação contínua de clipes, reprises do RedeCast e giros noturnos.",
    categoria: "AutoVJ 24h",
  },
];

function TvOnlineHubContent() {
  const searchParams = useSearchParams();
  const videoParam = searchParams.get("v");

  const [playerMode, setPlayerMode] = useState<"live" | "vod">("live");
  const [currentVodVideo, setCurrentVodVideo] = useState<PortalVideoItem | null>(null);
  const [isTheater, setIsTheater] = useState(false);
  const [activeTabSidebar, setActiveTabSidebar] = useState<"redecast" | "tvapucarana" | "grade">("redecast");
  const [filtroCanalCatalogo, setFiltroCanalCatalogo] = useState<"todos" | "TV Apucarana" | "RedeCast">("todos");

  const [videos, setVideos] = useState<PortalVideoItem[]>(MOCK_PORTAL_VIDEOS);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [horaAtual, setHoraAtual] = useState("");
  const [programaNoAr, setProgramaNoAr] = useState<ProgramBlock>(GRADE_PROGRAMACAO[1]);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hasAppliedParam = useRef<string | null>(null);

  // Carrega vídeos da API
  useEffect(() => {
    let cancel = false;
    const fetchVideos = async () => {
      try {
        setLoadingVideos(true);
        const res = await fetch("/api/videos", { cache: "no-store" });
        const json = await res.json();
        if (!cancel && json.success && Array.isArray(json.videos) && json.videos.length > 0) {
          setVideos(json.videos);
        }
      } catch (err) {
        console.warn("Falha ao buscar vídeos do hub:", err);
      } finally {
        if (!cancel) setLoadingVideos(false);
      }
    };

    fetchVideos();
    return () => {
      cancel = true;
    };
  }, []);

  // Deep linking: se houver ?v={id} na URL, sintoniza direto o vídeo compartilhado
  useEffect(() => {
    if (!videoParam || hasAppliedParam.current === videoParam) return;

    const targetVideo = videos.find(
      (v) => String(v.id) === String(videoParam) || (v.youtube_id && v.youtube_id === videoParam)
    );

    if (targetVideo) {
      hasAppliedParam.current = videoParam;
      setCurrentVodVideo(targetVideo);
      setPlayerMode("vod");

      setTimeout(() => {
        if (playerContainerRef.current) {
          playerContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 350);
    }
  }, [videoParam, videos]);

  // Monitora horário e programa no ar
  useEffect(() => {
    const atualizarHorario = () => {
      const now = new Date();
      const horas = String(now.getHours()).padStart(2, "0");
      const minutos = String(now.getMinutes()).padStart(2, "0");
      const horaStr = `${horas}:${minutos}`;
      setHoraAtual(horaStr);

      const blocoAtual = GRADE_PROGRAMACAO.find((item) => {
        if (item.inicio <= item.fim) {
          return horaStr >= item.inicio && horaStr < item.fim;
        } else {
          return horaStr >= item.inicio || horaStr < item.fim;
        }
      });

      if (blocoAtual) {
        setProgramaNoAr(blocoAtual);
      }
    };

    atualizarHorario();
    const interval = setInterval(atualizarHorario, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Tocar vídeo On-Demand no player principal e atualizar a barra de endereço
  const handleSelectVod = (video: PortalVideoItem) => {
    setCurrentVodVideo(video);
    setPlayerMode("vod");

    // Atualiza a URL sem recarregar para facilitar cópia direta
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("v", video.id);
      window.history.replaceState({}, "", url.toString());
    }

    if (playerContainerRef.current) {
      playerContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Voltar para a TV ao vivo
  const handleReturnToLive = () => {
    setPlayerMode("live");
    setCurrentVodVideo(null);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("v");
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Filtragem dos vídeos da barra lateral (Aba 1: RedeCast, Aba 2: TV Apucarana)
  const sidebarRedeCast = useMemo(() => {
    return videos.filter((v) => v.channel_source === "RedeCast");
  }, [videos]);

  const sidebarTvApucarana = useMemo(() => {
    return videos.filter((v) => v.channel_source === "TV Apucarana");
  }, [videos]);

  // Fileira dedicada para Cortes & Reels 9:16
  const videosCortes916 = useMemo(() => {
    return videos.filter((v) => v.video_format === "9:16" || v.category === "Cortes & Shorts");
  }, [videos]);

  // Prateleiras do catálogo horizontal
  const videosFiltrados = useMemo(() => {
    if (filtroCanalCatalogo === "todos") return videos;
    return videos.filter((v) => v.channel_source === filtroCanalCatalogo);
  }, [videos, filtroCanalCatalogo]);

  const prateleiraRedeCast = useMemo(() => {
    return videosFiltrados.filter(
      (v) => (v.category === "RedeCast Episódios" || v.channel_source === "RedeCast") && v.video_format !== "9:16"
    );
  }, [videosFiltrados]);

  const prateleiraTvApucarana = useMemo(() => {
    return videosFiltrados.filter(
      (v) => (v.category === "Reportagens TV" && v.channel_source === "TV Apucarana") && v.video_format !== "9:16"
    );
  }, [videosFiltrados]);

  const prateleiraEspeciais = useMemo(() => {
    return videosFiltrados.filter(
      (v) => v.category === "Especial & Música" && v.video_format !== "9:16"
    );
  }, [videosFiltrados]);

  // Compartilhamento direto no WhatsApp de um vídeo específico
  const handleDirectShareWhatsApp = (video: PortalVideoItem) => {
    const shareUrl = `https://www.redeapucarana.com.br/tv-online?v=${encodeURIComponent(video.id)}`;
    const text = encodeURIComponent(
      `🎬 Assista agora na *Rede Apucarana*: *${video.title}* 👉 ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // Compartilhamento do que está tocando no player principal
  const handleShareCurrentPlayerWhatsApp = () => {
    if (playerMode === "vod" && currentVodVideo) {
      handleDirectShareWhatsApp(currentVodVideo);
    } else {
      const text = encodeURIComponent(
        "📺 Assista à *TV Rede Apucarana Ao Vivo*: 👉 https://www.redeapucarana.com.br/tv-online"
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  const handleParticiparWhatsApp = () => {
    const text = encodeURIComponent(
      "Olá TV Rede Apucarana & RedeCast! Estou acompanhando a programação e gostaria de participar / mandar uma sugestão."
    );
    window.open(`https://wa.me/5543999809454?text=${text}`, "_blank");
  };

  const isCurrentVideoVertical = currentVodVideo?.video_format === "9:16";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-red-600 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOPLINE ESCURA COM LINKS RÁPIDOS E RETORNO                             */}
      {/* ========================================================================= */}
      <div className="bg-black/95 border-b border-slate-800/80 text-xs py-2.5 px-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-bold transition-colors"
            >
              <span>←</span>
              <span>Voltar ao Portal Principal</span>
            </Link>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">
              Hub Oficial de Streaming • TV Apucarana & RedeCast
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {playerMode === "vod" ? (
              <button
                type="button"
                onClick={handleReturnToLive}
                className="inline-flex items-center gap-1.5 text-white font-black text-[11px] bg-red-600 hover:bg-red-500 px-3 py-1 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
              >
                <span>🔴</span>
                <span>VOLTAR PARA A TV AO VIVO</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-red-400 font-bold text-[11px] bg-red-950/60 border border-red-800/60 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                SINAL DIGITAL AO VIVO 24H
              </span>
            )}
            <a
              href="https://wa.me/5543999809454?text=Ol%C3%A1%2C%20quero%20anunciar%20na%20TV%20Rede%20Apucarana"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Anuncie no Hub
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CABEÇALHO DO HUB DE STREAMING (TV APUCARANA + REDECAST)               */}
      {/* ========================================================================= */}
      <header className="bg-slate-900/60 border-b border-slate-800/90 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="shrink-0 group flex items-center gap-3">
              <img
                src="/logo-rede-apucarana.png"
                alt="Logo TV Rede Apucarana"
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            <div className="border-l border-slate-800 pl-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heading font-black text-lg sm:text-xl text-white tracking-tight">
                  HUB DE STREAMING
                </span>
                <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Tv className="w-3 h-3" /> TV Apucarana
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-600/90 text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Mic className="w-3 h-3" /> RedeCast
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                TV Digital ao vivo e catálogo completo com os 2 canais oficiais: TV Apucarana & RedeCast
              </p>
            </div>
          </div>

          {/* Botões de Ação no Topo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleShareCurrentPlayerWhatsApp}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Compartilhar</span>
            </button>

            <button
              type="button"
              onClick={handleParticiparWhatsApp}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md hover:shadow-emerald-600/30 active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp da TV</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. PALCO PRINCIPAL (HÍBRIDO AO VIVO <-> VOD MULTI-CANAL 16:9 & 9:16)      */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">
        <div
          ref={playerContainerRef}
          className={`grid gap-8 transition-all duration-300 ${
            isTheater ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"
          }`}
        >
          {/* COLUNA ESQUERDA: PLAYER HÍBRIDO (8 COLUNAS) */}
          <div className={`space-y-4 transition-all ${isTheater ? "w-full" : "lg:col-span-8"}`}>
            {/* CONTAINER ADAPTATIVO DO PLAYER */}
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
              {playerMode === "live" ? (
                // 1. ESTADO AO VIVO: Player HLS com M3U8
                <LiveTvPlayer
                  onTheaterToggle={() => setIsTheater(!isTheater)}
                  isTheater={isTheater}
                  streamUrl="https://Stmv1.samcast.com.br/tvapucarana/tvapucarana/playlist.m3u8"
                />
              ) : isCurrentVideoVertical ? (
                // 2. ESTADO SOB DEMANDA VERTICAL (9:16): Fundo Ambient Blur + Player Centralizado
                <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
                  {/* Fundo Ambient com Blur */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                    <img
                      src={currentVodVideo?.thumbnail_url}
                      alt=""
                      className="w-full h-full object-cover filter blur-3xl opacity-40 scale-125"
                    />
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
                  </div>

                  {/* Barra Superior com Botão de Voltar para o Ao Vivo */}
                  <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/90 via-black/60 to-transparent p-3 sm:p-4 flex items-center justify-between gap-3 pointer-events-none">
                    <div className="flex items-center gap-2 min-w-0 pointer-events-auto">
                      <span className="px-3 py-1 rounded-full bg-pink-600 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 shrink-0">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Corte 9:16</span>
                      </span>
                      <span className="hidden sm:inline-block text-xs font-bold text-slate-200 truncate max-w-sm drop-shadow-md">
                        {currentVodVideo?.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleReturnToLive}
                      className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-2xl border border-white/60 transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      <span>SINTONIZAR AO VIVO</span>
                    </button>
                  </div>

                  {/* Moldura Centralizada 9:16 */}
                  <div className="relative h-full max-h-[96%] aspect-[9/16] rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 z-10 bg-black flex items-center justify-center my-auto">
                    {currentVodVideo?.video_type === "mp4" ? (
                      <video
                        src={currentVodVideo.video_url}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    ) : currentVodVideo?.youtube_id ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${currentVodVideo.youtube_id}?autoplay=1&rel=0&playsinline=1`}
                        title={currentVodVideo.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center p-4">
                        Pré-visualização do vídeo não disponível.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // 3. ESTADO SOB DEMANDA HORIZONTAL (16:9): Player Widescreen YouTube / MP4
                <div className="relative w-full h-full flex flex-col bg-slate-950">
                  {/* Barra Superior do Palco VOD */}
                  <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/90 via-black/70 to-transparent p-3 sm:p-4 flex items-center justify-between gap-3 pointer-events-none">
                    <div className="flex items-center gap-2 min-w-0 pointer-events-auto">
                      {currentVodVideo?.channel_source === "RedeCast" ? (
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 shrink-0">
                          <Mic className="w-3.5 h-3.5" />
                          <span>Canal RedeCast</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 shrink-0">
                          <Tv className="w-3.5 h-3.5" />
                          <span>Canal TV Apucarana</span>
                        </span>
                      )}

                      <span className="hidden sm:inline-block text-xs font-bold text-slate-200 truncate max-w-sm drop-shadow-md">
                        {currentVodVideo?.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleReturnToLive}
                      className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-2xl border border-white/60 transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                      title="Voltar para a transmissão ao vivo da TV"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      <span>VOLTAR PARA A TV AO VIVO</span>
                    </button>
                  </div>

                  {/* Player Widescreen: MP4 Nativo ou YouTube */}
                  {currentVodVideo?.video_type === "mp4" ? (
                    <video
                      src={currentVodVideo.video_url}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : currentVodVideo?.youtube_id ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${currentVodVideo.youtube_id}?autoplay=1&rel=0&playsinline=1`}
                      title={currentVodVideo.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : null}
                </div>
              )}
            </div>

            {/* BARRA DE INFORMAÇÕES ABAIXO DO PLAYER */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                {playerMode === "live" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-wider text-red-400">
                        NO AR AGORA • {programaNoAr.inicio} às {programaNoAr.fim}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {programaNoAr.categoria}
                      </span>
                    </div>

                    <h1 className="font-heading font-extrabold text-lg sm:text-xl text-white truncate">
                      {programaNoAr.titulo}
                    </h1>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                      {programaNoAr.subtitulo}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {currentVodVideo?.category}
                      </span>
                      {currentVodVideo?.video_format === "9:16" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          📱 Vertical 9:16
                        </span>
                      )}
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-400 font-mono">
                        ⏱ {currentVodVideo?.duration || "Completo"}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-400">
                        {currentVodVideo?.views_count || "Destaque"} visualizações
                      </span>
                    </div>

                    <h1 className="font-heading font-extrabold text-lg sm:text-xl text-white leading-snug">
                      {currentVodVideo?.title}
                    </h1>
                  </>
                )}
              </div>

              {/* Botões de Ação na barra do Player */}
              <div className="flex items-center gap-2.5 shrink-0">
                {playerMode === "vod" && (
                  <button
                    type="button"
                    onClick={handleReturnToLive}
                    className="px-3.5 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-red-500/30 cursor-pointer"
                  >
                    <span>🔴 Sintonizar TV</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleShareCurrentPlayerWhatsApp}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md hover:shadow-emerald-600/30 active:scale-95"
                  title="Compartilhar link oficial deste vídeo no WhatsApp"
                >
                  <Share2 className="w-4 h-4 fill-current" />
                  <span>Compartilhar</span>
                </button>

                <button
                  type="button"
                  onClick={handleParticiparWhatsApp}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Mensagem</span>
                </button>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: DESTAQUES DOS CANAIS & GRADE COM 3 ABAS (4 COLUNAS) */}
          <div className={`space-y-4 ${isTheater ? "w-full" : "lg:col-span-4"}`}>
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[480px]">
              {/* SELETOR DAS 3 ABAS */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTabSidebar("redecast")}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                    activeTabSidebar === "redecast"
                      ? "bg-purple-600 text-white shadow-md font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>🎙️</span>
                  <span>RedeCast</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabSidebar("tvapucarana")}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                    activeTabSidebar === "tvapucarana"
                      ? "bg-red-600 text-white shadow-md font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>📺</span>
                  <span>TV Apucarana</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabSidebar("grade")}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                    activeTabSidebar === "grade"
                      ? "bg-slate-800 text-amber-400 shadow-md font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>📡</span>
                  <span>Grade 24h</span>
                </button>
              </div>

              {/* CONTEÚDO DA ABA 1: CANAL REDECAST */}
              {activeTabSidebar === "redecast" && (
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1 pb-1">
                    <span>Episódios & Entrevistas RedeCast</span>
                    <span className="text-purple-400">{sidebarRedeCast.length} vídeos</span>
                  </div>

                  {sidebarRedeCast.map((video) => {
                    const isSelected = playerMode === "vod" && currentVodVideo?.id === video.id;

                    return (
                      <div
                        key={video.id}
                        className={`w-full p-2.5 rounded-xl border transition-all flex items-start gap-3 group relative ${
                          isSelected
                            ? "bg-purple-950/50 border-purple-600 shadow-md ring-1 ring-purple-500/40"
                            : "bg-slate-950/40 border-slate-800/80 hover:border-purple-600/60 hover:bg-slate-950"
                        }`}
                      >
                        <div
                          onClick={() => handleSelectVod(video)}
                          className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-slate-800 cursor-pointer"
                        >
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white font-mono text-[9px] font-bold px-1 rounded">
                            {video.duration || "16:9"}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4
                            onClick={() => handleSelectVod(video)}
                            className="font-heading font-bold text-xs text-slate-200 group-hover:text-white line-clamp-2 leading-snug cursor-pointer"
                          >
                            {video.title}
                          </h4>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                            <span className="text-purple-400 font-bold">🎙️ RedeCast</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDirectShareWhatsApp(video);
                              }}
                              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5"
                              title="Compartilhar no WhatsApp"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>Zap</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CONTEÚDO DA ABA 2: CANAL TV APUCARANA */}
              {activeTabSidebar === "tvapucarana" && (
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1 pb-1">
                    <span>Reportagens & Notícias TV Apucarana</span>
                    <span className="text-red-400">{sidebarTvApucarana.length} vídeos</span>
                  </div>

                  {sidebarTvApucarana.map((video) => {
                    const isSelected = playerMode === "vod" && currentVodVideo?.id === video.id;

                    return (
                      <div
                        key={video.id}
                        className={`w-full p-2.5 rounded-xl border transition-all flex items-start gap-3 group relative ${
                          isSelected
                            ? "bg-red-950/50 border-red-600 shadow-md ring-1 ring-red-500/40"
                            : "bg-slate-950/40 border-slate-800/80 hover:border-red-600/60 hover:bg-slate-950"
                        }`}
                      >
                        <div
                          onClick={() => handleSelectVod(video)}
                          className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-slate-800 cursor-pointer"
                        >
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white font-mono text-[9px] font-bold px-1 rounded">
                            {video.duration || "16:9"}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4
                            onClick={() => handleSelectVod(video)}
                            className="font-heading font-bold text-xs text-slate-200 group-hover:text-white line-clamp-2 leading-snug cursor-pointer"
                          >
                            {video.title}
                          </h4>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                            <span className="text-red-400 font-bold">📺 TV Apucarana</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDirectShareWhatsApp(video);
                              }}
                              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5"
                              title="Compartilhar no WhatsApp"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>Zap</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CONTEÚDO DA ABA 3: GRADE DE PROGRAMAÇÃO DA TV AO VIVO */}
              {activeTabSidebar === "grade" && (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1 pb-1">
                    <span>Programação 24h</span>
                    {horaAtual && (
                      <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        {horaAtual}
                      </span>
                    )}
                  </div>

                  {GRADE_PROGRAMACAO.map((bloco, idx) => {
                    const isCurrent = bloco.titulo === programaNoAr.titulo;

                    return (
                      <div
                        key={idx}
                        onClick={handleReturnToLive}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-red-950/40 border-red-700/80 shadow-md ring-1 ring-red-500/30"
                            : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`font-mono text-[10px] font-bold ${
                              isCurrent ? "text-red-400" : "text-slate-400"
                            }`}
                          >
                            {bloco.inicio} - {bloco.fim}
                          </span>

                          {isCurrent ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              No Ar
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-500 font-semibold">
                              {bloco.categoria}
                            </span>
                          )}
                        </div>

                        <h4
                          className={`font-heading font-bold text-xs ${
                            isCurrent ? "text-white font-extrabold" : "text-slate-200"
                          }`}
                        >
                          {bloco.titulo}
                        </h4>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CARD COMERCIAL RÁPIDO */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Publicidade em Vídeo
                </span>
                <p className="text-xs font-bold text-white leading-tight mt-0.5">
                  Anuncie sua marca na TV Apucarana & RedeCast
                </p>
              </div>
              <a
                href="https://wa.me/5543999809454?text=Ol%C3%A1%2C%20gostaria%20de%20anunciar%20em%20v%C3%ADdeo%20na%20Rede%20Apucarana"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shrink-0 transition-transform active:scale-95"
              >
                Anuncie ↗
              </a>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3.1 CARROSSEL EXCLUSIVO DE CORTES & REELS 9:16                            */}
        {/* ========================================================================= */}
        {videosCortes916.length > 0 && (
          <section className="space-y-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-purple-950/20 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center font-black shadow-md text-sm">
                  📱
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-black text-lg sm:text-xl text-white tracking-tight">
                      Cortes & Reels 9:16
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-black uppercase border border-pink-500/30">
                      Vertical
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Momentos marcantes, declarações e flagrantes em formato dinâmico para celular
                  </p>
                </div>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                {videosCortes916.length} cortes disponíveis
              </span>
            </div>

            {/* Fileira Horizontal de Cards 9:16 */}
            <div className="flex gap-3.5 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x">
              {videosCortes916.map((video) => (
                <VerticalShelfCard
                  key={video.id}
                  video={video}
                  onSelect={() => handleSelectVod(video)}
                  isCurrent={playerMode === "vod" && currentVodVideo?.id === video.id}
                  onShareWhatsApp={() => handleDirectShareWhatsApp(video)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 4. PRATELEIRAS HORIZONTAIS 16:9 ESTILO NETFLIX COM FILTRO MULTI-CANAL     */}
        {/* ========================================================================= */}
        <section className="space-y-8 pt-4">
          {/* BARRA SUPERIOR DO CATÁLOGO: SELETOR DE CANAL */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Film className="w-3 h-3" /> Catálogo Sob Demanda
                </span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                Explore os Vídeos e Podcasts Widescreen
              </h2>
            </div>

            {/* SELETOR RÁPIDO DE CANAL */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setFiltroCanalCatalogo("todos")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroCanalCatalogo === "todos"
                    ? "bg-slate-800 text-white shadow-md font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Todos</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroCanalCatalogo("TV Apucarana")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroCanalCatalogo === "TV Apucarana"
                    ? "bg-red-600 text-white shadow-md font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>TV Apucarana</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroCanalCatalogo("RedeCast")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroCanalCatalogo === "RedeCast"
                    ? "bg-purple-600 text-white shadow-md font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>RedeCast</span>
              </button>
            </div>
          </div>

          {/* PRATELEIRA 1: REDECAST — EPISÓDIOS COMPLETOS & ENTREVISTAS (16:9) */}
          {prateleiraRedeCast.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                    🎙️
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg sm:text-xl text-white">
                      RedeCast — Episódios Completos & Entrevistas
                    </h3>
                    <p className="text-xs text-slate-400">
                      Conversas aprofundadas com líderes, personalidades e empreendedores do Paraná
                    </p>
                  </div>
                </div>
              </div>

              {/* Carrossel Horizontal */}
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x">
                {prateleiraRedeCast.map((video) => (
                  <VideoShelfCard
                    key={video.id}
                    video={video}
                    onSelect={() => handleSelectVod(video)}
                    isCurrent={playerMode === "vod" && currentVodVideo?.id === video.id}
                    onShareWhatsApp={() => handleDirectShareWhatsApp(video)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* PRATELEIRA 2: TV APUCARANA — REPORTAGENS & JORNALISMO REGIONAL (16:9) */}
          {prateleiraTvApucarana.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold">
                    📺
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg sm:text-xl text-white">
                      TV Apucarana — Reportagens & Jornalismo Regional
                    </h3>
                    <p className="text-xs text-slate-400">
                      Cobertura factual, infraestrutura, polícia e utilidade pública nas 27 cidades
                    </p>
                  </div>
                </div>
              </div>

              {/* Carrossel Horizontal */}
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x">
                {prateleiraTvApucarana.map((video) => (
                  <VideoShelfCard
                    key={video.id}
                    video={video}
                    onSelect={() => handleSelectVod(video)}
                    isCurrent={playerMode === "vod" && currentVodVideo?.id === video.id}
                    onShareWhatsApp={() => handleDirectShareWhatsApp(video)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* PRATELEIRA 3: ESPECIAL CULTURA, MÚSICA & ENTRETENIMENTO (16:9) */}
          {prateleiraEspeciais.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                    🎸
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg sm:text-xl text-white">
                      Especial Cultura, Música & Entretenimento
                    </h3>
                    <p className="text-xs text-slate-400">
                      Apresentações exclusivas no estúdio, música raiz e patrimônio do Norte do Paraná
                    </p>
                  </div>
                </div>
              </div>

              {/* Carrossel Horizontal */}
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x">
                {prateleiraEspeciais.map((video) => (
                  <VideoShelfCard
                    key={video.id}
                    video={video}
                    onSelect={() => handleSelectVod(video)}
                    isCurrent={playerMode === "vod" && currentVodVideo?.id === video.id}
                    onShareWhatsApp={() => handleDirectShareWhatsApp(video)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 5. FOOTER DA EMISSORA                                                    */}
      {/* ========================================================================= */}
      <footer className="bg-black border-t border-slate-900 py-6 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <img
              src="/logo-rede-apucarana.png"
              alt="Rede Apucarana de Comunicação"
              className="h-8 w-auto object-contain opacity-75"
            />
            <span>
              © {new Date().getFullYear()} Hub de Streaming • TV Rede Apucarana & RedeCast
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">
              Página Inicial
            </Link>
            <Link href="/tv-online" className="hover:text-white transition-colors">
              TV Ao Vivo
            </Link>
            <Link href="/anuncie" className="hover:text-white transition-colors">
              Anunciar
            </Link>
            <Link href="/contato" className="hover:text-white transition-colors">
              Fale Conosco
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Card individual vertical 9:16 (Cortes e Shorts)
 */
function VerticalShelfCard({
  video,
  onSelect,
  isCurrent,
  onShareWhatsApp,
}: {
  video: PortalVideoItem;
  onSelect: () => void;
  isCurrent?: boolean;
  onShareWhatsApp: () => void;
}) {
  const isRedeCast = video.channel_source === "RedeCast";

  return (
    <div
      onClick={onSelect}
      className={`group relative w-40 sm:w-48 shrink-0 aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border text-left cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 focus:outline-none snap-start p-0 flex flex-col shadow-lg ${
        isCurrent
          ? "border-pink-500 ring-2 ring-pink-400/50 shadow-pink-500/20"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Imagem de Fundo 9:16 */}
      <img
        src={video.thumbnail_url}
        alt={video.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        loading="lazy"
      />

      {/* Gradiente escuro */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-950/50 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

      {/* Selos do Topo */}
      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 z-10">
        {isRedeCast ? (
          <span className="px-2 py-0.5 rounded-md bg-purple-600/90 text-white font-extrabold text-[9px] uppercase tracking-wider backdrop-blur-xs shadow-sm flex items-center gap-1">
            <Mic className="w-2.5 h-2.5" /> RedeCast
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white font-extrabold text-[9px] uppercase tracking-wider backdrop-blur-xs shadow-sm flex items-center gap-1">
            <Tv className="w-2.5 h-2.5" /> TV Apucarana
          </span>
        )}

        <span className="bg-black/80 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
          {video.duration || "Corte"}
        </span>
      </div>

      {/* Ícone de Play no centro ao passar o mouse */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="w-12 h-12 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
          <Play className="w-5 h-5 fill-current translate-x-0.5" />
        </div>
      </div>

      {/* Detalhes na Base do Card 9:16 */}
      <div className="absolute bottom-0 inset-x-0 p-3 z-10 bg-gradient-to-t from-black via-black/90 to-transparent">
        <h4 className="font-heading font-bold text-xs text-white line-clamp-2 leading-snug group-hover:text-pink-300 transition-colors">
          {video.title}
        </h4>

        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10 text-[10px]">
          <span className="text-pink-400 font-bold flex items-center gap-1">
            <span>Assistir</span>
            <span>▶</span>
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShareWhatsApp();
            }}
            className="p-1 rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white shadow transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            title="Compartilhar corte no WhatsApp"
          >
            <Share2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Card individual das prateleiras estilo Netflix (16:9 Widescreen)
 */
function VideoShelfCard({
  video,
  onSelect,
  isCurrent,
  onShareWhatsApp,
}: {
  video: PortalVideoItem;
  onSelect: () => void;
  isCurrent?: boolean;
  onShareWhatsApp: () => void;
}) {
  const isRedeCast = video.channel_source === "RedeCast";

  return (
    <div
      onClick={onSelect}
      className={`group relative w-64 sm:w-72 shrink-0 rounded-2xl overflow-hidden bg-slate-900 border text-left cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 focus:outline-none snap-start p-0 flex flex-col shadow-lg ${
        isCurrent
          ? "border-amber-500 ring-2 ring-amber-400/50 shadow-amber-500/10"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Thumbnail 16:9 */}
      <div className="relative aspect-video w-full bg-black overflow-hidden">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradiente escuro */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Selo do Canal */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {isRedeCast ? (
            <span className="px-2 py-0.5 rounded-md bg-purple-600/90 text-white font-extrabold text-[9px] uppercase tracking-wider backdrop-blur-xs shadow-sm flex items-center gap-1">
              <Mic className="w-2.5 h-2.5" /> RedeCast
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white font-extrabold text-[9px] uppercase tracking-wider backdrop-blur-xs shadow-sm flex items-center gap-1">
              <Tv className="w-2.5 h-2.5" /> TV Apucarana
            </span>
          )}
        </div>

        {/* Duração no canto inferior direito */}
        <span className="absolute bottom-2 right-2 bg-black/85 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
          {video.duration || "16:9"}
        </span>

        {/* Ícone de Play no Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Detalhes do Card */}
      <div className="p-3.5 flex flex-col flex-1 justify-between bg-slate-900">
        <div>
          <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-200 group-hover:text-white line-clamp-2 leading-snug transition-colors">
            {video.title}
          </h4>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400">
            {video.category}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShareWhatsApp();
              }}
              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold border border-slate-700 hover:border-emerald-500/40 flex items-center gap-1 transition-colors cursor-pointer"
              title="Compartilhar no WhatsApp"
            >
              <Share2 className="w-3 h-3" />
              <span>Zap</span>
            </button>

            <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>Assistir</span>
              <span>▶</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente Principal com Suspense Boundary para useSearchParams
 */
export default function TvOnlineClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400">Carregando Hub de Streaming • TV Apucarana & RedeCast...</p>
        </div>
      }
    >
      <TvOnlineHubContent />
    </Suspense>
  );
}
