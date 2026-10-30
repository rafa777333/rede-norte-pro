"use client";

import React, { useEffect, useState } from "react";
import { getSupabase } from "../../../lib/supabase";
import { getYoutubeId, getVideoThumbnail } from "../../../components/DarkMediaStrip";

export interface VideoPortalRecord {
  id: string;
  titulo: string;
  url_video: string;
  plataforma: "youtube" | "tiktok" | "instagram" | "nativo" | string;
  thumbnail_url: string;
  status: "publicado" | "rascunho" | string;
  created_at?: string;
}

const PLATAFORMAS = [
  { value: "youtube", label: "YouTube / YouTube Shorts" },
  { value: "instagram", label: "Instagram Reels" },
  { value: "tiktok", label: "TikTok" },
  { value: "nativo", label: "Vídeo Próprio (Arquivo MP4)" },
];

const STATUS_OPTIONS = [
  { value: "publicado", label: "Publicado (visível na Home)" },
  { value: "rascunho", label: "Rascunho (oculto)" },
];

const EMPTY_FORM: Omit<VideoPortalRecord, "id"> = {
  titulo: "",
  url_video: "",
  plataforma: "youtube",
  thumbnail_url: "",
  status: "publicado",
};

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoPortalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [filtroPlataforma, setFiltroPlataforma] = useState("todas");
  const [busca, setBusca] = useState("");
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);

  // Carregar vídeos do Supabase
  const carregarVideos = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      if (!supabase) {
        console.warn("Supabase não configurado localmente.");
        return;
      }
      const { data, error } = await supabase
        .from("videos_portal")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        setVideos(
          data.map((item: any) => ({
            id: item.id,
            titulo: item.titulo || "",
            url_video: item.url_video || "",
            plataforma: item.plataforma || "youtube",
            thumbnail_url: item.thumbnail_url || "",
            status: item.status || "publicado",
            created_at: item.created_at,
          }))
        );
      }
    } catch (e: any) {
      console.error("Erro ao carregar vídeos:", e);
      alert(`Erro ao buscar vídeos: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregarVideos();
  }, []);

  // Upload opcional de imagem para thumbnail
  const handleUploadThumbnail = async (file: File) => {
    if (file.size > 3_000_000) {
      alert("A imagem selecionada é muito grande. Escolha uma foto de até 3 MB.");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      // Fallback data URL
      const reader = new FileReader();
      reader.onload = () => setForm((prev) => ({ ...prev, thumbnail_url: String(reader.result) }));
      reader.readAsDataURL(file);
      return;
    }
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const caminho = `videos-thumbnails/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("rede-norte-media").upload(caminho, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (error) {
        console.warn("Storage upload failed, usando base64:", error.message);
        const reader = new FileReader();
        reader.onload = () => setForm((prev) => ({ ...prev, thumbnail_url: String(reader.result) }));
        reader.readAsDataURL(file);
        return;
      }
      const { data } = supabase.storage.from("rede-norte-media").getPublicUrl(caminho);
      if (data?.publicUrl) {
        setForm((prev) => ({ ...prev, thumbnail_url: data.publicUrl }));
      }
    } catch (err: any) {
      console.warn("Erro no upload da thumbnail:", err);
      const reader = new FileReader();
      reader.onload = () => setForm((prev) => ({ ...prev, thumbnail_url: String(reader.result) }));
      reader.readAsDataURL(file);
    }
  };

  // Salvar (Criar ou Atualizar)
  const salvarVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) {
      alert("Por favor, preencha o Título do vídeo.");
      return;
    }
    if (!form.url_video.trim()) {
      alert("Por favor, informe a URL do Vídeo.");
      return;
    }

    setSalvando(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        alert("Aviso: Supabase não está configurado localmente no .env.local.");
        return;
      }

      // Auto-deriva thumbnail do YouTube se não informada
      let thumbFinal = form.thumbnail_url.trim();
      if (!thumbFinal && form.plataforma === "youtube") {
        const ytId = getYoutubeId(form.url_video);
        if (ytId) {
          thumbFinal = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        }
      }

      const payload = {
        titulo: form.titulo.trim(),
        url_video: form.url_video.trim(),
        plataforma: form.plataforma,
        thumbnail_url: thumbFinal || null,
        status: form.status,
      };

      if (editId) {
        // UPDATE
        const { error } = await supabase
          .from("videos_portal")
          .update(payload)
          .eq("id", editId);

        if (error) throw error;
        setMsgSucesso("Vídeo atualizado com sucesso!");
      } else {
        // INSERT
        const { error } = await supabase
          .from("videos_portal")
          .insert(payload);

        if (error) throw error;
        setMsgSucesso("Novo vídeo cadastrado e publicado com sucesso!");
      }

      setForm(EMPTY_FORM);
      setEditId(null);
      await carregarVideos();

      setTimeout(() => setMsgSucesso(null), 4000);
    } catch (err: any) {
      console.error("Erro ao salvar vídeo:", err);
      alert(`Não foi possível salvar o vídeo: ${err.message || err}`);
    } finally {
      setSalvando(false);
    }
  };

  // Preencher para editar
  const iniciarEdicao = (v: VideoPortalRecord) => {
    setEditId(v.id);
    setForm({
      titulo: v.titulo,
      url_video: v.url_video,
      plataforma: v.plataforma,
      thumbnail_url: v.thumbnail_url || "",
      status: v.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Excluir
  const excluirVideo = async (id: string, titulo: string) => {
    if (!confirm(`Tem certeza de que deseja excluir o vídeo "${titulo}"?`)) return;

    try {
      const supabase = getSupabase();
      if (!supabase) return;
      const { error } = await supabase.from("videos_portal").delete().eq("id", id);
      if (error) throw error;

      if (editId === id) {
        setEditId(null);
        setForm(EMPTY_FORM);
      }
      setMsgSucesso("Vídeo excluído com sucesso.");
      await carregarVideos();
      setTimeout(() => setMsgSucesso(null), 4000);
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message || err}`);
    }
  };

  // Auto-detectar plataforma ao colar URL
  const handleUrlChange = (url: string) => {
    let plat = form.plataforma;
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      plat = "youtube";
    } else if (url.includes("instagram.com")) {
      plat = "instagram";
    } else if (url.includes("tiktok.com")) {
      plat = "tiktok";
    } else if (url.endsWith(".mp4") || url.endsWith(".webm") || url.includes(".mp4?")) {
      plat = "nativo";
    }

    // Auto preview thumbnail se for youtube
    let thumb = form.thumbnail_url;
    if (plat === "youtube" && !thumb) {
      const ytId = getYoutubeId(url);
      if (ytId) thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }

    setForm((prev) => ({
      ...prev,
      url_video: url,
      plataforma: plat,
      thumbnail_url: thumb,
    }));
  };

  // Filtros de listagem
  const videosFiltrados = videos.filter((v) => {
    const matchPlat = filtroPlataforma === "todas" || v.plataforma === filtroPlataforma;
    const matchBusca =
      !busca.trim() ||
      v.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      v.url_video.toLowerCase().includes(busca.toLowerCase());
    return matchPlat && matchBusca;
  });

  const previewThumb = getVideoThumbnail({
    url_video: form.url_video,
    plataforma: form.plataforma,
    thumbnail_url: form.thumbnail_url,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Barra de Topo Administrativa */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              ← Painel Geral
            </a>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">🎬</span>
              <h1 className="font-heading font-bold text-base sm:text-lg text-white tracking-tight">
                Gerenciar Vídeos Curtos <span className="text-red-400 text-xs font-normal">(Faixa Multimídia)</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors hidden sm:inline-flex items-center gap-1"
            >
              Ver Portal ao Vivo ↗
            </a>
            <button
              type="button"
              onClick={() => void carregarVideos()}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              ↻ Atualizar
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {msgSucesso && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-sm flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>{msgSucesso}</span>
            </div>
            <button onClick={() => setMsgSucesso(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUNA ESQUERDA: FORMULÁRIO DE CADASTRO/EDIÇÃO (5 colunas) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm sticky lg:top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-red-600">
                  {editId ? "Modo de Edição" : "Novo Cadastro"}
                </span>
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 mt-0.5">
                  {editId ? "Editar Vídeo" : "Adicionar Vídeo"}
                </h2>
              </div>
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setForm(EMPTY_FORM);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            <form onSubmit={salvarVideo} className="space-y-4">
              {/* TÍTULO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Título do Vídeo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Entrevista com Prefeito sobre obras no Vale do Ivaí"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium transition-all"
                />
              </div>

              {/* URL DO VÍDEO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  URL do Vídeo (Link) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/shorts/... ou Instagram, TikTok, MP4"
                  value={form.url_video}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium transition-all"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Cole o link completo do YouTube Shorts, post/reel do Instagram, TikTok ou arquivo MP4.
                </p>
              </div>

              {/* PLATAFORMA & STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Plataforma
                  </label>
                  <select
                    value={form.plataforma}
                    onChange={(e) => setForm({ ...form, plataforma: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium bg-white"
                  >
                    {PLATAFORMAS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* THUMBNAIL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Capa / Thumbnail (Opcional)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Cole a URL da capa (https://...)"
                    value={form.thumbnail_url}
                    onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium"
                  />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 transition-colors inline-flex items-center gap-1.5">
                      <span>📁</span> Fazer Upload de Imagem
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUploadThumbnail(file);
                        }}
                      />
                    </label>
                    <span className="text-[11px] text-slate-400">
                      (No YouTube a capa é gerada automaticamente)
                    </span>
                  </div>
                </div>
              </div>

              {/* PRÉVIA VISUAL DO CARD 9:16 */}
              <div className="pt-2">
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Pré-visualização do Card na Home:
                </span>
                <div className="relative w-36 aspect-[9/16] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                  <img
                    src={previewThumb}
                    alt="Prévia"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute top-2 left-2">
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-600 text-white">
                      {form.plataforma}
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                      ▶
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[11px] font-bold text-white line-clamp-2 leading-tight">
                      {form.titulo || "Título do vídeo..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* BOTÃO DE SALVAR */}
              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-3 px-5 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-sm transition-all shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {salvando
                    ? "Salvando..."
                    : editId
                    ? "Atualizar Vídeo"
                    : "Publicar Vídeo no Portal"}
                </button>
                {editId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(null);
                      setForm(EMPTY_FORM);
                    }}
                    className="px-4 py-3 rounded-2xl border border-slate-300 hover:bg-slate-100 font-bold text-sm text-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* COLUNA DIREITA: LISTA DOS VÍDEOS CADASTRADOS (7 colunas) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h2 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900">
                    Vídeos Cadastrados ({videosFiltrados.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Itens salvos na tabela <code>public.videos_portal</code>
                  </p>
                </div>

                {/* Filtro por Plataforma */}
                <div className="flex items-center gap-2">
                  <select
                    value={filtroPlataforma}
                    onChange={(e) => setFiltroPlataforma(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
                  >
                    <option value="todas">Todas as plataformas</option>
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="nativo">Nativo (MP4)</option>
                  </select>
                </div>
              </div>

              {/* Campo de Busca */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Filtrar por título ou URL..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              {/* Estado de Carregamento */}
              {loading && (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <span className="inline-block animate-spin mr-2">↻</span> Carregando vídeos do banco...
                </div>
              )}

              {/* Lista Vazia */}
              {!loading && videosFiltrados.length === 0 && (
                <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <span className="text-3xl block mb-2">🎬</span>
                  <p className="font-bold text-slate-600 text-sm">Nenhum vídeo encontrado</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Cadastre um novo vídeo utilizando o formulário ao lado.
                  </p>
                </div>
              )}

              {/* Cards da Lista */}
              <div className="space-y-3">
                {videosFiltrados.map((v) => {
                  const thumb = getVideoThumbnail(v);
                  const isPublicado = v.status === "publicado";

                  return (
                    <div
                      key={v.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all bg-white"
                    >
                      {/* Miniatura + Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative w-16 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                          <img
                            src={thumb}
                            alt={v.titulo}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <span className="text-white text-xs">▶</span>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                v.plataforma === "youtube"
                                  ? "bg-red-50 text-red-600 border border-red-200"
                                  : v.plataforma === "instagram"
                                  ? "bg-pink-50 text-pink-600 border border-pink-200"
                                  : v.plataforma === "tiktok"
                                  ? "bg-slate-100 text-slate-900 border border-slate-300"
                                  : "bg-blue-50 text-blue-600 border border-blue-200"
                              }`}
                            >
                              {v.plataforma}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPublicado
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {isPublicado ? "● Publicado" : "○ Rascunho"}
                            </span>
                          </div>

                          <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 truncate">
                            {v.titulo}
                          </h3>

                          <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-md">
                            {v.url_video}
                          </p>

                          {v.created_at && (
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Cadastrado em: {new Date(v.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <a
                          href={v.url_video}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir link original"
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors"
                        >
                          ↗ Link
                        </a>
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(v)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void excluirVideo(v.id, v.titulo)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200 transition-colors cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
