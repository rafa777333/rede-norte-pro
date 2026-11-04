import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anuncie Conosco | Rede Apucarana de Comunicação",
  description: "Divulgue sua empresa ou marca no maior portal de notícias de Apucarana, Arapongas e Vale do Ivaí. Planos de publicidade na web, rádio e redes sociais.",
};

export default function AnunciePage() {
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

      <section className="bg-gradient-to-b from-slate-900 to-slate-850 text-white py-16 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-900/60 px-3 py-1 rounded-full">
            Mídia Kit & Publicidade 2026
          </span>
          <h1 className="editorial-headline text-white mt-4 mb-4">
            Conecte sua Marca a Milhares de Clientes no Vale do Ivaí
          </h1>
          <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Presença consolidada em Apucarana, Arapongas, Ivaiporã e 24 municípios da região. Formatos nativos com alta taxa de conversão e credibilidade jornalística.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl py-12 px-4 space-y-12">
        {/* Nossos Formatos de Mídia */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display text-center mb-8">
            Formatos Publicitários Disponíveis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-2xl">🖼</span>
                <h3 className="text-lg font-bold text-slate-900 mt-2 font-sans">
                  Banners na Capa & Matérias
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Posições privilegiadas na primeira dobra, no meio do feed de notícias e na barra lateral fixa. Formatos responsivos para mobile e desktop.
                </p>
              </div>
              <ul className="text-xs text-slate-500 mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                <li>✔ Super Banner Topo 1200x200</li>
                <li>✔ Banners de Feed 970x250</li>
                <li>✔ Módulos Laterais 300x250 / 300x600</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-2xl">📻</span>
                <h3 className="text-lg font-bold text-slate-900 mt-2 font-sans">
                  Web Rádio & RedeCast
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Spots comerciais gravados de 30 segundos com rotação contínua na nossa programação ao vivo e menções patrocinadas nos episódios em vídeo.
                </p>
              </div>
              <ul className="text-xs text-slate-500 mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                <li>✔ Inserções em rotação 24h</li>
                <li>✔ Patrocínio de Hora Certa e Clima</li>
                <li>✔ Entrevista exclusiva no estúdio</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-2xl">📱</span>
                <h3 className="text-lg font-bold text-slate-900 mt-2 font-sans">
                  Redes Sociais & Carimbos
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Publicações colaborativas no Instagram (@radionorteapucarana) e Facebook com arte carimbada oficial e alcance segmentado regionalmente.
                </p>
              </div>
              <ul className="text-xs text-slate-500 mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                <li>✔ Posts no Feed (1080x1350)</li>
                <li>✔ Stories com link direto</li>
                <li>✔ Cobertura de inaugurações e eventos</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Contato Comercial */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-8 sm:p-12 rounded-3xl shadow-lg text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            Pronto para colocar sua marca em destaque?
          </h2>
          <p className="text-sm sm:text-base text-red-100 max-w-xl mx-auto">
            Fale diretamente com nossa equipe comercial e receba uma proposta personalizada para o tamanho do seu negócio.
          </p>
          <div className="pt-2">
            <a
              href="https://chat.whatsapp.com/Irl8tuJypYR1kNqTZklqwz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-red-700 hover:bg-slate-100 font-bold text-sm shadow-md transition-all scale-100 hover:scale-105"
            >
              <span>📱</span>
              <span>Chamar no WhatsApp Comercial</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-400 py-8 px-4 text-center text-xs border-t border-slate-800">
        <p>© 2026 Rede Apucarana de Comunicação. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
