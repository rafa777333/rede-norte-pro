import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Classificados & Negócios no Vale do Ivaí | Rede Apucarana",
  description: "Compra, venda, imóveis, veículos e negócios em Apucarana e cidades da região do Vale do Ivaí.",
};

export default async function ClassificadosPage() {
  const supabase = getSupabase();
  let ads: any[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("classified_ads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    ads = data || [];
  }

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
          ← Voltar ao Portal
        </Link>
      </header>

      <section className="bg-gradient-to-b from-slate-900 to-amber-950 text-white py-14 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-900/60 px-3 py-1 rounded-full">
            Mercado & Negócios Locais
          </span>
          <h1 className="editorial-headline text-white mt-4 mb-3">
            Classificados do Vale do Ivaí
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Compre, venda e anuncie imóveis, veículos, serviços e produtos com quem vive na sua cidade.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl py-10 px-4">
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-sans">
              Anúncios em Destaque
            </h2>
            <p className="text-xs text-slate-500">
              Negociações diretas entre comprador e vendedor
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            {ads.length} anúncios
          </span>
        </div>

        {ads.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {ads.map((ad) => {
              const zapNumber = (ad.contato || "").replace(/\D/g, "");

              return (
                <article
                  key={ad.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="aspect-video w-full bg-slate-100 overflow-hidden relative">
                    {ad.imagem ? (
                      <img
                        src={ad.imagem}
                        alt={ad.titulo}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                        🛒
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-xs">
                      {ad.categoria || "Classificados"}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-900 line-clamp-2 leading-snug">
                        {ad.titulo}
                      </h3>
                      {ad.preco && (
                        <p className="text-base font-black text-amber-700 mt-1">
                          {ad.preco}
                        </p>
                      )}
                      {ad.descricao && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {ad.descricao}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {ad.cidade || "Apucarana"}
                      </span>
                      {zapNumber ? (
                        <a
                          href={`https://wa.me/55${zapNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <span>Negociar</span>
                          <span>→</span>
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-slate-600">{ad.contato}</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <span className="text-4xl block">🛒</span>
            <h3 className="text-lg font-bold text-slate-800">
              Novos classificados estão sendo moderados
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Quer vender um carro, imóvel ou oferecer um serviço no Vale do Ivaí? Fale com nossa equipe.
            </p>
          </div>
        )}

        <div className="mt-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-sans">
              Quer anunciar gratuitamente nos Classificados?
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-lg">
              Envie fotos e detalhes do produto ou serviço diretamente para a nossa redação pelo WhatsApp.
            </p>
          </div>
          <Link
            href="/contato"
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 transition-colors"
          >
            Enviar Anúncio →
          </Link>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-400 py-8 px-4 text-center text-xs border-t border-slate-800">
        <p>© 2026 Rede Apucarana de Comunicação. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
