import { getSupabase } from "./supabase";
import {
  decodeHtmlEntities,
  truncateWords,
  formatNewsTime,
  refineNewsCategory,
  isNoticiaRegional,
} from "./text-utils";

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
  const refinedCategory = refineNewsCategory(n.categoria, cleanTitle, n.conteudo || n.resumo);
  const cleanResumo = truncateWords(n.resumo || n.conteudo || "", 180);

  const cityName =
    n.cidade_slug && CITY_NAME_MAP[n.cidade_slug]
      ? CITY_NAME_MAP[n.cidade_slug]
      : n.cidade_slug && n.cidade_slug !== "geral"
      ? n.cidade_slug
      : "Vale do Ivaí";

  const hora = formatNewsTime(n.published_at);

  return {
    id: n.id,
    slug: n.slug || n.id,
    cidade: cityName,
    cidade_slug: n.cidade_slug || "geral",
    cat: refinedCategory,
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

    // Organização Editorial com PRIORIDADE REGIONAL no Topo e DESDUPLICAÇÃO ESTRITA:
    // Separa notícias regionais do Vale do Ivaí e outras (Agência Brasil / nacionais)
    const regionais = formattedNews.filter(isNoticiaRegional);
    const outras = formattedNews.filter((n) => !isNoticiaRegional(n));
    const poolPrioritario = [...regionais, ...outras];

    // 1. Manchete Principal: prioriza notícia regional com imagem válida (fallback: nacional com imagem)
    const regionalComImagem = regionais.find((n) => Boolean(n.img && n.img.startsWith("http")));
    const manchetePrincipal =
      regionalComImagem ||
      regionais[0] ||
      poolPrioritario.find((n) => Boolean(n.img && n.img.startsWith("http"))) ||
      poolPrioritario[0] ||
      null;

    const poolRestante = poolPrioritario.filter((n) => n.id !== manchetePrincipal?.id);

    // 2. Sub-manchetes (próximas 3 notícias prioritárias)
    const subManchetes = poolRestante.slice(0, 3);
    const usedTopIds = new Set([
      manchetePrincipal?.id,
      ...subManchetes.map((s) => s.id),
    ]);

    // 3. Destaques Regionais (prioriza 2 notícias regionais que sobraram com imagem)
    const remainingRegionais = regionais.filter((n) => !usedTopIds.has(n.id) && Boolean(n.img));
    const poolAfterSub = poolRestante.filter((n) => !usedTopIds.has(n.id));
    const destaquesRegionais = (remainingRegionais.length >= 2 ? remainingRegionais : poolAfterSub).slice(0, 2);
    destaquesRegionais.forEach((d) => usedTopIds.add(d.id));

    // 4. Plantão & Últimas (próximas 5 notícias para a coluna da direita)
    const plantaoUltimas = formattedNews.filter((n) => !usedTopIds.has(n.id)).slice(0, 5);
    plantaoUltimas.forEach((p) => usedTopIds.add(p.id));

    // 5. Motor Brasil & Mundo (Giro Nacional & Internacional):
    // REGRA DE OURO: Qualquer notícia do Topo NÃO PODE aparecer aqui (Desduplicação Estrita)!
    const nationalCategories = ["brasil", "economia", "mundo", "política", "politica", "segurança", "agronegócio", "justiça"];
    const poolParaNacional = formattedNews.filter((n) => !usedTopIds.has(n.id));
    const noticiasNacionaisFiltradas = poolParaNacional.filter((n) =>
      nationalCategories.some((cat) => n.cat.toLowerCase().includes(cat))
    );
    const noticiasNacionais = (noticiasNacionaisFiltradas.length >= 4 ? noticiasNacionaisFiltradas : poolParaNacional).slice(0, 8);

    return {
      allNews: formattedNews,
      manchetePrincipal,
      subManchetes,
      destaquesRegionais,
      plantaoUltimas,
      noticiasNacionais,
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
