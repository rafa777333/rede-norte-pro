import { MetadataRoute } from "next";
import { getSupabase } from "../lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.redeapucarana.com.br";
  const cidades = ["apucarana", "arapongas", "ivaipora", "jandaia-do-sul", "faxinal"];
  const { data: news } = (await getSupabase()?.from("news").select("id,slug,updated_at,published_at").eq("status", "published").order("published_at", { ascending: false }).limit(100)) || { data: [] };
  return [
    { url: base, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    ...cidades.map((cidade) => ({ url: `${base}/${cidade}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 })),
    ...(news || []).map((item: any) => ({ url: `${base}/noticias/${encodeURIComponent(item.slug || item.id)}`, lastModified: new Date(item.updated_at || item.published_at || Date.now()), changeFrequency: "hourly" as const, priority: 0.8 })),
  ];
}
