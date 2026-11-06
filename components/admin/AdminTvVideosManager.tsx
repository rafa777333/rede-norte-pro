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
} from "lucide-react";
import {
  PortalVideoItem,
  ChannelSource,
  VideoCategory,
  MOCK_PORTAL_VIDEOS,
  extractYouTubeId,
  getYouTubeThumbnail,
} from "@/lib/tv-videos-data";

export default function AdminTvVideosManager() {
  const hasFetchedRef = useRef(false);
  const [videos, setVideos] = useState<PortalVideoItem[]>(MOCK_PORTAL_VIDEOS);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Filtros da listagem
  const [filtroCanal, setFiltroCanal] = useState<"todos" | "TV Apucarana" | "RedeCast">("todos");
  const [busca, setBusca] = useState("");

  // Formulário de Cadastro
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [channelSource, setChannelSource] = useState<ChannelSource>("TV Apucarana");
  const [category, setCategory] = useState<VideoCategory>("Reportagens TV");
  const [duration, setDuration] = useState("12:00");
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<"publicado" | "rascunho">("publicado");

  // YouTube ID detectado automaticamente
  const detectedYtId = useMemo(() => {
    return extractYouTubeId(youtubeUrl);
  }, [youtubeUrl]);

  // Preview da capa do YouTube
  const previewThumbnail = useMemo(() => {
    return getYouTubeThumbnail(detectedYtId);
  }, [detectedYtId]);

  // Auto-ajuste inteligente de canal e categoria ao colar títulos conhecidos
  const handleYoutubeUrlChange = (val: string) => {
    setYoutubeUrl(val);
    const id = extractYouTubeId(val);
    if (id && !title) {
      // Dica visual ou sugestão
    }
  };

  // Carregar vídeos da API
  const carregarVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/videos");
      const json = await res.json();
      if (json.success && Array.isArray(json.videos)) {
        setVideos(json.videos);
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

  // Salvar novo vídeo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemSucesso(null);
    setMensagemErro(null);

    if (!title.trim()) {
      setMensagemErro("Por favor, informe o título do vídeo.");
      return;
    }

    if (!youtubeUrl.trim() || !detectedYtId) {
      setMensagemErro("Por favor, cole um link válido do YouTube (vídeo normal, shorts ou live).");
      return;
    }

    try {
      setSalvando(true);
      const payload = {
        title: title.trim(),
        youtube_url: youtubeUrl.trim(),
        channel_source: channelSource,
        category,
        duration: duration.trim() || "10:00",
        is_featured: isFeatured,
        status,
        thumbnail_url: previewThumbnail,
      };

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Erro ao salvar vídeo.");
      }

      setMensagemSucesso("Vídeo cadastrado com sucesso no Hub de Streaming!");
      setTitle("");
      setYoutubeUrl("");
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

  // Excluir vídeo
  const handleDelete = async (id: string, videoTitle: string) => {
    if (!confirm(`Deseja realmente remover o vídeo "${videoTitle}" do Hub?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/videos?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        setVideos((prev) => prev.filter((v) => v.id !== id));
        setMensagemSucesso("Vídeo removido com sucesso.");
        setTimeout(() => setMensagemSucesso(null), 3000);
      }
    } catch (e: any) {
      alert(`Erro ao excluir vídeo: ${e.message || e}`);
    }
  };

  // Filtragem dos vídeos cadastrados
  const videosFiltrados = useMemo(() => {
    return videos.filter((v) => {
      if (filtroCanal !== "todos" && v.channel_source !== filtroCanal) {
        return false;
      }
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        return (
          v.title.toLowerCase().includes(termo) ||
          v.category.toLowerCase().includes(termo)
        );
      }
      return true;
    });
  }, [videos, filtroCanal, busca]);

  const totalRedeCast = useMemo(() => videos.filter((v) => v.channel_source === "RedeCast").length, [videos]);
  const totalTvApucarana = useMemo(() => videos.filter((v) => v.channel_source === "TV Apucarana").length, [videos]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Tv className="w-3 h-3" /> TV Apucarana
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Mic className="w-3 h-3" /> RedeCast
            </span>
          </div>
          <h2 className="font-heading font-black text-xl text-white">
            Gerenciador Multi-Canal do Hub de Streaming
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre vídeos colando qualquer link do YouTube (watch, shorts, live ou embed) para alimentar o Hub em <code className="text-amber-400">/tv-online</code> e <code className="text-amber-400">/videos</code>.
          </p>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">TV Apucarana</span>
            <span className="text-lg font-black text-red-400">{totalTvApucarana}</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">RedeCast</span>
            <span className="text-lg font-black text-purple-400">{totalRedeCast}</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Total</span>
            <span className="text-lg font-black text-white">{videos.length}</span>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensagemSucesso && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/80 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-600/80 text-red-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* GRID: FORMULÁRIO DE CADASTRO + PREVIEW DO VÍDEO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário (7 colunas) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-600" />
              <span>Cadastrar Novo Vídeo no Hub</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Extração automática de ID</span>
          </div>

          {/* Campo de URL do YouTube */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Link / URL do YouTube *
            </label>
            <input
              type="text"
              required
              placeholder="Cole aqui: https://www.youtube.com/watch?v=... ou /shorts/... ou youtu.be/..."
              value={youtubeUrl}
              onChange={(e) => handleYoutubeUrlChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            {detectedYtId ? (
              <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                ✓ ID detectado: <code className="bg-emerald-50 px-1.5 py-0.5 rounded">{detectedYtId}</code>
              </p>
            ) : youtubeUrl.trim() ? (
              <p className="text-[11px] text-red-500 font-bold mt-1">
                ⚠️ Não foi possível identificar o ID do YouTube neste link.
              </p>
            ) : null}
          </div>

          {/* Título do Vídeo */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Título do Vídeo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: RedeCast #43 • Entrevista com Prefeito de Apucarana"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Seletor de Canal Oficial */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Canal de Origem no YouTube *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setChannelSource("TV Apucarana");
                  setCategory("Reportagens TV");
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer ${
                  channelSource === "TV Apucarana"
                    ? "border-red-600 bg-red-50 text-red-900 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-xs block">Canal TV Apucarana</span>
                  <span className="text-[10px] text-slate-500">Jornalismo, reportagens e polícia</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setChannelSource("RedeCast");
                  setCategory("RedeCast Episódios");
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer ${
                  channelSource === "RedeCast"
                    ? "border-purple-600 bg-purple-50 text-purple-900 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-xs block">Canal RedeCast</span>
                  <span className="text-[10px] text-slate-500">Podcasts, debates e estúdio</span>
                </div>
              </button>
            </div>
          </div>

          {/* Categoria e Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Categoria / Prateleira *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VideoCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="RedeCast Episódios">🎙️ RedeCast Episódios</option>
                <option value="Reportagens TV">📺 Reportagens TV</option>
                <option value="Cortes & Shorts">⚡ Cortes & Shorts</option>
                <option value="Especial & Música">🎸 Especial & Música</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Duração Estimada
              </label>
              <input
                type="text"
                placeholder="Ex: 12:30 ou 1h 14m"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Opções de Destaque e Status */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <span>⭐ Destacar na Barra Lateral ao lado do Player</span>
            </label>

            <div className="flex items-center gap-4 pt-1">
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status_video"
                  checked={status === "publicado"}
                  onChange={() => setStatus("publicado")}
                />
                <span>🟢 Publicado (visível imediatamente)</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status_video"
                  checked={status === "rascunho"}
                  onChange={() => setStatus("rascunho")}
                />
                <span>⚪ Rascunho</span>
              </label>
            </div>
          </div>

          {/* Botão Salvar */}
          <button
            type="submit"
            disabled={salvando}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {salvando ? "Salvando no Catálogo..." : "💾 Salvar Vídeo no Hub de Streaming"}
          </button>
        </form>

        {/* Live Preview (5 colunas) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400">Prévia no Hub</span>
            <span className="text-[10px] font-bold text-amber-400">16:9 HD</span>
          </div>

          {/* Card Preview */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 shadow-xl group">
            <img
              src={previewThumbnail}
              alt="Prévia"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

            <div className="absolute top-2.5 left-2.5">
              {channelSource === "RedeCast" ? (
                <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-black text-[9px] uppercase">
                  🎙️ RedeCast
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[9px] uppercase">
                  📺 TV Apucarana
                </span>
              )}
            </div>

            <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
              {duration || "12:00"}
            </span>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              {category}
            </span>
            <h4 className="font-heading font-bold text-sm text-white mt-1 line-clamp-2">
              {title || "Título do vídeo aparecerá aqui..."}
            </h4>
          </div>
        </div>
      </div>

      {/* LISTAGEM DOS VÍDEOS CADASTRADOS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-black text-lg text-slate-900">
              Vídeos Cadastrados no Catálogo ({videosFiltrados.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gerencie os episódios do RedeCast e reportagens da TV Apucarana
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro por Canal */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => setFiltroCanal("todos")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filtroCanal === "todos" ? "bg-white shadow-xs text-slate-900" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroCanal("TV Apucarana")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filtroCanal === "TV Apucarana" ? "bg-red-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📺 TV Apucarana
              </button>
              <button
                type="button"
                onClick={() => setFiltroCanal("RedeCast")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filtroCanal === "RedeCast" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🎙️ RedeCast
              </button>
            </div>

            {/* Busca textual */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar vídeo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={carregarVideos}
              className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Recarregar lista"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabela de Vídeos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black">
                <th className="py-2.5 px-3">Vídeo</th>
                <th className="py-2.5 px-3">Canal</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Duração</th>
                <th className="py-2.5 px-3">Destaque</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {videosFiltrados.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={v.thumbnail_url}
                        alt={v.title}
                        className="w-16 aspect-video rounded-md object-cover bg-black shrink-0"
                      />
                      <div className="min-w-0">
                        <strong className="block text-slate-900 text-xs font-bold truncate max-w-sm">
                          {v.title}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {v.youtube_id}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {v.channel_source === "RedeCast" ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-black text-[10px]">
                        🎙️ RedeCast
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 font-black text-[10px]">
                        📺 TV Apucarana
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <span className="text-slate-600 font-medium">
                      {v.category}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-500 font-bold">
                    {v.duration}
                  </td>

                  <td className="py-3 px-3">
                    {v.is_featured ? (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[10px]">
                        ⭐ Lateral
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">—</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={v.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Abrir no YouTube"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(v.id, v.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Excluir vídeo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {videosFiltrados.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              Nenhum vídeo encontrado para os filtros selecionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
