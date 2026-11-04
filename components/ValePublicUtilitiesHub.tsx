"use client";

import React from "react";
import Link from "next/link";
import HoroscopeCompactBar from "./HoroscopeCompactBar";
import { SignoPrevisao } from "@/lib/horoscope";

interface ValePublicUtilitiesHubProps {
  cidade?: string;
  initialCity?: string;
  signos?: SignoPrevisao[];
  onSelectSigno?: (s: SignoPrevisao) => void;
  vagasCount?: number;
  classifCount?: number;
  jobs?: any[];
  classifieds?: any[];
}

export default function ValePublicUtilitiesHub({
  cidade,
  initialCity,
  signos,
  onSelectSigno,
  vagasCount,
  classifCount,
  jobs,
  classifieds,
}: ValePublicUtilitiesHubProps) {
  const activeCity = cidade || initialCity || "Geral";
  const isCity = activeCity && activeCity !== "Geral" && activeCity !== "Todas";
  const finalVagasCount = jobs ? jobs.length : (vagasCount ?? 5);
  const finalClassifCount = classifieds ? classifieds.length : (classifCount ?? 8);

  return (
    <section
      className="w-full my-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm"
      aria-label="Hub de Serviços e Utilidade Pública do Vale do Ivaí"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-black uppercase text-red-600 tracking-wider">
            Super-App Regional · Vale do Ivaí
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
            Serviços & Utilidade Pública {isCity ? `em ${activeCity}` : "Regional"}
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Acesso rápido aos serviços essenciais para o cidadão
        </span>
      </div>

      {/* Grade de Cards 4 Colunas (Estilo Super-App) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Card 1: Empregos */}
        <Link
          href="/empregos"
          className="group p-3.5 rounded-xl bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 shadow-sm transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[110px]"
        >
          <div className="flex items-start justify-between">
            <span className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 text-lg flex items-center justify-center font-bold">
              💼
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Vagas Ativas
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              Empregos & Vagas
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
              Agência do Trabalhador e empresas
            </p>
          </div>
        </Link>

        {/* Card 2: Troca e Venda */}
        <Link
          href="/classificados"
          className="group p-3.5 rounded-xl bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 shadow-sm transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[110px]"
        >
          <div className="flex items-start justify-between">
            <span className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 text-lg flex items-center justify-center font-bold">
              🛒
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Classificados
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
              Troca & Negócios
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
              Imóveis, autos e produtos
            </p>
          </div>
        </Link>

        {/* Card 3: Onde Ir */}
        <Link
          href="/onde-ir"
          className="group p-3.5 rounded-xl bg-white hover:bg-orange-50/60 border border-slate-200 hover:border-orange-300 shadow-sm transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[110px]"
        >
          <div className="flex items-start justify-between">
            <span className="w-9 h-9 rounded-lg bg-orange-100 text-orange-800 text-lg flex items-center justify-center font-bold">
              🍔
            </span>
            <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
              Gastronomia & Lazer
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-700 transition-colors">
              Onde Ir & Guia
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
              Restaurantes, comércio e eventos
            </p>
          </div>
        </Link>

        {/* Card 4: Utilidade Pública */}
        <Link
          href="/utilidades"
          className="group p-3.5 rounded-xl bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 shadow-sm transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[110px]"
        >
          <div className="flex items-start justify-between">
            <span className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 text-lg flex items-center justify-center font-bold">
              🏥
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Plantão 24h
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
              Utilidade Pública
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
              Farmácias, falecimentos e telefones
            </p>
          </div>
        </Link>
      </div>

      {/* 5. Linha Integrada do Horóscopo do Dia (Compacto) */}
      <HoroscopeCompactBar signos={signos} onSelectSigno={onSelectSigno} />
    </section>
  );
}
