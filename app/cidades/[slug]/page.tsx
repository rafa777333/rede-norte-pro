import { notFound } from "next/navigation";
import { getSupabase } from "../../../lib/supabase";

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

const SITE_URL = "https://www.redeapucarana.com.br";
const CITY_NAMES: Record<string, string> = {
  apucarana: "Apucarana", arapongas: "Arapongas", arapua: "Arapuã", "ariranha-do-ivai": "Ariranha do Ivaí",
  "bom-sucesso": "Bom Sucesso", borrazopolis: "Borrazópolis", california: "Califórnia", cambira: "Cambira",
  cruzmaltina: "Cruzmaltina", faxinal: "Faxinal", "godoy-moreira": "Godoy Moreira", "grandes-rios": "Grandes Rios",
  ivaipora: "Ivaiporã", "jandaia-do-sul": "Jandaia do Sul", "jardim-alegre": "Jardim Alegre", kalore: "Kaloré",
  lidianopolis: "Lidianópolis", lunardelli: "Lunardelli", "marilandia-do-sul": "Marilândia do Sul", marumbi: "Marumbi",
  "maua-da-serra": "Mauá da Serra", "novo-itacolomi": "Novo Itacolomi", "rio-bom": "Rio Bom",
  "rio-branco-do-ivai": "Rio Branco do Ivaí", "rosario-do-ivai": "Rosário do Ivaí", "sao-joao-do-ivai": "São João do Ivaí",
  "sao-pedro-do-ivai": "São Pedro do Ivaí",
};

function paragraphs(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === "string").join(" ");
  } catch { /* texto normal */ }
  return value.replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
}

function textValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string").join(" ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return value == null ? fallback : String(value);
}

async function imageFromSource(source: string | null) {
  if (!source || !/^https?:\/\//i.test(source)) return "";
  try {
    const response = await fetch(source, { headers: { "user-agent": "Rede Norte/1.0" }, next: { revalidate: 3600 } });
    if (!response.ok) return "";
    const html = await response.text();
    const match = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["'][^>]*>/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/i);
    if (!match?.[1]) return "";
    return new URL(match[1], source).toString();
  } catch {
    return "";
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const name = CITY_NAMES[slug];
  if (!name) return { title: "Cidade não encontrada | Rede Norte" };
  return {
    title: `${name}: notícias e serviços | Rede Norte`,
    description: `Acompanhe as notícias da Prefeitura e os acontecimentos de ${name} na Rede Norte do Paraná.`,
    alternates: { canonical: `${SITE_URL}/cidades/${slug}` },
  };
}

export default async function CityPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const cityName = CITY_NAMES[slug];
  if (!cityName) notFound();
  const supabase = getSupabase();
  let data: News[] = [];
  try {
    if (supabase) {
      const result = await supabase.from("news")
        .select("id,slug,titulo,categoria,conteudo,resumo,imagem,cidade_slug,autor,published_at,fonte")
        .eq("status", "published")
        .eq("cidade_slug", slug)
        .order("published_at", { ascending: false })
        .limit(100);
      data = (result.data || []) as News[];
    }
  } catch {
    data = [];
  }
  const news = await Promise.all((data || []).map(async (item) => {
    const current = item as News;
    if (textValue(current.imagem)) return current;
    const imagem = await imageFromSource(current.fonte);
    return imagem ? { ...current, imagem } : current;
  }));

  return <main className="site-shell city-page">
    <header className="article-header"><a className="brand brand--small" href="/"><span className="brand-mark">RN</span><span>REDE NORTE</span></a><a className="video-back-link" href="/">← Voltar ao Geral</a><span className="article-header-status"><i /> Área municipal</span></header>
    <section className="container city-page-header"><span className="eyebrow">REDE NORTE · ÁREA MUNICIPAL</span><h1>Notícias de {cityName}</h1><p>Informação local, comunicados oficiais e acontecimentos de {cityName}. Esta área é independente da página Geral.</p><a className="city-general-link" href="/">Ver notícias gerais →</a></section>
    <section className="container news-section city-news-section"><div className="section-heading"><span>Últimas de {cityName}</span><i /></div>{news.length ? <div className="latest-visual-grid">{news.map((item) => { const title = textValue(item.titulo, "Notícia da cidade"); const image = textValue(item.imagem); const summary = textValue(item.resumo) || paragraphs(textValue(item.conteudo)).slice(0, 180); return <a className="news-card" href={`/noticias/${encodeURIComponent(textValue(item.slug, item.id))}`} key={item.id}>{image ? <img src={image} alt={title} loading="lazy" /> : <div className="news-card-placeholder"><span>RN</span><small>Imagem não fornecida pela fonte</small></div>}<span className="card-content"><span className="card-kicker"><span className="news-badge">{textValue(item.categoria, "Cidade")}</span><span>{cityName}</span></span><strong>{title}</strong><span className="card-summary">{summary}</span><span className="card-meta">{item.published_at ? new Date(item.published_at).toLocaleString("pt-BR") : "Rede Norte"}</span></span></a>; })}</div> : <div className="empty-state">Ainda não há notícias publicadas para {cityName}.</div>}</section>
  </main>;
}
