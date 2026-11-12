import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Bloqueio de Indexação em Previews da Vercel:
  // Se não estiver no ambiente oficial de produção (ex: *.vercel.app),
  // bloqueia totalmente o rastreamento para evitar que o Google indexe URLs de teste
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  const baseUrl = "https://www.redeapucarana.com.br";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/admin/*"],
      },
      {
        userAgent: "Googlebot-News",
        allow: "/",
        disallow: ["/admin", "/admin/*"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: "/",
        disallow: ["/admin", "/admin/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
