"use client";

import React, { useState, useId, useTransition } from "react";
import Link from "next/link";
import {
  Video,
  Upload,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText,
  Search,
  ArrowLeft,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { getYoutubeId } from "@/components/DarkMediaStrip";

const CATEGORIAS = [
  "Cidade",
  "Política",
  "Segurança",
  "Economia",
  "Esportes",
  "Eventos",
  "Saúde",
  "Educação",
  "Geral",
];

const CIDADES = [
  "Apucarana",
  "Arapongas",
  "Vale do Ivaí",
  "Jandaia do Sul",
  "Cambira",
  "Califórnia",
  "Marilândia do Sul",
  "Faxinal",
  "Ivaiporã",
  "Mauá da Serra",
  "Geral",
];

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export default function AdminNewsPublishForm() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [seoDescription, setSeoDescription] = useState("");
  const [content, setContent] = useState("");
  const [categoria, setCategoria] = useState("Cidade");
  const [cidade, setCidade] = useState("Apucarana");
  const [autor, setAutor] = useState("Redação Rede Apucarana");

  // Mídia
  const [mediaType, setMediaType] = useState<"upload" | "youtube">("youtube");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFormat, setVideoFormat] = useState<"16:9" | "9:16">("16:9");
  const [coverImage, setCoverImage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadCoverProgress, setUploadCoverProgress] = useState(0);

  // Preview & Status
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [submitting, setSubmitting] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<{
    slug: string;
    url: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-generate slug when title changes
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isCustomSlug) {
      setSlug(slugify(val));
    }
  };

  // Atualiza URL do vídeo e detecta formato automaticamente se for Shorts/Reels
  const handleVideoUrlChange = (url: string) => {
    setVideoUrl(url);
    if (url.includes("/shorts/") || url.includes("/reel/") || url.includes("tiktok.com/")) {
      setVideoFormat("9:16");
    }
  };

  // Upload dedicado para Foto de Capa (Thumbnail 16:9) no bucket media subpasta capas
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      setErrorMessage(null);
      setUploadCoverProgress(20);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "capas");

      setUploadCoverProgress(50);
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploadCoverProgress(100);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro no upload da foto de capa.");
      }

      setCoverImage(data.url);
    } catch (err: any) {
      console.error("[Cover Upload Error]", err);
      setErrorMessage(err?.message || "Não foi possível carregar a imagem de capa.");
    } finally {
      setUploadingCover(false);
    }
  };

  // Upload direto para o bucket media via API do Next.js
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setErrorMessage(null);
      setUploadProgress(20);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "noticias");

      setUploadProgress(50);
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploadProgress(100);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro no upload do arquivo.");
      }

      setUploadedFileName(file.name);
      if (data.fileType === "video") {
        setVideoUrl(data.url);
      } else {
        setImageUrl(data.url);
      }
    } catch (err: any) {
      console.error("[Upload Error]", err);
      setErrorMessage(err?.message || "Não foi possível carregar o arquivo.");
    } finally {
      setUploading(false);
    }
  };

  // Preenche descrição SEO com resumo do corpo caso esteja vazia
  const handleGenerateSeo = () => {
    if (!content.trim()) return;
    const clean = content
      .replace(/<[^>]+>/g, " ")
      .replace(/[*#_~`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    setSeoDescription(clean.slice(0, 155));
  };

  // YouTube Embed ID
  const ytId = getYoutubeId(videoUrl);

  // Submissão da notícia
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Por favor, informe o título da matéria.");
      return;
    }
    if (!content.trim()) {
      setErrorMessage("Por favor, digite o corpo/texto da notícia.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/noticias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || slugify(title),
          seo_description: seoDescription.trim(),
          content: content.trim(),
          video_url: videoUrl.trim() || null,
          video_format: videoFormat,
          cover_image: coverImage.trim() || imageUrl.trim() || null,
          imagem: coverImage.trim() || imageUrl.trim() || null,
          categoria,
          cidade,
          autor,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao publicar notícia.");
      }

      setPublishSuccess({
        slug: data.slug,
        url: data.url,
      });
    } catch (err: any) {
      console.error("[Publish Error]", err);
      setErrorMessage(err?.message || "Erro inesperado ao salvar matéria.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle("");
    setSlug("");
    setIsCustomSlug(false);
    setSeoDescription("");
    setContent("");
    setVideoUrl("");
    setVideoFormat("16:9");
    setCoverImage("");
    setImageUrl("");
    setUploadedFileName("");
    setPublishSuccess(null);
    setErrorMessage(null);
    setActiveTab("edit");
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Painel Geral
          </Link>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-red-600 text-white rounded-xl shadow-xs">
              <Video className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                Publicação de Notícias & Vídeos
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Otimizado para o Google (SEO instantâneo) com suporte nativo a vídeos
              </p>
            </div>
          </div>
        </div>

        {publishSuccess && (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            + Criar Nova Matéria
          </button>
        )}
      </div>

      {/* Modal / Sucesso de Publicação */}
      {publishSuccess && (
        <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl shadow-lg">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-emerald-900">
                🎉 Matéria Publicada com Sucesso no Portal!
              </h2>
              <p className="text-sm text-emerald-800 mt-1">
                A matéria já está com SSR (Server-Side Rendering) pronto para indexação rápida no Google e compartilhamento em redes sociais.
              </p>

              <div className="mt-4 p-3 bg-white rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-mono text-slate-700 truncate">
                  https://www.redeapucarana.com.br{publishSuccess.url}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={publishSuccess.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                  >
                    Abrir Notícia no Ar
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de Erro */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================================= */}
        {/* BLOCO 1: TÍTULO & SLUG                                                    */}
        {/* ========================================================================= */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Título da Matéria *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ex: Obra de duplicação do Contorno Sul é liberada para o tráfego em Apucarana"
              className="w-full px-4 py-3 text-base sm:text-lg font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          {/* Slug amigável */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
              <span className="font-semibold text-slate-600">URL Amigável:</span>
              <span className="font-mono text-slate-400">/noticia/</span>
              {isCustomSlug ? (
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-900"
                />
              ) : (
                <span className="font-mono font-bold text-slate-800 truncate">
                  {slug || "slug-automatico-da-materia"}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCustomSlug(!isCustomSlug)}
              className="text-[11px] font-bold text-sky-600 hover:text-sky-700 self-start sm:self-auto"
            >
              {isCustomSlug ? "Travar Automático" : "Editar Slug"}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOCO 2: SEO GOOGLE (META DESCRIPTION 160 CARACTERES)                    */}
        {/* ========================================================================= */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Descrição para o Google (SEO Snippet)
            </label>
            <button
              type="button"
              onClick={handleGenerateSeo}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700"
              title="Gera o resumo com base no texto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Preencher com texto
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              maxLength={200}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Resuma a notícia em 1 a 2 frases diretas (ideal até 160 caracteres). Este é o texto que os robôs do Google exibirão nos resultados de busca."
              className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden transition-all placeholder:text-slate-400"
            />
            {/* Contador de Caracteres */}
            <div className="flex items-center justify-between mt-1 px-1 text-[11px]">
              <span className="text-slate-500 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Este é o texto que aparecerá na busca do Google e nos compartilhamentos do WhatsApp.
              </span>
              <span
                className={`font-mono font-bold ${
                  seoDescription.length > 160
                    ? "text-red-600"
                    : seoDescription.length >= 140
                    ? "text-emerald-600"
                    : "text-slate-500"
                }`}
              >
                {seoDescription.length} / 160 caracteres
              </span>
            </div>
          </div>

          {/* Pré-visualização Realista no Google */}
          <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-slate-700">Prévia do Resultado no Google:</span>
            </div>
            <div className="text-xs text-slate-600 truncate">
              https://www.redeapucarana.com.br › noticia › {slug || "slug-da-noticia"}
            </div>
            <div className="text-base text-blue-700 font-medium hover:underline cursor-pointer truncate">
              {title || "Título da matéria como aparecerá nos resultados do Google"}
            </div>
            <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {seoDescription ||
                "A descrição da matéria configurada acima aparecerá aqui em até 160 caracteres, atraindo cliques orgânicos de leitores no buscador do Google."}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOCO 3: MÍDIA DA MATÉRIA (VÍDEO / CAPA)                                  */}
        {/* ========================================================================= */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Mídia da Matéria (Vídeo ou Imagem de Destaque)
            </label>
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setMediaType("youtube")}
                className={`px-3 py-1 font-bold rounded-md transition-all ${
                  mediaType === "youtube"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                YouTube / Link
              </button>
              <button
                type="button"
                onClick={() => setMediaType("upload")}
                className={`px-3 py-1 font-bold rounded-md transition-all ${
                  mediaType === "upload"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Upload Arquivo (.mp4/imagem)
              </button>
            </div>
          </div>

          {/* Opção A: YouTube / Link Externo */}
          {mediaType === "youtube" && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="Cole aqui o link do vídeo (YouTube, YouTube Shorts ou link .mp4)"
                  className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden"
                />
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>

              {/* Pré-visualização do YouTube */}
              {ytId && (
                <div className={`rounded-xl overflow-hidden border border-slate-200 mx-auto bg-black shadow-md ${
                  videoFormat === "9:16" ? "aspect-[9/16] max-w-[260px]" : "aspect-video max-w-lg"
                }`}>
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title="Pré-visualização do Vídeo"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )}

          {/* Opção B: Upload direto para o Bucket Media */}
          {mediaType === "upload" && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl p-6 text-center transition-colors bg-slate-50">
                <input
                  type="file"
                  id="media-file-upload"
                  accept="video/mp4,video/webm,image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="media-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 hover:underline">
                      Clique para selecionar o vídeo (.mp4) ou imagem
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      O arquivo é enviado diretamente para o Storage público (`media`) do Supabase.
                    </p>
                  </div>
                </label>
              </div>

              {/* Barra de Progresso do Upload */}
              {uploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Enviando mídia...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Sucesso do Upload e Preview */}
              {(videoUrl || imageUrl) && uploadedFileName && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <span className="truncate font-medium">
                    ✓ Arquivo salvo com sucesso: <strong>{uploadedFileName}</strong>
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-200/60 px-2 py-0.5 rounded">
                    bucket: media
                  </span>
                </div>
              )}

              {/* Player do MP4 Local */}
              {videoUrl && videoUrl.endsWith(".mp4") && (
                <div className={`rounded-xl overflow-hidden border border-slate-200 mx-auto bg-black shadow-md ${
                  videoFormat === "9:16" ? "aspect-[9/16] max-w-[260px]" : "aspect-video max-w-lg"
                }`}>
                  <video src={videoUrl} controls className="w-full h-full object-contain" />
                </div>
              )}

              {/* Preview da Imagem */}
              {imageUrl && (
                <div className="max-w-md mx-auto rounded-xl overflow-hidden border border-slate-200">
                  <img src={imageUrl} alt="Capa" className="w-full h-auto object-cover" />
                </div>
              )}
            </div>
          )}

          {/* Seletor de Formato do Vídeo (16:9 vs 9:16) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Formato de Exibição do Vídeo
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVideoFormat("16:9")}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  videoFormat === "16:9"
                    ? "border-red-600 bg-red-50/50 text-red-950 font-bold shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="text-xl">📺</span>
                <div>
                  <div className="text-xs font-bold">Vídeo Horizontal (16:9)</div>
                  <div className="text-[11px] text-slate-500 font-normal">Padrão para matérias e reportagens de TV</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVideoFormat("9:16")}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  videoFormat === "9:16"
                    ? "border-red-600 bg-red-50/50 text-red-950 font-bold shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="text-xl">📱</span>
                <div>
                  <div className="text-xs font-bold">Vídeo Vertical (9:16 - Shorts / Reels)</div>
                  <div className="text-[11px] text-slate-500 font-normal">Gravado no celular em pé / cortes verticais</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOCO 3.1: FOTO DE CAPA (THUMBNAIL DA HOME - 16:9)                       */}
        {/* ========================================================================= */}
        <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs space-y-4 transition-all ${
          videoFormat === "9:16" ? "bg-amber-50/40 border-amber-300" : "bg-white border-slate-200"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900">
                  Foto de Capa (Thumbnail da Home) • Proporção 16:9
                </label>
                {videoFormat === "9:16" && (
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-black uppercase">
                    Altamente Recomendado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {videoFormat === "9:16"
                  ? "Obrigatório quando o vídeo for vertical (Shorts/Reels 9:16). Essa imagem 16:9 será exibida na Home e no card de notícias para não quebrar o layout. Se não enviada, será exibido o logo oficial da Rede Apucarana."
                  : "Imagem horizontal 16:9 para a manchete da Home e compartilhamentos no WhatsApp e redes sociais."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-3">
              {/* Botão de Upload de Capa */}
              <div className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-xl p-4 text-center transition-colors bg-white">
                <input
                  type="file"
                  id="cover-file-upload"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleCoverUpload}
                  className="hidden"
                  disabled={uploadingCover}
                />
                <label
                  htmlFor="cover-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 hover:underline">
                      Enviar foto de capa do computador
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      JPG, PNG ou WEBP em 16:9 (salvo no bucket `media/capas`)
                    </p>
                  </div>
                </label>
              </div>

              {/* Progresso de Upload da Capa */}
              {uploadingCover && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>Enviando foto de capa...</span>
                    <span>{uploadCoverProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{ width: `${uploadCoverProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Ou informar URL externa da imagem */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Ou informe a URL direta da imagem:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://... ou caminho da imagem"
                    className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-hidden bg-white"
                  />
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Pré-visualização da Capa 16:9 */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">
                Prévia da Imagem na Home (16:9):
              </span>
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-300 bg-slate-900 flex items-center justify-center relative shadow-inner">
                {coverImage || imageUrl ? (
                  <img
                    src={coverImage || imageUrl}
                    alt="Prévia da Capa"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/logo-rede-apucarana.png";
                      (e.currentTarget as HTMLImageElement).className = "w-20 h-20 object-contain";
                    }}
                  />
                ) : ytId && videoFormat !== "9:16" ? (
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                    alt="Thumbnail YouTube"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/logo-rede-apucarana.png";
                      (e.currentTarget as HTMLImageElement).className = "w-20 h-20 object-contain";
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <img
                      src="/logo-rede-apucarana.png"
                      alt="Logo Oficial"
                      className="w-16 h-16 object-contain mb-2 opacity-80"
                    />
                    <span className="text-[11px] font-medium text-slate-300">
                      Fallback Oficial: Logo da Rede Apucarana
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Nenhuma foto aleatória será exibida)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOCO 4: METADADOS (CATEGORIA, CIDADE, AUTOR)                            */}
        {/* ========================================================================= */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Categoria
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-hidden"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Cidade / Região
            </label>
            <select
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-hidden"
            >
              {CIDADES.map((cid) => (
                <option key={cid} value={cid}>
                  {cid}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Autor / Créditos
            </label>
            <input
              type="text"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              placeholder="Redação Rede Apucarana"
              className="w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-hidden"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOCO 5: CORPO DA MATÉRIA (EDITOR COM PREVIEW)                            */}
        {/* ========================================================================= */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Corpo da Matéria *
            </label>
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-3 py-1 font-bold rounded-md flex items-center gap-1 transition-all ${
                  activeTab === "edit"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Escrever
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 font-bold rounded-md flex items-center gap-1 transition-all ${
                  activeTab === "preview"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Prévia de Leitura
              </button>
            </div>
          </div>

          {activeTab === "edit" ? (
            <textarea
              required
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva aqui a matéria completa. Pressione Enter duas vezes para criar novos parágrafos. Você também pode colar títulos e links normalmente."
              className="w-full px-4 py-3 text-base text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden font-sans leading-relaxed"
            />
          ) : (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl min-h-[300px]">
              <article className="prose prose-slate max-w-none">
                {content.split(/\n\s*\n/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </article>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BOTÃO DE AÇÃO PRINCIPAL                                                   */}
        {/* ========================================================================= */}
        <div className="pt-2 flex items-center justify-end gap-4">
          <Link
            href="/admin"
            className="px-5 py-3 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="px-8 py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publicando Matéria...</span>
              </>
            ) : (
              <>
                <span>Publicar Notícia</span>
                <span className="text-base">🚀</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
