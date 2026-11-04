import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Empregos & Vagas no Vale do Ivaí | Rede Apucarana",
  description: "Encontre oportunidades de trabalho, processos seletivos e vagas de emprego em Apucarana, Arapongas, Ivaiporã e região.",
};

export default async function EmpregosPage() {
  const supabase = getSupabase();
  let vagas: any[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(30);
    vagas = data || [];
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

      <section className="bg-gradient-to-b from-slate-900 to-emerald-950 text-white py-14 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 px-3 py-1 rounded-full">
            Balcão de Empregos Regional
          </span>
          <h1 className="editorial-headline text-white mt-4 mb-3">
            Oportunidades & Vagas de Trabalho
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Vagas abertas na indústria, comércio, serviços e agências do trabalhador de Apucarana e cidades do Vale do Ivaí.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl py-10 px-4">
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-sans">
              Vagas Recentes Publicadas
            </h2>
            <p className="text-xs text-slate-500">
              Candidaturas diretas com as empresas anunciantes
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            {vagas.length} vagas ativas
          </span>
        </div>

        {vagas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vagas.map((v) => {
              const zapNumber = (v.contato || "").replace(/\D/g, "");

              return (
                <article
                  key={v.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {v.cidade_slug || "Apucarana"}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {v.created_at ? new Date(v.created_at).toLocaleDateString("pt-BR") : "Recente"}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-lg text-slate-900 leading-snug">
                      {v.vaga || v.cargo || "Oportunidade de Trabalho"}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 mt-1">
                      Empresa: {v.empresa || "Confidencial"}
                    </p>

                    {v.descricao && (
                      <p className="text-xs text-slate-500 mt-2.5 line-clamp-3 leading-relaxed font-sans">
                        {v.descricao}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Contato: {v.contato}
                    </span>
                    {zapNumber ? (
                      <a
                        href={`https://wa.me/55${zapNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1.5"
                      >
                        <span>WhatsApp</span>
                        <span>→</span>
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-slate-700">Ver Contato</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <span className="text-4xl block">💼</span>
            <h3 className="text-lg font-bold text-slate-800">
              Novas vagas estão sendo atualizadas pela redação
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Empresas da região podem cadastrar oportunidades diretamente para publicação no portal.
            </p>
          </div>
        )}

        {/* Banner Anuncie sua Vaga */}
        <div className="mt-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-sans">
              É empresário ou recrutador no Vale do Ivaí?
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-lg">
              Divulgue gratuitamente suas vagas abertas na Rede Apucarana e alcance candidatos qualificados em 27 cidades.
            </p>
          </div>
          <Link
            href="/contato"
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 transition-colors"
          >
            Enviar Vaga para Publicação →
          </Link>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-400 py-8 px-4 text-center text-xs border-t border-slate-800">
        <p>© 2026 Rede Apucarana de Comunicação. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
