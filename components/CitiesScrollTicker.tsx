"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cidadeSlug } from "@/lib/supabase";

const CIDADES_PRIORITARIAS = [
  "Geral",
  "Apucarana",
  "Arapongas",
  "Ivaiporã",
  "Jandaia do Sul",
];

const DEMAIS_CIDADES = [
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

const TODAS_AS_CIDADES = [
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

interface CitiesScrollTickerProps {
  currentCity?: string;
  onSelectCity?: (city: string) => void;
}

export default function CitiesScrollTicker({
  currentCity = "Geral",
  onSelectCity,
}: CitiesScrollTickerProps) {
  const [modalAberto, setModalAberto] = useState(false);

  const handleClickCity = (e: React.MouseEvent, c: string) => {
    if (onSelectCity) {
      e.preventDefault();
      onSelectCity(c);
      setModalAberto(false);
    }
  };

  return (
    <>
      <nav
        className="w-full bg-[#0d1522] border-y border-slate-800/80 shadow-inner py-1.5 px-3 z-30"
        aria-label="Cidades do Vale do Ivaí"
      >
        <div className="container mx-auto flex items-center gap-2">
          {/* Tag Local */}
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold text-red-400 uppercase tracking-wider shrink-0 px-2 py-1 rounded bg-red-950/60 border border-red-900/40">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Vale do Ivaí
          </span>

          {/* Fita de Cidades com Scroll Horizontal Suave */}
          <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-1.5 py-0.5">
            {/* Prioritárias */}
            {CIDADES_PRIORITARIAS.map((c) => {
              const active = currentCity === c;
              const href = c === "Geral" ? "/" : `/cidades/${cidadeSlug(c)}`;

              return (
                <Link
                  key={c}
                  href={href}
                  onClick={(e) => handleClickCity(e, c)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
                    active
                      ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-sm font-bold scale-[1.02]"
                      : "bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700/50"
                  }`}
                >
                  {c}
                </Link>
              );
            })}

            <span className="text-slate-700 font-light px-0.5">|</span>

            {/* Demais cidades em linha */}
            {DEMAIS_CIDADES.map((c) => {
              const active = currentCity === c;
              const href = `/cidades/${cidadeSlug(c)}`;

              return (
                <Link
                  key={c}
                  href={href}
                  onClick={(e) => handleClickCity(e, c)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-xs transition-colors ${
                    active
                      ? "bg-red-600 text-white font-bold"
                      : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                  }`}
                >
                  {c}
                </Link>
              );
            })}
          </div>

          {/* Botão Dropdown / Modal com todas as 27 cidades */}
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all"
            title="Ver todas as 27 cidades do Vale do Ivaí"
          >
            <span>27 Cidades</span>
            <span className="text-[10px]">▾</span>
          </button>
        </div>
      </nav>

      {/* Modal / Sheet Elegante de Todas as Cidades */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setModalAberto(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-red-600 tracking-wider uppercase">
                  Região Norte & Vale do Ivaí
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-sans">
                  Todas as 27 Cidades Cobertas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Link
                  href="/"
                  onClick={(e) => handleClickCity(e, "Geral")}
                  className={`p-2.5 rounded-lg text-xs font-bold border transition-all text-center ${
                    currentCity === "Geral"
                      ? "bg-red-600 text-white border-red-600 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                  }`}
                >
                  🌐 Capa Geral
                </Link>

                {TODAS_AS_CIDADES.map((c) => {
                  const active = currentCity === c;
                  return (
                    <Link
                      key={c}
                      href={`/cidades/${cidadeSlug(c)}`}
                      onClick={(e) => handleClickCity(e, c)}
                      className={`p-2.5 rounded-lg text-xs font-medium border transition-all text-center truncate ${
                        active
                          ? "bg-red-600 text-white font-bold border-red-600 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200"
                      }`}
                      title={c}
                    >
                      {c}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Selecione sua cidade para ver matérias locais.</span>
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
