export interface MetaConfig {
  accessToken: string;
  pageId: string;
  igUserId: string;
  apiVersion: string;
  siteUrl: string;
}

export function getMetaConfig(): MetaConfig {
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID || process.env.META_PAGE_ID || "117584158034115";
  const igUserId =
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ||
    process.env.META_INSTAGRAM_USER_ID ||
    "17841462812495678";
  const apiVersion = process.env.META_GRAPH_API_VERSION || "v21.0";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.redeapucarana.com.br").replace(/\/$/, "");

  if (!accessToken) {
    throw new Error("META_ACCESS_TOKEN (ou META_PAGE_ACCESS_TOKEN) não está configurada no ambiente do servidor.");
  }
  if (!pageId) {
    throw new Error("FACEBOOK_PAGE_ID (ou META_PAGE_ID) não está configurada no ambiente do servidor.");
  }
  if (!igUserId) {
    throw new Error("INSTAGRAM_BUSINESS_ACCOUNT_ID (ou META_INSTAGRAM_USER_ID) não está configurada no ambiente do servidor.");
  }

  return { accessToken, pageId, igUserId, apiVersion, siteUrl };
}

export function formatFacebookCaption(
  news: { titulo: string; resumo?: string | null; slug?: string | null; id: string },
  siteUrl: string
): string {
  const partes: string[] = [news.titulo.trim()];

  if (news.resumo && news.resumo.trim()) {
    partes.push(news.resumo.trim());
  }

  const urlMateria = `${siteUrl}/noticias/${news.slug || news.id}`;
  partes.push(`👉 Leia a matéria completa no portal:\n${urlMateria}`);
  partes.push("#RedeApucarana #Apucarana #Parana #Noticias");

  return partes.join("\n\n");
}

export function formatInstagramCaption(news: {
  titulo: string;
  resumo?: string | null;
  slug?: string | null;
  id: string;
}): string {
  const partes: string[] = [news.titulo.trim()];

  if (news.resumo && news.resumo.trim()) {
    partes.push(news.resumo.trim());
  }

  partes.push("🔗 Matéria completa disponível no portal e pelo link na bio: redeapucarana.com.br");
  partes.push("#RedeApucarana #Apucarana #ValeDoIvai #Parana #Jornalismo #Noticias");

  return partes.join("\n\n");
}

async function callMetaApi<T>(endpoint: string, options: RequestInit = {}, timeoutMs = 20000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      ...options,
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);

    if (!res.ok || (json && json.error)) {
      const msg = json?.error?.message || `Erro HTTP ${res.status} da Graph API`;
      const code = json?.error?.code ? ` (código ${json.error.code})` : "";
      throw new Error(`${msg}${code}`);
    }

    return json as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Publica uma imagem no Facebook via POST /{page-id}/photos
 */
export async function publishFacebookPhoto(
  config: MetaConfig,
  params: { imageUrl: string; caption: string }
): Promise<{ id: string; post_id?: string }> {
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.pageId}/photos`;

  const payload = {
    url: params.imageUrl,
    caption: params.caption,
    access_token: config.accessToken,
  };

  return await callMetaApi<{ id: string; post_id?: string }>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Passo 1 do Instagram: Cria o Media Container
 */
export async function createInstagramContainer(
  config: MetaConfig,
  params: { imageUrl: string; caption: string }
): Promise<{ id: string }> {
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.igUserId}/media`;

  const payload = {
    image_url: params.imageUrl,
    caption: params.caption,
    access_token: config.accessToken,
  };

  return await callMetaApi<{ id: string }>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Verifica o status de processamento do Container do Instagram
 */
export async function checkInstagramContainerStatus(
  config: MetaConfig,
  containerId: string
): Promise<{ id: string; status_code?: string }> {
  const url = `https://graph.facebook.com/${config.apiVersion}/${containerId}?fields=id,status_code&access_token=${encodeURIComponent(
    config.accessToken
  )}`;

  return await callMetaApi<{ id: string; status_code?: string }>(url, {
    method: "GET",
  });
}

/**
 * Passo 2 do Instagram: Publica o Container previamente criado
 */
export async function publishInstagramContainer(
  config: MetaConfig,
  containerId: string
): Promise<{ id: string }> {
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.igUserId}/media_publish`;

  const payload = {
    creation_id: containerId,
    access_token: config.accessToken,
  };

  return await callMetaApi<{ id: string }>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Fluxo completo de publicação no Instagram com reaproveitamento de container_id existente
 */
export async function publishToInstagramTwoStep(
  config: MetaConfig,
  params: {
    imageUrl: string;
    caption: string;
    existingContainerId?: string | null;
    onContainerCreated?: (containerId: string) => Promise<void>;
  }
): Promise<{ mediaId: string; containerId: string }> {
  let containerId = params.existingContainerId?.trim() || null;
  let status = "IN_PROGRESS";

  // Se já há um container_id registrado, checa seu status na Meta
  if (containerId) {
    try {
      const check = await checkInstagramContainerStatus(config, containerId);
      status = check.status_code || "FINISHED";

      // Já foi publicado na Meta
      if (status === "PUBLISHED") {
        return { mediaId: containerId, containerId };
      }

      // Se falhou ou expirou, descartamos e criaremos um novo abaixo
      if (status === "ERROR" || status === "EXPIRED") {
        containerId = null;
      }
    } catch (e) {
      console.warn("Erro ao consultar status_code do container_id prévio, criando novo:", e);
      containerId = null;
    }
  }

  // 1. Cria o container se não houver container reutilizável
  if (!containerId) {
    const container = await createInstagramContainer(config, {
      imageUrl: params.imageUrl,
      caption: params.caption,
    });
    containerId = container.id;

    // Salva no banco imediatamente via callback
    if (params.onContainerCreated) {
      try {
        await params.onContainerCreated(containerId);
      } catch (e) {
        console.warn("Falha ao salvar container_id no banco:", e);
      }
    }
    status = "IN_PROGRESS";
  }

  // 2. Aguarda processamento do container se necessário (polling até FINISHED)
  if (status !== "FINISHED" && status !== "PUBLISHED") {
    for (let tentativa = 0; tentativa < 6; tentativa++) {
      const check = await checkInstagramContainerStatus(config, containerId);
      status = check.status_code || "FINISHED";

      if (status === "FINISHED" || status === "PUBLISHED") {
        break;
      }
      if (status === "ERROR" || status === "EXPIRED") {
        throw new Error(`Falha no processamento do container do Instagram: ${status}`);
      }

      // Espera 2.5s antes da próxima checagem
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
  }

  if (status === "PUBLISHED") {
    return { mediaId: containerId, containerId };
  }

  // 3. Dispara a publicação final usando o container verificado
  const published = await publishInstagramContainer(config, containerId);

  return {
    mediaId: published.id,
    containerId,
  };
}

/**
 * Reconciliação Passiva do Facebook (Consulta /photos?type=uploaded)
 */
export async function reconcileFacebookPhoto(
  config: MetaConfig,
  attemptedAt: Date,
  titleSnippet: string
): Promise<{ found: boolean; postId?: string; publishedAt?: string; error?: string }> {
  try {
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.pageId}/photos?type=uploaded&fields=id,name,created_time&limit=5&access_token=${encodeURIComponent(
      config.accessToken
    )}`;

    const data = await callMetaApi<{ data?: Array<{ id: string; name?: string; created_time: string }> }>(url, {
      method: "GET",
    });

    const snippet = titleSnippet.trim().toLowerCase().slice(0, 35);
    const minTimestamp = attemptedAt.getTime() - 120_000; // margem de 2 minutos

    if (data?.data && Array.isArray(data.data)) {
      for (const photo of data.data) {
        const photoTime = new Date(photo.created_time).getTime();
        const photoName = (photo.name || "").toLowerCase();

        if (photoTime >= minTimestamp && photoName.includes(snippet)) {
          return {
            found: true,
            postId: photo.id,
            publishedAt: photo.created_time,
          };
        }
      }
    }

    return { found: false };
  } catch (e: any) {
    return { found: false, error: e?.message || "Erro na consulta à Meta Graph API" };
  }
}

/**
 * Reconciliação Passiva do Instagram (Status do Container + Varredura /media)
 */
export async function reconcileInstagramMedia(
  config: MetaConfig,
  containerId: string | null,
  attemptedAt: Date,
  titleSnippet: string
): Promise<{ found: boolean; mediaId?: string; publishedAt?: string; error?: string }> {
  try {
    // 1. Se houver container ID salvo, checa seu status diretamente na Meta
    if (containerId) {
      try {
        const statusCheck = await checkInstagramContainerStatus(config, containerId);
        if (statusCheck.status_code === "PUBLISHED") {
          return { found: true, mediaId: containerId };
        }
      } catch (errCheck) {
        console.warn("Erro ao consultar status_code do container_id na reconciliação:", errCheck);
      }
    }

    // 2. Consulta mídias recentes do feed
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.igUserId}/media?fields=id,caption,timestamp&limit=5&access_token=${encodeURIComponent(
      config.accessToken
    )}`;

    const data = await callMetaApi<{ data?: Array<{ id: string; caption?: string; timestamp: string }> }>(url, {
      method: "GET",
    });

    const snippet = titleSnippet.trim().toLowerCase().slice(0, 35);
    const minTimestamp = attemptedAt.getTime() - 120_000;

    if (data?.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        const itemTime = new Date(item.timestamp).getTime();
        const itemCaption = (item.caption || "").toLowerCase();

        if (itemTime >= minTimestamp && itemCaption.includes(snippet)) {
          return {
            found: true,
            mediaId: item.id,
            publishedAt: item.timestamp,
          };
        }
      }
    }

    return { found: false };
  } catch (e: any) {
    return { found: false, error: e?.message || "Erro na consulta à Meta Graph API" };
  }
}
