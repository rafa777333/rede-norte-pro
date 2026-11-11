/**
 * Cliente de Rastreamento de Analytics para o Guia "Para Onde Ir"
 * Comunicação silenciosa, assíncrona e não-bloqueante para métricas comerciais.
 */

// Conjunto em memória para evitar contabilização redundante de visualizações na mesma sessão
const trackedViewIds = new Set<string>();
let pendingViewIds: string[] = [];
let debounceTimeout: NodeJS.Timeout | null = null;

/**
 * Dispara o envio silencioso das visualizações acumuladas
 */
function flushPendingViews() {
  if (pendingViewIds.length === 0) return;

  const idsToSend = [...pendingViewIds];
  pendingViewIds = [];

  try {
    const payload = JSON.stringify({
      action: "view",
      placeIds: idsToSend,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/places-analytics", blob);
      if (sent) return;
    }

    fetch("/api/places-analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

/**
 * Registra a visualização (impressão) de estabelecimentos de forma silenciosa e com debouncing
 */
export function trackPlaceViews(placeIds: string[]) {
  if (typeof window === "undefined" || !Array.isArray(placeIds)) return;

  const newIds: string[] = [];
  for (const id of placeIds) {
    if (id && !trackedViewIds.has(id)) {
      trackedViewIds.add(id);
      newIds.push(id);
    }
  }

  if (newIds.length === 0) return;

  pendingViewIds.push(...newIds);

  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }

  debounceTimeout = setTimeout(() => {
    flushPendingViews();
  }, 1200);
}

/**
 * Registra o clique no cupom ("🎯 RESGATAR DESCONTO NO CAIXA") de forma silenciosa
 */
export function trackPlaceCouponClick(placeId: string) {
  if (typeof window === "undefined" || !placeId) return;

  try {
    const payload = JSON.stringify({
      action: "click",
      placeId: String(placeId),
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/places-analytics", blob);
      if (sent) return;
    }

    fetch("/api/places-analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export interface PlaceAnalyticsData {
  place_id: string;
  views_count: number;
  clicks_count: number;
  updated_at: string;
}

/**
 * Busca estatísticas agregadas de analytics (usado pelo Painel /admin)
 */
export async function getPlacesAnalytics(): Promise<PlaceAnalyticsData[]> {
  try {
    const res = await fetch("/api/places-analytics", {
      cache: "no-store",
    });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err) {
    console.warn("[PlacesAnalytics] Erro ao buscar dados:", err);
  }
  return [];
}

/**
 * Zera as estatísticas de um local específico ou de todos (para fechamento do mês comercial)
 */
export async function resetPlacesAnalytics(placeId?: string): Promise<boolean> {
  try {
    const res = await fetch("/api/places-analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reset",
        placeId: placeId || "all",
      }),
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch {
    return false;
  }
}
