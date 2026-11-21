"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertTriangle, Home } from "lucide-react";

export default function NoticiaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[NoticiaError caught]:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 flex flex-col items-center">
        {/* Logo oficial da Rede Apucarana */}
        <Link href="/" className="mb-6 inline-flex items-center gap-2 group" title="Rede Apucarana">
          <img
            src="/logo-rede-apucarana.png"
            alt="Rede Apucarana"
            className="w-12 h-12 object-contain"
          />
        </Link>

        {/* Ícone ilustrativo */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 border border-amber-100 shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Tag de Aviso */}
        <span className="px-3 py-1 rounded-full bg-amber-600/10 text-amber-700 text-xs font-black uppercase tracking-wider mb-2">
          Instabilidade Temporária
        </span>

        {/* Título */}
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight mb-3">
          Não foi possível carregar a matéria
        </h1>

        {/* Descrição */}
        <p className="text-sm text-slate-600 leading-relaxed mb-8">
          Houve uma oscilação na conexão com nossos servidores. Clique abaixo para tentar novamente ou retorne ao portal de notícias.
        </p>

        {/* Ações com botões estilizados */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              reset();
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Tentar Novamente</span>
          </button>

          <Link
            href="/noticias"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver Notícias</span>
          </Link>
        </div>

        <Link
          href="/"
          className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1.5 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Ir para a Página Inicial</span>
        </Link>
      </div>
    </main>
  );
}
