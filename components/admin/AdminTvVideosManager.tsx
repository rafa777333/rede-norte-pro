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
} from "lucide-react";
import {
  PortalVideoItem,
  ChannelSource,
  VideoCategory,
  MOCK_PORTAL_VIDEOS,
  extractYouTubeId,
  getYouTubeThumbnail,
} from "@/lib/tv-videos-data";
import { getSupabase } from "@/lib/supabase";

export default function AdminTvVideosManager() {
  const hasFetchedRef = useRef(false);
  const [videos, setVideos] = useState<PortalVideoItem[]>(MOCK_PORTAL_VIDEOS);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [uploadingMp4, setUploadingMp4] = useState(false);
  const [mostrarAmostras, setMostrarAmostras] = useState(true);
  const [togglingAmostras, setTogglingAmostras] = useState(false);

  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Filtros da listagem
  const [filtroCanal, setFiltroCanal] = useState<"todos" | "TV Apucarana" | "RedeCast" | "9:16" | "home">("todos");
  const [busca, setBusca] = useState("");

  // Formulário de Cadastro / Edição
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

  // YouTube ID detectado automaticamente
  const detectedYtId = useMemo(() => {
    return extractYouTubeId(videoUrl);
  }, [videoUrl]);

  // Preview da capa
  const previewThumbnail = useMemo(() => {
    return getYouTubeThumbnail(detectedYtId, customThumbnail);
  }, [detectedYtId, customThumbnail]);

  // Auto-ajuste inteligente de formato e canal ao colar URLs
  const handleVideoUrlChange = (val: string) => {
    setVideoUrl(val);
    const low = val.toLowerCase();

    // Se for Shorts do YouTube, Reel do Instagram ou TikTok -> auto seleciona 9:16
    if (low.includes("/shorts/") || low.includes("/reel/") || low.includes("tiktok.com")) {
      setVideoFormat("9:16");
      setCategory("Cortes & Shorts");
      setDuration("0:59");
    } else if (low.includes("youtube.com") || low.includes("youtu.be")) {
      if (videoFormat === "9:16" && !low.includes("/shorts/")) {
        setVideoFormat("16:9");
      }
    }

    // Auto-sugestão de canal com base no título ou link
    if (low.includes("redecast") || title.toLowerCase().includes("redecast")) {
      setChannelSource("RedeCast");
      if (videoFormat === "16:9") setCategory("RedeCast Episódios");
    }
  };

  // Upload direto de arquivo MP4 para o Supabase Storage
  const handleUploadMp4 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = getSupabase();
    if (!supabase) {
      alert("Cliente Supabase não configurado.");
      return;
    }

    try {
      setUploadingMp4(true);
      const ext = file.name.split(".").pop() || "mp4";
      const filename = `videos/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("rede-norte-media")
        .upload(filename, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: pubData } = supabase.storage
        .from("rede-norte-media")
        .getPublicUrl(filename);

      if (pubData?.publicUrl) {
        setVideoUrl(pubData.publicUrl);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
        }
      }
    } catch (err: any) {
      alert(`Erro no upload do vídeo: ${err.message || err}`);
    } finally {
      setUploadingMp4(false);
    }
  };

  // Carregar vídeos da API
  const carregarVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/videos?all_status=true");
      const json = await res.json();
      if (json.success && Array.isArray(json.videos)) {
        setVideos(json.videos);
        if (typeof json.mostrar_amostras === "boolean") {
          setMostrarAmostras(json.mostrar_amostras);
        }
      }
    } catch (e: any) {
      console.warn("Erro ao buscar vídeos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    carregarVideos();
  }, []);

  // Alterna visibilidade global de vídeos de demonstração / amostras
  const handleToggleAmostras = async () => {
    try {
      setTogglingAmostras(true);
      const novoStatus = !mostrarAmostras;
      const res = await fetch("/api/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mostrar_videos_amostra: novoStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setMostrarAmostras(novoStatus);
        setMensagemSucesso(
          novoStatus
            ? "Vídeos de demonstração ATIVADOS no site público."
            : "Vídeos de demonstração OCULTOS (exibindo apenas vídeos reais salvos no painel)."
        );
        await carregarVideos();
        setTimeout(() => setMensagemSucesso(null), 4000);
      }
    } catch (err: any) {
      alert(`Erro ao alterar configuração de amostras: ${err.message}`);
    } finally {
      setTogglingAmostras(false);
    }
  };

  // Salvar / Atualizar vídeo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemSucesso(null);
    setMensagemErro(null);

    if (!title.trim()) {
      setMensagemErro("Por favor, informe o título do vídeo.");
      return;
    }

    if (!videoUrl.trim()) {
      setMensagemErro("Por favor, cole um link de vídeo (YouTube, Shorts ou MP4) ou faça o upload de um arquivo.");
      return;
    }

    try {
      setSalvando(true);
      const payload = {
        id: editId || undefined,
        title: title.trim(),
        url: videoUrl.trim(),
        youtube_url: videoUrl.trim(),
        video_format: videoFormat,
        channel_source: channelSource,
        category,
        duration: duration.trim() || (videoFormat === "9:16" ? "0:59" : "1h 15m"),
        show_on_home: showOnHome,
        is_featured: isFeatured,
        status,
        thumbnail_url: previewThumbnail,
      };

      const method = editId ? "PATCH" : "POST";
      const res = await fetch("/api/videos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Erro ao salvar vídeo.");
      }

      setMensagemSucesso(
        editId
          ? "Vídeo atualizado com sucesso!"
          : "Vídeo publicado com sucesso na Central de TV & Vídeos!"
      );

      // Limpa formulário
      setEditId(null);
      setTitle("");
      setVideoUrl("");
      setCustomThumbnail("");
      setShowOnHome(false);
      setIsFeatured(false);

      // Recarrega a lista
      await carregarVideos();
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err: any) {
      setMensagemErro(err.message || "Erro ao salvar vídeo.");
    } finally {
      setSalvando(false);
    }
  };

  // Editar vídeo
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
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  // Excluir vídeo
  const handleDelete = async (id: string, videoTitle: string) => {
    if (!confirm(`Deseja realmente excluir o vídeo "${videoTitle}"?`)) return;

    try {
      const res = await fetch(`/api/videos?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erro ao excluir.");

      setVideos((prev) => prev.filter((v) => v.id !== id));
      setMensagemSucesso("Vídeo excluído com sucesso.");
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (e: any) {
      alert(`Falha ao excluir vídeo: ${e.message}`);
    }
  };

  // Alterna flag show_on_home direto no card
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
      console.error(e);
    }
  };

  // Filtragem da lista
  const videosFiltrados = useMemo(() => {
    return videos.filter((v) => {
      if (filtroCanal === "RedeCast" && v.channel_source !== "RedeCast") return false;
      if (filtroCanal === "TV Apucarana" && v.channel_source !== "TV Apucarana") return false;
      if (filtroCanal === "9:16" && v.video_format !== "9:16") return false;
      if (filtroCanal === "home" && !v.show_on_home) return false;
      if (busca.trim()) {
        const b = busca.toLowerCase();
        return v.title.toLowerCase().includes(b) || (v.category && v.category.toLowerCase().includes(b));
      }
      return true;
    });
  }, [videos, filtroCanal, busca]);

  // Contadores
  const totalReais = videos.filter((v) => !(v as any).is_mock).length;
  const totalNaHome = videos.filter((v) => v.show_on_home).length;
  const totalVerticais = videos.filter((v) => v.video_format === "9:16").length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-8">
      {/* =========================================================================
          CABEÇALHO DA SEÇÃO COM TOGGLE DE VÍDEOS DE DEMONSTRAÇÃO
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider mb-2">
            <span>📺</span>
            <span>Central Unificada de TV, Vídeos & Podcasts</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Gerenciador de Streaming & Cortes da Rede Apucarana
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Cadastre transmissões ao vivo, podcasts completos do <strong>RedeCast (16:9)</strong>, reportagens da <strong>TV Apucarana</strong> e <strong>Cortes/Reels Verticais (9:16)</strong> que alimentam tanto o Hub público quanto a Home.
          </p>
        </div>

        {/* CONTROLE GLOBAL: MOSTRAR OU OCULTAR VÍDEOS DE AMOSTRA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
          <button
            type="button"
            onClick={handleToggleAmostras}
            disabled={togglingAmostras}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer ${
              mostrarAmostras
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-700 hover:bg-slate-800 text-slate-100"
            }`}
            title="Clique para alternar se os vídeos de demonstração aparecem ou não no site público"
          >
            {mostrarAmostras ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>
              {mostrarAmostras ? "Vídeos de Amostra: VISÍVEIS" : "Vídeos de Amostra: OCULTOS"}
            </span>
          </button>

          <button
            type="button"
            onClick={carregarVideos}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
            title="Atualizar lista de vídeos agora"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-red-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* METRICAS RÁPIDAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Vídeos Salvos no Banco</span>
          <strong className="text-xl font-black text-slate-900">{totalReais}</strong>
        </div>
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
          <span className="text-[11px] font-bold text-purple-700 uppercase block">RedeCast (Podcasts)</span>
          <strong className="text-xl font-black text-purple-900">
            {videos.filter((v) => v.channel_source === "RedeCast").length}
          </strong>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <span className="text-[11px] font-bold text-emerald-700 uppercase block">📱 Cortes Verticais 9:16</span>
          <strong className="text-xl font-black text-emerald-900">{totalVerticais}</strong>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
          <span className="text-[11px] font-bold text-amber-700 uppercase block">🏠 Exibidos na Capa (Home)</span>
          <strong className="text-xl font-black text-amber-900">{totalNaHome}</strong>
        </div>
      </div>

      {/* ALERTAS */}
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

      {/* =========================================================================
          FORMULÁRIO DE CADASTRO / EDIÇÃO DE VÍDEO
          ========================================================================= */}
      <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎬</span>
            <h3 className="text-base font-black text-slate-900">
              {editId ? "Editar Vídeo Cadastrado" : "Cadastrar Novo Vídeo no Hub & Home"}
            </h3>
          </div>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setTitle("");
                setVideoUrl("");
                setCustomThumbnail("");
                setShowOnHome(false);
              }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1 bg-white border border-slate-300 rounded-lg cursor-pointer"
            >
              Cancelar Edição
            </button>
          )}
        </div>

        {/* 1. TÍTULO */}
        <div>
          <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
            Título do Vídeo / Episódio *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: RedeCast #45: Bastidores do Agronegócio no Vale do Ivaí"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-red-500 focus:outline-none font-medium text-slate-900"
            required
          />
        </div>

        {/* 2. LINK OU ARQUIVO MP4 */}
        <div>
          <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
            Link do Vídeo (YouTube, Shorts, Reel ou MP4 Direto) *
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => handleVideoUrlChange(e.target.value)}
              placeholder="Cole aqui: https://www.youtube.com/watch?v=... ou /shorts/... ou URL .mp4"
              className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-red-500 focus:outline-none font-mono text-slate-800"
              required
            />

            {/* BOTÃO DE UPLOAD DE ARQUIVO MP4 */}
            <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer shadow-xs transition-colors shrink-0">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>{uploadingMp4 ? "Enviando MP4..." : "Subir Arquivo MP4"}</span>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleUploadMp4}
                className="hidden"
                disabled={uploadingMp4}
              />
            </label>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            💡 Aceita qualquer formato: link normal do YouTube, Shorts verticais, Instagram Reels ou upload de arquivo MP4 para o Storage do portal.
          </p>
        </div>

        {/* 3. SELETORES: FORMATO (16:9 vs 9:16) & CANAL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* FORMATO DO VÍDEO */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
              📐 Formato de Visualização *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVideoFormat("16:9")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                  videoFormat === "16:9"
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>🖥️ Horizontal 16:9</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVideoFormat("9:16");
                  setCategory("Cortes & Shorts");
                  setDuration("0:59");
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                  videoFormat === "9:16"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>📱 Vertical 9:16</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {videoFormat === "9:16"
                ? "Ideal para Reels, Shorts e cortes rápidos de celular."
                : "Ideal para Podcasts longos (1h30+) e reportagens no telão."}
            </p>
          </div>

          {/* CANAL OFICIAL */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
              🎙️ Canal Oficial da Emissora *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setChannelSource("TV Apucarana");
                  if (videoFormat === "16:9") setCategory("Reportagens TV");
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                  channelSource === "TV Apucarana"
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>TV Apucarana</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setChannelSource("RedeCast");
                  if (videoFormat === "16:9") setCategory("RedeCast Episódios");
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                  channelSource === "RedeCast"
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>RedeCast</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. CATEGORIA E DURAÇÃO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
              Categoria do Conteúdo
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as VideoCategory)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-red-500 focus:outline-none font-bold text-slate-800"
            >
              <option value="RedeCast Episódios">🎙️ RedeCast Episódios (Longos 16:9)</option>
              <option value="Reportagens TV">📺 Reportagens TV Apucarana</option>
              <option value="Cortes & Shorts">📱 Cortes & Shorts (Reels 9:16)</option>
              <option value="Especial & Música">🎵 Especial & Música</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
              Duração Estimada
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder={videoFormat === "9:16" ? "0:59" : "1h 14m"}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-red-500 focus:outline-none font-medium text-slate-800"
            />
          </div>
        </div>

        {/* 5. CHECKBOXES: EXIBIR NA HOME E DESTAQUE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* CHECKBOX: EXIBIR NA CAPA (HOME) */}
          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-300 bg-amber-50/80 cursor-pointer hover:bg-amber-100/70 transition">
            <input
              type="checkbox"
              checked={showOnHome}
              onChange={(e) => setShowOnHome(e.target.checked)}
              className="w-5 h-5 text-amber-600 rounded-md border-amber-400 focus:ring-amber-500 cursor-pointer"
            />
            <div>
              <strong className="block text-xs font-black text-amber-950 uppercase">
                🏠 Exibir na Faixa de Vídeos da Home (Capa)
              </strong>
              <span className="text-[11px] text-amber-800 block">
                Marca este vídeo para aparecer no carrossel de destaques da página principal.
              </span>
            </div>
          </label>

          {/* CHECKBOX: DESTAQUE NA CENTRAL */}
          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-300 bg-white cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5 text-red-600 rounded-md border-slate-300 focus:ring-red-500 cursor-pointer"
            />
            <div>
              <strong className="block text-xs font-black text-slate-900 uppercase">
                ⭐ Destaque no Topo da Central (/tv-online)
              </strong>
              <span className="text-[11px] text-slate-600 block">
                Prioriza a exibição deste vídeo nas primeiras posições do catálogo.
              </span>
            </div>
          </label>
        </div>

        {/* BOTÃO FINAL DE SUBMISSÃO */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={salvando}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
          >
            {salvando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gravando no Banco...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>{editId ? "Salvar Alterações do Vídeo" : "Publicar Vídeo no Portal"}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* =========================================================================
          LISTA DE VÍDEOS CADASTRADOS NO BANCO
          ========================================================================= */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-slate-700" />
            <h3 className="font-black text-slate-900 text-base">
              Vídeos Cadastrados ({videosFiltrados.length})
            </h3>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Filtrar por título..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-slate-500 font-medium"
            />
          </div>
        </div>

        {/* FILTROS RÁPIDOS POR PÍLULA */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { id: "todos", label: `Todos (${videos.length})` },
            { id: "RedeCast", label: "🎙️ RedeCast" },
            { id: "TV Apucarana", label: "📺 TV Apucarana" },
            { id: "9:16", label: `📱 Cortes 9:16 (${totalVerticais})` },
            { id: "home", label: `🏠 Na Capa (${totalNaHome})` },
          ].map((f) => {
            const active = filtroCanal === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroCanal(f.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* LISTA DE CARDS LEVES (SEM IFRAMES/SEM VIDEOS PESADOS NO ADMIN) */}
        <div className="grid gap-3">
          {videosFiltrados.map((v) => {
            const isMock = Boolean((v as any).is_mock);
            const thumb = v.thumbnail_url || (v.youtube_id ? `https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg` : "");

            return (
              <div
                key={v.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Thumbnail estática leve */}
                  <div className={`relative rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-300 ${
                    v.video_format === "9:16" ? "w-12 aspect-[9/16]" : "w-24 aspect-video"
                  }`}>
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={v.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-bold">
                        VÍDEO
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[9px] font-black bg-black/80 text-white">
                      {v.duration || "10m"}
                    </span>
                  </div>

                  {/* Informações */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Badge Canal */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        v.channel_source === "RedeCast"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {v.channel_source}
                      </span>

                      {/* Badge Formato */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        v.video_format === "9:16"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {v.video_format === "9:16" ? "📱 9:16 Vertical" : "🖥️ 16:9 Widescreen"}
                      </span>

                      {/* Badge Home */}
                      {v.show_on_home && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                          🏠 Na Capa
                        </span>
                      )}

                      {/* Badge Amostra Mock */}
                      {isMock && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">
                          Demonstração
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 truncate" title={v.title}>
                      {v.title}
                    </h4>

                    <span className="text-[11px] font-mono text-slate-400 truncate block">
                      {v.video_url || v.youtube_url}
                    </span>
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Alternar Na Home */}
                  {!isMock && (
                    <button
                      type="button"
                      onClick={() => handleToggleHome(v)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        v.show_on_home
                          ? "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                      title="Alternar se este vídeo aparece na faixa da Home"
                    >
                      {v.show_on_home ? "✓ Na Home" : "+ Pôr na Home"}
                    </button>
                  )}

                  {/* Abrir no Hub */}
                  <a
                    href={`/tv-online?v=${encodeURIComponent(v.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    title="Assistir no Hub (/tv-online)"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Editar */}
                  {!isMock && (
                    <button
                      type="button"
                      onClick={() => handleEdit(v)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      Editar
                    </button>
                  )}

                  {/* Excluir */}
                  {!isMock && (
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id, v.title)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Excluir vídeo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {videosFiltrados.length === 0 && (
            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500 text-sm">
              Nenhum vídeo encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
