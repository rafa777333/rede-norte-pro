import { getSupabase } from "./supabase";
import { decodeHtmlEntities } from "./text-utils";

export interface PortalNews {
  id: string;
  slug: string;
  cidade: string;
  cidade_slug: string;
  cat: string;
  titulo: string;
  sub: string;
  resumo: string;
  texto: string;
  img: string;
  hora: string;
  autor: string;
  credit?: string;
  published_at?: string;
}

export interface PortalInitialData {
  allNews: PortalNews[];
  manchetePrincipal: PortalNews | null;
  subManchetes: PortalNews[];
  destaquesRegionais: PortalNews[];
  plantaoUltimas: PortalNews[];
  noticiasNacionais: PortalNews[];
  futebolJogos: any[];
  siteSettings: Record<string, string>;
  jobs: any[];
  classificados: any[];
}

const CITY_NAME_MAP: Record<string, string> = {
  apucarana: "Apucarana",
  arapongas: "Arapongas",
  arapua: "Arapuã",
  "ariranha-do-ivai": "Ariranha do Ivaí",
  "bom-sucesso": "Bom Sucesso",
  borrazopolis: "Borrazópolis",
  california: "Califórnia",
  cambira: "Cambira",
  cruzmaltina: "Cruzmaltina",
  faxinal: "Faxinal",
  "godoy-moreira": "Godoy Moreira",
  "grandes-rios": "Grandes Rios",
  ivaipora: "Ivaiporã",
  "jandaia-do-sul": "Jandaia do Sul",
  "jardim-alegre": "Jardim Alegre",
  kalore: "Kaloré",
  lidianopolis: "Lidianópolis",
  lunardelli: "Lunardelli",
  "marilandia-do-sul": "Marilândia do Sul",
  marumbi: "Marumbi",
  "maua-da-serra": "Mauá da Serra",
  "novo-itacolomi": "Novo Itacolomi",
  "rio-bom": "Rio Bom",
  "rio-branco-do-ivai": "Rio Branco do Ivaí",
  "rosario-do-ivai": "Rosário do Ivaí",
  "sao-joao-do-ivai": "São João do Ivaí",
  "sao-pedro-do-ivai": "São Pedro do Ivaí",
  geral: "Geral",
};

function formatNewsItem(n: any): PortalNews {
  const cleanTitle = decodeHtmlEntities(n.titulo || "").trim();
  const cleanCategory = decodeHtmlEntities(n.categoria || "Geral").trim();
  const cleanResumo = decodeHtmlEntities(n.resumo || n.conteudo || "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  const cityName =
    n.cidade_slug && CITY_NAME_MAP[n.cidade_slug]
      ? CITY_NAME_MAP[n.cidade_slug]
      : n.cidade_slug && n.cidade_slug !== "geral"
      ? n.cidade_slug
      : "Vale do Ivaí";

  let hora = "Hoje";
  if (n.published_at) {
    try {
      const dt = new Date(n.published_at);
      hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      hora = "Hoje";
    }
  }

  return {
    id: n.id,
    slug: n.slug || n.id,
    cidade: cityName,
    cidade_slug: n.cidade_slug || "geral",
    cat: cleanCategory,
    titulo: cleanTitle,
    sub: cleanResumo,
    resumo: cleanResumo,
    texto: n.conteudo || "",
    img: n.imagem || "",
    hora,
    autor: n.autor || "Redação Rede Apucarana",
    published_at: n.published_at || undefined,
  };
}

export async function getInitialPortalData(cidade: string = "Geral"): Promise<PortalInitialData> {
  const supabase = getSupabase();

  if (!supabase) {
    return {
      allNews: [],
      manchetePrincipal: null,
      subManchetes: [],
      destaquesRegionais: [],
      plantaoUltimas: [],
      noticiasNacionais: [],
      futebolJogos: [],
      siteSettings: {},
      jobs: [],
      classificados: [],
    };
  }

  try {
    const [newsRes, settingsRes, futebolRes, jobsRes, classifRes] = await Promise.all([
      supabase
        .from("news")
        .select("id,slug,titulo,categoria,conteudo,resumo,imagem,cidade_slug,autor,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(100),
      supabase.from("site_settings").select("key,value"),
      supabase.from("futebol_jogos").select("*").order("data_jogo", { ascending: false }).limit(40),
      supabase.from("jobs").select("*").eq("status", "published").limit(6),
      supabase.from("classified_ads").select("*").limit(6),
    ]);

    const rawNews = newsRes.data || [];
    const formattedNews = rawNews.map(formatNewsItem);

    // Mapeamento de settings
    const siteSettings: Record<string, string> = {};
    if (settingsRes.data) {
      for (const row of settingsRes.data) {
        siteSettings[row.key] = row.value;
      }
    }

    // Organização Editorial para a Nova Capa 2026:
    // 1. Manchete Principal: notícia prioritária com imagem válida
    const withImages = formattedNews.filter((n) => Boolean(n.img && n.img.startsWith("http")));
    const manchetePrincipal = withImages[0] || formattedNews[0] || null;

    // 2. Sub-manchetes (próximas 3 notícias após a principal)
    const remaining = formattedNews.filter((n) => n.id !== manchetePrincipal?.id);
    const subManchetes = remaining.slice(0, 3);

    // 3. Destaques Regionais (prioriza cidades do Vale do Ivaí com imagem)
    const afterSub = remaining.slice(3);
    const regionais = afterSub.filter(
      (n) => n.cidade_slug && n.cidade_slug !== "geral" && Boolean(n.img)
    );
    const destaquesRegionais = (regionais.length >= 2 ? regionais : afterSub).slice(0, 2);

    // 4. Plantão & Últimas (próximas 5 notícias urgentes)
    const usedIds = new Set([
      manchetePrincipal?.id,
      ...subManchetes.map((s) => s.id),
      ...destaquesRegionais.map((d) => d.id),
    ]);
    const plantaoUltimas = formattedNews.filter((n) => !usedIds.has(n.id)).slice(0, 5);

    // 5. Motor Brasil & Mundo (Google Discover): categorias nacionais/globais
    const nationalCategories = ["brasil", "economia", "mundo", "política", "politica", "segurança", "agronegócio"];
    const noticiasNacionais = formattedNews
      .filter((n) => nationalCategories.some((cat) => n.cat.toLowerCase().includes(cat)))
      .slice(0, 6);

    return {
      allNews: formattedNews,
      manchetePrincipal,
      subManchetes,
      destaquesRegionais,
      plantaoUltimas,
      noticiasNacionais: noticiasNacionais.length > 0 ? noticiasNacionais : formattedNews.slice(10, 16),
      futebolJogos: futebolRes.data || [],
      siteSettings,
      jobs: jobsRes.data || [],
      classificados: classifRes.data || [],
    };
  } catch (error) {
    console.error("Erro ao carregar dados iniciais do portal:", error);
    return {
      allNews: [],
      manchetePrincipal: null,
      subManchetes: [],
      destaquesRegionais: [],
      plantaoUltimas: [],
      noticiasNacionais: [],
      futebolJogos: [],
      siteSettings: {},
      jobs: [],
      classificados: [],
    };
  }
}
