"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  PictureInPicture,
  Tv,
  RefreshCw,
  Scaling,
  Expand,
  Radio,
  Sliders,
} from "lucide-react";

interface LiveTvPlayerProps {
  streamUrl?: string;
  poster?: string;
  autoPlay?: boolean;
  onTheaterToggle?: () => void;
  isTheater?: boolean;
  className?: string;
  showTheaterButton?: boolean;
  onError?: (errorType?: string) => void;
  onStreamActive?: () => void;
}

const DEFAULT_STREAM =
  "https://Stmv1.samcast.com.br/tvapucarana/tvapucarana/playlist.m3u8";

export default function LiveTvPlayer({
  streamUrl = DEFAULT_STREAM,
  poster = "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=1280&auto=format&fit=crop&q=80",
  autoPlay = true,
  onTheaterToggle,
  isTheater = false,
  className = "",
  showTheaterButton = true,
  onError,
  onStreamActive,
}: LiveTvPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [objectFit, setObjectFit] = useState<"cover" | "contain">("cover");
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Manipulação de visibilidade automática dos controles
  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false);
      }
    }, 3500);
  }, []);

  // Inicialização e recuperação inteligente do HLS
  const initStream = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setHasError(false);
    setIsBuffering(false);

    try {
      const HlsModule = (await import("hls.js")).default;

      if (HlsModule.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new HlsModule({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
          maxBufferLength: 20,
          maxMaxBufferLength: 40,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 6,
          manifestLoadingRetryDelay: 1000,
          levelLoadingTimeOut: 15000,
          levelLoadingMaxRetry: 5,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
        });

        hlsRef.current = hls;

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          setIsBuffering(false);
          onStreamActive?.();
          if (autoPlay) {
            video.muted = true;
            setIsMuted(true);
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => setIsPlaying(true))
                .catch((e) => {
                  console.warn("[Autoplay prevenido pelo navegador]:", e);
                  setIsPlaying(false);
                });
            }
          }
        });

        hls.on(HlsModule.Events.BUFFER_APPENDING, () => {
          setIsBuffering(false);
        });

        hls.on(HlsModule.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal) {
            console.warn("[HLS Error Fatal]:", data.type, data.details);
            onError?.(data?.details || data?.type || "hls_fatal_error");
            switch (data.type) {
              case HlsModule.ErrorTypes.NETWORK_ERROR:
                setIsBuffering(true);
                hls.startLoad();
                break;
              case HlsModule.ErrorTypes.MEDIA_ERROR:
                setIsBuffering(true);
                hls.recoverMediaError();
                break;
              default:
                setHasError(true);
                setErrorMessage(
                  "Sinal temporariamente indisponível. Reconectando..."
                );
                hls.destroy();
                setTimeout(() => {
                  setRetryCount((prev) => prev + 1);
                }, 3000);
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Fallback nativo HLS (Safari / iOS)
        video.src = streamUrl;
        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false);
          setIsBuffering(false);
          onStreamActive?.();
          if (autoPlay) {
            video.muted = true;
            setIsMuted(true);
            video
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          }
        });

        video.addEventListener("waiting", () => setIsBuffering(true));
        video.addEventListener("playing", () => {
          setIsBuffering(false);
          setIsPlaying(true);
          onStreamActive?.();
        });
        video.addEventListener("error", () => {
          setHasError(true);
          setErrorMessage("Erro ao sintonizar transmissão nativa.");
          onError?.("native_video_error");
        });
      } else {
        setHasError(true);
        setErrorMessage(
          "Seu navegador não oferece suporte à reprodução de streaming HLS."
        );
      }
    } catch (err: any) {
      console.error("Falha ao inicializar player HLS:", err);
      setHasError(true);
      setErrorMessage("Não foi possível carregar o player de vídeo.");
    }
  }, [streamUrl, autoPlay]);

  useEffect(() => {
    initStream();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [initStream, retryCount]);

  // Listener de eventos do elemento de vídeo nativo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsLoading(false);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
    };
  }, []);

  // Monitoramento de Fullscreen
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

  // Monitoramento de Picture-in-Picture
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnterPip = () => setIsPiP(true);
    const onLeavePip = () => setIsPiP(false);

    video.addEventListener("enterpictureinpicture", onEnterPip);
    video.addEventListener("leavepictureinpicture", onLeavePip);

    return () => {
      video.removeEventListener("enterpictureinpicture", onEnterPip);
      video.removeEventListener("leavepictureinpicture", onLeavePip);
    };
  }, []);

  // Ações do Player
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.warn);
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    showControlsTemporarily();
  };

  const handleUnlockAudio = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1;
    setVolume(1);
    setIsMuted(false);
    setIsAudioUnlocked(true);

    if (video.paused) {
      video.play().catch(console.warn);
      setIsPlaying(true);
    }
    showControlsTemporarily();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.muted) {
      video.muted = false;
      video.volume = volume > 0 ? volume : 1;
      setIsMuted(false);
      setIsAudioUnlocked(true);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
    showControlsTemporarily();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;

    video.volume = val;
    setVolume(val);

    if (val === 0) {
      video.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      setIsAudioUnlocked(true);
    }
    showControlsTemporarily();
  };

  const toggleObjectFit = () => {
    setObjectFit((prev) => (prev === "cover" ? "contain" : "cover"));
    showControlsTemporarily();
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (err) {
      console.warn("Falha no Picture-in-Picture:", err);
    }
    showControlsTemporarily();
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        } else if (video && (video as any).webkitEnterFullscreen) {
          (video as any).webkitEnterFullscreen();
        }

        // Tenta travar em paisagem no smartphone
        try {
          if (screen.orientation && typeof (screen.orientation as any).lock === "function") {
            await (screen.orientation as any).lock("landscape").catch(() => {});
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
      console.warn("Falha no modo Fullscreen:", err);
    }
    showControlsTemporarily();
  };

  const reloadStream = () => {
    setRetryCount((c) => c + 1);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => {
        if (isPlaying) setControlsVisible(false);
      }}
      onTouchStart={showControlsTemporarily}
      className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 group select-none ${className}`}
    >
      {/* Vídeo Nativo */}
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        autoPlay={autoPlay}
        muted={isMuted}
        onClick={togglePlay}
        className={`w-full h-full cursor-pointer transition-all duration-300 ${
          objectFit === "cover" ? "object-cover" : "object-contain"
        }`}
      />

      {/* OVERLAY DE TRANSMISSÃO SUPERIOR (HUD BROADCAST) */}
      <div
        className={`absolute top-0 inset-x-0 p-3 sm:p-4 flex items-center justify-between pointer-events-none transition-opacity duration-300 z-20 ${
          controlsVisible || isMuted || isLoading || isBuffering
            ? "opacity-100"
            : "opacity-0"
        }`}
      >
        {/* Lado Esquerdo: Badge Ao Vivo + Resolução */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider backdrop-blur-md shadow-lg border border-red-500/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span>AO VIVO</span>
            <span className="hidden sm:inline font-bold opacity-80">·</span>
            <span className="hidden sm:inline font-bold">TV REDE APUCARANA</span>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-amber-400 font-bold text-[10px] sm:text-xs border border-amber-500/30 backdrop-blur-md shadow-sm">
            HD 1080p
          </span>
        </div>

        {/* Lado Direito: Marca d'água oficial */}
        <div className="flex items-center gap-2">
          <img
            src="/logo-rede-apucarana.png"
            alt="Rede Apucarana de Comunicação"
            className="h-7 sm:h-9 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity drop-shadow-md"
          />
        </div>
      </div>

      {/* BOTÃO ULTRA-CHAMATIVO: TOQUE PARA ATIVAR O ÁUDIO */}
      {isMuted && !isLoading && !hasError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-none">
          <button
            type="button"
            onClick={handleUnlockAudio}
            className="pointer-events-auto group/btn flex items-center gap-3 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-2xl border-2 border-white/90 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce"
            title="Clique para ligar o som da TV"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="tracking-wide">
              🔊 Toque para Ativar o Áudio da TV
            </span>
            <span className="hidden md:inline-flex px-2 py-0.5 rounded bg-black/30 text-[10px] uppercase font-mono">
              Som 100%
            </span>
          </button>
        </div>
      )}

      {/* OVERLAY DE CARREGAMENTO / BUFFERING / ERRO */}
      {(isLoading || isBuffering || hasError) && (
        <div className="absolute inset-0 z-25 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
          {hasError ? (
            <div className="space-y-3 max-w-md">
              <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 mx-auto flex items-center justify-center">
                <Tv className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-black text-lg text-white">
                Falha na Conexão com o Transmissor
              </h3>
              <p className="text-xs text-slate-300">
                {errorMessage ||
                  "O sinal da TV Rede Apucarana está temporariamente em manutenção ou a rede oscilou."}
              </p>
              <button
                type="button"
                onClick={reloadStream}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg hover:scale-105"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Tentar Conectar Novamente</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-30" />
                <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl">
                  <Radio className="w-7 h-7 animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm sm:text-base text-white">
                  Sintonizando sinal da TV Rede Apucarana...
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Conectando transmissão em alta definição (1080p 60fps)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BARRA INFERIOR DE CONTROLES MODERNA */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-3 px-3 sm:px-5 flex items-center justify-between gap-3 text-white transition-opacity duration-300 z-20 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Controles da Esquerda: Play/Pause, Volume, Ao Vivo */}
        <div className="flex items-center gap-3">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
            title={isPlaying ? "Pausar" : "Reproduzir"}
            aria-label={isPlaying ? "Pausar" : "Reproduzir"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Volume & Mute */}
          <div className="flex items-center gap-2 group/vol">
            <button
              type="button"
              onClick={toggleMute}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              title={isMuted ? "Ativar som" : "Desativar som"}
              aria-label={isMuted ? "Ativar som" : "Desativar som"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Slider de volume com hover dinâmico */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 h-1.5 bg-slate-700 accent-red-500 rounded-lg cursor-pointer"
              title="Ajustar Volume"
            />
          </div>

          {/* Indicador de Transmissão Contínua */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-300 bg-white/10 px-2.5 py-1 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>TRANSMISSÃO 24H</span>
          </div>
        </div>

        {/* Controles da Direita: Preencher/Ajustar, Teatro, PiP, Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Alternar Preencher Tela (cover) vs Ajustar (contain) */}
          <button
            type="button"
            onClick={toggleObjectFit}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              objectFit === "cover"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
            title={
              objectFit === "cover"
                ? "Modo: Preencher Tela (sem barras pretas)"
                : "Modo: Ajustar Proporção Original"
            }
          >
            <Scaling className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {objectFit === "cover" ? "Preencher Tela" : "Ajustar"}
            </span>
          </button>

          {/* Picture-in-Picture */}
          <button
            type="button"
            onClick={togglePiP}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isPiP
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title="Picture-in-Picture (Assistir enquanto navega)"
            aria-label="Picture in Picture"
          >
            <PictureInPicture className="w-4 h-4" />
          </button>

          {/* Modo Teatro */}
          {showTheaterButton && onTheaterToggle && (
            <button
              type="button"
              onClick={onTheaterToggle}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isTheater
                  ? "bg-red-600 text-white"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title={isTheater ? "Modo Padrão" : "Modo Teatro (Expandir)"}
              aria-label="Alternar modo teatro"
            >
              <Expand className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            aria-label="Alternar tela cheia"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
