"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Verificar se já está rodando como app instalado (standalone)
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);

    if (isStandalone) {
      return;
    }

    // 2. Verificar se o usuário já dispensou nas últimas 24h
    if (typeof window !== "undefined") {
      const dismissedTime = localStorage.getItem("dismiss_install_banner");
      if (dismissedTime) {
        const hoursPassed = (Date.now() - Number(dismissedTime)) / (1000 * 60 * 60);
        if (hoursPassed < 24) {
          return;
        }
      }

      // 3. Detectar iOS/Safari
      const ua = window.navigator.userAgent.toLowerCase();
      const isIOSDevice =
        /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
      setIsIOS(isIOSDevice);

      // 4. Capturar evento de instalação do Chrome / Android
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowBanner(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);

      // Se for iOS e não for standalone, exibe o banner também
      if (isIOSDevice) {
        setShowBanner(true);
      }

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dismiss_install_banner", String(Date.now()));
    }
    setShowBanner(false);
    setShowIOSInstructions(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner Principal Discreto no Mobile */}
      <div className="block md:hidden bg-gradient-to-r from-slate-900 via-[#0a192f] to-slate-900 border-b border-red-600/60 px-3.5 py-2.5 shadow-sm text-white relative animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-600/90 flex items-center justify-center shrink-0 shadow-2xs border border-red-400/40">
              <Download className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-snug">
                Instale o App da Rede Apucarana
              </p>
              <p className="text-[10px] text-slate-300 truncate">
                Acesso rápido em 1 toque na sua tela inicial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-sm transition-all whitespace-nowrap cursor-pointer"
            >
              📲 Baixar App
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal/Instrução amigável para iOS (Safari) */}
      {showIOSInstructions && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm w-full text-slate-900 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Instalar no seu iPhone / iPad
              </h3>
              <p className="text-xs text-slate-600 mt-1 mb-4 leading-relaxed">
                Adicione o aplicativo da Rede Apucarana diretamente na sua tela de início em apenas 2 passos:
              </p>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-left text-xs space-y-2.5 mb-4">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <span className="w-6 h-6 rounded-full bg-slate-200 font-bold flex items-center justify-center shrink-0 text-slate-800">
                    1
                  </span>
                  <span>
                    Toque no botão <strong>Compartilhar</strong> (ícone <Share className="inline w-3.5 h-3.5 mx-0.5 text-blue-600" />) na barra inferior do Safari.
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <span className="w-6 h-6 rounded-full bg-slate-200 font-bold flex items-center justify-center shrink-0 text-slate-800">
                    2
                  </span>
                  <span>
                    Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> (ícone <PlusSquare className="inline w-3.5 h-3.5 mx-0.5 text-slate-800" />).
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSInstructions(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
