import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.redeapucarana.com.br";
  const cidades = ["apucarana", "arapongas", "ivaipora", "jandaia-do-sul", "faxinal"];
  return [
    { url: base, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    ...cidades.map((cidade) => ({ url: `${base}/${cidade}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 })),
  ];
}
