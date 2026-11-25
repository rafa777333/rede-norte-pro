import { google } from "googleapis";

export interface IndexingResult {
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
}

export interface SitemapResult {
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
}

export interface IndexNotificationResponse {
  success: boolean;
  url: string;
  type: "URL_UPDATED" | "URL_DELETED";
  indexing: IndexingResult;
  sitemap: SitemapResult;
  timestamp: string;
}

const DEFAULT_BASE_URL = "https://www.redeapucarana.com.br";

/**
 * Normaliza qualquer URL recebida (relativa ou absoluta)
 */
export function normalizeUrl(rawUrl: string): string {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) {
    throw new Error("URL não fornecida para indexação.");
  }
  if (trimmed.startsWith("/")) {
    return `${DEFAULT_BASE_URL}${trimmed}`;
  }
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Cria o cliente de autenticação JWT da Service Account do Google
 */
export function getGoogleAuthClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Credenciais do Google não configuradas. Defina GOOGLE_CLIENT_EMAIL e GOOGLE_PRIVATE_KEY no ambiente (.env.local)."
    );
  }

  // Remove aspas adicionadas acidentalmente nas pontas
  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }

  // Converte \n escapados para quebras de linha reais da chave PEM RSA
  privateKey = privateKey.replace(/\\n/g, "\n");

  const jwtClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/indexing",
      "https://www.googleapis.com/auth/webmasters",
    ],
  });

  return jwtClient;
}

/**
 * Envia notificação para a Google Indexing API (URL_UPDATED ou URL_DELETED)
 */
export async function notifyGoogleIndexing(
  targetUrl: string,
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<IndexingResult> {
  const cleanUrl = normalizeUrl(targetUrl);

  try {
    const auth = getGoogleAuthClient();
    const indexing = google.indexing({ version: "v3", auth });

    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url: cleanUrl,
        type: type,
      },
    });

    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.error?.message ||
      err?.message ||
      "Erro desconhecido ao chamar Google Indexing API";
    console.error(`[Google Indexing API Error] [${cleanUrl}]:`, errorMsg);
    return {
      success: false,
      status: err?.response?.status || 500,
      error: errorMsg,
    };
  }
}

/**
 * Reenvia o sitemap via Google Search Console API
 */
export async function notifySearchConsoleSitemap(
  customSitemapUrl?: string,
  customSiteUrl?: string
): Promise<SitemapResult> {
  const sitemapUrl =
    customSitemapUrl ||
    process.env.NEXT_PUBLIC_SITEMAP_URL ||
    `${DEFAULT_BASE_URL}/sitemap.xml`;

  // Search Console siteUrl: geralmente com barra no final para URL-prefix
  const siteUrl =
    customSiteUrl ||
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL ||
    `${DEFAULT_BASE_URL}/`;

  try {
    const auth = getGoogleAuthClient();
    const searchconsole = google.searchconsole({ version: "v1", auth });

    const response = await searchconsole.sitemaps.submit({
      siteUrl: siteUrl,
      feedpath: sitemapUrl,
    });

    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.error?.message ||
      err?.message ||
      "Erro desconhecido ao reenviar sitemap no Search Console";
    console.warn(`[Search Console Sitemap Error] [${sitemapUrl}]:`, errorMsg);
    return {
      success: false,
      status: err?.response?.status || 500,
      error: errorMsg,
    };
  }
}

/**
 * Fluxo completo: Notifica Google Indexing API e reenvia Sitemap
 */
export async function indexUrlAndNotifySitemap(
  targetUrl: string,
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<IndexNotificationResponse> {
  const cleanUrl = normalizeUrl(targetUrl);

  // Executa Indexing API e Search Console em paralelo
  const [indexingResult, sitemapResult] = await Promise.all([
    notifyGoogleIndexing(cleanUrl, type),
    notifySearchConsoleSitemap(),
  ]);

  return {
    success: indexingResult.success || sitemapResult.success,
    url: cleanUrl,
    type,
    indexing: indexingResult,
    sitemap: sitemapResult,
    timestamp: new Date().toISOString(),
  };
}
