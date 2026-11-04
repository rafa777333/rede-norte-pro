import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quem Somos | Rede Apucarana de Comunicação",
  description: "Conheça a história, a missão e a equipe da Rede Apucarana de Comunicação, o maior portal de notícias do Vale do Ivaí e Norte do Paraná.",
};

export default function QuemSomosPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
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

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-850 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-red-500 bg-red-950/60 border border-red-900/60 px-3 py-1 rounded-full">
            Nossa História & Missão
          </span>
          <h1 className="editorial-headline text-white mt-4 mb-4">
            Jornalismo Regional Independente, Rádio e Web TV no Coração do Vale do Ivaí
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            A Rede Apucarana nasceu para conectar os 27 municípios do Norte do Paraná com informação ágil, checada, multimídia e de utilidade pública para toda a comunidade.
          </p>
        </div>
      </section>

      {/* Conteúdo Institucional */}
      <section className="container mx-auto max-w-4xl py-12 px-4 space-y-10">
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 font-display">
            Quem Somos
          </h2>
          <p className="text-slate-600 leading-relaxed">
            A <strong>Rede Apucarana de Comunicação</strong> é um ecossistema multimídia pioneiro no Norte do Paraná, combinando portal de notícias com atualização em tempo real, emissora de rádio web 24 horas, canal de Web TV e estúdio de podcast (RedeCast).
          </p>
          <p className="text-slate-600 leading-relaxed">
            Com sede em Apucarana e correspondentes cobrindo os 27 municípios do Vale do Ivaí, nossa redação atua com independência editorial, compromisso com a verdade e foco nas pautas que impactam o dia a dia, a economia familiar, os empregos e a segurança da nossa gente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-2xl">🎯</span>
              <h3 className="font-bold text-slate-900 mt-2 mb-1">Missão</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Informar com precisão, transparência e velocidade, fortalecendo a cidadania e o desenvolvimento regional do Paraná.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-2xl">👁</span>
              <h3 className="font-bold text-slate-900 mt-2 mb-1">Visão</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ser o principal hub digital de notícias, negócios e utilidade pública para os mais de 400 mil habitantes do Vale do Ivaí.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-2xl">⚖</span>
              <h3 className="font-bold text-slate-900 mt-2 mb-1">Valores</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ética jornalística, independência, respeito aos leitores, inovação tecnológica e valorização da cultura paranaense.
              </p>
            </div>
          </div>
        </div>

        {/* Banner Institucional */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
          <img
            src="/banner-rede-apucarana.png?v=2"
            alt="Rede Apucarana de Comunicação"
            className="w-full h-auto object-cover"
          />
        </div>
      </section>

      {/* Footer simples */}
      <footer className="bg-slate-950 text-slate-400 py-8 px-4 text-center text-xs border-t border-slate-800">
        <p>© 2026 Rede Apucarana de Comunicação. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
