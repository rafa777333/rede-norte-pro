import { MetadataRoute } from "next";
import { getSupabase } from "../lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.redeapucarana.com.br";
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
  const { data: news } =
    (await getSupabase()
      ?.from("news")
      .select("id,slug,updated_at,published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(100)) || { data: [] };

  return [
    { url: base, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${base}/tv-online`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/horoscopo`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    ...cidades.map((cidade) => ({
      url: `${base}/cidades/${cidade}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...(news || []).map((item: any) => ({
      url: `${base}/noticias/${encodeURIComponent(item.slug || item.id)}`,
      lastModified: new Date(item.updated_at || item.published_at || Date.now()),
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];
}
