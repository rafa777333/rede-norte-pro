import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, FileQuestion } from "lucide-react";

export default function NoticiaNotFound() {
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
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-5 border border-red-100 shadow-inner">
          <FileQuestion className="w-8 h-8" />
        </div>

        {/* Tag 404 */}
        <span className="px-3 py-1 rounded-full bg-red-600/10 text-red-700 text-xs font-black uppercase tracking-wider mb-2">
          Erro 404 • Não Localizado
        </span>

        {/* Título */}
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight mb-3">
          Matéria não encontrada ou removida
        </h1>

        {/* Descrição */}
        <p className="text-sm text-slate-600 leading-relaxed mb-8">
          A notícia que você tentou acessar não está mais disponível no portal, teve o link atualizado ou foi arquivada pela nossa redação.
        </p>

        {/* Ações com botões estilizados */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Voltar para a Home</span>
          </Link>

          <Link
            href="/noticias"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver Notícias</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
