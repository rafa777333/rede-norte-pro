import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Onde Ir & Guia Comercial | Rede Apucarana",
  description: "Descubra os melhores restaurantes, bares, hotéis, atrações turísticas e comércio de Apucarana e região do Vale do Ivaí.",
};

export default async function OndeIrPage() {
  const supabase = getSupabase();
  let locais: any[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("service_providers")
      .select("*")
      .limit(30);
    locais = data || [];
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

      <section className="bg-gradient-to-b from-slate-900 to-orange-950 text-white py-14 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400 bg-orange-950/60 border border-orange-900/60 px-3 py-1 rounded-full">
            Gastronomia, Comércio & Lazer
          </span>
          <h1 className="editorial-headline text-white mt-4 mb-3">
            Onde Ir no Vale do Ivaí
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            O guia definitivo de experiências, restaurantes, cafeterias, turismo regional e serviços recomendados em Apucarana e cidades vizinhas.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl py-10 px-4">
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-sans">
              Locais & Experiências Recomendadas
            </h2>
            <p className="text-xs text-slate-500">
              Guia curado pela redação e parceiros comerciais
            </p>
          </div>
        </div>

        {locais.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {locais.map((loc) => (
              <article
                key={loc.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="aspect-video w-full bg-slate-100 overflow-hidden relative">
                  {loc.imagem ? (
                    <img
                      src={loc.imagem}
                      alt={loc.nome}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl">
                      🍽
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white">
                    {loc.categoria || "Gastronomia"}
                  </span>
                </div>

                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 leading-snug">
                      {loc.nome}
                    </h3>
                    {loc.endereco && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        📍 {loc.endereco}
                      </p>
                    )}
                    {loc.descricao && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {loc.descricao}
                      </p>
                    )}
                  </div>

                  {loc.whatsapp && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <a
                        href={`https://wa.me/55${loc.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center block transition-colors"
                      >
                        Chamar no WhatsApp →
                      </a>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <span className="text-4xl block">🍔</span>
            <h3 className="text-lg font-bold text-slate-800">
              O Guia Onde Ir está sendo mapeado pela nossa equipe
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tem um restaurante, cafeteria, pousada ou atrativo no Vale do Ivaí? Cadastre sua empresa no guia da Rede Apucarana.
            </p>
            <div className="pt-2">
              <Link
                href="/contato"
                className="inline-block px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors"
              >
                Cadastrar meu Estabelecimento →
              </Link>
            </div>
          </div>
        )}
      </section>

      <footer className="bg-slate-950 text-slate-400 py-8 px-4 text-center text-xs border-t border-slate-800">
        <p>© 2026 Rede Apucarana de Comunicação. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
