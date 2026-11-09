// Service Worker Oficial - Portal Rede Apucarana de Comunicação
// Garante auto-update instantâneo no Smartphone (PWA/Mobile) sem cache preso.

const CACHE_NAME = "rede-apucarana-v3";

// 1. Instalação: ativa imediatamente a nova versão sem aguardar fechar abas
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// 2. Ativação: limpa agressivamente versões antigas de cache e assume o controle dos clientes
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// 3. Comunicação bidirecional com a aplicação
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 4. Interceptação de requisições:
// NUNCA cachear rotas de streaming, APIs em tempo real, chamadas do OBS ou rotas administrativas
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignora métodos não-GET e recursos de streaming em tempo real
  if (
    event.request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/tv-online") ||
    url.pathname.startsWith("/videos") ||
    url.pathname.includes(".m3u8") ||
    url.pathname.includes(".ts") ||
    url.hostname.includes("samcast") ||
    url.hostname.includes("youtube") ||
    url.hostname.includes("googlevideo") ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("instagram.com")
  ) {
    return;
  }

  // Network-First com fallback seguro para cache apenas em caso de perda total de sinal
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
