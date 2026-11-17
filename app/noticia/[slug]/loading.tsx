import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NoticiaLoading() {
  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans pb-20 animate-pulse">
      {/* Barra de Topo Limpa com Navegação */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-red-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar às Notícias</span>
          </Link>

          <div className="flex items-center gap-2">
            <img
              src="/logo-rede-apucarana.png"
              alt="Rede Apucarana"
              className="w-8 h-8 object-contain"
            />
            <span className="font-heading font-black text-sm tracking-tight text-slate-900 hidden sm:inline">
              REDE APUCARANA
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Central Skeleton */}
      <article className="max-w-3xl mx-auto px-4 pt-6 sm:pt-10">
        {/* Metadados: Categoria e Cidade */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
          <div className="h-4 w-28 bg-slate-100 rounded" />
        </div>

        {/* H1 Skeleton */}
        <div className="space-y-3 mb-6">
          <div className="h-8 sm:h-10 bg-slate-200 rounded-lg w-full" />
          <div className="h-8 sm:h-10 bg-slate-200 rounded-lg w-4/5" />
        </div>

        {/* Linha Fina Skeleton */}
        <div className="space-y-2 mb-6">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
        </div>

        {/* Byline: Autor e Data Skeleton */}
        <div className="flex items-center justify-between gap-3 py-3 border-y border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="h-8 w-24 bg-slate-100 rounded-lg" />
        </div>

        {/* Mídia / Capa Skeleton */}
        <div className="w-full aspect-video rounded-2xl bg-slate-200 mb-8 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center">
            <div className="w-0 h-0 border-y-8 border-y-transparent border-l-12 border-l-slate-400 ml-1" />
          </div>
        </div>

        {/* Texto da Notícia Skeleton */}
        <div className="space-y-4">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-11/12" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-4/5" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-3/4" />
        </div>
      </article>
    </main>
  );
}
