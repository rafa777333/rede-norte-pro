import { getSupabaseAdmin } from "./supabase-admin";
import { getSupabase } from "./supabase";
import { decodeHtmlEntities } from "./text-utils";

export interface CitySource {
  cidade_nome: string;
  site_oficial: string;
  fonte_url: string;
  tipo_fonte: "CMS_ATENDE" | "RSS" | "CMS" | "CMS_INGA";
  cidade_slug: string;
}

export const CIDADES_VALE_DO_IVAI: CitySource[] = [
  // 1. Arapongas (Oficial Atende.Net)
  { cidade_nome: "Arapongas", site_oficial: "https://www.arapongas.pr.gov.br/", fonte_url: "https://arapongas.atende.net/cidadao/noticia", tipo_fonte: "CMS_ATENDE", cidade_slug: "arapongas" },

  // 2 a 5. RSS Feeds Oficiais
  { cidade_nome: "Apucarana", site_oficial: "https://www.apucarana.pr.gov.br/site/", fonte_url: "https://www.apucarana.pr.gov.br/site/feed/", tipo_fonte: "RSS", cidade_slug: "apucarana" },
  { cidade_nome: "Borrazópolis", site_oficial: "https://borrazopolis.pr.gov.br/", fonte_url: "https://borrazopolis.pr.gov.br/feed/", tipo_fonte: "RSS", cidade_slug: "borrazopolis" },
  { cidade_nome: "Cambira", site_oficial: "https://cambira.pr.gov.br/", fonte_url: "https://cambira.pr.gov.br/feed/", tipo_fonte: "RSS", cidade_slug: "cambira" },
  { cidade_nome: "Novo Itacolomi", site_oficial: "https://novoitacolomi.pr.gov.br/", fonte_url: "https://novoitacolomi.pr.gov.br/portal/?feed=rss2", tipo_fonte: "RSS", cidade_slug: "novo-itacolomi" },

  // 6. Arapuã (WordPress)
  { cidade_nome: "Arapuã", site_oficial: "https://arapua.pr.gov.br/", fonte_url: "https://arapua.pr.gov.br/noticias/", tipo_fonte: "CMS", cidade_slug: "arapua" },

  // 7 a 14. Ingá / Controle Municipal (8 Cidades) -> com sessao=b054603368n5b0
  { cidade_nome: "Ivaiporã", site_oficial: "https://www.ivaipora.pr.gov.br/", fonte_url: "https://www.ivaipora.pr.gov.br/index.php?sessao=b054603368n5b0", tipo_fonte: "CMS_INGA", cidade_slug: "ivaipora" },
  { cidade_nome: "São João do Ivaí", site_oficial: "https://www.saojoaodoivai.pr.gov.br/", fonte_url: "https://www.saojoaodoivai.pr.gov.br/index.php?sessao=b054603368n5b0", tipo_fonte: "CMS_INGA", cidade_slug: "sao-joao-do-ivai" },
  { cidade_nome: "São Pedro do Ivaí", site_oficial: "https://www.saopedrodoivai.pr.gov.br/", fonte_url: "https://www.saopedrodoivai.pr.gov.br/index.php?sessao=b054603368n5b0", tipo_fonte: "CMS_INGA", cidade_slug: "sao-pedro-do-ivai" },
  { cidade_nome: "Godoy Moreira", site_oficial: "https://godoymoreira.pr.gov.br/", fonte_url: "https://godoymoreira.pr.gov.br/index.php?sessao=b054603368n5b0", tipo_fonte: "CMS_INGA", cidade_slug: "godoy-moreira" },
  { cidade_nome: "Jandaia do Sul", site_oficial: "https://www.jandaiadosul.pr.gov.br/", fonte_url: "https://www.jandaiadosul.pr.gov.br/index.php?sessao=b054603368n5b0", tipo_fonte: "CMS_INGA", cidade_slug: "jandaia-do-sul" },
  { cidade_nome: "Califórnia", site_oficial: "http://www.california.pr.gov.br/", fonte_url: "https://www.california.pr.gov.br/index.php?sessao=b054603368n5b0", tipo_fonte: "CMS_INGA", cidade_slug: "california" },
  { cidade_nome: "Lunardelli", site_oficial: "http://www.lunardelli.pr.gov.br/", fonte_url: "https://www.lunardelli.pr.gov.br/index.php?sessao=b054603368n5b0", tipo_fonte: "CMS_INGA", cidade_slug: "lunardelli" },
  { cidade_nome: "Rosário do Ivaí", site_oficial: "http://www.rosariodoivai.pr.gov.br/", fonte_url: "https://www.rosariodoivai.pr.gov.br/index.php?sessao=b054603368n5b0", tipo_fonte: "CMS_INGA", cidade_slug: "rosario-do-ivai" },

  // 15 a 27. Portais Próprios
  { cidade_nome: "Kaloré", site_oficial: "https://www.kalore.pr.gov.br/", fonte_url: "https://www.kalore.pr.gov.br/noticias/", tipo_fonte: "CMS", cidade_slug: "kalore" },
  { cidade_nome: "Marumbi", site_oficial: "https://www.marumbi.pr.gov.br/", fonte_url: "https://www.marumbi.pr.gov.br/noticias/", tipo_fonte: "CMS", cidade_slug: "marumbi" },
  { cidade_nome: "Mauá da Serra", site_oficial: "https://www.mauadaserra.pr.gov.br/", fonte_url: "https://www.mauadaserra.pr.gov.br/noticias", tipo_fonte: "CMS", cidade_slug: "maua-da-serra" },
  { cidade_nome: "Cruzmaltina", site_oficial: "https://www.cruzmaltina.pr.gov.br/", fonte_url: "https://www.cruzmaltina.pr.gov.br/noticias", tipo_fonte: "CMS", cidade_slug: "cruzmaltina" },
  { cidade_nome: "Grandes Rios", site_oficial: "https://www.grandesrios.pr.gov.br/", fonte_url: "https://www.grandesrios.pr.gov.br/noticias", tipo_fonte: "CMS", cidade_slug: "grandes-rios" },
  { cidade_nome: "Ariranha do Ivaí", site_oficial: "https://www.ariranhadoivai.pr.gov.br/", fonte_url: "https://www.ariranhadoivai.pr.gov.br/noticias", tipo_fonte: "CMS", cidade_slug: "ariranha-do-ivai" },
  { cidade_nome: "Jardim Alegre", site_oficial: "https://www.jardimalegre.pr.gov.br/", fonte_url: "https://www.jardimalegre.pr.gov.br/noticias", tipo_fonte: "CMS", cidade_slug: "jardim-alegre" },
  { cidade_nome: "Bom Sucesso", site_oficial: "https://www.bomsucesso.pr.gov.br/", fonte_url: "https://www.bomsucesso.pr.gov.br/noticias", tipo_fonte: "CMS", cidade_slug: "bom-sucesso" },
  { cidade_nome: "Rio Bom", site_oficial: "https://www.riobom.pr.gov.br/", fonte_url: "https://www.riobom.pr.gov.br/noticia", tipo_fonte: "CMS", cidade_slug: "rio-bom" },
  { cidade_nome: "Lidianópolis", site_oficial: "https://www.lidianopolis.pr.gov.br/", fonte_url: "https://www.lidianopolis.pr.gov.br/noticias", tipo_fonte: "CMS", cidade_slug: "lidianopolis" },
  { cidade_nome: "Faxinal", site_oficial: "https://www.faxinal.pr.gov.br/", fonte_url: "https://www.faxinal.pr.gov.br/noticias_site", tipo_fonte: "CMS", cidade_slug: "faxinal" },
  { cidade_nome: "Rio Branco do Ivaí", site_oficial: "https://www.riobrancodoivai.pr.gov.br/", fonte_url: "https://www.riobrancodoivai.pr.gov.br/noticias/", tipo_fonte: "CMS", cidade_slug: "rio-branco-do-ivai" },
  { cidade_nome: "Marilândia do Sul", site_oficial: "https://marilandiadosul.pr.gov.br/", fonte_url: "https://marilandiadosul.pr.gov.br/noticia", tipo_fonte: "CMS", cidade_slug: "marilandia-do-sul" },
];

function decodeEntities(str: string): string {
  if (!str) return "";
  let decoded = String(str);

  // Normalizar casos de dupla codificação como &amp;#231;
  decoded = decoded.replace(/&amp;#/gi, "&#");

  // 1. Entidades numéricas decimais (ex: &#231; -> ç, &#8211; -> –)
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => {
    try {
      const code = parseInt(dec, 10);
      return code > 0 ? String.fromCodePoint(code) : _;
    } catch {
      return _;
    }
  });

  // 2. Entidades numéricas hexadecimais (ex: &#xE7; -> ç, &#x2013; -> –)
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      const code = parseInt(hex, 16);
      return code > 0 ? String.fromCodePoint(code) : _;
    } catch {
      return _;
    }
  });

  // 3. Entidades nomeadas
  const namedEntities: Record<string, string> = {
    "&quot;": '"',
    "&apos;": "'",
    "&#039;": "'",
    "&#39;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
    "&ndash;": "–",
    "&mdash;": "—",
    "&lsquo;": "‘",
    "&rsquo;": "’",
    "&sbquo;": "‚",
    "&bdquo;": "„",
    "&ldquo;": "“",
    "&rdquo;": "”",
    "&hellip;": "…",
    "&bull;": "•",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
    "&ordf;": "ª",
    "&ordm;": "º",
    "&deg;": "°",
    "&sect;": "§",
    "&middot;": "·",
    "&aacute;": "á", "&Aacute;": "Á",
    "&agrave;": "à", "&Agrave;": "À",
    "&atilde;": "ã", "&Atilde;": "Ã",
    "&acirc;": "â", "&Acirc;": "Â",
    "&auml;": "ä", "&Auml;": "Ä",
    "&eacute;": "é", "&Eacute;": "É",
    "&egrave;": "è", "&Egrave;": "È",
    "&ecirc;": "ê", "&Ecirc;": "Ê",
    "&euml;": "ë", "&Euml;": "Ë",
    "&iacute;": "í", "&Iacute;": "Í",
    "&igrave;": "ì", "&Igrave;": "Ì",
    "&icirc;": "î", "&Icirc;": "Î",
    "&iuml;": "ï", "&Iuml;": "Ï",
    "&oacute;": "ó", "&Oacute;": "Ó",
    "&ograve;": "ò", "&Ograve;": "Ò",
    "&otilde;": "õ", "&Otilde;": "Õ",
    "&ocirc;": "ô", "&Ocirc;": "Ô",
    "&ouml;": "ö", "&Ouml;": "Ö",
    "&uacute;": "ú", "&Uacute;": "Ú",
    "&ugrave;": "ù", "&Ugrave;": "Ù",
    "&ucirc;": "û", "&Ucirc;": "Û",
    "&uuml;": "ü", "&Uuml;": "Ü",
    "&ccedil;": "ç", "&Ccedil;": "Ç",
    "&ntilde;": "ñ", "&Ntilde;": "Ñ",
  };

  for (const [entity, replacement] of Object.entries(namedEntities)) {
    decoded = decoded.replace(new RegExp(entity, "gi"), replacement);
  }

  decoded = decoded.replace(/&amp;/gi, "&");

  return decoded
    .replace(/<[^>]+>/g, "")
    .trim();
}

function cleanImageUrl(img: string, base: string): string {
  if (!img) return "";
  let clean = img.trim();
  if (clean.startsWith("//")) clean = "https:" + clean;
  if (!clean.startsWith("http")) {
    clean = base.replace(/\/$/, "") + (clean.startsWith("/") ? "" : "/") + clean;
  }
  if (clean.startsWith("http://")) {
    clean = "https://" + clean.slice(7);
  }
  if (clean.includes("/tb_")) clean = clean.replace("/tb_", "/");

  const lower = clean.toLowerCase();
  if (
    lower.includes("logo") ||
    lower.includes("brasao") ||
    lower.includes("transparencia") ||
    lower.includes("vlibras") ||
    lower.includes("avatar") ||
    lower.includes("placeholder") ||
    lower.includes("selo_diamante") ||
    lower.includes("core/emoji") ||
    lower.endsWith(".svg") ||
    lower.endsWith(".gif")
  ) {
    return "";
  }
  return clean;
}

export async function extractOgImageFromUrl(url: string): Promise<string> {
  if (!url || !url.startsWith("http")) return "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return "";
    const html = await res.text();

    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

    if (ogMatch && ogMatch[1]) {
      const cleaned = cleanImageUrl(ogMatch[1], url);
      if (cleaned) return cleaned;
    }

    const postImgMatch =
      html.match(/<img[^>]+class=["'][^"']*(?:wp-post-image|featured|attachment|noticia)[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
      html.match(/<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*(?:wp-post-image|featured|attachment|noticia)[^"']*["']/i);
    if (postImgMatch && postImgMatch[1]) {
      const cleaned = cleanImageUrl(postImgMatch[1], url);
      if (cleaned) return cleaned;
    }

    return "";
  } catch {
    return "";
  }
}

function parsePubDate(pubDate: string | undefined): string {
  if (!pubDate) return new Date().toISOString();
  try {
    const str = String(pubDate).trim();
    const slashMatch = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      return new Date(Date.UTC(+slashMatch[3], +slashMatch[2] - 1, +slashMatch[1], 12, 0, 0)).toISOString();
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return new Date().toISOString();
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

interface ParsedItem {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  image: string;
  cidade: string;
  cidade_slug: string;
}

function parseCityHtml(html: string, city: CitySource): ParsedItem[] {
  const output: ParsedItem[] = [];
  const base = city.site_oficial.endsWith("/") ? city.site_oficial.slice(0, -1) : city.site_oficial;

  // 1. Arapongas (Oficial Atende.Net)
  if (city.cidade_slug === "arapongas") {
    const dadosMatch = html.match(/dados="([A-Za-z0-9+/=]+)"/);
    if (dadosMatch) {
      try {
        const jsonStr = Buffer.from(dadosMatch[1], "base64").toString("utf8");
        const parsed = JSON.parse(jsonStr);
        for (const reg of (parsed.registros || []).slice(0, 8)) {
          const title = decodeEntities(reg.titulo || "").replace(/\s+/g, " ").trim();
          let link = reg.url || reg.url_portal || "";
          if (link && !link.startsWith("http")) link = "https://arapongas.atende.net" + (link.startsWith("/") ? "" : "/") + link;
          const img = cleanImageUrl(reg.url_midia || "", "https://arapongas.atende.net");
          const pubDate = reg.data_publicacao || reg.data || "";
          const excerpt = decodeEntities(reg.chamada || title).replace(/\s+/g, " ").trim();
          if (title && link) {
            output.push({ title, link, pubDate, content: excerpt, image: img, cidade: city.cidade_nome, cidade_slug: city.cidade_slug });
          }
        }
      } catch (e) {}
    }
  }

  // 2. RSS / Feed XML (Apucarana, Borrazópolis, Cambira, Novo Itacolomi)
  else if (["apucarana", "borrazopolis", "cambira", "novo-itacolomi"].includes(city.cidade_slug) || html.includes("<rss") || html.includes("<channel>") || html.includes("<feed")) {
    const items = html.split(/<item[\s>]/i).slice(1);
    for (const it of items.slice(0, 8)) {
      const titleMatch = it.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      const linkMatch = it.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
      if (!titleMatch || !linkMatch) continue;

      const title = decodeEntities(titleMatch[1].replace(/<[^>]+>/g, "").trim()).replace(/\s+/g, " ");
      const link = linkMatch[1].trim();

      const encMatch = it.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
      const mediaMatch = it.match(/<media:content[^>]+url=["']([^"']+)["']/i);
      const imgMatch = it.match(/<img[^>]+src=["']([^"']+)["']/i);
      const rawImg = encMatch ? encMatch[1] : (mediaMatch ? mediaMatch[1] : (imgMatch ? imgMatch[1] : ""));
      const img = cleanImageUrl(rawImg, base);

      const pubDateMatch = it.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";

      const descMatch = it.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
      const desc = descMatch ? decodeEntities(descMatch[1].replace(/<[^>]+>/g, "").trim()).replace(/\s+/g, " ") : "";

      output.push({ title, link, pubDate, content: desc || title, image: img, cidade: city.cidade_nome, cidade_slug: city.cidade_slug });
    }
  }

  // 3. CMS Geral e Inga
  else {
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    const seenUrls = new Set<string>();

    while ((match = linkRegex.exec(html)) !== null && output.length < 8) {
      let href = match[1].trim();
      const rawText = match[2];
      const title = decodeEntities(rawText).replace(/\s+/g, " ").trim();

      if (title.length < 20 || title.length > 200) continue;
      if (title.toLowerCase().includes("leia mais") || title.toLowerCase().includes("ver mais")) continue;
      if (href.startsWith("#") || href.startsWith("javascript:") || href.includes("tel:") || href.includes("mailto:")) continue;

      if (!href.startsWith("http")) {
        href = base + (href.startsWith("/") ? "" : "/") + href;
      }
      if (seenUrls.has(href)) continue;
      seenUrls.add(href);

      const imgMatch = rawText.match(/<img[^>]+src=["']([^"']+)["']/i);
      const img = imgMatch ? cleanImageUrl(imgMatch[1], base) : "";

      output.push({
        title,
        link: href,
        pubDate: new Date().toISOString(),
        content: title,
        image: img,
        cidade: city.cidade_nome,
        cidade_slug: city.cidade_slug,
      });
    }
  }

  return output;
}

export async function runMunicipalNewsSync() {
  const supabase = getSupabaseAdmin() || getSupabase();
  if (!supabase) {
    throw new Error("Supabase não configurado.");
  }

  const { data: existingRows } = await supabase
    .from("news")
    .select("id, slug, fonte, titulo")
    .limit(2500);

  const existingFontes = new Set((existingRows || []).map((r) => r.fonte).filter(Boolean));
  const existingSlugs = new Set((existingRows || []).map((r) => r.slug).filter(Boolean));
  const existingTitles = new Set(
    (existingRows || []).map((r) => (r.titulo ? r.titulo.toLowerCase().trim() : "")).filter(Boolean)
  );

  let totalInseridas = 0;
  const resultadosPorCidade: Record<string, number> = {};

  for (const city of CIDADES_VALE_DO_IVAI) {
    resultadosPorCidade[city.cidade_nome] = 0;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(city.fonte_url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const html = await res.text();
      const parsedItems = parseCityHtml(html, city);

      for (const item of parsedItems) {
        if (!item.title || item.title.length < 15) continue;
        item.title = decodeHtmlEntities(item.title).trim();
        item.content = decodeHtmlEntities(item.content || item.title).trim();
        if (existingFontes.has(item.link)) continue;
        if (existingTitles.has(item.title.toLowerCase().trim())) continue;

        let slug = slugify(item.title);
        if (existingSlugs.has(slug)) {
          slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        // Tenta capturar a foto real diretamente da página original (og:image)
        if (!item.image || !item.image.startsWith("http") || item.image.includes("logo-rede-apucarana")) {
          const ogImg = await extractOgImageFromUrl(item.link);
          if (ogImg) item.image = ogImg;
        }

        const cleanTitle = decodeEntities(item.title);
        const cleanContent = decodeEntities(item.content || item.title);
        const cleanImg = cleanImageUrl(item.image, city.site_oficial);

        const nowIso = new Date().toISOString();
        const payload = {
          id: crypto.randomUUID(),
          titulo: cleanTitle,
          slug: slug,
          conteudo: cleanContent,
          resumo: cleanContent.slice(0, 160),
          imagem: cleanImg || "/logo-rede-apucarana.png",
          categoria: "Cidade",
          cidade_slug: city.cidade_slug,
          autor: `Fonte oficial: Prefeitura de ${city.cidade_nome}`,
          fonte: item.link,
          status: "published",
          published_at: parsePubDate(item.pubDate),
          created_at: nowIso,
          updated_at: nowIso,
        };

        const { error: insertErr } = await supabase.from("news").insert(payload);
        if (!insertErr) {
          totalInseridas++;
          resultadosPorCidade[city.cidade_nome]++;
          existingFontes.add(item.link);
          existingSlugs.add(slug);
          existingTitles.add(item.title.toLowerCase().trim());
        }
      }
    } catch {}
  }

  // Notícias Nacionais (Agência Brasil)
  let countAb = 0;
  try {
    const abRes = await fetch("https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36",
      },
    });
    if (abRes.ok) {
      const xml = await abRes.text();
      const items = xml.split(/<item[\s>]/i).slice(1);
      for (const it of items.slice(0, 10)) {
        const titleMatch = it.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
        const linkMatch = it.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
        if (!titleMatch || !linkMatch) continue;

        const title = decodeEntities(titleMatch[1].replace(/<[^>]+>/g, "").trim()).replace(/\s+/g, " ");
        const link = linkMatch[1].trim();

        if (existingFontes.has(link) || existingTitles.has(title.toLowerCase().trim())) continue;

        const descMatch = it.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
        const desc = descMatch ? decodeEntities(descMatch[1].replace(/<[^>]+>/g, "").trim()).replace(/\s+/g, " ") : title;

        const encMatch = it.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
        const mediaMatch = it.match(/<media:content[^>]+url=["']([^"']+)["']/i);
        const imgMatch = it.match(/<img[^>]+src=["']([^"']+)["']/i);
        const rawImg = encMatch ? encMatch[1] : mediaMatch ? mediaMatch[1] : imgMatch ? imgMatch[1] : "";
        const img = cleanImageUrl(rawImg, "https://agenciabrasil.ebc.com.br");

        let slug = slugify(title);
        if (existingSlugs.has(slug)) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;

        let finalImg = img;
        if (!finalImg || !finalImg.startsWith("http") || finalImg.includes("logo-rede-apucarana")) {
          const ogImg = await extractOgImageFromUrl(link);
          if (ogImg) finalImg = ogImg;
        }

        const cleanAbTitle = decodeEntities(title);
        const cleanAbDesc = decodeEntities(desc);
        const cleanAbImg = cleanImageUrl(finalImg, "https://agenciabrasil.ebc.com.br");

        const nowIso = new Date().toISOString();
        const payload = {
          id: crypto.randomUUID(),
          titulo: cleanAbTitle,
          slug: slug,
          conteudo: cleanAbDesc,
          resumo: cleanAbDesc.slice(0, 160),
          imagem: cleanAbImg || "/logo-rede-apucarana.png",
          categoria: "Geral",
          cidade_slug: "geral",
          autor: "Agência Brasil",
          fonte: link,
          status: "published",
          published_at: nowIso,
          created_at: nowIso,
          updated_at: nowIso,
        };

        const { error: abErr } = await supabase.from("news").insert(payload);
        if (!abErr) {
          countAb++;
          totalInseridas++;
          existingFontes.add(link);
          existingSlugs.add(slug);
          existingTitles.add(title.toLowerCase().trim());
        }
      }
    }
  } catch {}

  return {
    success: true,
    totalNovasNoticias: totalInseridas,
    totalNacionais: countAb,
    porCidade: resultadosPorCidade,
    timestamp: new Date().toISOString(),
  };
}
