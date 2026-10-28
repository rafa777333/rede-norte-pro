import { notFound } from "next/navigation";
import { getSupabase } from "../../../lib/supabase";
import ShareButtons from "./ShareButtons";

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
  const bySlug = await supabase
    .from("news")
    .select(
      "id,slug,titulo,categoria,conteudo,resumo,imagem,cidade_slug,autor,published_at,fonte"
    )
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (bySlug.data) return bySlug.data as News;
  const byId = await supabase
    .from("news")
    .select(
      "id,slug,titulo,categoria,conteudo,resumo,imagem,cidade_slug,autor,published_at,fonte"
    )
    .eq("status", "published")
    .eq("id", slug)
    .maybeSingle();
  if (byId.data) return byId.data as News;

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
  return {
    title: `${news.titulo} | Rede Apucarana`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: news.titulo,
      description,
      url,
      type: "article",
      siteName: "Rede Apucarana de Comunicação",
      locale: "pt_BR",
      images: news.imagem ? [{ url: news.imagem, alt: news.titulo }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: news.titulo,
      description,
      images: news.imagem ? [news.imagem] : [],
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

  return (
    <main className="article-page permanent-article">
      <header className="article-header">
        <a className="brand brand--small" href="/">
          <img
            src="/logo-rede-apucarana.png?v=2"
            alt="Logo Rede Apucarana"
            className="brand-mark"
            style={{ objectFit: "cover", width: "36px", height: "36px", padding: 0 }}
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
        <div className="article-category">
          <span className="news-badge">{news.categoria || "Notícias"}</span>
          <span>{city}</span>
        </div>
        <h1>{news.titulo}</h1>
        <p className="article-dek">{cleanSummary}</p>
        <div className="article-byline">
          <img
            src="/logo-rede-apucarana.png?v=2"
            alt="Rede Apucarana"
            className="avatar"
            style={{ objectFit: "cover", width: "36px", height: "36px", borderRadius: "50%" }}
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
        {news.imagem && (
          <figure className="article-figure">
            <img src={news.imagem} alt={news.titulo} />
            <figcaption>
              {news.autor ? `Foto / Crédito: ${news.autor} · Reprodução autorizada` : "Imagem da fonte original · Reprodução com indicação da fonte"}
            </figcaption>
          </figure>
        )}
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
                    <span className="news-badge">
                      {item.categoria || "Notícias"}
                    </span>
                  </span>
                  <strong>{item.titulo}</strong>
                </span>
              </a>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
