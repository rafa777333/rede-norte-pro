import React, { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ArrowLeft, Clock, Play } from "lucide-react";
import ShareButtons from "./ShareButtons";
import { decodeHtmlEntities, ensureHttps } from "@/lib/text-utils";

// Caching ISR inteligente: revalida a cada 60s em background
// Sem 'force-dynamic' para permitir renderização ultra rápida (< 30ms)
export const revalidate = 60;

const SITE_URL = "https://www.redeapucarana.com.br";

interface NormalizedNews {
  id: string;
  slug: string;
  title: string;
  seo_description: string;
  content: string;
  video_url: string | null;
  video_format?: string;
  cover_image?: string | null;
  imagem: string | null;
  categoria: string;
  cidade: string;
  autor: string;
  published_at: string;
}

/**
 * Fallback institucional resiliente para notícias base do portal
 */
const INSTITUTIONAL_FALLBACKS: Record<string, NormalizedNews> = {
  "1": {
    id: "1",
    slug: "portal-rede-apucarana-informacao-regional",
    title: "Portal Rede Apucarana de Comunicação • Informação Regional em Tempo Real",
    seo_description:
      "Acompanhe a cobertura completa de acontecimentos em Apucarana, Arapongas e Vale do Ivaí com credibilidade e utilidade pública.",
    content:
      "A Rede Apucarana de Comunicação traz as principais atualizações e reportagens de toda a nossa região com jornalismo ágil, ético e focado no desenvolvimento do Vale do Ivaí.",
    video_url: null,
    imagem: "/logo-rede-apucarana.png",
    cover_image: "/logo-rede-apucarana.png",
    categoria: "Cidade",
    cidade: "Apucarana",
    autor: "Redação Rede Apucarana",
    published_at: "2026-01-01T08:00:00Z",
  },
  "portal-rede-apucarana-informacao-regional": {
    id: "1",
    slug: "portal-rede-apucarana-informacao-regional",
    title: "Portal Rede Apucarana de Comunicação • Informação Regional em Tempo Real",
    seo_description:
      "Acompanhe a cobertura completa de acontecimentos em Apucarana, Arapongas e Vale do Ivaí com credibilidade e utilidade pública.",
    content:
      "A Rede Apucarana de Comunicação traz as principais atualizações e reportagens de toda a nossa região com jornalismo ágil, ético e focado no desenvolvimento do Vale do Ivaí.",
    video_url: null,
    imagem: "/logo-rede-apucarana.png",
    cover_image: "/logo-rede-apucarana.png",
    categoria: "Cidade",
    cidade: "Apucarana",
    autor: "Redação Rede Apucarana",
    published_at: "2026-01-01T08:00:00Z",
  },
  "2": {
    id: "2",
    slug: "desenvolvimento-regional-oportunidades-vale-do-ivai",
    title: "Desenvolvimento Regional e Oportunidades no Vale do Ivaí",
    seo_description:
      "Setor produtivo e comércio local fortalecem a geração de empregos na região de Apucarana e cidades vizinhas.",
    content:
      "O setor de comércio e serviços segue como um dos pilares da economia regional, impulsionando novos empreendimentos e oportunidades de trabalho.",
    video_url: null,
    imagem: "/logo-rede-apucarana.png",
    cover_image: "/logo-rede-apucarana.png",
    categoria: "Economia",
    cidade: "Arapongas",
    autor: "Redação Rede Apucarana",
    published_at: "2026-01-01T08:00:00Z",
  },
  "desenvolvimento-regional-oportunidades-vale-do-ivai": {
    id: "2",
    slug: "desenvolvimento-regional-oportunidades-vale-do-ivai",
    title: "Desenvolvimento Regional e Oportunidades no Vale do Ivaí",
    seo_description:
      "Setor produtivo e comércio local fortalecem a geração de empregos na região de Apucarana e cidades vizinhas.",
    content:
      "O setor de comércio e serviços segue como um dos pilares da economia regional, impulsionando novos empreendimentos e oportunidades de trabalho.",
    video_url: null,
    imagem: "/logo-rede-apucarana.png",
    cover_image: "/logo-rede-apucarana.png",
    categoria: "Economia",
    cidade: "Arapongas",
    autor: "Redação Rede Apucarana",
    published_at: "2026-01-01T08:00:00Z",
  },
  "3": {
    id: "3",
    slug: "servicos-publicos-comunidade-apucarana",
    title: "Serviços Públicos e Utilidade à Comunidade de Apucarana e Região",
    seo_description:
      "Confira informações essenciais, telefones úteis e atendimento à população do Vale do Ivaí.",
    content:
      "Informações atualizadas sobre serviços públicos, plantões e utilidades para o morador de Apucarana e municípios parceiros.",
    video_url: null,
    imagem: "/logo-rede-apucarana.png",
    cover_image: "/logo-rede-apucarana.png",
    categoria: "Serviço",
    cidade: "Apucarana",
    autor: "Redação Rede Apucarana",
    published_at: "2026-01-01T08:00:00Z",
  },
  "servicos-publicos-comunidade-apucarana": {
    id: "3",
    slug: "servicos-publicos-comunidade-apucarana",
    title: "Serviços Públicos e Utilidade à Comunidade de Apucarana e Região",
    seo_description:
      "Confira informações essenciais, telefones úteis e atendimento à população do Vale do Ivaí.",
    content:
      "Informações atualizadas sobre serviços públicos, plantões e utilidades para o morador de Apucarana e municípios parceiros.",
    video_url: null,
    imagem: "/logo-rede-apucarana.png",
    cover_image: "/logo-rede-apucarana.png",
    categoria: "Serviço",
    cidade: "Apucarana",
    autor: "Redação Rede Apucarana",
    published_at: "2026-01-01T08:00:00Z",
  },
  "4": {
    id: "4",
    slug: "vale-do-ivai-noticias-dos-26-municipios",
    title: "Vale do Ivaí: Acompanhe as Notícias dos 26 Municípios",
    seo_description:
      "Giro regional com os principais fatos do dia apurados pela equipe de reportagem da Rede Apucarana.",
    content:
      "Reportagens e notícias de interesse público cobrindo todo o Vale do Ivaí com atualizações diárias sobre os 26 municípios paranaenses.",
    video_url: null,
    imagem: "/logo-rede-apucarana.png",
    cover_image: "/logo-rede-apucarana.png",
    categoria: "Região",
    cidade: "Ivaiporã",
    autor: "Redação Rede Apucarana",
    published_at: "2026-01-01T08:00:00Z",
  },
  "vale-do-ivai-noticias-dos-26-municipios": {
    id: "4",
    slug: "vale-do-ivai-noticias-dos-26-municipios",
    title: "Vale do Ivaí: Acompanhe as Notícias dos 26 Municípios",
    seo_description:
      "Giro regional com os principais fatos do dia apurados pela equipe de reportagem da Rede Apucarana.",
    content:
      "Reportagens e notícias de interesse público cobrindo todo o Vale do Ivaí com atualizações diárias sobre os 26 municípios paranaenses.",
    video_url: null,
    imagem: "/logo-rede-apucarana.png",
    cover_image: "/logo-rede-apucarana.png",
    categoria: "Região",
    cidade: "Ivaiporã",
    autor: "Redação Rede Apucarana",
    published_at: "2026-01-01T08:00:00Z",
  },
};

/**
 * Timeout seguro para evitar que consultas remotas travem o servidor
 */
function withTimeout<T>(promise: PromiseLike<T>, ms: number = 4000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout de consulta após ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Formatação de data à prova de falhas (nunca lança RangeError)
 */
function safeFormatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Formatação ISO segura para dados estruturados
 */
function safeIsoDate(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Extrator Robusto de ID do YouTube
 */
function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const regExp =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

/**
 * Retorna a URL da thumbnail em alta resolução do YouTube
 */
function getYoutubeThumbnail(url: string | null | undefined): string | null {
  const id = extractYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
}

/**
 * Busca a notícia no Supabase com deduplicação React cache() por requisição
 */
const getNewsBySlug = cache(
  async (slug: string | undefined | null): Promise<NormalizedNews | null> => {
    if (!slug) return null;

    let decodedSlug = "";
    try {
      decodedSlug = decodeURIComponent(slug).trim();
    } catch {
      decodedSlug = String(slug).trim();
    }
    if (!decodedSlug) return null;

    // 0. Fallback institucional instantâneo (evita 404 em links base)
    if (INSTITUTIONAL_FALLBACKS[decodedSlug]) {
      return INSTITUTIONAL_FALLBACKS[decodedSlug];
    }

    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      // Valida se o slug informado é um UUID v4 válido
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        decodedSlug
      );

      // 1. Consulta primária na tabela news com timeout protetor
      let query = supabase.from("news").select("*");
      if (isUuid) {
        query = query.or(`slug.eq.${decodedSlug},id.eq.${decodedSlug}`);
      } else {
        query = query.eq("slug", decodedSlug);
      }

      const { data, error } = await withTimeout(query.maybeSingle(), 4000);

      if (error) {
        console.warn("[getNewsBySlug news warning]:", error.message);
      }

      if (data) {
        const rawFonte = data.fonte || "";
        let extractedVideo: string | null = data.video_url || null;
        let extractedFormat = (data as any).video_format || "16:9";

        if (!extractedVideo && rawFonte.startsWith("video:")) {
          const rawVideo = rawFonte.slice(6);
          if (rawVideo.startsWith("9:16:") || rawVideo.startsWith("16:9:")) {
            extractedFormat = rawVideo.slice(0, 4);
            extractedVideo = rawVideo.slice(5);
          } else {
            extractedVideo = rawVideo;
          }
        }

        if (
          extractedVideo &&
          (extractedVideo.includes("/shorts/") ||
            extractedVideo.includes("/reel/") ||
            extractedVideo.includes("tiktok.com/"))
        ) {
          extractedFormat = "9:16";
        }

        const cover_image = ensureHttps((data as any).cover_image || data.imagem || null);
        const rawTitle = decodeHtmlEntities(data.title || data.titulo || "");
        if (!rawTitle) return null;

        const rawContent = decodeHtmlEntities(data.content || data.conteudo || "");
        const rawResumo = decodeHtmlEntities(
          data.seo_description ||
          data.resumo ||
          rawContent.replace(/<[^>]+>/g, "").slice(0, 160)
        );

        return {
          id: data.id,
          slug: data.slug || data.id,
          title: rawTitle,
          seo_description: rawResumo,
          content: rawContent,
          video_url: extractedVideo,
          video_format: extractedFormat,
          cover_image,
          imagem: cover_image || ensureHttps(data.imagem) || null,
          categoria: data.categoria || "Geral",
          cidade: data.cidade_slug || "Apucarana",
          autor: data.autor || "Redação Rede Apucarana",
          published_at: data.published_at || data.created_at || new Date().toISOString(),
        };
      }

      // 2. Fallback de compatibilidade na tabela noticias_portal com timeout protetor
      let portalQuery = supabase.from("noticias_portal").select("*");
      if (isUuid) {
        portalQuery = portalQuery.or(`slug.eq.${decodedSlug},id.eq.${decodedSlug}`);
      } else {
        portalQuery = portalQuery.eq("slug", decodedSlug);
      }

      const { data: portalData, error: portalError } = await withTimeout(
        portalQuery.maybeSingle(),
        3000
      );

      if (portalError) {
        console.warn("[getNewsBySlug noticias_portal warning]:", portalError.message);
      }

      if (portalData) {
        const rawTitle = decodeHtmlEntities(portalData.titulo_seo || portalData.titulo || "");
        if (!rawTitle) return null;

        const rawContent = decodeHtmlEntities(portalData.corpo_html || portalData.conteudo || "");
        const rawResumo = decodeHtmlEntities(
          portalData.resumo_meta ||
          rawContent.replace(/<[^>]+>/g, "").slice(0, 160)
        );

        return {
          id: portalData.id,
          slug: portalData.slug || portalData.id,
          title: rawTitle,
          seo_description: rawResumo,
          content: rawContent,
          video_url: null,
          imagem: ensureHttps(portalData.imagem_url || portalData.imagem || null),
          cover_image: ensureHttps(portalData.imagem_url || portalData.imagem || null),
          categoria: portalData.categoria || "Geral",
          cidade: "Apucarana",
          autor: portalData.credito_imagem || portalData.fonte_nome || "Redação Rede Apucarana",
          published_at: portalData.created_at || new Date().toISOString(),
        };
      }

      return null;
    } catch (err) {
      console.error("[getNewsBySlug exception]:", err);
      return null;
    }
  }
);

/**
 * =========================================================================
 * SEO DINÂMICO PARA O GOOGLE (Server-Side Metadata)
 * =========================================================================
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const news = await getNewsBySlug(params?.slug);
    if (!news) {
      return {
        title: "Matéria não encontrada | Rede Apucarana",
        description: "A matéria solicitada não foi localizada ou já expirou.",
        robots: { index: false, follow: false },
      };
    }

    const pageUrl = `${SITE_URL}/noticia/${encodeURIComponent(news.slug)}`;
    const description =
      news.seo_description ||
      "Confira a reportagem completa com detalhes apurados na Rede Apucarana de Comunicação.";

    const is916 = news.video_format === "9:16";
    const ytId = extractYoutubeId(news.video_url);
    const ytThumb = !is916 && ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;

    const primaryImageUrl =
      news.cover_image || news.imagem || ytThumb || `${SITE_URL}/logo-rede-apucarana.png`;

    const ogImages = [
      {
        url: primaryImageUrl,
        width: 1280,
        height: 720,
        alt: news.title,
      },
    ];

    const metadata: Metadata = {
      title: `${news.title} | Rede Apucarana`,
      description: description,
      alternates: {
        canonical: pageUrl,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      },
      openGraph: {
        title: news.title,
        description: description,
        url: pageUrl,
        type: "article",
        siteName: "Rede Apucarana de Comunicação",
        locale: "pt_BR",
        publishedTime: safeIsoDate(news.published_at),
        authors: [news.autor],
        images: ogImages,
      },
      twitter: {
        card: "summary_large_image",
        title: news.title,
        description: description,
        images: [primaryImageUrl],
      },
    };

    if (news.video_url && metadata.openGraph) {
      if (ytId) {
        metadata.openGraph.videos = [
          {
            url: `https://www.youtube.com/embed/${ytId}`,
            type: "text/html",
            width: 1280,
            height: 720,
          },
        ];
      } else {
        metadata.openGraph.videos = [
          {
            url: news.video_url,
            type: "video/mp4",
          },
        ];
      }
    }

    return metadata;
  } catch (err) {
    return {
      title: "Rede Apucarana - Notícias e TV ao Vivo no Vale do Ivaí",
      description:
        "Portal de notícias, TV ao vivo 24h, podcasts e guia de comércios de Apucarana e todo o Vale do Ivaí.",
    };
  }
}

/**
 * =========================================================================
 * COMPONENTE PRINCIPAL (RSC): NewsArticlePage
 * =========================================================================
 */
export default async function NewsArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  // 1. Validação do parâmetro de rota
  if (!params?.slug) {
    notFound();
  }

  // 2. Busca segura da notícia (usa React cache, compartilhando o resultado com generateMetadata)
  const news = await getNewsBySlug(params.slug);

  // 3. Tratamento de Not Found antes de qualquer renderização
  if (!news) {
    notFound();
  }

  const supabase = getSupabase();
  const pageUrl = `${SITE_URL}/noticia/${encodeURIComponent(news.slug)}`;

  // 4. Notícias relacionadas com timeout seguro e try/catch
  let related: any[] = [];
  try {
    if (supabase) {
      const { data } = await withTimeout(
        supabase
          .from("news")
          .select("id,slug,titulo,imagem,categoria,published_at")
          .neq("id", news.id)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(3),
        2500
      );
      if (data) related = data;
    }
  } catch (err) {
    console.warn("[related news warning]:", err);
  }

  // Detecção de Vídeo YouTube vs Arquivo .mp4
  const ytId = extractYoutubeId(news.video_url);
  const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;
  const primaryThumb = ytThumb || news.imagem || `${SITE_URL}/logo-rede-apucarana.png`;

  const isDirectVideo =
    news.video_url &&
    (news.video_url.endsWith(".mp4") ||
      news.video_url.includes("supabase.co/storage") ||
      news.video_url.includes("/media/"));

  // Conteúdo em parágrafos
  const isHtml = /<\/(p|h2|h3|ul|li|strong|em|div|blockquote)>/i.test(news.content);
  const textParagraphs = isHtml
    ? []
    : news.content
        .replace(/\\n/g, "\n")
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

  // Formatação segura de data
  const uploadDateIso = safeIsoDate(news.published_at);
  const formattedDisplayDate = safeFormatDate(news.published_at);

  // =========================================================================
  // DADOS ESTRUTURADOS (JSON-LD) - Schema.org NewsArticle + VideoObject
  // =========================================================================
  const schemaArticle: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    headline: news.title,
    description: news.seo_description,
    image: [primaryThumb, news.imagem].filter(Boolean),
    datePublished: uploadDateIso,
    dateModified: uploadDateIso,
    author: {
      "@type": "Person",
      name: news.autor,
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "Rede Apucarana de Comunicação",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo-rede-apucarana.png`,
      },
    },
  };

  if (news.video_url) {
    const embedUrl = ytId ? `https://www.youtube.com/embed/${ytId}` : news.video_url;
    const thumbnailList = ytId
      ? [
          `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
          `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        ]
      : [primaryThumb];

    schemaArticle.video = {
      "@type": "VideoObject",
      name: news.title,
      description: news.seo_description,
      thumbnailUrl: thumbnailList,
      uploadDate: uploadDateIso,
      embedUrl: embedUrl,
      contentUrl: news.video_url,
    };
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-red-500 selection:text-white pb-20">
      {/* Injeção de Dados Estruturados para o Googlebot */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaArticle) }}
      />

      {/* Barra de Topo Limpa com Navegação */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-red-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar às Notícias</span>
          </Link>

          <Link href="/" className="flex items-center gap-2" title="Página Inicial">
            <img
              src="/logo-rede-apucarana.png"
              alt="Rede Apucarana"
              className="w-8 h-8 object-contain"
            />
            <span className="font-heading font-black text-sm tracking-tight text-slate-900 hidden sm:inline">
              REDE APUCARANA
            </span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Central da Matéria */}
      <article className="max-w-3xl mx-auto px-4 pt-6 sm:pt-10">
        {/* Metadados: Categoria e Cidade */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-xs">
            {news.categoria}
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            • {news.cidade}
          </span>
        </div>

        {/* H1 Principal */}
        <h1 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl text-slate-900 leading-[1.18] tracking-tight mb-4">
          {decodeHtmlEntities(news.title)}
        </h1>

        {/* Subtítulo / Linha Fina (Resumo SEO Google) */}
        {news.seo_description && (
          <p className="text-base sm:text-xl text-slate-600 font-sans leading-relaxed mb-6 font-normal">
            {decodeHtmlEntities(news.seo_description)}
          </p>
        )}

        {/* Byline: Autor, Data e Compartilhamento */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-slate-100 text-xs text-slate-500 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
              <img
                src="/logo-rede-apucarana.png"
                alt={news.autor}
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-xs sm:text-sm">
                {news.autor}
              </div>
              {formattedDisplayDate && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{formattedDisplayDate}</span>
                </div>
              )}
            </div>
          </div>

          <ShareButtons title={news.title} url={pageUrl} />
        </div>

        {/* ========================================================================= */}
        {/* PLAYER DE VÍDEO EM DESTAQUE (YouTube ou .mp4)                             */}
        {/* ========================================================================= */}
        {news.video_url && (() => {
          const isVertical =
            news.video_format === "9:16" ||
            Boolean(
              news.video_url?.includes("/shorts/") ||
                news.video_url?.includes("/reel/") ||
                news.video_url?.includes("tiktok.com/")
            );
          return (
            <section aria-label="Vídeo da Matéria" className="my-6 sm:my-8">
              {isVertical ? (
                // Player Vertical (9:16 - Shorts / Reels / Mobile)
                <div className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800">
                  {ytId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                      title={news.title}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : isDirectVideo ? (
                    <video
                      src={news.video_url}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    >
                      Seu navegador não suporta a reprodução deste vídeo.
                    </video>
                  ) : (
                    <iframe
                      src={news.video_url}
                      title={news.title}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                    />
                  )}
                </div>
              ) : ytId ? (
                // Player do YouTube (16:9)
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-200">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                    title={news.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : isDirectVideo ? (
                // Player de Vídeo Nativo HTML5 (.mp4)
                <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-200 flex items-center justify-center">
                  <video
                    src={news.video_url}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                  >
                    Seu navegador não suporta a reprodução deste vídeo.
                  </video>
                </div>
              ) : (
                // Fallback para outros tipos de link de vídeo
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-red-500" />
                    <span className="text-xs font-bold">Assistir ao vídeo da matéria</span>
                  </div>
                  <a
                    href={news.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Abrir Vídeo Externo ↗
                  </a>
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                ▶ Transmissão em vídeo • Rede Apucarana de Comunicação
              </p>
            </section>
          );
        })()}

        {/* Se NÃO houver vídeo, exibe imagem de capa com fallback neutro */}
        {!news.video_url && (news.cover_image || news.imagem) && (
          <figure className="my-6 sm:my-8 rounded-2xl overflow-hidden shadow-md border border-slate-100 bg-slate-900">
            <img
              src={ensureHttps(news.cover_image || news.imagem) || "/logo-rede-apucarana.png"}
              alt={news.title}
              className={`w-full ${(news.cover_image || news.imagem) === "/logo-rede-apucarana.png" ? "h-64 object-contain p-6" : "h-auto max-h-[500px] object-cover"}`}
              loading="eager"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.startsWith("http://")) {
                  target.src = target.src.replace(/^http:\/\//i, "https://");
                  return;
                }
                target.src = "/logo-rede-apucarana.png";
                target.className = "w-full h-64 object-contain p-6 bg-slate-900";
              }}
            />
            <figcaption className="p-2.5 bg-slate-50 text-[11px] text-slate-500 text-center border-t border-slate-100">
              Foto: {news.autor} • Reprodução Jornalística Rede Apucarana
            </figcaption>
          </figure>
        )}

        {/* Corpo do Texto da Notícia */}
        <section className="prose prose-lg max-w-3xl mx-auto mt-6 text-slate-800 leading-relaxed font-sans">
          {isHtml ? (
            <div dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(news.content) }} />
          ) : (
            textParagraphs.map((paragraph, index) => (
              <p key={index} className="mb-4 text-base sm:text-lg leading-relaxed">
                {decodeHtmlEntities(paragraph)}
              </p>
            ))
          )}
        </section>

        {/* Rodapé da Matéria com Compartilhamento */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Jornalismo Regional • Rede Apucarana de Comunicação
          </div>
          <ShareButtons title={news.title} url={pageUrl} />
        </div>

        {/* Bloco de Notícias Relacionadas */}
        {related && related.length > 0 && (
          <section className="mt-12 pt-8 border-t-2 border-slate-100">
            <h2 className="font-heading font-black text-xl text-slate-900 mb-6">
              Mais Notícias Recentes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((item: any) => {
                const itemTitle = decodeHtmlEntities(item.title || item.titulo || "");
                const itemSlug = item.slug || item.id;
                return (
                  <Link
                    key={item.id}
                    href={`/noticia/${encodeURIComponent(itemSlug)}`}
                    prefetch={false}
                    className="group block rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-all"
                  >
                    {item.imagem && (
                      <div className="aspect-video w-full overflow-hidden bg-slate-100">
                        <img
                          src={ensureHttps(item.imagem)}
                          alt={itemTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.startsWith("http://")) {
                              target.src = target.src.replace(/^http:\/\//i, "https://");
                              return;
                            }
                            target.src = "/logo-rede-apucarana.png";
                            target.className = "w-full h-full object-contain p-2 bg-slate-900";
                          }}
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">
                        {item.categoria || "Geral"}
                      </span>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2">
                        {itemTitle}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </article>

      {/* Navegação Inferior para Celulares */}
      <MobileBottomNav currentTab="noticias" />
    </main>
  );
}
