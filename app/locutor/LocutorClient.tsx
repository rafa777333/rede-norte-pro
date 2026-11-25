"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Radio,
  Tv,
  SwitchCamera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Lock,
  Unlock,
  AlertCircle,
  Square,
  Sparkles,
  Wifi,
  WifiOff,
  Volume2,
} from "lucide-react";

const DEFAULT_PIN = process.env.NEXT_PUBLIC_LOCUTOR_PIN || "1935";
const STORAGE_AUTH_KEY = "rede_locutor_authorized";

export default function LocutorClient() {
  // 1. Estado de Autorização (PIN de 4 dígitos)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);

  // 2. Mídia Local (Câmera + Microfone)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isExternalMic, setIsExternalMic] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // 3. Estado da Transmissão WebRTC (WHIP)
  const [broadcastStatus, setBroadcastStatus] = useState<
    "idle" | "connecting" | "live" | "reconnecting" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const whipLocationRef = useRef<string | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioAnimFrameRef = useRef<number | null>(null);

  // Inicializa verificação do PIN do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_AUTH_KEY);
      setIsAuthorized(stored === "true");
    } catch {
      setIsAuthorized(false);
    }
  }, []);

  // Handler do Teclado Numérico do PIN
  const handlePinDigit = useCallback(
    (digit: string) => {
      setPinError(null);
      setPinInput((prev) => {
        if (prev.length >= 4) return prev;
        const next = prev + digit;
        if (next.length === 4) {
          if (next === DEFAULT_PIN) {
            try {
              localStorage.setItem(STORAGE_AUTH_KEY, "true");
            } catch {}
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([40, 60, 40]);
            }
            setIsAuthorized(true);
            return "";
          } else {
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([100, 50, 100]);
            }
            setPinError("PIN Incorreto. Tente novamente.");
            return "";
          }
        }
        return next;
      });
    },
    []
  );

  const handlePinBackspace = useCallback(() => {
    setPinError(null);
    setPinInput((prev) => prev.slice(0, -1));
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    } catch {}
    setIsAuthorized(false);
    setPinInput("");
  }, []);

  // Inicia ou altera a câmera
  const startCamera = useCallback(
    async (mode: "user" | "environment", highFidelityAudio: boolean) => {
      setCameraError(null);

      // Encerra faixas anteriores se existirem
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }

      const videoConstraints: MediaTrackConstraints = {
        facingMode: mode,
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 30 },
      };

      const audioConstraints: MediaTrackConstraints = highFidelityAudio
        ? {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 2,
          }
        : {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        });

        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Configura VU Meter de Áudio em tempo real
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            if (!audioContextRef.current || audioContextRef.current.state === "closed") {
              audioContextRef.current = new AudioCtx();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === "suspended") {
              ctx.resume().catch(() => {});
            }
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            audioAnalyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
              audioAnimFrameRef.current = requestAnimationFrame(checkVolume);
            };
            checkVolume();
          }
        } catch (e) {
          console.warn("[Estúdio Móvel] VU Meter indisponível:", e);
        }
      } catch (err: any) {
        console.error("[Estúdio Móvel] Erro ao acessar câmera/microfone:", err);
        setCameraError(
          err.name === "NotAllowedError"
            ? "Permissão negada. Conceda acesso à Câmera e Microfone no navegador para entrar ao vivo."
            : `Falha ao iniciar câmera: ${err.message || "Dispositivo ocupado ou incompatível."}`
        );
      }
    },
    [localStream]
  );

  // Inicia câmera ao desbloquear
  useEffect(() => {
    if (isAuthorized) {
      startCamera(facingMode, isExternalMic);
    }
    return () => {
      if (audioAnimFrameRef.current) {
        cancelAnimationFrame(audioAnimFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isAuthorized]);

  // Alterna Câmera Frontal / Traseira
  const handleToggleCamera = useCallback(() => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode, isExternalMic);
  }, [facingMode, isExternalMic, startCamera]);

  // Alterna Modo de Áudio (Microfone Externo / Música vs Padrão)
  const handleToggleMicMode = useCallback(() => {
    const next = !isExternalMic;
    setIsExternalMic(next);
    startCamera(facingMode, next);
  }, [facingMode, isExternalMic, startCamera]);

  // Cronômetro de Tempo No Ar
  useEffect(() => {
    if (broadcastStatus === "live") {
      setElapsedSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setElapsedSeconds(0);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [broadcastStatus]);

  const formattedTime = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, [elapsedSeconds]);

  // =========================================================================
  // MOTOR DE TRANSMISSÃO WEBRTC (WHIP)
  // =========================================================================

  const stopBroadcast = useCallback(async () => {
    setBroadcastStatus("idle");

    if (whipLocationRef.current) {
      try {
        await fetch(
          `/api/locutor/whip?location=${encodeURIComponent(whipLocationRef.current)}`,
          { method: "DELETE" }
        );
      } catch {}
      whipLocationRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  }, []);

  const startBroadcast = useCallback(async () => {
    if (!localStream) {
      setErrorMessage("Ative a câmera e microfone antes de transmitir.");
      return;
    }

    setErrorMessage(null);
    setBroadcastStatus("connecting");

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
        bundlePolicy: "max-bundle",
      });

      peerConnectionRef.current = pc;

      // Adiciona faixas de vídeo e áudio locais à conexão
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Monitora estado da conexão com tratamento em português
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.info("[WHIP PeerConnection State]:", state);
        if (state === "connected") {
          setBroadcastStatus("live");
          setErrorMessage(null);
        } else if (state === "disconnected" || state === "failed") {
          setBroadcastStatus("reconnecting");
          setErrorMessage("Sem sinal de internet, tentando restabelecer conexão...");
        } else if (state === "closed") {
          setBroadcastStatus("idle");
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
          setBroadcastStatus("reconnecting");
          setErrorMessage("Falha de conexão ICE. Tentando reconectar...");
          try {
            pc.restartIce();
          } catch {}
        }
      };

      // 1. Gera a Oferta SDP
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });

      await pc.setLocalDescription(offer);

      // 2. Aguarda coleta de candidatos ICE (ou timeout de 1.5s)
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
        } else {
          const checkState = () => {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", checkState);
              resolve();
            }
          };
          pc.addEventListener("icegatheringstatechange", checkState);
          setTimeout(resolve, 1500);
        }
      });

      const sdpToSend = pc.localDescription?.sdp || offer.sdp;

      // 3. Envia o handshake WHIP via rota protegida do Next.js
      const res = await fetch("/api/locutor/whip", {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
        },
        body: sdpToSend,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.error ||
            `Falha ao conectar com o Servidor de TV (Status ${res.status}).`
        );
      }

      // 4. Recebe a Resposta SDP (Answer) do MediaMTX
      const answerSdp = await res.text();
      whipLocationRef.current = res.headers.get("Location");

      await pc.setRemoteDescription(
        new RTCSessionDescription({
          type: "answer",
          sdp: answerSdp,
        })
      );

      // Se a conexão WebRTC já estiver engatada, marca como LIVE
      setBroadcastStatus("live");
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([80, 50, 80]);
      }
    } catch (err: any) {
      console.error("[WHIP Handshake Error]:", err);
      setBroadcastStatus("error");
      setErrorMessage(
        err.message ||
          "Não foi possível conectar ao servidor da TV. Verifique se o computador do estúdio está com a janela preta aberta."
      );
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    }
  }, [localStream]);

  // Alterna entre Iniciar e Parar
  const handleMainButtonClick = useCallback(() => {
    if (broadcastStatus === "live" || broadcastStatus === "connecting" || broadcastStatus === "reconnecting") {
      stopBroadcast();
    } else {
      startBroadcast();
    }
  }, [broadcastStatus, startBroadcast, stopBroadcast]);

  // =========================================================================
  // RENDERIZAÇÃO: TELA DE BLOQUEIO (PIN)
  // =========================================================================
  if (isAuthorized === false) {
    return (
      <div className="fixed inset-0 bg-slate-950 text-white flex flex-col justify-between p-6 select-none touch-manipulation z-50 overflow-hidden font-sans">
        {/* Cabeçalho */}
        <div className="pt-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-2xl shadow-red-600/30 mb-4 border border-red-500/30">
            <Radio className="w-9 h-9 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-100 uppercase">
            Estúdio Móvel
          </h1>
          <p className="text-sm font-semibold text-red-400 uppercase tracking-widest mt-1">
            Rede Apucarana de Comunicação
          </p>
          <p className="text-xs text-slate-400 mt-3 max-w-xs">
            Digite o PIN de 4 dígitos para liberar a câmera e entrar ao vivo pelo celular.
          </p>
        </div>

        {/* Indicadores de Dígitos (Bolinhas) */}
        <div className="my-auto flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-6 h-6 rounded-full transition-all duration-200 border-2 ${
                    isFilled
                      ? "bg-red-500 border-red-400 scale-110 shadow-lg shadow-red-500/50"
                      : "bg-slate-900 border-slate-700"
                  }`}
                />
              );
            })}
          </div>

          {pinError && (
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold animate-bounce mt-2 bg-rose-950/60 border border-rose-800/60 px-4 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}
        </div>

        {/* Teclado Numérico Gigante Touch-Friendly */}
        <div className="w-full max-w-sm mx-auto pb-4">
          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handlePinDigit(digit)}
                className="h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-700 active:scale-95 text-2xl font-black text-slate-100 flex items-center justify-center border border-slate-800 shadow-md transition-all touch-manipulation"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPinInput("")}
              className="h-16 rounded-2xl bg-slate-950 active:bg-slate-900 text-xs font-bold text-slate-500 flex items-center justify-center uppercase tracking-wider transition-all"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={() => handlePinDigit("0")}
              className="h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-700 active:scale-95 text-2xl font-black text-slate-100 flex items-center justify-center border border-slate-800 shadow-md transition-all touch-manipulation"
            >
              0
            </button>

            <button
              type="button"
              onClick={handlePinBackspace}
              className="h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-700 active:scale-95 text-slate-300 flex items-center justify-center border border-slate-800 shadow-md transition-all"
            >
              ⌫
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se ainda estiver checando o localStorage no primeiro frame
  if (isAuthorized === null) {
    return <div className="fixed inset-0 bg-black" />;
  }

  // =========================================================================
  // RENDERIZAÇÃO: ESTÚDIO MÓVEL (TELA CHEIA / PWA)
  // =========================================================================
  const isStreaming = broadcastStatus === "live" || broadcastStatus === "connecting" || broadcastStatus === "reconnecting";

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col justify-between overflow-hidden select-none font-sans z-50">
      {/* 1. PREVIEW DA CÂMERA EM TELA CHEIA */}
      <div className="absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            facingMode === "user" ? "scale-x-[-1]" : ""
          }`}
        />

        {/* Gradiente escuro no topo e na base para dar alto contraste aos botões */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

        {/* Erro de Câmera */}
        {cameraError && (
          <div className="absolute inset-4 z-30 bg-black/90 rounded-3xl p-6 flex flex-col items-center justify-center text-center border border-red-500/40 backdrop-blur-md">
            <VideoOff className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-black text-white uppercase mb-2">
              Acesso à Câmera Bloqueado
            </h2>
            <p className="text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
              {cameraError}
            </p>
            <button
              onClick={() => startCamera(facingMode, isExternalMic)}
              className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase rounded-2xl shadow-xl active:scale-95 transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        )}
      </div>

      {/* 2. BARRA SUPERIOR (HEADER) */}
      <div className="relative z-20 pt-safe px-4 pt-3 flex items-start justify-between gap-3">
        {/* Lado Esquerdo: Identificação e Status No Ar */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700/80 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5 shadow-lg">
              <Tv className="w-3.5 h-3.5 text-red-500" />
              <span>Rede Apucarana</span>
            </span>

            {broadcastStatus === "live" && (
              <span className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-red-600/50 animate-pulse border border-red-400/50">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>NO AR</span>
              </span>
            )}
          </div>

          {/* Cronômetro Gigante Quando No Ar */}
          {broadcastStatus === "live" && (
            <div className="px-3.5 py-1 rounded-2xl bg-black/85 border border-red-500/50 backdrop-blur-lg shadow-2xl flex items-center gap-2 self-start">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wider drop-shadow-md">
                {formattedTime}
              </span>
            </div>
          )}
        </div>

        {/* Lado Direito: Botões de Controle Rápido */}
        <div className="flex items-center gap-2">
          {/* Botão Alternar Câmera (Frontal / Traseira) */}
          <button
            type="button"
            onClick={handleToggleCamera}
            className="w-12 h-12 rounded-2xl bg-black/75 hover:bg-black active:scale-90 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xl transition-all"
            title="Alternar Câmera"
          >
            <SwitchCamera className="w-6 h-6 text-slate-100" />
          </button>

          {/* Botão Alternar Modo de Microfone */}
          <button
            type="button"
            onClick={handleToggleMicMode}
            className={`w-12 h-12 rounded-2xl border backdrop-blur-md flex items-center justify-center shadow-xl active:scale-90 transition-all ${
              isExternalMic
                ? "bg-amber-600 border-amber-400 text-white shadow-amber-600/30"
                : "bg-black/75 border-white/20 text-slate-200"
            }`}
            title={isExternalMic ? "Modo Estúdio/Alta Fidelidade Ativo" : "Modo Microfone Padrão"}
          >
            <Mic className="w-6 h-6" />
          </button>

          {/* Botão Sair / Bloquear */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-12 h-12 rounded-2xl bg-black/75 hover:bg-black active:scale-90 border border-white/20 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-white shadow-xl transition-all"
            title="Bloquear Estúdio Móvel"
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. AVISOS E BANNERS DE STATUS */}
      <div className="relative z-20 px-4 flex flex-col items-center gap-2">
        {broadcastStatus === "connecting" && (
          <div className="px-5 py-3 rounded-2xl bg-amber-500/90 border border-amber-300 text-slate-950 font-black text-sm uppercase tracking-wide flex items-center gap-2 shadow-2xl backdrop-blur-md animate-pulse">
            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            <span>Conectando ao Servidor da TV...</span>
          </div>
        )}

        {broadcastStatus === "reconnecting" && (
          <div className="px-5 py-3 rounded-2xl bg-amber-600 text-white font-bold text-xs uppercase tracking-wide flex items-center gap-2 shadow-2xl backdrop-blur-md animate-bounce border border-amber-400">
            <WifiOff className="w-4 h-4" />
            <span>Sem sinal de internet, tentando reconectar...</span>
          </div>
        )}

        {errorMessage && (
          <div className="max-w-md w-full px-4 py-3 rounded-2xl bg-rose-950/90 border border-rose-500/80 text-rose-100 text-xs font-semibold flex items-center gap-3 shadow-2xl backdrop-blur-md">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="flex-1 leading-snug">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 4. ÁREA INFERIOR (VU METER + O BOTÃO GIGANTE) */}
      <div className="relative z-20 px-4 pb-safe pb-6 flex flex-col gap-3 max-w-lg mx-auto w-full">
        {/* Barra VU Meter do Microfone em Tempo Real */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 border border-white/15 backdrop-blur-md">
          <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                audioLevel > 75
                  ? "bg-red-500"
                  : audioLevel > 40
                  ? "bg-amber-400"
                  : "bg-emerald-400"
              }`}
              style={{ width: `${Math.max(5, audioLevel)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest w-12 text-right">
            {isExternalMic ? "PRO" : "MIC"}
          </span>
        </div>

        {/* ================================================================= */}
        {/* O BOTÃO GIGANTE DO LOCUTOR */}
        {/* ================================================================= */}
        {isStreaming ? (
          // ESTADO 2: NO AR (BOTÃO VERMELHO PULSANTE)
          <button
            type="button"
            onClick={handleMainButtonClick}
            className="w-full h-24 rounded-3xl bg-red-600 hover:bg-red-500 active:bg-red-700 active:scale-95 text-white font-black text-xl sm:text-2xl uppercase tracking-wider flex items-center justify-center gap-4 shadow-2xl shadow-red-600/60 border-4 border-red-400/80 animate-pulse transition-all touch-manipulation"
          >
            <Square className="w-7 h-7 fill-white shrink-0" />
            <span className="drop-shadow-md">NO AR - TOQUE P/ ENCERRAR</span>
          </button>
        ) : (
          // ESTADO 1: DESCONECTADO (BOTÃO VERDE GIGANTE)
          <button
            type="button"
            onClick={handleMainButtonClick}
            disabled={!localStream}
            className="w-full h-24 rounded-3xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white font-black text-2xl sm:text-3xl uppercase tracking-wider flex items-center justify-center gap-4 shadow-2xl shadow-emerald-600/50 border-4 border-emerald-400/70 transition-all touch-manipulation"
          >
            <Radio className="w-8 h-8 text-white shrink-0 animate-pulse" />
            <span className="drop-shadow-md">ENTRAR AO VIVO</span>
          </button>
        )}

        <p className="text-[11px] font-medium text-center text-slate-400 tracking-wide">
          Sinal transmitido em alta definição via WebRTC WHIP para o portal.
        </p>
      </div>
    </div>
  );
}
