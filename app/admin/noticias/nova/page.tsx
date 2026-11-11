import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import AdminNewsPublishForm from "@/components/admin/AdminNewsPublishForm";

export const metadata: Metadata = {
  title: "Publicar Nova Notícia | Painel Jornalístico Rede Apucarana",
  description: "Formulário de publicação de matérias com SEO e vídeos para a Rede Apucarana.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminNovaNoticiaPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-20 selection:bg-red-500 selection:text-white">
      {/* Header Superior Administrativo */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-slate-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              ← Painel Geral
            </Link>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">✍️</span>
              <span className="font-heading font-bold text-sm sm:text-base text-white tracking-tight">
                Redação & Jornalismo Multiplataforma
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/noticias"
              target="_blank"
              className="text-xs font-bold text-sky-300 hover:text-sky-200 px-3 py-1.5 rounded-lg border border-sky-500/30 hover:bg-sky-500/10 transition-colors hidden sm:inline-flex items-center gap-1"
            >
              Ver Notícias no Ar ↗
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <AdminNewsPublishForm />
      </main>
    </div>
  );
}
