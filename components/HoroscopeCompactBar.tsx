"use client";

import React from "react";
import Link from "next/link";
import { SignoPrevisao, SIGNOS_INFO } from "@/lib/horoscope";

interface HoroscopeCompactBarProps {
  signos?: SignoPrevisao[];
  onSelectSigno?: (signo: SignoPrevisao) => void;
}

export default function HoroscopeCompactBar({
  signos,
  onSelectSigno,
}: HoroscopeCompactBarProps) {
  const listaSignos = signos && signos.length > 0 ? signos : (SIGNOS_INFO as unknown as SignoPrevisao[]);

  return (
    <div className="w-full bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-900/40 rounded-xl p-3 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-purple-800/30">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <div>
            <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider font-sans">
              Horóscopo do Dia · Vale do Ivaí
            </h4>
            <p className="text-[11px] text-purple-300/70 hidden sm:block">
              Toque no seu signo para ver as previsões diárias de amor, trabalho e números da sorte
            </p>
          </div>
        </div>

        <Link
          href="/horoscopo"
          className="text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors inline-flex items-center gap-1 shrink-0"
        >
          <span>Página Completa</span>
          <span>→</span>
        </Link>
      </div>

      {/* Carrossel / Barra de Pílulas dos 12 Signos */}
      <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 py-0.5">
        {listaSignos.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => onSelectSigno && onSelectSigno(s)}
            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/40 text-purple-100 hover:text-white flex items-center gap-1.5 text-xs font-medium transition-all hover:scale-105 active:scale-95"
            title={`Ver previsão de hoje para ${s.nome}`}
          >
            <span className="text-sm">{s.simbolo}</span>
            <span>{s.nome}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
