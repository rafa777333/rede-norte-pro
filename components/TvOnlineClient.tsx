"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, useImperativeHandle, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  VolumeX,
  PictureInPicture,
  Maximize2,
  Minimize2,
  Expand,
  Settings,
} from "lucide-react";
import LiveTvPlayer, { type LiveTvPlayerHandle } from "./LiveTvPlayer";
import {
  PortalVideoItem,
  ChannelSource,
  VideoCategory,
  MOCK_PORTAL_VIDEOS,
  getYouTubeThumbnail,
  isVideoVerticalFormat,
} from "@/lib/tv-videos-data";
import {
  TvSettings,
  TvPlaylistItem,
  DEFAULT_TV_SETTINGS,
  INITIAL_TV_PLAYLIST,
  formatDurationSeconds,
  formatClockTime,
  getPlaylistItemTypeMeta,
  calculateTvProgramAtTime,
} from "@/lib/tv-channel-data";
import { getSupabase } from "@/lib/supabase";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

/**
 * =========================================================================
 * COMPONENTE: YouTubeFastGridPlayer
 * Player Oficial com window.YT.Player, loadVideoById (Zero Cliques),
 * Enquadramento 100% Original, Controles Liberados (HD/1080p, FS) e
 * Transição Estritamente Sequencial.
 * =========================================================================
 */
export interface YouTubeFastGridPlayerHandle {
  toggleMute: () => void;
  unMute: () => void;
  mute: () => void;
  setVolume: (val: number) => void;
  isMuted: () => boolean;
  setQuality: (quality: string) => void;
  getQuality: () => string;
  resyncWithClock?: (videoId: string, elapsedSeconds: number) => void;
  playVideo?: () => void;
  pauseVideo?: () => void;
}

interface YouTubeFastGridPlayerProps {
  playlist: TvPlaylistItem[];
  onCurrentItemChange?: (item: TvPlaylistItem, nextItem: TvPlaylistItem, remainingSeconds: number) => void;
  onMuteChange?: (muted: boolean) => void;
}

const YouTubeFastGridPlayer = React.forwardRef<YouTubeFastGridPlayerHandle, YouTubeFastGridPlayerProps>(
  function YouTubeFastGridPlayer(
    {
      playlist,
      onCurrentItemChange,
      onMuteChange,
    },
    ref
  ) {
    const playerRef = useRef<any>(null);
    const isTransitioningRef = useRef(false);

    // Lista apenas com itens ativos e com duração válida
    const activePlaylist = useMemo(() => {
      const list = playlist.filter((i) => i.active && i.youtube_id && i.duration_seconds > 0);
      return list.length > 0 ? list : INITIAL_TV_PLAYLIST;
    }, [playlist]);

    // Ponto de partida calculado pelo relógio sincronizado
    const initialCalculated = useMemo(() => {
      return calculateTvProgramAtTime(activePlaylist);
    }, [activePlaylist]);

    // Índice sequencial rigoroso na fila da grade
    const [currentIndex, setCurrentIndex] = useState(() => initialCalculated?.currentIndex ?? 0);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [selectedQuality, setSelectedQuality] = useState<string>("hd1080");

    const currentItem = activePlaylist[currentIndex] || activePlaylist[0];
    const nextIndex = (currentIndex + 1) % activePlaylist.length;
    const nextItem = activePlaylist[nextIndex] || currentItem;

    // Notifica o componente pai sobre o item no ar e o próximo
    useEffect(() => {
      if (currentItem && nextItem) {
        onCurrentItemChange?.(currentItem, nextItem, remainingTime);
      }
    }, [currentItem, nextItem, remainingTime, onCurrentItemChange]);

    // Transição sequencial rigorosa entre vídeos sem cliques (loadVideoById)
    const advanceToNextVideo = useCallback(() => {
      if (isTransitioningRef.current || activePlaylist.length === 0) return;
      isTransitioningRef.current = true;

      setCurrentIndex((prev) => {
        const nextIdx = (prev + 1) % activePlaylist.length;
        const nextVid = activePlaylist[nextIdx];

        if (nextVid && playerRef.current && typeof playerRef.current.loadVideoById === "function") {
          try {
            playerRef.current.loadVideoById({
              videoId: nextVid.youtube_id,
              startSeconds: 0,
            });
            playerRef.current.playVideo();
            if (selectedQuality && typeof playerRef.current.setPlaybackQuality === "function") {
              playerRef.current.setPlaybackQuality(selectedQuality);
            }
          } catch (e) {
            console.warn("[YouTubeFastGridPlayer] Falha ao avançar vídeo:", e);
          }
        }

        return nextIdx;
      });

      // Trava de segurança para não chamar loadVideoById em duplicidade
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 2000);
    }, [activePlaylist, selectedQuality]);

    // Controle de áudio desmutar / mutar
    const handleToggleMute = useCallback(() => {
      const p = playerRef.current;
      if (!p) return;

      try {
        if (isMuted) {
          p.unMute();
          p.setVolume(100);
          setIsMuted(false);
          onMuteChange?.(false);
        } else {
          p.mute();
          setIsMuted(true);
          onMuteChange?.(true);
        }
      } catch (e) {
        console.warn("Erro ao alternar áudio:", e);
      }
    }, [isMuted, onMuteChange]);

    // Expõe métodos imperativos para controle externo
    useImperativeHandle(
      ref,
      () => ({
        toggleMute: handleToggleMute,
        unMute: () => {
          const p = playerRef.current;
          if (p && typeof p.unMute === "function") {
            try {
              p.unMute();
              p.setVolume(100);
              setIsMuted(false);
              onMuteChange?.(false);
            } catch {}
          }
        },
        mute: () => {
          const p = playerRef.current;
          if (p && typeof p.mute === "function") {
            try {
              p.mute();
              setIsMuted(true);
              onMuteChange?.(true);
            } catch {}
          }
        },
        setVolume: (val: number) => {
          const p = playerRef.current;
          if (p && typeof p.setVolume === "function") {
            try {
              p.setVolume(val);
              if (val === 0) {
                p.mute();
                setIsMuted(true);
                onMuteChange?.(true);
              } else if (isMuted) {
                p.unMute();
                setIsMuted(false);
                onMuteChange?.(false);
              }
            } catch {}
          }
        },
        isMuted: () => isMuted,
        setQuality: (quality: string) => {
          setSelectedQuality(quality);
          const p = playerRef.current;
          if (p && typeof p.setPlaybackQuality === "function") {
            try {
              p.setPlaybackQuality(quality);
            } catch (e) {
              console.warn("Erro ao definir qualidade:", e);
            }
          }
        },
        getQuality: () => selectedQuality,
        playVideo: () => {
          const p = playerRef.current;
          if (p && typeof p.playVideo === "function") {
            try {
              p.unMute();
              p.setVolume(100);
              p.playVideo();
              setIsPlaying(true);
              setIsMuted(false);
            } catch {}
          }
        },
        pauseVideo: () => {
          const p = playerRef.current;
          if (p && typeof p.pauseVideo === "function") {
            try {
              p.pauseVideo();
              setIsPlaying(false);
            } catch {}
          }
        },
        resyncWithClock: (videoId: string, elapsedSeconds: number) => {
          const p = playerRef.current;
          if (!p) return;
          try {
            const currentVidData = typeof p.getVideoData === "function" ? p.getVideoData() : null;
            const currentVidId = currentVidData?.video_id;
            if (currentVidId && currentVidId !== videoId) {
              if (typeof p.loadVideoById === "function") {
                p.loadVideoById({ videoId, startSeconds: elapsedSeconds });
                p.playVideo();
              }
            } else if (typeof p.getCurrentTime === "function" && typeof p.seekTo === "function") {
              const currentPos = p.getCurrentTime();
              if (Math.abs(currentPos - elapsedSeconds) > 4) {
                p.seekTo(elapsedSeconds, true);
              }
            }
          } catch (e) {
            console.warn("[YouTubeFastGridPlayer] Falha no resync com relógio:", e);
          }
        },
      }),
      [handleToggleMute, isMuted, onMuteChange, selectedQuality]
    );

    // Inicialização única da API oficial do YouTube IFrame (window.YT)
    useEffect(() => {
      let cancel = false;

      const setupPlayerInstance = () => {
        if (cancel || playerRef.current || !window.YT || !window.YT.Player) return;

        const container = document.getElementById("yt-fast-player-container");
        if (!container) return;

        const initialStart = initialCalculated?.offsetInCurrentVideo ?? 0;
        const initialYtId = currentItem?.youtube_id || activePlaylist[0]?.youtube_id;

        try {
          playerRef.current = new window.YT.Player("yt-fast-player-container", {
            videoId: initialYtId,
            playerVars: {
              autoplay: 1,
              controls: 0, // TV REAL: SEM Barra de tempo do YouTube (impede avançar/voltar)
              disablekb: 1, // TV REAL: Sem atalhos de teclado
              fs: 0, // Sem botão nativo de Fullscreen do YouTube (usamos a barra da TV)
              iv_load_policy: 3,
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
              start: Math.floor(initialStart),
              origin: typeof window !== "undefined" ? window.location.origin : undefined,
            },
            events: {
              onReady: (e: any) => {
                if (cancel) return;
                e.target.playVideo();
                setIsPlaying(true);
                if (typeof e.target.setPlaybackQuality === "function") {
                  try {
                    e.target.setPlaybackQuality("hd1080");
                  } catch {}
                }

                // Garante atributos de permissão no iframe gerado para tela cheia e rotação mobile
                try {
                  const iframe = e.target.getIframe?.();
                  if (iframe) {
                    iframe.setAttribute(
                      "allow",
                      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    );
                    iframe.setAttribute("allowfullscreen", "true");
                    iframe.setAttribute("webkitallowfullscreen", "true");
                    iframe.setAttribute("mozallowfullscreen", "true");
                    iframe.className = "w-full h-full border-0 pointer-events-none";
                  }
                } catch {}

                if (typeof e.target.isMuted === "function") {
                  const m = e.target.isMuted();
                  setIsMuted(m);
                  onMuteChange?.(m);
                }
              },
              onStateChange: (e: any) => {
                // 0 = YT.PlayerState.ENDED
                if (e.data === 0) {
                  advanceToNextVideo();
                }
              },
              onError: (e: any) => {
                console.warn("[YT Fast Grid Error Code]:", e.data);
                // Se o vídeo falhar, avança direto para o próximo da grade
                advanceToNextVideo();
              },
            },
          });
        } catch (err) {
          console.warn("[YouTubeFastGridPlayer] Erro na instanciação do YT.Player:", err);
        }
      };

      if (window.YT && window.YT.Player) {
        setupPlayerInstance();
      } else {
        // Carrega o script oficial do YouTube caso ainda não esteja no DOM
        if (!document.getElementById("yt-iframe-api-script")) {
          const tag = document.createElement("script");
          tag.id = "yt-iframe-api-script";
          tag.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(tag);
        }

        const prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (typeof prevReady === "function") prevReady();
          setupPlayerInstance();
        };
      }

      return () => {
        cancel = true;
      };
    }, [currentItem?.youtube_id, initialCalculated?.offsetInCurrentVideo, activePlaylist, advanceToNextVideo, onMuteChange]);

    // Monitor de tempo a cada 400ms: aciona a transição 1.2s antes do final e sincroniza áudio
    useEffect(() => {
      const interval = setInterval(() => {
        const p = playerRef.current;
        if (!p || typeof p.getCurrentTime !== "function" || typeof p.getDuration !== "function") {
          return;
        }

        try {
          const curr = p.getCurrentTime();
          const dur = p.getDuration();

          if (dur > 0 && curr >= 0) {
            const rem = Math.max(0, dur - curr);
            setRemainingTime(Math.round(rem));

            // 1.2 segundo antes de acabar: carrega imediatamente o próximo item
            if (curr >= dur - 1.2 && dur > 4) {
              advanceToNextVideo();
            }
          }

          // Sincroniza estado de mudo com controles nativos do YouTube
          if (typeof p.isMuted === "function") {
            const actualMuted = p.isMuted();
            if (actualMuted !== isMuted) {
              setIsMuted(actualMuted);
              onMuteChange?.(actualMuted);
            }
          }
        } catch (err) {
          // Ignora leituras durante transição de estado
        }
      }, 400);

      return () => clearInterval(interval);
    }, [advanceToNextVideo, isMuted, onMuteChange]);

    // Destruição limpa no unmount
    useEffect(() => {
      return () => {
        if (playerRef.current && typeof playerRef.current.destroy === "function") {
          try {
            playerRef.current.destroy();
          } catch {}
          playerRef.current = null;
        }
      };
    }, []);

    const typeMeta = getPlaylistItemTypeMeta(currentItem?.type || "podcast");

    return (
      <div className="relative w-full h-full aspect-video bg-black flex items-center justify-center select-none group">
        {/* Container do player oficial YouTube IFrame - 100% original sem corte */}
        <div className="w-full h-full aspect-video">
          <div id="yt-fast-player-container" className="w-full h-full" />
        </div>

        {/* CAMADA TRANSPARENTE DE PROTEÇÃO (SHIELD): Impede hover/pausa/seek acidental no YouTube */}
        <div className="absolute inset-0 z-10 pointer-events-auto" />

        {/* Badge discreto no canto superior esquerdo */}
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-purple-600/95 text-white font-black text-[10px] uppercase tracking-wider shadow-md backdrop-blur-xs flex items-center gap-1.5 border border-purple-400/30">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>GRADE 24H</span>
          </span>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-black/70 text-amber-400 font-bold text-[10px] border border-amber-500/30 backdrop-blur-xs">
            {selectedQuality === "hd1080" ? "HD 1080p" : selectedQuality === "hd720" ? "HD 720p" : "HD Auto"}
          </span>
          <span className={`hidden md:inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border backdrop-blur-xs ${typeMeta.badgeBg}`}>
            {typeMeta.icon} {typeMeta.label}
          </span>
        </div>

        {/* Botão flutuante para desbloquear áudio se iniciar no mudo (autoplay do navegador) */}
        {isMuted && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <button
              type="button"
              onClick={handleToggleMute}
              className="pointer-events-auto px-5 py-3 rounded-2xl bg-black/85 hover:bg-black text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl border-2 border-red-500 backdrop-blur-md transition-all hover:scale-105 active:scale-95 animate-pulse cursor-pointer"
            >
              <VolumeX className="w-4 h-4 text-red-500" />
              <span>CLIQUE PARA ATIVAR O SOM DA TV</span>
            </button>
          </div>
        )}
      </div>
    );
  }
);

/**
 * =========================================================================
 * COMPONENTE PRINCIPAL DO HUB DE STREAMING: TvOnlineHubContent
 * =========================================================================
 */
function TvOnlineHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoParam = searchParams.get("v");

  // Modo do Player: "live" (Transmissão contínua da TV) | "vod" (Vídeo sob demanda específico)
  const [playerMode, setPlayerMode] = useState<"live" | "vod">("live");
  const [currentVodVideo, setCurrentVodVideo] = useState<PortalVideoItem | null>(null);
  const [mp4IsVertical, setMp4IsVertical] = useState<boolean | null>(null);
  const [isTheater, setIsTheater] = useState(false);
  const [activeTabSidebar, setActiveTabSidebar] = useState<"redecast" | "tvapucarana" | "grade">("redecast");
  const [filtroCanalCatalogo, setFiltroCanalCatalogo] = useState<"todos" | "TV Apucarana" | "RedeCast">("todos");

  // Configurações e Grade da TV
  const [tvSettings, setTvSettings] = useState<TvSettings>(DEFAULT_TV_SETTINGS);
  const [tvPlaylist, setTvPlaylist] = useState<TvPlaylistItem[]>(INITIAL_TV_PLAYLIST);
  const [m3u8HasError, setM3u8HasError] = useState(false);
  const [probeIsLive, setProbeIsLive] = useState<boolean>(false);

  // Monitor do que está no ar na Grade 24h
  const [liveCurrentItem, setLiveCurrentItem] = useState<TvPlaylistItem | null>(null);
  const [liveNextItem, setLiveNextItem] = useState<TvPlaylistItem | null>(null);
  const [liveRemainingSeconds, setLiveRemainingSeconds] = useState<number>(0);

  // Catálogo de Vídeos Sob Demanda
  const [videos, setVideos] = useState<PortalVideoItem[]>(MOCK_PORTAL_VIDEOS);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Estados de Interface e Controles Modernos
  const [isFloating, setIsFloating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);
  const [globalVolume, setGlobalVolume] = useState<number>(100);
  const [tvQuality, setTvQuality] = useState<"hd1080" | "hd720" | "auto">("hd1080");
  const [floatingPos, setFloatingPos] = useState<{ x: number; y: number } | null>(null);

  // Fluxo Cinema Instantâneo Mobile (Tela cheia horizontal + desbloqueio de áudio)
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerStageRef = useRef<HTMLDivElement>(null);
  const livePlayerRef = useRef<LiveTvPlayerHandle | null>(null);
  const playerScrollAnchorRef = useRef<HTMLDivElement>(null);
  const userDismissedFloatingRef = useRef(false);
  const ytPlayerHandleRef = useRef<YouTubeFastGridPlayerHandle | null>(null);
  const hasAppliedParam = useRef<string | null>(null);

  // Detecção em tempo real de Smartphone (Mobile) e Orientação (Portrait vs Landscape)
  useEffect(() => {
    const handleScreenResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      const portrait =
        window.screen?.orientation?.type
          ? window.screen.orientation.type.includes("portrait")
          : window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    handleScreenResize();
    window.addEventListener("resize", handleScreenResize);
    window.addEventListener("orientationchange", handleScreenResize);
    return () => {
      window.removeEventListener("resize", handleScreenResize);
      window.removeEventListener("orientationchange", handleScreenResize);
    };
  }, []);

  // Blindagem definitiva contra Stream Congelado / Fantasma do SamCast (Fim do Loop):
  const lastSeenSegmentRef = useRef<string | null>(null);
  const lastSeenSequenceRef = useRef<number | null>(null);
  const segmentLastChangedAtRef = useRef<number>(Date.now());
  const cooldownUntilRef = useRef<number>(0);
  const lastKnownFrozenSegmentRef = useRef<string | null>(null);

  // Detecção Inteligente de Formato 9:16 (Vertical) vs 16:9 (Horizontal)
  // A TV ao vivo e grade normal são sempre 16:9; VOD respeita tags, URLs (/shorts/) ou metadados de vídeo MP4
  const isCurrentVideoVertical = useMemo(() => {
    if (playerMode === "live") return false;
    if (!currentVodVideo) return false;
    return isVideoVerticalFormat(currentVodVideo, mp4IsVertical);
  }, [playerMode, currentVodVideo, mp4IsVertical]);

  // Modo Cinema Mobile: força rotação horizontal de 90° via CSS quando o smartphone estiver em pé (portrait)
  // e o vídeo for no formato widescreen 16:9 (TV Ao Vivo ou VOD horizontal)
  const shouldRotateHorizontal =
    isMobile && isPortrait && !isCurrentVideoVertical;

  // Inicializa posição padrão no canto inferior direito respeitando proporção horizontal vs vertical
  const initFloatingPos = useCallback(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 640;
    const width = isCurrentVideoVertical ? (isMobile ? 160 : 192) : (isMobile ? 288 : 384);
    const height = isCurrentVideoVertical ? Math.round((width * 16) / 9) : Math.round((width * 9) / 16);
    const defaultX = Math.max(12, window.innerWidth - width - 16);
    const defaultY = Math.max(12, window.innerHeight - height - 16);
    setFloatingPos({ x: defaultX, y: defaultY });
  }, [isCurrentVideoVertical]);

  // 1. Carrega configurações do Canal 24h e Playlist da Grade (Nuvem com failover direto no Supabase)
  const fetchTvChannel = useCallback(async () => {
    try {
      // 1.1 Tenta API Route com cache-buster e sem cache
      const res = await fetch(`/api/tv-channel?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        if (json.settings) setTvSettings(json.settings);
        if (Array.isArray(json.playlist) && json.playlist.length > 0) {
          setTvPlaylist(json.playlist);
          return;
        }
      }
    } catch (err) {
      console.warn("[TvOnlineClient] API Route fallback para Supabase direto:", err);
    }

    // 1.2 Fallback Direto ao Supabase (site_settings)
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["tv_channel_settings", "tv_channel_playlist"]);

        if (!error && Array.isArray(data)) {
          for (const item of data) {
            if (item.key === "tv_channel_settings" && item.value) {
              const parsed = typeof item.value === "string" ? JSON.parse(item.value) : item.value;
              if (parsed) setTvSettings((prev) => ({ ...prev, ...parsed }));
            }
            if (item.key === "tv_channel_playlist" && item.value) {
              const parsed = typeof item.value === "string" ? JSON.parse(item.value) : item.value;
              if (Array.isArray(parsed) && parsed.length > 0) {
                setTvPlaylist(parsed);
              }
            }
          }
        }
      }
    } catch (errSupabase) {
      console.warn("[TvOnlineClient] Falha no Supabase direto:", errSupabase);
    }
  }, []);

  useEffect(() => {
    fetchTvChannel();
  }, [fetchTvChannel]);

  // 1.1 Inscrição Realtime no Supabase (Atualização instantânea celular <-> desktop)
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel("tv_channel_realtime_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        () => {
          fetchTvChannel();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "videos_portal" },
        () => {
          fetchVideos();
        }
      )
      .on("broadcast", { event: "tv_updated" }, () => {
        fetchTvChannel();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTvChannel]);

  // 1.2 Desativa a janela flutuante se a tela for mobile (< 768px)
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768 && isFloating) {
        setIsFloating(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFloating]);

  // Trava Anti-Ping-Pong (Cooldown de 20s): Quando o OBS para, fixa na Grade YouTube e impede retornos espúrios
  const triggerOfflineCooldown = useCallback((frozenSegment?: string | null) => {
    console.info("[LiveTv] OBS encerrado ou sinal congelado. Ativando cooldown anti-ping-pong de 20s e retornando à Grade YouTube.");
    setProbeIsLive(false);
    setM3u8HasError(true);
    cooldownUntilRef.current = Date.now() + 20_000;
    if (frozenSegment) {
      lastKnownFrozenSegmentRef.current = frozenSegment;
    }
  }, []);

  // 2. Sonda Inteligente do Stream M3U8 com Detector de Stream Congelado / Fantasma (Fim do Loop)
  const checkLiveStream = useCallback(async () => {
    // 2.1 CHAVE MANUAL SOBERANA: Se o admin marcou Grade YouTube 24h, nem sequer consulta o SamCast!
    if (tvSettings.mode === "force_youtube_grid") {
      setProbeIsLive(false);
      setM3u8HasError(false);
      return;
    }

    // Se o admin forçou entrada ao vivo (force_live_m3u8), mantém ativo
    if (tvSettings.mode === "force_live_m3u8") {
      setProbeIsLive(true);
      return;
    }

    const now = Date.now();
    const isUnderCooldown = now < cooldownUntilRef.current;

    try {
      const streamUrl = tvSettings.live_m3u8_url || DEFAULT_TV_SETTINGS.live_m3u8_url;
      const res = await fetch(
        `/api/tv-channel/probe?url=${encodeURIComponent(streamUrl)}&t=${now}`,
        { cache: "no-store" }
      );
      const json = await res.json();

      // Regra 1: Se a resposta HTTP falhou, ou tem #EXT-X-ENDLIST, ou não tem #EXTINF, ou isLive=false
      if (!res.ok || !json.isLive || json.isFrozen || !json.lastSegment) {
        if (probeIsLive) {
          triggerOfflineCooldown(json.lastSegment || lastSeenSegmentRef.current);
        } else {
          setProbeIsLive(false);
        }
        return;
      }

      const currentSegment = String(json.lastSegment);
      const currentSeq =
        json.mediaSequence !== null && json.mediaSequence !== undefined
          ? Number(json.mediaSequence)
          : null;
      const previousSegment = lastSeenSegmentRef.current;
      const previousSeq = lastSeenSequenceRef.current;

      // Regra 2: Verificação de Sequência Viva e Detecção de Stream Congelado no Cliente
      if (!previousSegment) {
        lastSeenSegmentRef.current = currentSegment;
        lastSeenSequenceRef.current = currentSeq;
        segmentLastChangedAtRef.current = now;

        // Se não estamos sob cooldown e o segmento não é o mesmo congelado anteriormente
        if (!isUnderCooldown && currentSegment !== lastKnownFrozenSegmentRef.current) {
          setProbeIsLive(true);
          setM3u8HasError(false);
        }
        return;
      }

      // Verifica se houve avanço real no stream (novo .ts ou incremento no MEDIA-SEQUENCE)
      const hasAdvanced =
        currentSegment !== previousSegment ||
        (currentSeq !== null && previousSeq !== null && currentSeq > previousSeq);

      if (hasAdvanced) {
        // OBS está vivo e transmitindo ativamente pacotes inéditos!
        lastSeenSegmentRef.current = currentSegment;
        lastSeenSequenceRef.current = currentSeq;
        segmentLastChangedAtRef.current = now;

        // Limpa o segmento congelado anterior se recebemos um novo
        if (currentSegment !== lastKnownFrozenSegmentRef.current) {
          lastKnownFrozenSegmentRef.current = null;
        }

        // Só promove para live se o cooldown de 20s já tiver expirado
        if (!isUnderCooldown) {
          setProbeIsLive(true);
          setM3u8HasError(false);
        }
      } else {
        // O segmento é idêntico ao da verificação anterior
        const timeUnchanged = now - segmentLastChangedAtRef.current;

        // Se após 8 segundos o manifesto do SamCast continuar devolvendo exatamente o mesmo último arquivo .ts:
        // (O OBS parou de enviar pacotes novos e o SamCast está repetindo cache antigo)
        if (timeUnchanged >= 8_000) {
          console.warn(
            `[Probe OBS] Stream CONGELADO / FANTASMA detectado! Segmento '${currentSegment}' inalterado há ${(timeUnchanged / 1000).toFixed(1)}s. Marcando como OFFLINE imediatamente.`
          );
          triggerOfflineCooldown(currentSegment);
        }
      }
    } catch (err) {
      console.warn("[Probe OBS] Erro de rede ao consultar probe:", err);
      if (probeIsLive) {
        triggerOfflineCooldown(lastSeenSegmentRef.current);
      } else {
        setProbeIsLive(false);
      }
    }
  }, [tvSettings.mode, tvSettings.live_m3u8_url, probeIsLive, triggerOfflineCooldown]);

  useEffect(() => {
    // Se o administrador selecionou Grade YouTube 24h, nem sequer consulta o SamCast!
    if (tvSettings.mode === "force_youtube_grid") {
      setProbeIsLive(false);
      setM3u8HasError(false);
      return;
    }

    checkLiveStream();
    const interval = setInterval(checkLiveStream, 8_000); // 8 segundos conforme especificação
    return () => clearInterval(interval);
  }, [tvSettings.mode, checkLiveStream]);

  // 2.1 Listener do evento customizado app:resync-tv (Auto-update PWA Mobile e retorno do background)
  useEffect(() => {
    const handleResync = () => {
      checkLiveStream();
      fetchTvChannel();
      if (playerMode === "live" && tvPlaylist.length > 0) {
        const calc = calculateTvProgramAtTime(tvPlaylist);
        if (calc) {
          setLiveCurrentItem(calc.currentItem);
          setLiveNextItem(calc.nextItem);
          setLiveRemainingSeconds(calc.remainingInCurrent);
          ytPlayerHandleRef.current?.resyncWithClock?.(
            calc.currentItem.youtube_id,
            calc.offsetInCurrentVideo
          );
        }
      }
    };

    window.addEventListener("app:resync-tv", handleResync);
    return () => {
      window.removeEventListener("app:resync-tv", handleResync);
    };
  }, [playerMode, tvPlaylist, checkLiveStream, fetchTvChannel]);

  // 3. Carrega catálogo de vídeos da API
  const fetchVideos = useCallback(async () => {
    try {
      setLoadingVideos(true);
      const res = await fetch(`/api/videos?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.videos) && json.videos.length > 0) {
        setVideos(json.videos);
      }
    } catch (err) {
      console.warn("Falha ao buscar vídeos do hub:", err);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // 4. Deep linking: se houver ?v={id} na URL, sintoniza direto o vídeo compartilhado
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
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (playerContainerRef.current) {
          playerContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 350);
    }
  }, [videoParam, videos]);

  // 5. Determina se o sinal ao vivo do OBS (SamCast) está ativo
  // Modo 'force_youtube_grid' -> 100% Grade YouTube (Zero consultas M3U8, sem loop)
  // Modo 'force_live_m3u8' -> Força sinal OBS (com fallback se erro fatal)
  // Modo 'auto' -> Entra se probeIsLive for true E sem erro/watchdog
  const isObsLiveActive = useMemo(() => {
    if (tvSettings.mode === "force_youtube_grid") return false;
    if (tvSettings.mode === "force_live_m3u8") {
      return !m3u8HasError;
    }
    if (m3u8HasError) return false;
    return probeIsLive;
  }, [tvSettings.mode, probeIsLive, m3u8HasError]);

  // Desbloqueio Instantâneo de Áudio por Gesto + Play + Fullscreen + Orientação Paisagem
  const handleUnlockCinemaAudio = useCallback(async () => {
    setIsAudioUnlocked(true);
    setIsGlobalMuted(false);

    // 1. Sinal HLS do OBS (LiveTvPlayer)
    if (playerMode === "live" && isObsLiveActive) {
      if (livePlayerRef.current) {
        try {
          livePlayerRef.current.unMute();
          await livePlayerRef.current.play();
        } catch (err) {
          console.warn("[Cinema Mobile] Erro ao iniciar HLS unmuted:", err);
        }
      }
    }

    // 2. Grade 24h contínua do YouTube (YouTubeFastGridPlayer)
    if (playerMode === "live" && !isObsLiveActive) {
      if (ytPlayerHandleRef.current) {
        try {
          ytPlayerHandleRef.current.unMute();
          ytPlayerHandleRef.current.setVolume(100);
          ytPlayerHandleRef.current.playVideo?.();
        } catch (err) {
          console.warn("[Cinema Mobile] Erro ao iniciar YouTube unmuted:", err);
        }
      }
    }

    // 3. Vídeo Sob Demanda (VOD)
    if (playerMode === "vod") {
      const vodVideo = playerStageRef.current?.querySelector("video");
      if (vodVideo) {
        vodVideo.muted = false;
        vodVideo.volume = 1;
        vodVideo.play().catch(() => {});
      }
    }

    // 4. Solicitação de Tela Cheia nativa do navegador
    const stage = playerStageRef.current;
    if (stage) {
      try {
        if (stage.requestFullscreen) {
          await stage.requestFullscreen();
        } else if ((stage as any).webkitRequestFullscreen) {
          await (stage as any).webkitRequestFullscreen();
        }
      } catch (err) {
        console.warn("[Cinema Mobile] requestFullscreen:", err);
      }
    }

    // 5. Força orientação horizontal em dispositivos Android compatíveis
    if (typeof window !== "undefined" && window.screen?.orientation && (window.screen.orientation as any).lock) {
      try {
        await (window.screen.orientation as any).lock("landscape");
      } catch {}
    }
  }, [playerMode, isObsLiveActive]);

  // Ação ao clicar no botão gigante "VOLTAR AO MENU" (Anti-travamento para idosos)
  const handleExitCinema = useCallback(() => {
    // 1. Pausa imediatamente o vídeo ativo
    try {
      livePlayerRef.current?.pause();
    } catch {}
    try {
      ytPlayerHandleRef.current?.pauseVideo?.();
    } catch {}
    try {
      const vodVideo = playerStageRef.current?.querySelector("video");
      vodVideo?.pause();
    } catch {}

    // 2. Sai do modo tela cheia se ativo
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // 3. Destrava a orientação da tela do smartphone
    if (typeof window !== "undefined" && window.screen?.orientation && (window.screen.orientation as any).unlock) {
      try {
        (window.screen.orientation as any).unlock();
      } catch {}
    }

    // 4. Retorna imediatamente à Home dos botões gigantes
    router.push("/");
  }, [router]);

  // Tocar vídeo On-Demand no player principal e atualizar a barra de endereço
  const handleSelectVod = (video: PortalVideoItem) => {
    setMp4IsVertical(null);
    setCurrentVodVideo(video);
    setPlayerMode("vod");

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("v", video.id);
      window.history.replaceState({}, "", url.toString());

      // No mobile (< 768px): rola suavemente ao topo para o player principal imediatamente
      if (window.innerWidth < 768) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (playerContainerRef.current) {
        playerContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Voltar para a programação contínua da TV (Ao Vivo OBS ou Grade 24h)
  const handleReturnToLive = () => {
    setMp4IsVertical(null);
    setPlayerMode("live");
    setCurrentVodVideo(null);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("v");
      window.history.replaceState({}, "", url.toString());
    }
  };

  // 6. Alternar Áudio Global do Player
  const handleToggleGlobalMute = () => {
    const nextMuted = !isGlobalMuted;
    setIsGlobalMuted(nextMuted);

    if (playerMode === "live") {
      if (isObsLiveActive) {
        const video = playerStageRef.current?.querySelector("video");
        if (video) {
          video.muted = nextMuted;
          if (!nextMuted) video.volume = globalVolume / 100;
        }
      } else {
        ytPlayerHandleRef.current?.toggleMute();
      }
    } else {
      const video = playerStageRef.current?.querySelector("video");
      if (video) {
        video.muted = nextMuted;
        if (!nextMuted) video.volume = globalVolume / 100;
      }
    }
  };

  // Controle de Volume Numérico (0 a 100)
  const handleVolumeChange = (newVol: number) => {
    setGlobalVolume(newVol);
    if (newVol === 0) {
      setIsGlobalMuted(true);
    } else if (isGlobalMuted) {
      setIsGlobalMuted(false);
    }

    if (playerMode === "live") {
      if (isObsLiveActive) {
        const video = playerStageRef.current?.querySelector("video");
        if (video) {
          video.volume = newVol / 100;
          video.muted = newVol === 0;
        }
      } else {
        ytPlayerHandleRef.current?.setVolume(newVol);
      }
    } else {
      const video = playerStageRef.current?.querySelector("video");
      if (video) {
        video.volume = newVol / 100;
        video.muted = newVol === 0;
      }
    }
  };

  // Seletor de Qualidade do Player (1080p, 720p, Auto)
  const handleQualityChange = (q: "hd1080" | "hd720" | "auto") => {
    setTvQuality(q);
    if (!isObsLiveActive && playerMode === "live") {
      ytPlayerHandleRef.current?.setQuality(q);
    }
  };

  // 7. Alternar Janela Flutuante Arrastável (Draggable PiP Universal - Bloqueado em Mobile < 768px)
  const handleToggleFloating = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    if (isFloating) {
      setIsFloating(false);
      userDismissedFloatingRef.current = false;
      return;
    }
    userDismissedFloatingRef.current = false;
    if (!floatingPos) {
      initFloatingPos();
    }
    setIsFloating(true);
  };

  // Início do arrasto da Janela Flutuante (Mouse ou Toque na barra superior)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;

    isDraggingRef.current = true;
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const el = playerStageRef.current;
    const rect = el ? el.getBoundingClientRect() : { left: floatingPos?.x ?? 20, top: floatingPos?.y ?? 20 };

    dragOffsetRef.current = {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
    };
  };

  // Movimentação livre (Mouse & Touch) do Mini-Player Flutuante pela tela
  useEffect(() => {
    if (!isFloating) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      if ("touches" in e) {
        if (e.cancelable) e.preventDefault();
      }

      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const el = playerStageRef.current;
      const width = el?.offsetWidth || 320;
      const height = el?.offsetHeight || 180;

      let newX = clientX - dragOffsetRef.current.offsetX;
      let newY = clientY - dragOffsetRef.current.offsetY;

      const maxX = Math.max(8, window.innerWidth - width - 8);
      const maxY = Math.max(8, window.innerHeight - height - 8);

      newX = Math.min(Math.max(8, newX), maxX);
      newY = Math.min(Math.max(8, newY), maxY);

      setFloatingPos({ x: newX, y: newY });
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isFloating, isCurrentVideoVertical]);

  // 8. Tela Cheia com Inteligência de Orientação: 16:9 Landscape vs 9:16 Portrait (Em Pé)
  const handleFullscreenToggle = async () => {
    const container = playerStageRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        } else {
          const video = container.querySelector("video");
          if (video && (video as any).webkitEnterFullscreen) {
            (video as any).webkitEnterFullscreen();
          }
        }

        // Orientação inteligente:
        // - Se 16:9 (Horizontal): Gira o celular para paisagem (landscape)
        // - Se 9:16 (Vertical): NUNCA gira para paisagem! Abre o Reels/Corte em pé preenchendo a tela do celular
        try {
          if (screen.orientation && typeof (screen.orientation as any).lock === "function") {
            if (isCurrentVideoVertical) {
              await (screen.orientation as any).lock("portrait").catch(() => {
                try {
                  if (typeof (screen.orientation as any).unlock === "function") {
                    (screen.orientation as any).unlock();
                  }
                } catch {}
              });
            } else {
              await (screen.orientation as any).lock("landscape").catch(() => {});
            }
          }
        } catch {}
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        try {
          if (screen.orientation && typeof (screen.orientation as any).unlock === "function") {
            (screen.orientation as any).unlock();
          }
        } catch {}
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("[Fullscreen] Falha ao alternar tela cheia:", err);
    }
  };

  // Monitora alterações de Fullscreen pelo navegador/sistema
  useEffect(() => {
    const onFsChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs) {
        try {
          if (screen.orientation && typeof (screen.orientation as any).unlock === "function") {
            (screen.orientation as any).unlock();
          }
        } catch {}
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // Monitora rolagem para acionar Mini-Player Flutuante automaticamente ao rolar além do player (Apenas Desktop >= 768px)
  useEffect(() => {
    const anchor = playerScrollAnchorRef.current;
    if (!anchor || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        // No celular (< 768px): mini-player flutuante é completamente desativado
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          if (isFloating) setIsFloating(false);
          return;
        }

        const entry = entries[0];
        const scrolledPast = entry.boundingClientRect.top < -100;

        if (scrolledPast && !entry.isIntersecting) {
          if (!userDismissedFloatingRef.current && !isFullscreen) {
            if (!floatingPos) initFloatingPos();
            setIsFloating(true);
          }
        } else if (entry.isIntersecting) {
          userDismissedFloatingRef.current = false;
          setIsFloating(false);
        }
      },
      { threshold: [0, 0.2, 1] }
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [isFullscreen, floatingPos, initFloatingPos, isFloating]);

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
    } else if (isObsLiveActive) {
      const text = encodeURIComponent(
        `📺 Assista à *TV Rede Apucarana Ao Vivo*: 👉 https://www.redeapucarana.com.br/tv-online`
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    } else {
      const progTitle = liveCurrentItem?.title || "Transmissão 24h";
      const text = encodeURIComponent(
        `📺 Assista à *TV Rede Apucarana 24h*: No ar agora *${progTitle}* 👉 https://www.redeapucarana.com.br/tv-online`
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-red-600 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOPLINE ESCURA COM LINKS RÁPIDOS E RETORNO (Apenas Desktop)            */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-black/95 border-b border-slate-800/80 text-xs py-2.5 px-4 sticky top-0 z-50 backdrop-blur-md">
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
              Hub Oficial de Streaming • TV Apucarana & RedeCast 24h
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
            ) : isObsLiveActive ? (
              <span className="inline-flex items-center gap-1.5 text-red-400 font-bold text-[11px] bg-red-950/60 border border-red-800/60 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                SINAL DIGITAL OBS AO VIVO (SamCast)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-purple-400 font-bold text-[11px] bg-purple-950/60 border border-purple-800/60 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                GRADE PROGRAMADA 24H (AutoVJ)
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
      {/* 2. CABEÇALHO DO HUB DE STREAMING (Apenas Desktop)                         */}
      {/* ========================================================================= */}
      <header className="hidden md:block bg-slate-900/60 border-b border-slate-800/90 py-4 px-4 sm:px-6 lg:px-8">
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
                  HUB DE STREAMING 24H
                </span>
                <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Tv className="w-3 h-3" /> TV Apucarana
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-600/90 text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Mic className="w-3 h-3" /> RedeCast
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                FAST Channel Híbrido: Transmissões ao vivo do OBS e Grade Contínua 24 Horas
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
      {/* 3. PALCO PRINCIPAL (MOTOR HÍBRIDO OBS <-> LOOP YOUTUBE 24H <-> VOD)       */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-0 md:px-6 lg:px-8 md:py-6 space-y-0 md:space-y-10">
        <div
          ref={playerContainerRef}
          className={`grid gap-0 md:gap-8 transition-all duration-300 ${
            isTheater ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"
          }`}
        >
          {/* COLUNA ESQUERDA: PALCO PRINCIPAL DA TV (8 COLUNAS) */}
          <div className={`space-y-0 md:space-y-4 transition-all ${isTheater ? "w-full" : "lg:col-span-8"}`}>
            {/* Âncora invisível para detecção de scroll do player */}
            <div ref={playerScrollAnchorRef} className="h-0 w-full pointer-events-none" />

            {/* Espaço reservado (Placeholder) para manter o layout estável quando o Mini-Player estiver flutuando */}
            {isFloating && (
              <div
                className={
                  isCurrentVideoVertical
                    ? "w-full max-w-[400px] sm:max-w-none aspect-[9/16] sm:aspect-auto sm:h-[560px] mx-auto rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center text-center p-4"
                    : "w-full aspect-video rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center text-center p-4"
                }
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 animate-pulse ${
                    isCurrentVideoVertical ? "bg-pink-600/20 text-pink-500" : "bg-red-600/20 text-red-500"
                  }`}
                >
                  {isCurrentVideoVertical ? <Smartphone className="w-6 h-6" /> : <Tv className="w-6 h-6" />}
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-200">
                  {isCurrentVideoVertical
                    ? "O corte 9:16 está em reprodução na Janela Flutuante"
                    : "A transmissão está em reprodução na Janela Flutuante"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Você pode continuar assistindo enquanto navega pelo catálogo e notícias abaixo.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsFloating(false);
                    userDismissedFloatingRef.current = false;
                    playerContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className={`mt-3 px-3.5 py-1.5 rounded-lg text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer ${
                    isCurrentVideoVertical ? "bg-pink-600 hover:bg-pink-500" : "bg-red-600 hover:bg-red-500"
                  }`}
                >
                  <span>⬆️ Voltar ao Tamanho Normal</span>
                </button>
              </div>
            )}

            {/* PALCO DO PLAYER (TRANSFORMA-SE EM MINI-PLAYER FLUTUANTE ARRASTÁVEL QUANDO isFloating = true) */}
            <div
              ref={playerStageRef}
              style={
                isFloating && floatingPos
                  ? { left: `${floatingPos.x}px`, top: `${floatingPos.y}px` }
                  : undefined
              }
              className={
                isFloating
                  ? isCurrentVideoVertical
                    ? "fixed z-50 w-40 sm:w-48 aspect-[9/16] rounded-xl shadow-2xl border-2 border-pink-500 bg-black overflow-hidden select-none touch-none animate-in fade-in"
                    : "fixed z-50 w-72 sm:w-96 aspect-video rounded-xl shadow-2xl border-2 border-red-600 bg-black overflow-hidden select-none touch-none animate-in fade-in"
                  : isCurrentVideoVertical
                  ? "fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden md:relative md:inset-auto md:z-auto md:w-full md:max-w-[400px] md:sm:max-w-none md:aspect-[9/16] md:sm:aspect-auto md:sm:h-[560px] md:mx-auto md:rounded-2xl md:bg-black md:shadow-2xl md:border md:border-slate-800 md:transition-all md:duration-300 md:flex md:items-center md:justify-center"
                  : "fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden md:relative md:inset-auto md:z-auto md:w-full md:aspect-video md:rounded-2xl md:bg-black md:shadow-2xl md:border md:border-slate-800 md:transition-all md:duration-300"
              }
            >
              {/* Barra Superior da Janela Flutuante Arrastável (apenas visível quando em modo flutuante) */}
              {isFloating && (
                <div
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  className="absolute top-0 inset-x-0 z-40 bg-gradient-to-b from-black/95 via-black/85 to-transparent p-2 sm:p-2.5 flex items-center justify-between text-white text-xs font-bold backdrop-blur-xs cursor-move select-none border-b border-white/10"
                  title="⠿ Arraste para mover o player livremente pela tela"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-slate-400 font-mono tracking-tighter text-sm">⠿</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCurrentVideoVertical ? "bg-pink-500 animate-ping" : "bg-red-500 animate-ping"
                      } shrink-0`}
                    />
                    <span className="truncate text-[11px] font-black text-white">
                      {isCurrentVideoVertical ? "Corte 9:16" : "TV Rede Apucarana"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
                    {/* Botão de Som rápido no Mini-Player */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleGlobalMute();
                      }}
                      className="w-6 h-6 rounded bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition cursor-pointer"
                      title={isGlobalMuted ? "Ativar som" : "Mutar som"}
                    >
                      {isGlobalMuted ? (
                        <VolumeX className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>

                    {/* Botão de Expandir de volta */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFloating(false);
                        userDismissedFloatingRef.current = false;
                        playerContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Voltar ao Tamanho Normal"
                    >
                      <span>⬆️</span>
                      <span className="hidden xs:inline">Expandir</span>
                    </button>

                    {/* Botão Fechar */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFloating(false);
                        userDismissedFloatingRef.current = true;
                      }}
                      className="w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center text-xs transition cursor-pointer"
                      title="Fechar Janela Flutuante"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* BOTÃO GIGANTE VOLTAR AO MENU (Exclusivo Mobile / Anti-Travamento Idosos)  */}
              {/* ========================================================================= */}
              <div className="block md:hidden">
                <button
                  type="button"
                  onClick={handleExitCinema}
                  className="fixed top-4 left-4 z-[90] px-5 py-3 rounded-full text-base sm:text-lg font-black text-white bg-red-600 hover:bg-red-500 active:scale-95 shadow-[0_4px_25px_rgba(0,0,0,0.8)] border-2 border-white/90 flex items-center gap-2 cursor-pointer select-none transition-all"
                  title="Voltar ao Menu Principal"
                  aria-label="Voltar ao menu inicial"
                >
                  <span className="text-xl leading-none font-black">⬅</span>
                  <span>VOLTAR AO MENU</span>
                </button>
              </div>

              {/* ========================================================================= */}
              {/* BOTÃO GIGANTE DE DESBLOQUEIO DE ÁUDIO POR GESTO (Exclusivo Mobile)        */}
              {/* ========================================================================= */}
              {!isAudioUnlocked && (
                <div
                  onClick={handleUnlockCinemaAudio}
                  className="block md:hidden fixed inset-0 z-[85] bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none"
                >
                  <button
                    type="button"
                    onClick={handleUnlockCinemaAudio}
                    className="group px-6 py-4 sm:px-8 sm:py-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-black text-base sm:text-xl shadow-[0_0_40px_rgba(239,68,68,0.8)] border-3 border-white animate-pulse active:scale-95 hover:scale-105 transition-all flex items-center gap-3 cursor-pointer"
                  >
                    <span className="text-2xl sm:text-3xl animate-bounce">🔊</span>
                    <span className="tracking-wide uppercase">
                      TOCAR PARA ASSISTIR COM SOM (TELA CHEIA)
                    </span>
                  </button>
                  <p className="text-white/80 text-xs sm:text-sm font-bold mt-4 drop-shadow">
                    Toque para liberar o áudio e assistir em tela cheia horizontal
                  </p>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONTAINER COM GIRO HORIZONTAL FORÇADO VIA CSS (90° em portrait no mobile)  */}
              {/* ========================================================================= */}
              <div
                style={
                  shouldRotateHorizontal
                    ? { width: "100vh", height: "100vw" }
                    : { width: "100%", height: "100%" }
                }
                className={`w-full h-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
                  shouldRotateHorizontal ? "rotate-90 origin-center shrink-0" : "rotate-0"
                }`}
              >
                {/* CONTEÚDO ATIVO DO PLAYER */}
                {playerMode === "live" ? (
                  isObsLiveActive ? (
                    // 1.1 ESTADO AO VIVO OBS (SamCast HLS M3U8 com Watchdog de 4 segundos)
                    <div className="relative w-full h-full aspect-video bg-black flex items-center justify-center">
                      <LiveTvPlayer
                        ref={livePlayerRef}
                        onTheaterToggle={() => setIsTheater(!isTheater)}
                        isTheater={isTheater}
                        streamUrl={tvSettings.live_m3u8_url}
                        onStreamActive={() => {
                          setM3u8HasError(false);
                          cooldownUntilRef.current = 0;
                        }}
                        onError={(err) => {
                          console.info("[LiveTvPlayer] Sinal M3U8 caiu/desconectado ou congelou:", err);
                          triggerOfflineCooldown(lastSeenSegmentRef.current);
                        }}
                      />
                    </div>
                  ) : (
                    // 1.2 ESTADO GRADE YOUTUBE 24H (TV REAL: SEM barra de tempo/seek, Enquadramento 100% Original e Zero Cliques)
                    <YouTubeFastGridPlayer
                      ref={ytPlayerHandleRef}
                      playlist={tvPlaylist}
                      onCurrentItemChange={(curr, next, rem) => {
                        setLiveCurrentItem(curr);
                        setLiveNextItem(next);
                        setLiveRemainingSeconds(rem);
                      }}
                      onMuteChange={(muted) => setIsGlobalMuted(muted)}
                    />
                  )
                ) : isCurrentVideoVertical ? (
                  // 2. ESTADO SOB DEMANDA VERTICAL (9:16): Fundo Ambient Blur no Desktop + Moldura Vertical Responsiva
                  <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
                    {/* Fundo Ambient com Blur para Computador (Desktop) */}
                    <div className="hidden sm:block absolute inset-0 pointer-events-none overflow-hidden select-none">
                      <img
                        src={currentVodVideo?.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover filter blur-2xl opacity-40 scale-110"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
                    </div>

                    {/* Barra Superior com Botão de Voltar para a TV */}
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
                        title="Voltar para a TV Ao Vivo"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                        <span>VOLTAR PARA A TV AO VIVO</span>
                      </button>
                    </div>

                    {/* Moldura Centralizada 9:16 (No celular ocupa 100% da tela em pé; no computador mantém h-[520px] aspect-[9/16]) */}
                    <div
                      className={`relative aspect-[9/16] ${
                        isFullscreen
                          ? "h-full max-h-[100dvh] w-auto max-w-[100vw] mx-auto rounded-none"
                          : "w-full h-full sm:w-auto sm:h-[520px] rounded-none sm:rounded-xl sm:border sm:border-slate-700/80"
                      } overflow-hidden shadow-2xl z-10 bg-black flex items-center justify-center my-auto`}
                    >
                      {currentVodVideo?.video_type === "mp4" ? (
                        <video
                          src={currentVodVideo.video_url}
                          controls
                          autoPlay
                          playsInline
                          onLoadedMetadata={(e) => {
                            const v = e.currentTarget;
                            if (v.videoWidth && v.videoHeight) {
                              setMp4IsVertical(v.videoHeight > v.videoWidth);
                            }
                          }}
                          className="w-full h-full object-cover sm:object-contain bg-black"
                        />
                      ) : currentVodVideo?.youtube_id ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${currentVodVideo.youtube_id}?autoplay=1&rel=0&playsinline=1&controls=1&fs=1`}
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
                  <div className="relative w-full h-full aspect-video bg-slate-950 flex flex-col">
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
                        title="Voltar para a programação contínua da TV"
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
                        onLoadedMetadata={(e) => {
                          const v = e.currentTarget;
                          if (v.videoWidth && v.videoHeight) {
                            setMp4IsVertical(v.videoHeight > v.videoWidth);
                          }
                        }}
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : currentVodVideo?.youtube_id ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${currentVodVideo.youtube_id}?autoplay=1&rel=0&playsinline=1&controls=1&fs=1`}
                        title={currentVodVideo.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* BARRA DE CONTROLE MODERNA DO PLAYER (Apenas Desktop)                      */}
            {/* ========================================================================= */}
            <div className="hidden md:flex bg-slate-900/95 border border-slate-800 rounded-xl px-3 sm:px-4 py-2.5 items-center justify-between gap-3 shadow-lg">
              {/* Lado Esquerdo: Áudio & Slider de Volume & Status */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Botão Mute / Unmute */}
                <button
                  type="button"
                  onClick={handleToggleGlobalMute}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    isGlobalMuted
                      ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  }`}
                  title={isGlobalMuted ? "Clique para ativar o áudio" : "Mutar áudio"}
                >
                  {isGlobalMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 text-white" />
                      <span>Ativar Som</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span className="hidden sm:inline">Som Ligado</span>
                    </>
                  )}
                </button>

                {/* Slider de Volume Funcional */}
                <div className="hidden xs:flex items-center gap-1.5">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isGlobalMuted ? 0 : globalVolume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-16 sm:w-20 h-1.5 bg-slate-700 accent-red-500 rounded-lg cursor-pointer"
                    title={`Volume: ${isGlobalMuted ? 0 : globalVolume}%`}
                  />
                  <span className="text-[10px] font-mono text-slate-400 w-7">
                    {isGlobalMuted ? "0%" : `${globalVolume}%`}
                  </span>
                </div>

                {/* Indicador de Transmissão */}
                <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-800 pl-3">
                  {playerMode === "live" ? (
                    isObsLiveActive ? (
                      <span className="flex items-center gap-1.5 text-red-400 font-bold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        Ao Vivo OBS (SamCast)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-purple-400 font-bold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        Grade 24h Contínua
                      </span>
                    )
                  ) : isCurrentVideoVertical ? (
                    <span className="flex items-center gap-1.5 text-pink-400 font-bold text-[11px]">
                      <Smartphone className="w-3.5 h-3.5" />
                      Corte Vertical 9:16
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px]">
                      <span>▶️</span> Vídeo Sob Demanda (16:9)
                    </span>
                  )}
                </div>
              </div>

              {/* Lado Direito: Qualidade, Janela Flutuante, Teatro e Tela Cheia */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Seletor de Qualidade do Player */}
                <div className="relative group/qual">
                  <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    title="Qualidade do Vídeo"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {tvQuality === "hd1080" ? "1080p" : tvQuality === "hd720" ? "720p" : "Auto"}
                    </span>
                  </button>
                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover/qual:flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-30 min-w-[120px]">
                    <button
                      type="button"
                      onClick={() => handleQualityChange("hd1080")}
                      className={`px-3 py-1.5 rounded text-left text-xs font-bold transition cursor-pointer ${
                        tvQuality === "hd1080" ? "bg-red-600 text-white" : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      1080p Full HD
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQualityChange("hd720")}
                      className={`px-3 py-1.5 rounded text-left text-xs font-bold transition cursor-pointer ${
                        tvQuality === "hd720" ? "bg-red-600 text-white" : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      720p HD
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQualityChange("auto")}
                      className={`px-3 py-1.5 rounded text-left text-xs font-bold transition cursor-pointer ${
                        tvQuality === "auto" ? "bg-red-600 text-white" : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      Automático
                    </button>
                  </div>
                </div>

                {/* Botão Janela Flutuante (Mini-Player Arrastável - Oculto em Telas Mobile < 768px) */}
                <button
                  type="button"
                  onClick={handleToggleFloating}
                  className={`hidden md:inline-flex px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all items-center gap-1.5 cursor-pointer border ${
                    isFloating
                      ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white"
                  }`}
                  title="Assistir em Janela Flutuante Arrastável enquanto navega pelo site"
                >
                  <PictureInPicture className="w-4 h-4 text-amber-400" />
                  <span>Janela Flutuante</span>
                </button>

                {/* Botão Modo Teatro (Expandir Largura) */}
                <button
                  type="button"
                  onClick={() => setIsTheater((prev) => !prev)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all hidden sm:flex items-center gap-1.5 cursor-pointer border ${
                    isTheater
                      ? "bg-red-600/20 text-red-400 border-red-500/40"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white"
                  }`}
                  title={isTheater ? "Voltar ao Modo Normal" : "Expandir para Modo Teatro"}
                >
                  <Expand className="w-4 h-4 text-slate-300" />
                  <span>Teatro</span>
                </button>

                {/* Botão Tela Cheia (Respeita 16:9 Landscape vs 9:16 Portrait no smartphone) */}
                <button
                  type="button"
                  onClick={handleFullscreenToggle}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                  title={
                    isFullscreen
                      ? "Sair da Tela Cheia"
                      : isCurrentVideoVertical
                      ? "Tela Cheia Vertical (Sem Girar Celular)"
                      : "Tela Cheia (Girar Celular em Paisagem)"
                  }
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-4 h-4 text-emerald-400" />
                      <span className="hidden xs:inline">Restaurar</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4 text-emerald-400" />
                      <span className="hidden xs:inline">
                        {isCurrentVideoVertical ? "Tela Cheia 9:16" : "Tela Cheia"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* BARRA DE INFORMAÇÕES ABAIXO DO PLAYER (Apenas Desktop)                    */}
            {/* ========================================================================= */}
            <div className="hidden md:flex bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                {playerMode === "live" ? (
                  isObsLiveActive ? (
                    // Informações do Sinal Ao Vivo OBS
                    <>
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-red-400">
                          TRANSMISSÃO AO VIVO DO ESTÚDIO (OBS SAMCAST)
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          HD 1080p
                        </span>
                      </div>

                      <h1 className="font-heading font-extrabold text-lg sm:text-xl text-white truncate">
                        {tvSettings.live_program_title || "TV Rede Apucarana Ao Vivo"}
                      </h1>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                        Sinal direto do estúdio com jornalismo regional, utilidade pública e entrevistas das 27 cidades do Vale do Ivaí.
                      </p>
                    </>
                  ) : (
                    // Informações da Grade 24h Automatizada (YouTube Loop)
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-purple-400">
                          NO AR AGORA NA GRADE 24H
                        </span>
                        {liveCurrentItem && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getPlaylistItemTypeMeta(liveCurrentItem.type).badgeBg}`}>
                            {getPlaylistItemTypeMeta(liveCurrentItem.type).icon} {getPlaylistItemTypeMeta(liveCurrentItem.type).label}
                          </span>
                        )}
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-amber-300 font-mono font-bold">
                          ⏱ Restam {liveRemainingSeconds > 0 ? formatClockTime(liveRemainingSeconds) : "Avançando..."}
                        </span>
                      </div>

                      <h1 className="font-heading font-extrabold text-lg sm:text-xl text-white leading-snug truncate">
                        {liveCurrentItem?.title || "Grade Contínua da TV Rede Apucarana"}
                      </h1>

                      {/* BLOCO "A SEGUIR NA GRADE" */}
                      {liveNextItem && (
                        <div className="text-xs text-slate-300 flex items-center gap-1.5 pt-1 truncate">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            ⏭ A Seguir:
                          </span>
                          <span className="font-bold text-slate-200 truncate">
                            {liveNextItem.title}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            ({formatClockTime(liveNextItem.duration_seconds)})
                          </span>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  // Informações de Vídeo Sob Demanda (VOD)
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

          {/* COLUNA DIREITA: DESTAQUES DOS CANAIS & GRADE COM 3 ABAS (Apenas Desktop) */}
          <div className={`space-y-4 hidden md:block ${isTheater ? "w-full" : "lg:col-span-4"}`}>
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
                              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 cursor-pointer"
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
                              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 cursor-pointer"
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

              {/* CONTEÚDO DA ABA 3: GRADE DINÂMICA DA TV (PLAYLIST 24H) */}
              {activeTabSidebar === "grade" && (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1 pb-1">
                    <span>Grade 24h em Execução</span>
                    <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      {tvPlaylist.filter((i) => i.active).length} blocos
                    </span>
                  </div>

                  {tvPlaylist.map((item, idx) => {
                    const isCurrent = liveCurrentItem?.id === item.id;
                    const meta = getPlaylistItemTypeMeta(item.type);

                    return (
                      <div
                        key={item.id}
                        onClick={handleReturnToLive}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-purple-950/50 border-purple-600 shadow-md ring-1 ring-purple-400"
                            : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`font-mono text-[10px] font-bold ${
                              isCurrent ? "text-amber-400" : "text-slate-400"
                            }`}
                          >
                            #{idx + 1} · {formatClockTime(item.duration_seconds)}
                          </span>

                          {isCurrent ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              No Ar
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-500 font-semibold">
                              {meta.icon} {meta.label}
                            </span>
                          )}
                        </div>

                        <h4
                          className={`font-heading font-bold text-xs truncate ${
                            isCurrent ? "text-white font-extrabold" : "text-slate-200"
                          }`}
                        >
                          {item.title}
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
                  Publicidade em Vídeo 24h
                </span>
                <p className="text-xs font-bold text-white leading-tight mt-0.5">
                  Anuncie sua marca nos comerciais da TV Apucarana & RedeCast
                </p>
              </div>
              <a
                href="https://wa.me/5543999809454?text=Ol%C3%A1%2C%20gostaria%20de%20inserir%20um%20comercial%20na%20Grade%2024h%20da%20Rede%20Apucarana"
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
          <section className="hidden md:block space-y-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-purple-950/20 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
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
        {/* 4. PRATELEIRAS HORIZONTAIS 16:9 (Apenas Desktop)                          */}
        {/* ========================================================================= */}
        <section className="hidden md:block space-y-8 pt-4">
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
      {/* 5. FOOTER DA EMISSORA (Apenas Desktop)                                   */}
      {/* ========================================================================= */}
      <footer className="hidden md:block bg-black border-t border-slate-900 py-6 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <img
              src="/logo-rede-apucarana.png"
              alt="Rede Apucarana de Comunicação"
              className="h-8 w-auto object-contain opacity-75"
            />
            <span>
              © {new Date().getFullYear()} Hub de Streaming 24h • TV Rede Apucarana & RedeCast
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
          <p className="text-sm font-bold text-slate-400">Carregando Hub de Streaming 24h • TV Apucarana & RedeCast...</p>
        </div>
      }
    >
      <TvOnlineHubContent />
    </Suspense>
  );
}
