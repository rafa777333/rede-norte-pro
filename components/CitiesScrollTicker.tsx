"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, ChevronDown } from "lucide-react";
import { cidadeSlug } from "@/lib/supabase";

export const TODAS_AS_CIDADES = [
  "Apucarana",
  "Arapongas",
  "Arapuã",
  "Ariranha do Ivaí",
  "Bom Sucesso",
  "Borrazópolis",
  "Califórnia",
  "Cambira",
  "Cruzmaltina",
  "Faxinal",
  "Godoy Moreira",
  "Grandes Rios",
  "Ivaiporã",
  "Jandaia do Sul",
  "Jardim Alegre",
  "Kaloré",
  "Lidianópolis",
  "Lunardelli",
  "Marilândia do Sul",
  "Marumbi",
  "Mauá da Serra",
  "Novo Itacolomi",
  "Rio Bom",
  "Rio Branco do Ivaí",
  "Rosário do Ivaí",
  "São João do Ivaí",
  "São Pedro do Ivaí",
];

const POLOS = ["Apucarana", "Arapongas", "Ivaiporã", "Jandaia do Sul"];

interface CitiesScrollTickerProps {
  currentCity?: string;
  onSelectCity?: (city: string) => void;
  variant?: "inline" | "banner";
}

export default function CitiesScrollTicker({
  currentCity = "Geral",
  onSelectCity,
  variant = "inline",
}: CitiesScrollTickerProps) {
  const [modalAberto, setModalAberto] = useState(false);

  // Fechar com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalAberto(false);
    };
    if (modalAberto) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalAberto]);

  const handleCitySelect = (c: string) => {
    setModalAberto(false);
    if (onSelectCity) {
      onSelectCity(c);
    }
  };

  const isCidadeAtiva = currentCity && currentCity !== "Geral";

  return (
    <>
      {/* 1. Variante BANNER LARGO DE DESTAQUE (Ideal para o Topo da Página de Notícias) */}
      {variant === "banner" ? (
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0a192f] via-slate-900 to-blue-950 hover:from-blue-950 hover:to-slate-900 text-white shadow-lg border border-red-500/30 flex items-center justify-between group active:scale-[0.99] transition-all cursor-pointer select-none"
          title="Clique para escolher uma das 27 cidades do Vale do Ivaí"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.4} />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-base sm:text-lg text-white tracking-tight">
                  📍 Cidades do Vale do Ivaí
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                  27 CIDADES
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                {isCidadeAtiva
                  ? `Notícias de ${currentCity} • Toque para trocar de município`
                  : "Toque para ver notícias exclusivas por município"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isCidadeAtiva && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleCitySelect("Geral");
                }}
                className="hidden xs:inline-flex text-[11px] font-bold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Voltar para a Capa Geral de todo o portal"
              >
                Ver Todas
              </span>
            )}
            <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" strokeWidth={2.4} />
            </div>
          </div>
        </button>
      ) : (
        /* 2. Variante INLINE COMPACTA (Para a barra de rolagem e títulos) */
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer ${
              isCidadeAtiva
                ? "bg-red-600 hover:bg-red-700 text-white shadow-xs"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
            title="Clique para escolher uma das 27 cidades do Vale do Ivaí"
          >
            <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" strokeWidth={2.2} />
            <span className="tracking-wide">
              {isCidadeAtiva
                ? `${currentCity} (27 Cidades)`
                : "Vale do Ivaí — 27 Cidades"}
            </span>
            <ChevronDown className="w-3 h-3 text-white/80 shrink-0" strokeWidth={2.2} />
          </button>

          {/* Atalho para Capa Geral quando uma cidade específica estiver aberta */}
          {isCidadeAtiva && (
            <Link
              href="/"
              onClick={() => handleCitySelect("Geral")}
              className="text-[11px] font-semibold text-slate-600 hover:text-red-700 px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
              title="Voltar para a Capa Geral de todo o portal"
            >
              ← Capa Geral
            </Link>
          )}
        </div>
      )}

      {/* Modal / Aba Completa das 27 Cidades do Vale do Ivaí (Sem campo de busca para evitar teclado no mobile) */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setModalAberto(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-600 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                  Região Norte & Vale do Ivaí
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-sans mt-0.5">
                  Escolha sua Cidade
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toque na cidade desejada para ver as notícias exclusivas do município.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-base font-bold transition-colors shrink-0 ml-2 cursor-pointer"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Lista com as 27 Cidades em Grid Responsivo (Livre de Teclado Virtual no Mobile) */}
            <div className="overflow-y-auto pr-1 py-3 flex-1 space-y-3">
              {/* Botão Capa Geral em Destaque */}
              <div>
                <Link
                  href="/"
                  onClick={() => handleCitySelect("Geral")}
                  className={`w-full p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-between cursor-pointer active:scale-95 ${
                    !isCidadeAtiva
                      ? "bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">🌐</span>
                    <span>Capa Geral (Todas as Notícias do Vale & Brasil)</span>
                  </span>
                  <span className="text-[11px] opacity-80 font-normal">Edição Principal</span>
                </Link>
              </div>

              {/* Grid das 27 Cidades */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {TODAS_AS_CIDADES.map((c) => {
                  const active = currentCity === c;
                  const isPolo = POLOS.includes(c);
                  const slug = cidadeSlug(c);

                  return (
                    <Link
                      key={c}
                      href={`/cidades/${slug}`}
                      onClick={() => handleCitySelect(c)}
                      className={`p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-medium border transition-all flex items-center justify-between text-left group cursor-pointer active:scale-95 ${
                        active
                          ? "bg-red-600 text-white font-bold border-red-600 shadow-md"
                          : "bg-slate-50 hover:bg-red-50/50 hover:border-red-200 text-slate-700 hover:text-red-700 border-slate-200"
                      }`}
                      title={`Abrir notícias de ${c}`}
                    >
                      <span className="truncate pr-1">
                        {isPolo && !active ? (
                          <span className="font-bold text-slate-900 group-hover:text-red-700">
                            {c}
                          </span>
                        ) : (
                          c
                        )}
                      </span>
                      {isPolo && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          Polo
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>27 Municípios atendidos pela Rede Apucarana</span>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="text-red-600 font-bold hover:underline cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
