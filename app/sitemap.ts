import type { MetadataRoute } from "next";
import { getSupabase } from "@/lib/supabase";

export const revalidate = 3600; // Atualiza e revalida o sitemap a cada 1 hora automaticamente

const BASE_URL = "https://www.redeapucarana.com.br";

function parseSafeDate(dateString?: string | null): Date {
  if (!dateString) return new Date();
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Rotas Estáticas Principais (Alta Prioridade para o Google)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/noticias`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tv-online`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/onde-ir`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/empregos`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/comprasevendas`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/ofertas`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Cidades do Vale do Ivaí para SEO Local
  const cidades = [
    "apucarana",
    "arapongas",
    "arapua",
    "ariranha-do-ivai",
    "bom-sucesso",
    "borrazopolis",
    "california",
    "cambira",
    "cruzmaltina",
    "faxinal",
    "godoy-moreira",
    "grandes-rios",
    "ivaipora",
    "jandaia-do-sul",
    "jardim-alegre",
    "kalore",
    "lidianopolis",
    "lunardelli",
    "marilandia-do-sul",
    "marumbi",
    "maua-da-serra",
    "novo-itacolomi",
    "rio-bom",
    "rio-branco-do-ivai",
    "rosario-do-ivai",
    "sao-joao-do-ivai",
    "sao-pedro-do-ivai",
  ];

  const cityRoutes: MetadataRoute.Sitemap = cidades.map((cidade) => ({
    url: `${BASE_URL}/cidades/${cidade}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  // 2. Rotas Dinâmicas de Notícias (Banco de Dados Supabase)
  let newsRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: news, error } = await supabase
        .from("news")
        .select("id,slug,status,updated_at,published_at,created_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(10000);

      if (!error && news && news.length > 0) {
        newsRoutes = news
          .filter((item) => Boolean(item.slug || item.id))
          .map((item) => {
            const rawSlug = (item.slug || item.id).trim();
            const date = parseSafeDate(item.updated_at || item.published_at || item.created_at);

            return {
              url: `${BASE_URL}/noticia/${encodeURIComponent(rawSlug)}`,
              lastModified: date,
              changeFrequency: "daily" as const,
              priority: 0.8,
            };
          });
      }
    }
  } catch (err) {
    console.error("[Sitemap Error] Falha ao consultar notícias no Supabase:", err);
  }

  return [...staticRoutes, ...cityRoutes, ...newsRoutes];
}
