"use client";

import React, { useState, useMemo, useEffect } from "react";
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
}

export default function CitiesScrollTicker({
  currentCity = "Geral",
  onSelectCity,
}: CitiesScrollTickerProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [busca, setBusca] = useState("");

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

  // Cidades filtradas pela busca
  const cidadesFiltradas = useMemo(() => {
    if (!busca.trim()) return TODAS_AS_CIDADES;
    const termo = busca.toLowerCase().trim();
    return TODAS_AS_CIDADES.filter((c) => c.toLowerCase().includes(termo));
  }, [busca]);

  const handleCitySelect = (c: string) => {
    setModalAberto(false);
    setBusca("");
    if (onSelectCity) {
      onSelectCity(c);
    }
  };

  const isCidadeAtiva = currentCity && currentCity !== "Geral";

  return (
    <>
      {/* Botão Interativo do Seletor de Cidades (Inline, Elegante e Leve) */}
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

      {/* Modal / Aba Completa das 27 Cidades do Vale do Ivaí */}
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
                  Selecione para abrir o portal de notícias exclusivo do seu município.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-base font-bold transition-colors shrink-0 ml-2"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Campo de Busca Rápida */}
            <div className="mt-3.5 mb-2 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Digite o nome da cidade para filtrar..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 px-1"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Lista com as 27 Cidades em Grid Responsivo */}
            <div className="overflow-y-auto pr-1 py-2 flex-1">
              {/* Botão Capa Geral em Destaque */}
              <div className="mb-3">
                <Link
                  href="/"
                  onClick={() => handleCitySelect("Geral")}
                  className={`w-full p-3 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-between ${
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

              {/* Grid das Cidades */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cidadesFiltradas.map((c) => {
                  const active = currentCity === c;
                  const isPolo = POLOS.includes(c);
                  const slug = cidadeSlug(c);

                  return (
                    <Link
                      key={c}
                      href={`/cidades/${slug}`}
                      onClick={() => handleCitySelect(c)}
                      className={`p-2.5 rounded-xl text-xs font-medium border transition-all flex items-center justify-between text-left group ${
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

              {cidadesFiltradas.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Nenhuma cidade encontrada com "<strong>{busca}</strong>".
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>27 Municípios atendidos pela Rede Apucarana</span>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="text-red-600 font-bold hover:underline"
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
