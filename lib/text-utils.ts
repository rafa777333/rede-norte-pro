/**
 * Utilitários para tratamento e sanitização de texto e manchetes
 */

/**
 * Decodifica entidades HTML comuns em strings (ex: &#039; -> ', &quot; -> ", &#231; -> ç, &atilde; -> ã)
 * Suporta entidades numéricas decimais (&#231;), hexadecimais (&#xE7;) e nomeadas (&ccedil;).
 */
export function decodeHtmlEntities(str: string): string {
  if (!str || typeof str !== "string") return "";

  let decoded = str;

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

  // 3. Entidades nomeadas do português e HTML padrão
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
    "&aacute;": "á",
    "&Aacute;": "Á",
    "&agrave;": "à",
    "&Agrave;": "À",
    "&atilde;": "ã",
    "&Atilde;": "Ã",
    "&acirc;": "â",
    "&Acirc;": "Â",
    "&auml;": "ä",
    "&Auml;": "Ä",
    "&eacute;": "é",
    "&Eacute;": "É",
    "&egrave;": "è",
    "&Egrave;": "È",
    "&ecirc;": "ê",
    "&Ecirc;": "Ê",
    "&euml;": "ë",
    "&Euml;": "Ë",
    "&iacute;": "í",
    "&Iacute;": "Í",
    "&igrave;": "ì",
    "&Igrave;": "Ì",
    "&icirc;": "î",
    "&Icirc;": "Î",
    "&iuml;": "ï",
    "&Iuml;": "Ï",
    "&oacute;": "ó",
    "&Oacute;": "Ó",
    "&ograve;": "ò",
    "&Ograve;": "Ò",
    "&otilde;": "õ",
    "&Otilde;": "Õ",
    "&ocirc;": "ô",
    "&Ocirc;": "Ô",
    "&ouml;": "ö",
    "&Ouml;": "Ö",
    "&uacute;": "ú",
    "&Uacute;": "Ú",
    "&ugrave;": "ù",
    "&Ugrave;": "Ù",
    "&ucirc;": "û",
    "&Ucirc;": "Û",
    "&uuml;": "ü",
    "&Uuml;": "Ü",
    "&ccedil;": "ç",
    "&Ccedil;": "Ç",
    "&ntilde;": "ñ",
    "&Ntilde;": "Ñ",
  };

  // 3. Substituição segura e rápida de entidades nomeadas
  decoded = decoded.replace(/&([a-zA-Z]+);/g, (match) => {
    return namedEntities[match] || namedEntities[match.toLowerCase()] || match;
  });

  // 4. Limpeza de &amp; residual
  decoded = decoded.replace(/&amp;/gi, "&");

  // 5. Limpar entidade quebrada por corte de caracteres no final (ex: "texto &#25" ou "fim &am")
  decoded = decoded.replace(/&#\d*$/, "").replace(/&[a-zA-Z0-9]*$/, "");

  return decoded;
}

/**
 * Trunca o texto no último espaço completo sem cortar palavras ao meio (evita "bebidas alcoó...").
 */
export function truncateWords(text: unknown, maxChars: number = 160): string {
  if (typeof text !== "string" || !text.trim()) return "";
  const cleaned = decodeHtmlEntities(text)
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxChars) return cleaned;

  const cut = cleaned.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > 20) {
    return cut.slice(0, lastSpace).trim() + "...";
  }
  return cut.trim() + "...";
}

/**
 * Formata o tempo de publicação na Home:
 * - Últimas 3 horas: relativo dinâmico ("Há 15 min", "Há 1 hora", "Há 2 horas")
 * - Mais antigas: formato HH:mm
 */
export function formatNewsTime(publishedAt?: string, fallbackHora?: string): string {
  if (!publishedAt) return fallbackHora || "Hoje";
  try {
    const date = new Date(publishedAt);
    if (isNaN(date.getTime())) return fallbackHora || "Hoje";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }

    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Agora";
    if (diffMinutes < 60) return `Há ${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 3) {
      return diffHours === 1 ? "Há 1 hora" : `Há ${diffHours} horas`;
    }

    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return fallbackHora || "Hoje";
  }
}

/**
 * Refinamento de Categorias da Agência Brasil / Nacional:
 * Evita classificar notícias de tribunais superiores (TSE, STF, STJ, BRB) como Policial.
 * Mapeia esses termos para Política ou Justiça, reservando a tag Policial para ocorrências policiais.
 */
export function refineNewsCategory(categoria?: string, titulo?: string, texto?: string): string {
  const cat = (categoria || "").trim();
  const lowerCat = cat.toLowerCase();
  const lowerTitle = (titulo || "").toLowerCase();
  const lowerText = (texto || "").slice(0, 400).toLowerCase();
  const fullContext = `${lowerTitle} ${lowerText}`;

  const isTribunal =
    /\b(stf|tse|stj|trf|tst|brb|supremo tribunal federal|tribunal superior eleitoral|superior tribunal de justi[çc]a|ministro do stf|ministra do stf|plen[áa]rio do stf|plen[áa]rio do tse|pgr|procuradoria-geral|alexandre de moraes|barroso|gilmar mendes|c[áa]rmen l[úu]cia|fux|zanin|dino|toffoli|mendon[çc]a|nunes marques)\b/i.test(fullContext);

  if (isTribunal) {
    if (lowerCat === "policial" || lowerCat === "segurança" || lowerCat === "geral" || !cat) {
      return "Justiça";
    }
  }

  if (!cat || lowerCat === "geral") {
    if (/\b(governo|lula|bolsonaro|senado|c[âa]mara|congresso|deputad|minist[ée]rio|planalto)\b/i.test(lowerTitle)) {
      return "Política";
    }
    if (/\b(d[óo]lar|infla[çc][ãa]o|selic|ibovespa|banco central|mercado|pib|imposto|economia)\b/i.test(lowerTitle)) {
      return "Economia";
    }
  }

  return cat || "Geral";
}

export const CIDADES_VALE_IVAI = [
  "apucarana", "arapongas", "jandaia do sul", "ivaiporã", "ivaipora", "faxinal",
  "cambira", "califórnia", "california", "marilândia do sul", "marilandia do sul",
  "borrazópolis", "borrazopolis", "bom sucesso", "mauá da serra", "maua da serra",
  "são joão do ivaí", "sao joao do ivai", "são pedro do ivaí", "sao pedro do ivai",
  "grandes rios", "cruzmaltina", "rio bom", "kaloré", "kalore", "marumbi",
  "novo itacolomi", "lunardelli", "lidianópolis", "lidianopolis", "jardim alegre",
  "godoy moreira", "arapuã", "arapua", "ariranha do ivaí", "ariranha do ivai",
  "rio branco do ivaí", "rio branco do ivai", "rosário do ivaí", "rosario do ivai",
  "vale do ivaí", "vale do ivai", "norte do paraná", "norte do parana"
];

/**
 * Identifica se a notícia é local ou regional do Vale do Ivaí
 */
export function isNoticiaRegional(item: {
  cidade?: string;
  cidade_slug?: string;
  autor?: string;
  titulo?: string;
  cat?: string;
}): boolean {
  if (!item) return false;
  const cSlug = (item.cidade_slug || "").toLowerCase().trim();
  const cidade = (item.cidade || "").toLowerCase().trim();
  const autor = (item.autor || "").toLowerCase().trim();
  const titulo = (item.titulo || "").toLowerCase().trim();
  const cat = (item.cat || "").toLowerCase().trim();

  // Se o slug for de uma cidade real (não 'geral')
  if (cSlug && cSlug !== "geral") return true;

  // Se a cidade for do Vale do Ivaí
  if (cidade && cidade !== "geral" && cidade !== "brasil" && cidade !== "mundo") {
    if (CIDADES_VALE_IVAI.some((c) => cidade.includes(c))) return true;
  }

  // Se o autor for da Rede Apucarana / Rede Norte / Redação Local
  if (autor.includes("rede apucarana") || autor.includes("rede norte") || autor.includes("redação local")) {
    if (cat !== "brasil" && cat !== "mundo") return true;
  }

  // Se o título menciona explicitamente uma cidade da região
  if (CIDADES_VALE_IVAI.some((c) => titulo.includes(c))) return true;

  // Se a categoria for Cidade / Regional / Vale do Ivaí
  if (cat === "cidade" || cat === "regional" || cat === "vale do ivaí" || cat === "vale do ivai") return true;

  return false;
}

/**
 * Detecta a cidade para exibir no Badge de Geo-Tag (ex: "APUCARANA", "ARAPONGAS")
 */
export function detectCityGeoTag(item: {
  cidade?: string;
  cidade_slug?: string;
  titulo?: string;
  cat?: string;
}): string | null {
  if (!item) return null;
  const cidade = (item.cidade || "").trim();
  const cSlug = (item.cidade_slug || "").trim().toLowerCase();
  const titulo = (item.titulo || "").toLowerCase();

  // 1. Se tem cidade explicitada que não seja 'Geral' ou 'Vale do Ivaí'
  if (
    cidade &&
    cidade.toLowerCase() !== "geral" &&
    cidade.toLowerCase() !== "vale do ivaí" &&
    cidade.toLowerCase() !== "vale do ivai" &&
    cidade.toLowerCase() !== "brasil" &&
    cidade.toLowerCase() !== "mundo"
  ) {
    return cidade.toUpperCase();
  }

  // 2. Se o slug corresponder a uma cidade mapeada
  if (cSlug && cSlug !== "geral") {
    const found = CIDADES_VALE_IVAI.find((c) => cSlug.includes(c.replace(/\s+/g, "-")));
    if (found) {
      return found.toUpperCase();
    }
  }

  // 3. Busca no título da matéria por cidades principais do Vale
  for (const c of CIDADES_VALE_IVAI) {
    if (c.length >= 5 && titulo.includes(c)) {
      return c.toUpperCase();
    }
  }

  if (isNoticiaRegional(item)) {
    return "VALE DO IVAÍ";
  }

  return null;
}

/**
 * Verifica se a notícia possui vídeo
 */
export function hasVideoContent(item: any): boolean {
  if (!item) return false;
  if (item.video_url || item.videoUrl || item.url_video) return true;
  const cat = (item.cat || item.categoria || "").toLowerCase();
  if (cat.includes("vídeo") || cat.includes("video") || cat.includes("corte") || cat.includes("reels") || cat.includes("tv")) return true;
  const titulo = (item.titulo || "").toLowerCase();
  if (titulo.startsWith("[vídeo]") || titulo.startsWith("[video]") || titulo.includes("em vídeo") || titulo.includes("veja o vídeo")) return true;
  return false;
}
