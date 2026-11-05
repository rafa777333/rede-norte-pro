import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  const supabase = getSupabase();
  const { data: news } = supabase
    ? await supabase
        .from("news")
        .select("id,slug,titulo,categoria,resumo,conteudo,imagem,autor,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50)
    : { data: [] };

  const baseUrl = "https://www.redeapucarana.com.br";
  const now = new Date().toUTCString();

  const escapeXml = (str: string) =>
    (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const itemsXml = (news || [])
    .map((item) => {
      const url = `${baseUrl}/noticias/${encodeURIComponent(item.slug || item.id)}`;
      const pubDate = item.published_at
        ? new Date(item.published_at).toUTCString()
        : now;
      const desc = escapeXml(item.resumo || item.conteudo?.substring(0, 250) || "");
      const title = escapeXml(item.titulo || "Notícia");
      const cat = escapeXml(item.categoria || "Geral");
      const author = escapeXml(item.autor || "Redação Rede Apucarana");

      return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${cat}</category>
      <author>${author}</author>
      <description>${desc}</description>
      ${item.imagem ? `<enclosure url="${escapeXml(item.imagem)}" type="image/jpeg" length="0" />` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Rede Apucarana de Comunicação - Notícias</title>
    <link>${baseUrl}</link>
    <description>Últimas notícias de Apucarana, Arapongas e do Vale do Ivaí.</description>
    <language>pt-br</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/feed" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
