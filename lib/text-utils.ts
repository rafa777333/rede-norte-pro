/**
 * Utilitários para tratamento e sanitização de texto e manchetes
 */

/**
 * Decodifica entidades HTML comuns em strings (ex: &#039; -> ', &quot; -> ", &atilde; -> ã)
 * Suporta entidades numéricas decimais (&#39;), hexadecimais (&#x27;) e nomeadas (&quot;).
 */
export function decodeHtmlEntities(str: string): string {
  if (!str || typeof str !== "string") return "";

  return str
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return _;
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return _;
      }
    })
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&rsquo;/gi, "’")
    .replace(/&ldquo;/gi, "“")
    .replace(/&rdquo;/gi, "”")
    .replace(/&hellip;/gi, "…")
    .replace(/&bull;/gi, "•")
    .replace(/&copy;/gi, "©")
    .replace(/&reg;/gi, "®")
    .replace(/&aacute;/gi, "á")
    .replace(/&Aacute;/gi, "Á")
    .replace(/&agrave;/gi, "à")
    .replace(/&Agrave;/gi, "À")
    .replace(/&atilde;/gi, "ã")
    .replace(/&Atilde;/gi, "Ã")
    .replace(/&acirc;/gi, "â")
    .replace(/&Acirc;/gi, "Â")
    .replace(/&eacute;/gi, "é")
    .replace(/&Eacute;/gi, "É")
    .replace(/&ecirc;/gi, "ê")
    .replace(/&Ecirc;/gi, "Ê")
    .replace(/&iacute;/gi, "í")
    .replace(/&Iacute;/gi, "Í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&Oacute;/gi, "Ó")
    .replace(/&otilde;/gi, "õ")
    .replace(/&Otilde;/gi, "Õ")
    .replace(/&ocirc;/gi, "ô")
    .replace(/&Ocirc;/gi, "Ô")
    .replace(/&uacute;/gi, "ú")
    .replace(/&Uacute;/gi, "Ú")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&Ccedil;/gi, "Ç");
}
