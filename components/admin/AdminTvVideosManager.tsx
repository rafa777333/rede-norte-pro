"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Tv,
  Mic,
  Play,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Film,
  Upload,
  Smartphone,
  Monitor,
  Home,
  Share2,
  Check,
  Eye,
  EyeOff,
  Video,
  Radio,
  ArrowUp,
  ArrowDown,
  Clock,
  Flame,
  Settings2,
  Layers,
  ListVideo,
  CheckCircle,
} from "lucide-react";
import {
  PortalVideoItem,
  ChannelSource,
  VideoCategory,
  MOCK_PORTAL_VIDEOS,
  extractYouTubeId,
  getYouTubeThumbnail,
} from "@/lib/tv-videos-data";
import {
  TvSettings,
  TvPlaylistItem,
  TvPlaylistItemType,
  TvChannelMode,
  DEFAULT_TV_SETTINGS,
  INITIAL_TV_PLAYLIST,
  formatDurationSeconds,
  formatClockTime,
  getPlaylistItemTypeMeta,
  calculateTvProgramAtTime,
} from "@/lib/tv-channel-data";
import { getSupabase } from "@/lib/supabase";

export default function AdminTvVideosManager() {
  const hasFetchedRef = useRef(false);

  // Sub-abas do painel da TV
  const [activeTab, setActiveTab] = useState<"transmissao" | "catalogo">("transmissao");

  // =========================================================================
  // ESTADO DA TRANSMISSÃO 24H (FAST CHANNEL HÍBRIDO: OBS vs. GRADE YOUTUBE)
  // =========================================================================
  const [tvSettings, setTvSettings] = useState<TvSettings>(DEFAULT_TV_SETTINGS);
  const [tvPlaylist, setTvPlaylist] = useState<TvPlaylistItem[]>(INITIAL_TV_PLAYLIST);
  const [loadingTv, setLoadingTv] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Formulário de Adicionar Vídeo à Grade 24h
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemType, setNewItemType] = useState<TvPlaylistItemType>("podcast");
  const [newItemMinutes, setNewItemMinutes] = useState("15");
  const [newItemSeconds, setNewItemSeconds] = useState("00");
  const [addingItem, setAddingItem] = useState(false);

  // Relógio sincronizado para preview do item no ar neste segundo
  const [currentClockSeconds, setCurrentClockSeconds] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClockSeconds(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cálculo do programa no ar e estatísticas da grade
  const currentTvSchedule = useMemo(() => {
    return calculateTvProgramAtTime(tvPlaylist, currentClockSeconds);
  }, [tvPlaylist, currentClockSeconds]);

  const totalPlaylistSeconds = useMemo(() => {
    return tvPlaylist
      .filter((i) => i.active)
      .reduce((acc, curr) => acc + (Number(curr.duration_seconds) || 0), 0);
  }, [tvPlaylist]);

  // ID do YouTube detectado no formulário da grade
  const detectedNewItemYtId = useMemo(() => {
    return extractYouTubeId(newItemUrl);
  }, [newItemUrl]);

  // =========================================================================
  // ESTADO DO CATÁLOGO SOB DEMANDA & HOME (EXISTENTE)
  // =========================================================================
  const [videos, setVideos] = useState<PortalVideoItem[]>(MOCK_PORTAL_VIDEOS);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [uploadingMp4, setUploadingMp4] = useState(false);
  const [mostrarAmostras, setMostrarAmostras] = useState(true);
  const [togglingAmostras, setTogglingAmostras] = useState(false);

  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Filtros da listagem do catálogo
  const [filtroCanal, setFiltroCanal] = useState<"todos" | "TV Apucarana" | "RedeCast" | "9:16" | "home">("todos");
  const [busca, setBusca] = useState("");

  // Formulário do catálogo sob demanda
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFormat, setVideoFormat] = useState<"16:9" | "9:16">("16:9");
  const [channelSource, setChannelSource] = useState<ChannelSource>("TV Apucarana");
  const [category, setCategory] = useState<VideoCategory>("Reportagens TV");
  const [duration, setDuration] = useState("1h 15m");
  const [showOnHome, setShowOnHome] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<"publicado" | "rascunho">("publicado");
  const [customThumbnail, setCustomThumbnail] = useState("");

  const detectedYtId = useMemo(() => {
    return extractYouTubeId(videoUrl);
  }, [videoUrl]);

  const previewThumbnail = useMemo(() => {
    return getYouTubeThumbnail(detectedYtId, customThumbnail);
  }, [detectedYtId, customThumbnail]);

  // =========================================================================
  // CARREGAMENTO INICIAL
  // =========================================================================
  const carregarTvChannel = async () => {
    try {
      setLoadingTv(true);
      const res = await fetch("/api/tv-channel", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        if (json.settings) setTvSettings(json.settings);
        if (Array.isArray(json.playlist) && json.playlist.length > 0) {
          setTvPlaylist(json.playlist);
        }
      }
    } catch (err) {
      console.warn("[AdminTvVideosManager] Falha ao carregar tv-channel:", err);
    } finally {
      setLoadingTv(false);
    }
  };

  const carregarVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/videos?all_status=true", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.videos)) {
        setVideos(json.videos);
        if (typeof json.mostrar_amostras === "boolean") {
          setMostrarAmostras(json.mostrar_amostras);
        }
      }
    } catch (err: any) {
      console.warn("[AdminTvVideosManager] Falha ao carregar catálogo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    carregarTvChannel();
    carregarVideos();
  }, []);

  // =========================================================================
  // AÇÕES DO BLOCO A — CHAVE MESTRA DO OBS
  // =========================================================================
  const handleUpdateMode = async (newMode: TvChannelMode) => {
    const updated: TvSettings = { ...tvSettings, mode: newMode };
    setTvSettings(updated);
    try {
      setSavingSettings(true);
      const res = await fetch("/api/tv-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_settings", settings: updated }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erro ao salvar modo.");
      setMensagemSucesso(`Modo de transmissão alterado para: ${
        newMode === "force_youtube_grid"
          ? "GRADE YOUTUBE 24H"
          : newMode === "force_live_m3u8"
          ? "AO VIVO OBS (SamCast)"
          : "MODO AUTOMÁTICO (Fallback)"
      }`);
      setTimeout(() => setMensagemSucesso(null), 3500);
    } catch (e: any) {
      setMensagemErro(e.message || "Erro ao alterar modo da TV.");
      setTimeout(() => setMensagemErro(null), 3500);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveTvSettings = async () => {
    try {
      setSavingSettings(true);
      const res = await fetch("/api/tv-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_settings", settings: tvSettings }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erro ao salvar.");
      setMensagemSucesso("Configurações do canal da TV salvas com sucesso!");
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (e: any) {
      setMensagemErro(e.message || "Erro ao salvar configurações.");
    } finally {
      setSavingSettings(false);
    }
  };

  // =========================================================================
  // AÇÕES DO BLOCO B — MONTADOR DE GRADE 24H
  // =========================================================================
  const handleAddItemToPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) {
      setMensagemErro("Informe o título do programa ou comercial.");
      return;
    }
    if (!newItemUrl.trim() || !detectedNewItemYtId) {
      setMensagemErro("Cole um link válido do YouTube.");
      return;
    }

    const min = parseInt(newItemMinutes, 10) || 0;
    const sec = parseInt(newItemSeconds, 10) || 0;
    const totalSec = min * 60 + sec;

    if (totalSec <= 0) {
      setMensagemErro("A duração do vídeo deve ser maior que 0 segundos.");
      return;
    }

    try {
      setAddingItem(true);
      setMensagemErro(null);

      const payload = {
        title: newItemTitle.trim(),
        youtube_url: newItemUrl.trim(),
        youtube_id: detectedNewItemYtId,
        type: newItemType,
        duration_seconds: totalSec,
      };

      const res = await fetch("/api/tv-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_item", item: payload }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erro ao adicionar item.");

      // Limpa formulário
      setNewItemTitle("");
      setNewItemUrl("");
      setNewItemMinutes("15");
      setNewItemSeconds("00");

      setMensagemSucesso("Item adicionado com sucesso à Grade 24h!");
      await carregarTvChannel();
      setTimeout(() => setMensagemSucesso(null), 3500);
    } catch (err: any) {
      setMensagemErro(err.message || "Erro ao adicionar à grade.");
    } finally {
      setAddingItem(false);
    }
  };

  const handleMovePlaylistItem = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tvPlaylist.length) return;

    const reordered = [...tvPlaylist];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Atualiza otimista no estado
    const withSortOrder = reordered.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
    setTvPlaylist(withSortOrder);

    try {
      await fetch("/api/tv-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          newOrderIds: withSortOrder.map((i) => i.id),
        }),
      });
    } catch (e) {
      console.warn("Falha ao salvar nova ordem:", e);
    }
  };

  const handleDeletePlaylistItem = async (item: TvPlaylistItem) => {
    if (!confirm(`Deseja remover "${item.title}" da Grade 24h?`)) return;

    // Atualiza otimista no estado
    setTvPlaylist((prev) => prev.filter((i) => i.id !== item.id));

    try {
      const res = await fetch("/api/tv-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_item", itemId: item.id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setMensagemSucesso("Item removido da grade.");
      setTimeout(() => setMensagemSucesso(null), 2500);
    } catch (e: any) {
      alert(`Erro ao excluir: ${e.message}`);
      await carregarTvChannel();
    }
  };

  const handleTogglePlaylistItemActive = async (item: TvPlaylistItem) => {
    const updated = !item.active;
    setTvPlaylist((prev) => prev.map((i) => (i.id === item.id ? { ...i, active: updated } : i)));

    try {
      await fetch("/api/tv-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_item",
          item: { ...item, active: updated },
        }),
      });
    } catch (e) {
      console.warn("Falha ao alternar status do item:", e);
    }
  };

  const handleResetDefaultPlaylist = async () => {
    if (!confirm("Deseja restaurar a Grade Inicial demonstrativa com 7 blocos intercalados?")) return;

    try {
      setLoadingTv(true);
      const res = await fetch("/api/tv-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_playlist", playlist: INITIAL_TV_PLAYLIST }),
      });
      const json = await res.json();
      if (json.success) {
        setTvPlaylist(INITIAL_TV_PLAYLIST);
        setMensagemSucesso("Grade inicial restaurada com sucesso!");
        setTimeout(() => setMensagemSucesso(null), 3000);
      }
    } catch (e: any) {
      alert("Erro ao restaurar grade.");
    } finally {
      setLoadingTv(false);
    }
  };

  // =========================================================================
  // AÇÕES DO CATÁLOGO SOB DEMANDA (EXISTENTE)
  // =========================================================================
  const handleToggleAmostras = async () => {
    try {
      setTogglingAmostras(true);
      const novoValor = !mostrarAmostras;
      const res = await fetch("/api/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mostrar_videos_amostra: novoValor }),
      });
      const json = await res.json();
      if (json.success) {
        setMostrarAmostras(novoValor);
        setMensagemSucesso(
          novoValor
            ? "Vídeos de amostra ativados no site."
            : "Vídeos de amostra ocultados no site (apenas vídeos reais aparecem)."
        );
        await carregarVideos();
        setTimeout(() => setMensagemSucesso(null), 4000);
      }
    } catch (e: any) {
      setMensagemErro("Erro ao alternar exibição de amostras.");
    } finally {
      setTogglingAmostras(false);
    }
  };

  const handleSalvarVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setMensagemErro("Informe o título do vídeo.");
    if (!videoUrl.trim()) return setMensagemErro("Informe o link do vídeo.");

    setSalvando(true);
    setMensagemErro(null);

    try {
      const payload = {
        id: editId || undefined,
        title: title.trim(),
        video_url: videoUrl.trim(),
        youtube_url: videoUrl.trim(),
        format: videoFormat,
        channel: channelSource,
        category,
        duration,
        show_on_home: showOnHome,
        is_featured: isFeatured,
        status,
        thumbnail_url: customThumbnail.trim() || undefined,
      };

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erro ao salvar vídeo.");

      setMensagemSucesso(editId ? "Vídeo atualizado com sucesso!" : "Vídeo publicado com sucesso!");
      setEditId(null);
      setTitle("");
      setVideoUrl("");
      setCustomThumbnail("");
      setShowOnHome(false);
      setIsFeatured(false);

      await carregarVideos();
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err: any) {
      setMensagemErro(err.message || "Erro ao salvar vídeo.");
    } finally {
      setSalvando(false);
    }
  };

  const handleEdit = (v: PortalVideoItem) => {
    setEditId(v.id);
    setTitle(v.title);
    setVideoUrl(v.video_url || v.youtube_url);
    setVideoFormat(v.video_format === "9:16" ? "9:16" : "16:9");
    setChannelSource(v.channel_source);
    setCategory(v.category);
    setDuration(v.duration || "12:00");
    setShowOnHome(Boolean(v.show_on_home));
    setIsFeatured(Boolean(v.is_featured));
    setStatus((v.status as any) || "publicado");
    setCustomThumbnail(v.thumbnail_url || "");
    setActiveTab("catalogo");
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  const handleDelete = async (id: string, videoTitle: string) => {
    if (!confirm(`Deseja realmente excluir o vídeo "${videoTitle}"?`)) return;
    try {
      const res = await fetch(`/api/videos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erro ao excluir.");
      setVideos((prev) => prev.filter((v) => v.id !== id));
      setMensagemSucesso("Vídeo excluído com sucesso.");
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (e: any) {
      alert(`Falha ao excluir vídeo: ${e.message}`);
    }
  };

  const handleToggleHome = async (v: PortalVideoItem) => {
    try {
      const nextHome = !v.show_on_home;
      const res = await fetch("/api/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: v.id, show_on_home: nextHome }),
      });
      if (res.ok) {
        setVideos((prev) =>
          prev.map((item) => (item.id === v.id ? { ...item, show_on_home: nextHome } : item))
        );
      }
    } catch (e) {
      console.warn("Falha ao alternar show_on_home:", e);
    }
  };

  const videosFiltrados = useMemo(() => {
    return videos.filter((v) => {
      if (filtroCanal === "TV Apucarana" && v.channel_source !== "TV Apucarana") return false;
      if (filtroCanal === "RedeCast" && v.channel_source !== "RedeCast") return false;
      if (filtroCanal === "9:16" && v.video_format !== "9:16") return false;
      if (filtroCanal === "home" && !v.show_on_home) return false;

      if (busca.trim()) {
        const b = busca.toLowerCase();
        const matchTitle = v.title.toLowerCase().includes(b);
        const matchCat = v.category.toLowerCase().includes(b);
        return matchTitle || matchCat;
      }
      return true;
    });
  }, [videos, filtroCanal, busca]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO DO MÓDULO E SELETOR DE SUB-ABAS                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider mb-2">
            <span>📺</span>
            <span>Central Unificada de TV, Grade 24h & Vídeos</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Transmissão 24h & Gerenciador Audiovisual
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Alterne entre o sinal ao vivo do <strong>OBS (SamCast)</strong> e a <strong>Grade 24h Automatizada do YouTube</strong>, ou gerencie os vídeos sob demanda e cortes verticais do portal.
          </p>
        </div>

        {/* SELETOR DE ABAS DO MÓDULO */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-300 rounded-xl shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("transmissao")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "transmissao"
                ? "bg-red-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Sinal & Grade 24h</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("catalogo")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "catalogo"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Catálogo & Home</span>
          </button>
        </div>
      </div>

      {/* ALERTAS GLOBAIS */}
      {mensagemSucesso && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: FAST CHANNEL 24H (BLOCO A + BLOCO B)                              */}
      {/* ========================================================================= */}
      {activeTab === "transmissao" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* ===================================================================== */}
          {/* BLOCO A — CHAVE MESTRA DO OBS (AO VIVO vs. GRADE YOUTUBE)             */}
          {/* ===================================================================== */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  Bloco A • Chave Mestra de Transmissão
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  O que deve ser exibido no Player Principal da TV?
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Status Atual:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    tvSettings.mode === "force_youtube_grid"
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : tvSettings.mode === "force_live_m3u8"
                      ? "bg-red-100 text-red-700 border border-red-200 animate-pulse"
                      : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                  {tvSettings.mode === "force_youtube_grid"
                    ? "Grade YouTube 24h"
                    : tvSettings.mode === "force_live_m3u8"
                    ? "OBS Ao Vivo (SamCast)"
                    : "Modo Automático (Fallback)"}
                </span>
              </div>
            </div>

            {/* OS 3 BOTÕES GRANDES DE STATUS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Botão 1: Grade YouTube 24h */}
              <button
                type="button"
                onClick={() => handleUpdateMode("force_youtube_grid")}
                disabled={savingSettings}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  tvSettings.mode === "force_youtube_grid"
                    ? "border-purple-600 bg-purple-50/70 shadow-md ring-2 ring-purple-500/30"
                    : "border-slate-200 bg-slate-50/70 hover:border-purple-400 hover:bg-purple-50/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🎬</span>
                    {tvSettings.mode === "force_youtube_grid" && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-black text-[10px] uppercase tracking-wider">
                        Ativo Agora
                      </span>
                    )}
                  </div>
                  <h4 className="font-black text-sm text-slate-900 group-hover:text-purple-700">
                    RODAR GRADE YOUTUBE 24H (Padrão)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Executa o loop contínuo e sincronizado com os programas do RedeCast, reportagens e comerciais cadastrados abaixo.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-bold text-purple-700">
                  Transmissão contínua 24h →
                </div>
              </button>

              {/* Botão 2: Ao Vivo OBS */}
              <button
                type="button"
                onClick={() => handleUpdateMode("force_live_m3u8")}
                disabled={savingSettings}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  tvSettings.mode === "force_live_m3u8"
                    ? "border-red-600 bg-red-50/70 shadow-md ring-2 ring-red-500/30"
                    : "border-slate-200 bg-slate-50/70 hover:border-red-400 hover:bg-red-50/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🔴</span>
                    {tvSettings.mode === "force_live_m3u8" && (
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase tracking-wider animate-pulse">
                        Sinal No Ar
                      </span>
                    )}
                  </div>
                  <h4 className="font-black text-sm text-slate-900 group-hover:text-red-700">
                    ENTRAR AO VIVO AGORA (Sinal OBS / SamCast)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Força o player a sintonizar a transmissão direta do estúdio via streaming SamCast HLS (`.m3u8`).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-bold text-red-700">
                  Entrada imediata no sinal OBS →
                </div>
              </button>

              {/* Botão 3: Modo Automático */}
              <button
                type="button"
                onClick={() => handleUpdateMode("auto")}
                disabled={savingSettings}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  tvSettings.mode === "auto"
                    ? "border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/30"
                    : "border-slate-200 bg-slate-50/70 hover:border-emerald-400 hover:bg-emerald-50/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">⚡</span>
                    {tvSettings.mode === "auto" && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider">
                        Ativo Inteligente
                      </span>
                    )}
                  </div>
                  <h4 className="font-black text-sm text-slate-900 group-hover:text-emerald-700">
                    MODO AUTOMÁTICO (Fallback Inteligente)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Sintoniza o OBS sempre que houver sinal ao vivo transmitindo. Se o OBS desligar (stream 404), passa sozinho para a Grade 24h sem erros.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-bold text-emerald-700">
                  Transição suave sem quedas →
                </div>
              </button>
            </div>

            {/* AVISO IMPORTANTE SOBRE O AUTOVJ DO SAMCAST */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <span className="text-base shrink-0">⚠️</span>
              <p className="leading-relaxed">
                <strong>Atenção para o Modo Automático com o OBS:</strong> Para que a transição ocorra de forma 100% automática ao ligar ou desligar o OBS, certifique-se de que o <u>AutoVJ interno do SamCast esteja pausado/desligado</u> no painel da SamCast. Caso o AutoVJ da SamCast fique rodando lá no servidor deles, o link M3U8 continuará emitindo pacotes 24h e o sistema considerará o sinal como ativo continuamente.
              </p>
            </div>

            {/* Configurações Adicionais do Ao Vivo (Título e URL M3U8) */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Texto Exibido no Topo quando Estiver Ao Vivo
                </label>
                <input
                  type="text"
                  value={tvSettings.live_program_title}
                  onChange={(e) =>
                    setTvSettings({ ...tvSettings, live_program_title: e.target.value })
                  }
                  placeholder="Ex: 🔴 AO VIVO: Jornalismo & Giro Rede Apucarana"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-red-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  URL do Stream HLS M3U8 do SamCast
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={tvSettings.live_m3u8_url}
                    onChange={(e) =>
                      setTvSettings({ ...tvSettings, live_m3u8_url: e.target.value })
                    }
                    placeholder="https://.../playlist.m3u8"
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-red-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTvSettings}
                    disabled={savingSettings}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition cursor-pointer"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BLOCO B — MONTADOR DE GRADE 24H (PLAYLIST YOUTUBE + COMERCIAIS)        */}
          {/* ===================================================================== */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Bloco B • Montador da Grade Programada 24h (Loop Sincronizado)
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Sequência Contínua de Vídeos, Programas e Comerciais
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaultPlaylist}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  title="Restaura a grade demonstrativa intercalada"
                >
                  Restaurar Grade Padrão
                </button>
              </div>
            </div>

            {/* BANNER DINÂMICO DE TEMPO TOTAL E PROGRAMA NO AR */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Tempo Total do Loop da TV
                </span>
                <strong className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 block">
                  {formatDurationSeconds(totalPlaylistSeconds)}
                </strong>
                <span className="text-xs text-slate-400">
                  {tvPlaylist.filter((i) => i.active).length} blocos ativos na grade
                </span>
              </div>

              <div className="md:col-span-2 bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    No Ar Agora Neste Segundo
                  </span>
                  {currentTvSchedule && (
                    <span className="text-[11px] font-mono text-amber-300 font-bold">
                      Faltam {formatClockTime(currentTvSchedule.remainingInCurrent)}
                    </span>
                  )}
                </div>

                <div className="mt-1.5">
                  <p className="font-heading font-black text-sm sm:text-base text-white truncate">
                    {currentTvSchedule?.currentItem?.title || "Grade desativada ou vazia"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 truncate">
                    <span>
                      {getPlaylistItemTypeMeta(currentTvSchedule?.currentItem?.type || "podcast").icon}{" "}
                      {getPlaylistItemTypeMeta(currentTvSchedule?.currentItem?.type || "podcast").label}
                    </span>
                    <span>·</span>
                    <span className="text-slate-300 truncate">
                      <strong>A Seguir:</strong> {currentTvSchedule?.nextItem?.title || "Repetição do Loop"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* FORMULÁRIO RÁPIDO PARA ADICIONAR VÍDEO NA GRADE */}
            <form
              onSubmit={handleAddItemToPlaylist}
              className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-600" />
                <h4 className="font-black text-sm text-slate-900">
                  Adicionar Novo Programa, Reportagem ou Comercial à Grade
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* 1. Link do YouTube */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link do YouTube
                  </label>
                  <input
                    type="url"
                    value={newItemUrl}
                    onChange={(e) => setNewItemUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600 bg-white"
                    required
                  />
                </div>

                {/* 2. Título */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título do Bloco
                  </label>
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Ex: Comercial Sicredi / Entrevista Prefeito"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600 bg-white"
                    required
                  />
                </div>

                {/* 3. Tipo */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600 bg-white font-medium"
                  >
                    <option value="podcast">🎙️ Podcast</option>
                    <option value="reportagem">🚨 Reportagem</option>
                    <option value="comercial">💰 Comercial</option>
                    <option value="musical">🎸 Música</option>
                  </select>
                </div>

                {/* 4. Duração: Minutos e Segundos */}
                <div className="sm:col-span-2 flex items-center gap-1.5">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Min</label>
                    <input
                      type="number"
                      min="0"
                      max="600"
                      value={newItemMinutes}
                      onChange={(e) => setNewItemMinutes(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600 bg-white text-center font-mono"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Seg</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={newItemSeconds}
                      onChange={(e) => setNewItemSeconds(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600 bg-white text-center font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  {detectedNewItemYtId ? (
                    <span className="text-emerald-700 font-bold">
                      ✓ Vídeo identificado: {detectedNewItemYtId}
                    </span>
                  ) : (
                    "Cole o link do YouTube acima para vincular automaticamente."
                  )}
                </span>

                <button
                  type="submit"
                  disabled={addingItem}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{addingItem ? "Adicionando..." : "Adicionar à Fila da Grade"}</span>
                </button>
              </div>
            </form>

            {/* LISTAGEM REORDENÁVEL DA FILA DA GRADE (ZERO IFRAMES, THUMBNAILS LEVES) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
                <span>Ordem de Exibição Contínua ({tvPlaylist.length} itens)</span>
                <span>Controles de Posição</span>
              </div>

              {tvPlaylist.map((item, index) => {
                const typeMeta = getPlaylistItemTypeMeta(item.type);
                const isFirst = index === 0;
                const isLast = index === tvPlaylist.length - 1;
                const isCurrentlyPlaying = currentTvSchedule?.currentItem?.id === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCurrentlyPlaying
                        ? "bg-purple-50/70 border-purple-500 shadow-sm ring-1 ring-purple-400"
                        : item.active
                        ? "bg-white border-slate-200 hover:border-slate-300"
                        : "bg-slate-100 border-slate-200 opacity-60"
                    }`}
                  >
                    {/* LADO ESQUERDO: Posição, Imagem Estática Leve e Dados */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Posição na Fila */}
                      <span className="w-7 text-center font-mono font-black text-xs text-slate-500 shrink-0">
                        #{index + 1}
                      </span>

                      {/* Thumbnail Estática Leve (ZERO IFRAME) */}
                      <div className="relative w-16 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-slate-200">
                        {item.youtube_id ? (
                          <img
                            src={`https://img.youtube.com/vi/${item.youtube_id}/mqdefault.jpg`}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-mono">
                            SEM CAPA
                          </div>
                        )}
                      </div>

                      {/* Título e Metadados */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${typeMeta.badgeBg}`}
                          >
                            {typeMeta.icon} {typeMeta.label}
                          </span>
                          {isCurrentlyPlaying && (
                            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] uppercase tracking-wider animate-pulse">
                              NO AR AGORA
                            </span>
                          )}
                        </div>
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                          {item.title}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-500 font-bold">
                          ⏱ {formatClockTime(item.duration_seconds)} ({item.duration_seconds}s)
                        </span>
                      </div>
                    </div>

                    {/* LADO DIREITO: Botões de Subir / Descer / Ativar / Excluir */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMovePlaylistItem(index, "up")}
                        disabled={isFirst}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                          isFirst
                            ? "text-slate-300 border-slate-200 cursor-not-allowed"
                            : "text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer"
                        }`}
                        title="Subir na fila"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMovePlaylistItem(index, "down")}
                        disabled={isLast}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                          isLast
                            ? "text-slate-300 border-slate-200 cursor-not-allowed"
                            : "text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer"
                        }`}
                        title="Descer na fila"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePlaylistItemActive(item)}
                        className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                          item.active
                            ? "text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                            : "text-slate-400 border-slate-300 bg-slate-50 hover:bg-slate-100"
                        }`}
                        title={item.active ? "Pausar item" : "Ativar item"}
                      >
                        {item.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePlaylistItem(item)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs transition cursor-pointer"
                        title="Remover da grade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {tvPlaylist.length === 0 && (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  Nenhum item na grade programada. Adicione o primeiro vídeo acima ou clique em &quot;Restaurar Grade Padrão&quot;.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CATÁLOGO SOB DEMANDA & CAPA (HOME)                                */}
      {/* ========================================================================= */}
      {activeTab === "catalogo" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* BARRA DE CONTROLE DO CATÁLOGO: AMOSTRAS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <h4 className="font-black text-sm text-slate-900">
                Catálogo de Vídeos Sob Demanda (VOD) & Faixa da Home
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Gerencie reportagens, podcasts e cortes que aparecem na prateleira estilo streaming e na capa.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleAmostras}
              disabled={togglingAmostras}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer ${
                mostrarAmostras
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-700 hover:bg-slate-800 text-slate-100"
              }`}
            >
              {mostrarAmostras ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{mostrarAmostras ? "Vídeos de Amostra: VISÍVEIS" : "Vídeos de Amostra: OCULTOS"}</span>
            </button>
          </div>

          {/* FORMULÁRIO DE CADASTRO DO CATÁLOGO */}
          <form
            onSubmit={handleSalvarVideo}
            className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-black text-base sm:text-lg text-slate-900">
                {editId ? "Editar Vídeo do Catálogo" : "Cadastrar Novo Vídeo no Catálogo"}
              </h3>
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setTitle("");
                    setVideoUrl("");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 font-bold"
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título do Vídeo</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Entrevista Exclusiva com Prefeito de Apucarana"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link / URL do Vídeo (YouTube, Shorts ou MP4)
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... ou .mp4"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-red-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Formato</label>
                <select
                  value={videoFormat}
                  onChange={(e) => setVideoFormat(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                >
                  <option value="16:9">🖥️ Horizontal (16:9)</option>
                  <option value="9:16">📱 Vertical (9:16)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Canal Oficial</label>
                <select
                  value={channelSource}
                  onChange={(e) => setChannelSource(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                >
                  <option value="TV Apucarana">📺 TV Apucarana</option>
                  <option value="RedeCast">🎙️ RedeCast</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                >
                  <option value="RedeCast Episódios">RedeCast Episódios</option>
                  <option value="Reportagens TV">Reportagens TV</option>
                  <option value="Cortes & Shorts">Cortes & Shorts</option>
                  <option value="Especial & Música">Especial & Música</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duração Estimada</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ex: 1h 15m ou 0:59"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={showOnHome}
                  onChange={(e) => setShowOnHome(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <span>🏠 Exibir também na faixa de vídeos da Página Inicial (Home)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span>⭐ Destaque no Hub</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={salvando}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                {salvando ? "Salvando..." : editId ? "Salvar Alterações" : "Publicar Vídeo no Catálogo"}
              </button>
            </div>
          </form>

          {/* LISTA DE VÍDEOS CADASTRADOS (CATÁLOGO) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="font-heading font-black text-sm text-slate-800">
                Vídeos no Catálogo ({videosFiltrados.length})
              </h4>

              {/* Filtros Rápidos */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(["todos", "TV Apucarana", "RedeCast", "9:16", "home"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFiltroCanal(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                      filtroCanal === f
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f === "todos"
                      ? "Todos"
                      : f === "9:16"
                      ? "📱 9:16"
                      : f === "home"
                      ? "🏠 Na Home"
                      : f}
                  </button>
                ))}
              </div>
            </div>

            {/* CARDS ESTÁTICOS LEVES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {videosFiltrados.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-slate-200">
                      <img
                        src={v.thumbnail_url}
                        alt={v.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="font-black text-red-600">{v.channel_source}</span>
                        <span>·</span>
                        <span className="text-slate-500">{v.video_format}</span>
                        {v.show_on_home && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                            Home
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 truncate mt-0.5">{v.title}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">{v.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleHome(v)}
                      className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                        v.show_on_home
                          ? "bg-amber-50 border-amber-300 text-amber-700"
                          : "border-slate-200 text-slate-400 hover:bg-slate-50"
                      }`}
                      title={v.show_on_home ? "Remover da Home" : "Exibir na Home"}
                    >
                      <Home className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(v)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs cursor-pointer"
                      title="Editar vídeo"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id, v.title)}
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs cursor-pointer"
                      title="Excluir vídeo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
