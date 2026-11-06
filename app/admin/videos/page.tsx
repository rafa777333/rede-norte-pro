"use client";

import React from "react";
import Link from "next/link";
import AdminTvVideosManager from "@/components/admin/AdminTvVideosManager";

export default function AdminVideosPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Barra de Topo Administrativa */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              ← Painel Geral
            </Link>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">📺</span>
              <h1 className="font-heading font-bold text-base sm:text-lg text-white tracking-tight">
                Hub de Streaming Multi-Canal{" "}
                <span className="text-red-400 text-xs font-normal">
                  (TV Apucarana & RedeCast)
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/tv-online"
              target="_blank"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/10 transition-colors inline-flex items-center gap-1"
            >
              Ver Hub no Ar ↗
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal: Gerenciador Oficial */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <AdminTvVideosManager />
      </main>
    </div>
  );
}
