import { notFound } from "next/navigation";
import { getSupabase } from "../../../lib/supabase";
import ShareButtons from "./ShareButtons";
import ReadingProgressBar from "../../../components/ReadingProgressBar";
import Badge from "../../../components/Badge";
import MobileBottomNav from "../../../components/MobileBottomNav";
import { extractYoutubeId, getYoutubeThumbnail } from "../../noticia/[slug]/page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE_URL = "https://www.redeapucarana.com.br";

type News = {
  id: string;
  slug: string | null;
  titulo: string;
  categoria: string | null;
  conteudo: string | null;
  resumo: string | null;
  imagem: string | null;
  video_url?: string | null;
  cidade_slug: string | null;
  autor: string | null;
  published_at: string | null;
  fonte: string | null;
};

function paragraphs(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    /* texto normal */
  }
  return value
    .replace(/\\n/g, "\n")
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function getNews(slug: string): Promise<News | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const extractVideo = (d: any) =>
    d.video_url ||
    (d.fonte?.startsWith("video:") ? d.fonte.slice(6) : null) ||
    null;

  const bySlug = await supabase
    .from("news")
    .select(
      "id,slug,titulo,categoria,conteudo,resumo,imagem,cidade_slug,autor,published_at,fonte,video_url,title,seo_description,content"
    )
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (bySlug.data) {
    const d: any = bySlug.data;
    return {
      id: d.id,
      slug: d.slug,
      titulo: d.title || d.titulo,
      categoria: d.categoria,
      conteudo: d.content || d.conteudo,
      resumo: d.seo_description || d.resumo,
      imagem: d.imagem,
      video_url: extractVideo(d),
      cidade_slug: d.cidade_slug,
      autor: d.autor,
      published_at: d.published_at,
      fonte: d.fonte,
    };
  }

  const bySlugFb = await supabase
    .from("news")
    .select(
      "id,slug,titulo,categoria,conteudo,resumo,imagem,cidade_slug,autor,published_at,fonte"
    )
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (bySlugFb.data) {
    const d: any = bySlugFb.data;
    return {
      ...d,
      video_url: extractVideo(d),
    };
  }

  const byId = await supabase
    .from("news")
    .select(
      "id,slug,titulo,categoria,conteudo,resumo,imagem,cidade_slug,autor,published_at,fonte"
    )
    .eq("status", "published")
    .eq("id", slug)
    .maybeSingle();
  if (byId.data) {
    const d: any = byId.data;
    return {
      ...d,
      video_url: extractVideo(d),
    };
  }

  // Fallback para consulta direta na tabela noticias_portal
  const portalBySlug = await supabase
    .from("noticias_portal")
    .select("id,slug,titulo_seo,categoria,corpo_html,resumo_meta,imagem_url,fonte_nome,credito_imagem,created_at,url_original")
    .eq("status", "publicado")
    .eq("slug", slug)
    .maybeSingle();
  if (portalBySlug.data) {
    const p = portalBySlug.data;
    return {
      id: p.id,
      slug: p.slug,
      titulo: p.titulo_seo,
      categoria: p.categoria,
      conteudo: p.corpo_html,
      resumo: p.resumo_meta,
      imagem: p.imagem_url,
      cidade_slug: "geral",
      autor: p.credito_imagem || p.fonte_nome,
      published_at: p.created_at,
      fonte: p.url_original
    };
  }

  const portalById = await supabase
    .from("noticias_portal")
    .select("id,slug,titulo_seo,categoria,corpo_html,resumo_meta,imagem_url,fonte_nome,credito_imagem,created_at,url_original")
    .eq("status", "publicado")
    .eq("id", slug)
    .maybeSingle();
  if (portalById.data) {
    const p = portalById.data;
    return {
      id: p.id,
      slug: p.slug,
      titulo: p.titulo_seo,
      categoria: p.categoria,
      conteudo: p.corpo_html,
      resumo: p.resumo_meta,
      imagem: p.imagem_url,
      cidade_slug: "geral",
      autor: p.credito_imagem || p.fonte_nome,
      published_at: p.created_at,
      fonte: p.url_original
    };
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const news = await getNews(decodeURIComponent(params.slug));
  if (!news) return { title: "Notícia não encontrada | Rede Apucarana" };
  const description =
    news.resumo ||
    paragraphs(news.conteudo)[0] ||
    "Leia a notícia completa na Rede Apucarana de Comunicação.";
  const url = `${SITE_URL}/noticias/${encodeURIComponent(news.slug || news.id)}`;

  const titulo = news.titulo || "";
  const categoria = news.categoria || "NOTÍCIA";

  // Extrator de Thumbnail em Alta Resolução do YouTube para OpenGraph / WhatsApp / Facebook
  const ytThumb = getYoutubeThumbnail(news.video_url);
  const fotoOriginal = ytThumb || news.imagem || "";

  // Capa oficial de compartilhamento carimbada em 1200x630 (Link Preview Card Facebook)
  const ogImageUrl = ytThumb || (fotoOriginal
    ? `${SITE_URL}/api/og-facebook?title=${encodeURIComponent(titulo)}&category=${encodeURIComponent(categoria)}&image_url=${encodeURIComponent(fotoOriginal)}`
    : `${SITE_URL}/logo-rede-apucarana.png`);

  return {
    title: `${news.titulo} | Rede Apucarana`,
    description,
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    openGraph: {
      title: news.titulo,
      description,
      url,
      type: "article",
      siteName: "Rede Apucarana de Comunicação",
      locale: "pt_BR",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: news.titulo,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: news.titulo,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function NewsPage({
  params,
}: {
  params: { slug: string };
}) {
  const news = await getNews(decodeURIComponent(params.slug));
  if (!news) notFound();
  const supabase = getSupabase();
  const city = news.cidade_slug
    ? (
        await supabase
          ?.from("cities")
          .select("nome")
          .eq("slug", news.cidade_slug)
          .maybeSingle()
      )?.data?.nome || news.cidade_slug
    : "Geral";
  const related = await supabase
    ?.from("news")
    .select("id,slug,titulo,imagem,categoria")
    .eq("status", "published")
    .neq("id", news.id)
    .eq("categoria", news.categoria || "Esportes")
    .order("published_at", { ascending: false })
    .limit(4);
  const url = `${SITE_URL}/noticias/${encodeURIComponent(news.slug || news.id)}`;
  const isHtml = /<\/(p|h2|h3|ul|li|strong|em)>/i.test(news.conteudo || "");
  const body = isHtml ? [] : paragraphs(news.conteudo);
  const cleanSummary = news.resumo || (news.conteudo ? news.conteudo.replace(/<[^>]+>/g, "").slice(0, 160) : "Confira os detalhes desta notícia.");

  // Geração de 3 Bullets - Resumo em 30 Segundos (Axios Smart Brevity)
  const bullets = (() => {
    const list: string[] = [];
    if (cleanSummary && cleanSummary.length > 20) {
      list.push(cleanSummary);
    }
    if (body.length > 0) {
      for (const p of body) {
        const sentences = p.split(/(?<=[.!?])\s+/).filter((s) => s.length > 25);
        for (const s of sentences) {
          if (!list.includes(s.trim()) && list.length < 3) {
            list.push(s.trim());
          }
        }
        if (list.length >= 3) break;
      }
    }
    if (list.length < 2) {
      list.push(`Fatos apurados pela redação da Rede Apucarana com impacto direto em ${city} e região.`);
    }
    if (list.length < 3) {
      list.push("Acompanhe todos os desdobramentos e detalhes apurados na íntegra da matéria abaixo.");
    }
    return list.slice(0, 3);
  })();

  const ytId = extractYoutubeId(news.video_url);
  const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;
  const primaryThumb = ytThumb || news.imagem || `${SITE_URL}/logo-rede-apucarana.png`;

  const newsArticleJsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: news.titulo,
    description: cleanSummary,
    image: [primaryThumb, news.imagem].filter(Boolean),
    datePublished: news.published_at || new Date().toISOString(),
    dateModified: news.published_at || new Date().toISOString(),
    author: {
      "@type": "Person",
      name: news.autor || "Redação Rede Apucarana",
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

  // Se houver vídeo, injeta o VideoObject no Schema.org para o Google Search Video
  if (news.video_url) {
    const embedUrl = ytId
      ? `https://www.youtube.com/embed/${ytId}`
      : news.video_url;

    const thumbnailList = ytId
      ? [
          `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
          `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        ]
      : [primaryThumb];

    newsArticleJsonLd.video = {
      "@type": "VideoObject",
      name: news.titulo,
      description: cleanSummary,
      thumbnailUrl: thumbnailList,
      uploadDate: news.published_at || new Date().toISOString(),
      embedUrl: embedUrl,
      contentUrl: news.video_url,
    };
  }

  return (
    <main className="article-page permanent-article">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />
      <ReadingProgressBar />
      <header className="article-header">
        <a className="brand brand--small" href="/">
          <img
            src="/logo-rede-apucarana.png"
            alt="Logo Rede Apucarana"
            className="brand-mark"
            style={{ objectFit: "contain", width: "36px", height: "36px", padding: 0 }}
          />
          <span>REDE APUCARANA</span>
        </a>
        <a className="video-back-link" href="/">
          ← Voltar às notícias
        </a>
        <span className="article-header-status">
          <i /> Jornalismo regional
        </span>
      </header>
      <article className="article-shell">
        <div className="article-breadcrumb">
          <a href="/">Início</a> / {news.categoria || "Notícias"} / {city}
        </div>
        <div className="article-category flex items-center gap-2">
          <Badge category={news.categoria || "Notícias"}>{news.categoria || "Notícias"}</Badge>
          <span>{city}</span>
        </div>
        <h1 className="font-display font-bold">{news.titulo}</h1>
        <p className="article-dek">{cleanSummary}</p>
        <div className="article-byline">
          <img
            src="/logo-rede-apucarana.png"
            alt="Rede Apucarana"
            className="avatar"
            style={{ objectFit: "contain", width: "36px", height: "36px", borderRadius: "50%" }}
          />
          <span>
            <strong>{news.autor || "Redação Rede Apucarana"}</strong>
            <small>
              Publicado em{" "}
              {news.published_at
                ? new Date(news.published_at).toLocaleString("pt-BR")
                : "Rede Apucarana"}
            </small>
          </span>
        </div>
        {news.video_url ? (
          (() => {
            const ytId = extractYoutubeId(news.video_url);
            return (
              <div className="my-6 rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-200 aspect-video">
                {ytId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                    title={news.titulo}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={news.video_url}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            );
          })()
        ) : news.imagem ? (
          <figure className="article-figure">
            <img src={news.imagem} alt={news.titulo} />
            <figcaption>
              {news.autor ? `Foto / Crédito: ${news.autor} · Reprodução autorizada` : "Imagem da fonte original · Reprodução com indicação da fonte"}
            </figcaption>
          </figure>
        ) : null}

        {/* BOX: RESUMO EM 30 SEGUNDOS (SMART BREVITY - AXIOS / G1) */}
        <div className="my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-red-50/30 border-l-4 border-red-600 border-y border-r border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-red-600 font-black text-sm">⚡</span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 font-sans">
              Resumo em 30 Segundos · Smart Brevity
            </span>
          </div>
          <ul className="space-y-2 text-sm sm:text-base text-slate-700 font-sans">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-2" />
                <span className="leading-relaxed">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
        {isHtml ? (
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: news.conteudo || "" }}
          />
        ) : (
          <div className="article-body">
            {body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
        <div className="article-source">
          <strong>Fonte original:</strong>{" "}
          <a
            href={news.fonte || "https://www.redeapucarana.com.br"}
            target="_blank"
            rel="noreferrer"
          >
            Fonte original ↗
          </a>
        </div>
        <ShareButtons title={news.titulo} url={url} />
        <section className="related">
          <div className="section-heading">
            <span>Leia também</span>
            <i />
          </div>
          <div className="related-grid">
            {(related?.data || []).map((item: any) => (
              <a
                className="news-card news-card--compact"
                href={`/noticias/${encodeURIComponent(item.slug || item.id)}`}
                key={item.id}
              >
                {item.imagem && (
                  <img src={item.imagem} alt={item.titulo} loading="lazy" />
                )}
                <span className="card-content">
                  <span className="card-kicker">
                    <Badge category={item.categoria || "Notícias"}>
                      {item.categoria || "Notícias"}
                    </Badge>
                  </span>
                  <strong>{item.titulo}</strong>
                </span>
              </a>
            ))}
          </div>
        </section>
      </article>
      <MobileBottomNav currentTab="noticias" />
    </main>
  );
}
