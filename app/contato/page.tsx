import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fale Conosco & Contato | Rede Apucarana de Comunicação",
  description: "Envie pautas, denúncias, sugestões de reportagem ou fale com o setor comercial e a redação da Rede Apucarana.",
};

export default function ContatoPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="h-16 bg-[#101114] text-white flex items-center justify-between px-4 sm:px-8 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/logo-rede-apucarana.png?v=2"
            alt="Logo Rede Apucarana"
            className="w-9 h-9 object-cover rounded-md"
          />
          <span className="font-bold tracking-wider text-sm sm:text-base">
            REDE APUCARANA
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
        >
          ← Voltar ao Início
        </Link>
      </header>

      <section className="bg-gradient-to-b from-slate-900 to-slate-850 text-white py-14 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 px-3 py-1 rounded-full">
            Canal Direto com o Leitor
          </span>
          <h1 className="editorial-headline text-white mt-4 mb-3">
            Fale com a Redação & Comercial
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Tem um flagrante, sugestão de reportagem ou interesse em anunciar? Nossa equipe está pronta para atender você.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-4xl py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card WhatsApp Redação */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mb-4">
                📱
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-sans">
                WhatsApp da Redação
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Envie fotos, vídeos de ocorrências na sua cidade, sugestões de reportagem ou dúvidas sobre eventos locais. O sigilo da fonte é garantido pela Constituição Federal.
              </p>
            </div>
            <a
              href="https://chat.whatsapp.com/Irl8tuJypYR1kNqTZklqwz"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center text-sm shadow-sm transition-all block"
            >
              Falar no WhatsApp da Redação →
            </a>
          </div>

          {/* Card Comercial & Anúncios */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center text-2xl mb-4">
                📢
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-sans">
                Departamento Comercial
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Consulte nossos formatos de mídia na capa, inserções de áudio na Web Rádio 24h, matérias de conteúdo patrocinado e ações de rede social para o Norte do Paraná.
              </p>
            </div>
            <Link
              href="/anuncie"
              className="mt-6 w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-center text-sm shadow-sm transition-all block"
            >
              Ver Mídia Kit e Planos →
            </Link>
          </div>
        </div>

        {/* Informações Institucionais de Contato */}
        <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 text-sm text-slate-600 space-y-3">
          <h3 className="text-base font-bold text-slate-900 font-sans">
            Sede & Cobertura Editorial
          </h3>
          <p>
            <strong>Localização:</strong> Apucarana — Paraná, Brasil. Cobertura diária nos 27 municípios do Vale do Ivaí.
          </p>
          <p>
            <strong>E-mail institucional:</strong> <a href="mailto:contato@redeapucarana.com.br" className="text-red-600 hover:underline">contato@redeapucarana.com.br</a>
          </p>
          <p>
            <strong>Horário de atendimento:</strong> Segunda a Sexta, das 08h às 18h. Plantão jornalístico 24 horas por dia.
          </p>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-400 py-8 px-4 text-center text-xs border-t border-slate-800">
        <p>© 2026 Rede Apucarana de Comunicação. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
