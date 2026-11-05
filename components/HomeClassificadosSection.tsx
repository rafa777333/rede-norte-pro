"use client";

import React from "react";
import Link from "next/link";
import { ClassifiedAdItem, MOCK_CLASSIFICADOS } from "@/lib/classificados-data";

interface HomeClassificadosSectionProps {
  cidadeAtual?: string;
  initialAds?: ClassifiedAdItem[];
}

export default function HomeClassificadosSection({
  cidadeAtual = "Geral",
  initialAds,
}: HomeClassificadosSectionProps) {
  const [ads, setAds] = React.useState<ClassifiedAdItem[]>(
    initialAds && initialAds.length > 0 ? initialAds : MOCK_CLASSIFICADOS
  );

  React.useEffect(() => {
    let cancel = false;
    fetch("/api/classificados")
      .then((res) => res.json())
      .then((data) => {
        if (!cancel && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setAds(data.data);
        }
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  const displayAds = React.useMemo(() => {
    let list = ads;
    if (cidadeAtual && cidadeAtual !== "Geral" && cidadeAtual !== "Todas") {
      const byCity = list.filter(
        (a) => a.cidade?.toLowerCase() === cidadeAtual.toLowerCase()
      );
      if (byCity.length > 0) list = byCity;
    }
    return list.slice(0, 4);
  }, [cidadeAtual, ads]);

  return (
    <section
      className="w-full my-8 bg-gradient-to-b from-amber-500/5 via-white to-slate-50 border border-amber-500/20 rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden relative"
      aria-label="Compras e Vendas no Vale do Ivaí - Classificados & Rolo"
    >
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-amber-500/15">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-6 rounded-full bg-amber-500 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase text-amber-700 tracking-wider">
                Marketplace Regional do Vale
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                100% Gratuito
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans tracking-tight">
              Compras & Vendas {cidadeAtual !== "Geral" && cidadeAtual !== "Todas" ? `em ${cidadeAtual}` : "no Vale do Ivaí"}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/comprasevendas"
            className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition"
          >
            <span>➕ Anunciar Grátis</span>
          </Link>
          <Link
            href="/comprasevendas"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 rounded-xl border border-amber-200 transition"
          >
            <span>Ver Todos ({ads.length}) →</span>
          </Link>
        </div>
      </div>

      {/* Grid de 4 Cards em Destaque */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayAds.map((ad) => {
          const cover =
            (ad.fotos && ad.fotos[0]) ||
            ad.imagem ||
            "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80";

          return (
            <Link
              key={ad.id}
              href={`/comprasevendas?id=${ad.id}`}
              className="group bg-white rounded-xl border border-slate-200 hover:border-amber-400 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                  <img
                    src={cover}
                    alt={ad.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                      {ad.categoria}
                    </span>
                    {ad.aceita_troca && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-blue-600 text-white">
                        🤝 Rolo
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    <span>📍</span>
                    <span>{ad.cidade}</span>
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2 group-hover:text-amber-700 transition-colors">
                    {ad.titulo}
                  </h4>
                </div>
              </div>

              <div className="p-3 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold leading-none">
                    Valor
                  </span>
                  <span className="text-sm font-black text-emerald-700">
                    {ad.preco}
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform">
                  Ver detalhes →
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Faixa inferior de chamada rápida */}
      <div className="mt-4 pt-3 border-t border-amber-500/15 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        <p>
          Carros, motos, celulares, móveis, ferramentas e oportunidades com negociação direta no WhatsApp nas 27 cidades da região.
        </p>
        <Link
          href="/comprasevendas"
          className="font-bold text-amber-700 hover:text-amber-900 shrink-0 flex items-center gap-1"
        >
          <span>Acessar vitrine completa em /comprasevendas</span>
          <span>→</span>
        </Link>
      </div>
    </section>
  );
}
