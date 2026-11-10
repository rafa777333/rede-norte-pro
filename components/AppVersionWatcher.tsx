"use client";

import { useEffect, useRef } from "react";

/**
 * =========================================================================
 * COMPONENTE: AppVersionWatcher
 * Gerencia o ciclo de vida do Service Worker PWA Mobile, garantindo auto-update
 * instantâneo e ressincronização em tempo real quando o usuário volta do background.
 * =========================================================================
 */
export default function AppVersionWatcher() {
  const isRegisteredRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || isRegisteredRef.current) return;
    isRegisteredRef.current = true;

    // 1. Registro e atualização do Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Checagem imediata de nova versão
          reg.update().catch(() => {});

          if (reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }

          reg.addEventListener("updatefound", () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (
                  installingWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  installingWorker.postMessage({ type: "SKIP_WAITING" });
                }
              });
            }
          });
        })
        .catch((err) => {
          console.info("[PWA SW] Registro opcional não disponível:", err);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          // Notifica a aplicação sobre nova versão ativa e recarrega automaticamente
          window.dispatchEvent(new CustomEvent("app:sw-updated"));
          window.location.reload();
        }
      });
    }

    // 2. Listener para quando o app volta do background no celular (visibilitychange / focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // A) Dispara busca de nova versão do Service Worker sem esperar
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg) {
              reg.update().catch(() => {});
              if (reg.waiting) {
                reg.waiting.postMessage({ type: "SKIP_WAITING" });
              }
            }
          }).catch(() => {});
        }

        // B) Dispara evento para a TV Online ressincronizar com o relógio e com o OBS
        window.dispatchEvent(
          new CustomEvent("app:resync-tv", {
            detail: {
              timestamp: Date.now(),
              source: "visibilitychange",
            },
          })
        );
      }
    };

    const handleFocus = () => {
      window.dispatchEvent(
        new CustomEvent("app:resync-tv", {
          detail: {
            timestamp: Date.now(),
            source: "focus",
          },
        })
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return null; // Componente estritamente funcional e invisível
}
