import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { getYoutubeId } from "@/components/DarkMediaStrip";
import Badge from "@/components/Badge";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ArrowLeft, Clock, User, Share2, Play } from "lucide-react";
import ShareButtons from "@/app/noticias/[slug]/ShareButtons";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const SITE_URL = "https://www.redeapucarana.com.br";

interface NormalizedNews {
  id: string;
  slug: string;
  title: string;
  seo_description: string;
  content: string;
  video_url: string | null;
  imagem: string | null;
  categoria: string;
  cidade: string;
  autor: string;
  published_at: string;
}

async function getNewsBySlug(slug: string): Promise<NormalizedNews | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const decodedSlug = decodeURIComponent(slug);

  // 1. Consulta primária na tabela news
  const { data, error } = await supabase
    .from("news")
    .select(
      "id,slug,title,titulo,seo_description,resumo,content,conteudo,video_url,imagem,categoria,cidade_slug,autor,published_at,created_at,fonte"
    )
    .or(`slug.eq.${decodedSlug},id.eq.${decodedSlug}`)
    .maybeSingle();

  if (data) {
    const rawFonte = data.fonte || "";
    const extractedVideo =
      data.video_url ||
      (rawFonte.startsWith("video:") ? rawFonte.slice(6) : null) ||
      null;

    return {
      id: data.id,
      slug: data.slug || data.id,
      title: data.title || data.titulo || "Notícia da Rede Apucarana",
      seo_description:
        data.seo_description ||
        data.resumo ||
        (data.content || data.conteudo || "").replace(/<[^>]+>/g, "").slice(0, 160),
      content: data.content || data.conteudo || "",
      video_url: extractedVideo,
      imagem: data.imagem || null,
      categoria: data.categoria || "Geral",
      cidade: data.cidade_slug || "Apucarana",
      autor: data.autor || "Redação Rede Apucarana",
      published_at: data.published_at || data.created_at || new Date().toISOString(),
    };
  }

  // 2. Fallback de compatibilidade na tabela noticias_portal
  const { data: portalData } = await supabase
    .from("noticias_portal")
    .select(
      "id,slug,titulo_seo,corpo_html,resumo_meta,imagem_url,categoria,fonte_nome,credito_imagem,created_at"
    )
    .or(`slug.eq.${decodedSlug},id.eq.${decodedSlug}`)
    .maybeSingle();

  if (portalData) {
    return {
      id: portalData.id,
      slug: portalData.slug,
      title: portalData.titulo_seo,
      seo_description:
        portalData.resumo_meta ||
        portalData.corpo_html.replace(/<[^>]+>/g, "").slice(0, 160),
      content: portalData.corpo_html,
      video_url: null,
      imagem: portalData.imagem_url,
      categoria: portalData.categoria || "Geral",
      cidade: "Apucarana",
      autor: portalData.credito_imagem || portalData.fonte_nome || "Redação Rede Apucarana",
      published_at: portalData.created_at || new Date().toISOString(),
    };
  }

  return null;
}

/**
 * =========================================================================
 * SEO DINÂMICO CRUCIAL PARA O GOOGLE (Server-Side Metadata)
 * =========================================================================
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const news = await getNewsBySlug(params.slug);
  if (!news) {
    return {
      title: "Notícia não encontrada | Rede Apucarana",
      description: "A matéria solicitada não foi localizada ou já expirou.",
    };
  }

  const pageUrl = `${SITE_URL}/noticia/${encodeURIComponent(news.slug)}`;
  const description =
    news.seo_description ||
    "Confira a reportagem completa com detalhes apurados na Rede Apucarana de Comunicação.";

  const ogImages = news.imagem
    ? [
        {
          url: news.imagem,
          width: 1200,
          height: 630,
          alt: news.title,
        },
      ]
    : [
        {
          url: `${SITE_URL}/logo-rede-apucarana.png`,
          width: 1200,
          height: 630,
          alt: "Rede Apucarana de Comunicação",
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
      publishedTime: news.published_at,
      authors: [news.autor],
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: news.title,
      description: description,
      images: [ogImages[0].url],
    },
  };

  // Se houver vídeo, injeta metadado OpenGraph de vídeo para WhatsApp/Facebook
  if (news.video_url && metadata.openGraph) {
    metadata.openGraph.videos = [
      {
        url: news.video_url,
        type: "video/mp4",
      },
    ];
  }

  return metadata;
}

export default async function NoticiaDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const news = await getNewsBySlug(params.slug);
  if (!news) notFound();

  const supabase = getSupabase();
  const pageUrl = `${SITE_URL}/noticia/${encodeURIComponent(news.slug)}`;

  // Notícias relacionadas
  const { data: related } = await (supabase
    ? supabase
        .from("news")
        .select("id,slug,title,titulo,imagem,categoria,published_at")
        .neq("id", news.id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3)
    : Promise.resolve({ data: [] }));

  // Detecção de Vídeo YouTube vs Arquivo .mp4
  const ytId = news.video_url ? getYoutubeId(news.video_url) : null;
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

  // Schema.org NewsArticle & VideoObject JSON-LD para indexação rápida no Google
  const schemaArticle: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    headline: news.title,
    description: news.seo_description,
    image: news.imagem ? [news.imagem] : [`${SITE_URL}/logo-rede-apucarana.png`],
    datePublished: news.published_at,
    dateModified: news.published_at,
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
    schemaArticle.video = {
      "@type": "VideoObject",
      name: news.title,
      description: news.seo_description,
      thumbnailUrl: news.imagem || `${SITE_URL}/logo-rede-apucarana.png`,
      uploadDate: news.published_at,
      contentUrl: news.video_url,
      embedUrl: ytId ? `https://www.youtube.com/embed/${ytId}` : news.video_url,
    };
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-red-500 selection:text-white pb-20">
      {/* Injeção de Dados Estruturados para o Google */}
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

        {/* H1 GRANDE E LIMPO (Destaque Principal) */}
        <h1 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl text-slate-900 leading-[1.18] tracking-tight mb-4">
          {news.title}
        </h1>

        {/* SUBTÍTULO / LINHA FINA (Resumo SEO Google) */}
        {news.seo_description && (
          <p className="text-base sm:text-xl text-slate-600 font-sans leading-relaxed mb-6 font-normal">
            {news.seo_description}
          </p>
        )}

        {/* Byline: Autor, Data e Compartilhar */}
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
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(news.published_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          <ShareButtons title={news.title} url={pageUrl} />
        </div>

        {/* ========================================================================= */}
        {/* PLAYER DE VÍDEO EM DESTAQUE (YouTube ou .mp4 nativo)                     */}
        {/* ========================================================================= */}
        {news.video_url && (
          <section aria-label="Vídeo da Matéria" className="my-6 sm:my-8">
            {ytId ? (
              // Player do YouTube (16:9 responsivo)
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
              // Player de Vídeo Nativo HTML5 (.mp4 do Supabase Storage)
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
        )}

        {/* Se NÃO houver vídeo, mas houver imagem de capa */}
        {!news.video_url && news.imagem && (
          <figure className="my-6 sm:my-8 rounded-2xl overflow-hidden shadow-md border border-slate-100">
            <img
              src={news.imagem}
              alt={news.title}
              className="w-full h-auto max-h-[500px] object-cover"
              loading="eager"
            />
            <figcaption className="p-2.5 bg-slate-50 text-[11px] text-slate-500 text-center border-t border-slate-100">
              Foto: {news.autor} • Reprodução Jornalística Rede Apucarana
            </figcaption>
          </figure>
        )}

        {/* ========================================================================= */}
        {/* CORPO DO TEXTO (prose prose-lg dark:prose-invert para leitura confortável) */}
        {/* ========================================================================= */}
        <section className="prose prose-lg dark:prose-invert max-w-3xl mx-auto mt-6 text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
          {isHtml ? (
            <div dangerouslySetInnerHTML={{ __html: news.content }} />
          ) : (
            textParagraphs.map((paragraph, index) => (
              <p key={index} className="mb-4 text-base sm:text-lg leading-relaxed">
                {paragraph}
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
                const itemTitle = item.title || item.titulo || "";
                const itemSlug = item.slug || item.id;
                return (
                  <Link
                    key={item.id}
                    href={`/noticia/${encodeURIComponent(itemSlug)}`}
                    className="group block rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-all"
                  >
                    {item.imagem && (
                      <div className="aspect-video w-full overflow-hidden bg-slate-100">
                        <img
                          src={item.imagem}
                          alt={itemTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
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
