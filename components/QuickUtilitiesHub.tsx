"use client";

import React from "react";

interface QuickUtilitiesHubProps {
  cidadeAtual?: string;
  onSelectAba: (aba: string) => void;
  vagasCount?: number;
  classifCount?: number;
  locaisCount?: number;
  onOpenHoroscopo?: () => void;
}

export default function QuickUtilitiesHub({
  cidadeAtual = "Geral",
  onSelectAba,
  vagasCount = 0,
  classifCount = 0,
  locaisCount = 0,
  onOpenHoroscopo,
}: QuickUtilitiesHubProps) {
  const tools = [
    {
      id: "empregos",
      titulo: "Vagas de Emprego",
      descricao: `Oportunidades em ${cidadeAtual !== "Geral" ? cidadeAtual : "Apucarana e região"}`,
      icone: "💼",
      corBadge: "bg-amber-100 text-amber-800 border-amber-200",
      badgeText: vagasCount > 0 ? `${vagasCount} disponíveis` : "Ver vagas",
      tag: "Trabalho",
      action: () => onSelectAba("empregos"),
    },
    {
      id: "compras",
      titulo: "Classificados & Negócios",
      descricao: "Carros, imóveis, serviços e produtos da região",
      icone: "🏷️",
      corBadge: "bg-blue-100 text-blue-800 border-blue-200",
      badgeText: classifCount > 0 ? `${classifCount} anúncios` : "Anunciar grátis",
      tag: "Mercado",
      action: () => onSelectAba("compras"),
    },
    {
      id: "ondeir",
      titulo: "Onde Ir & Guia Regional",
      descricao: "Lojas, restaurantes, serviços e empresas verificadas",
      icone: "📍",
      corBadge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      badgeText: locaisCount > 0 ? `${locaisCount} cadastros` : "Explorar",
      tag: "Guia Local",
      action: () => onSelectAba("ondeir"),
    },
    {
      id: "horoscopo",
      titulo: "Horóscopo & Previsões",
      descricao: "Amor, trabalho e conselho diário dos 12 signos",
      icone: "✨",
      corBadge: "bg-purple-100 text-purple-800 border-purple-200",
      badgeText: "Signos de Hoje",
      tag: "Astrologia",
      action: () => {
        if (onOpenHoroscopo) {
          onOpenHoroscopo();
        } else {
          window.location.href = "/horoscopo";
        }
      },
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <div>
            <h3 className="font-heading font-extrabold text-slate-900 text-base leading-tight">
              Central de Utilidades
            </h3>
            <span className="text-xs text-slate-500">
              Ferramentas e serviços do Vale do Ivaí
            </span>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
          Interativo
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        {tools.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.action}
            className="group flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-blue-200 hover:shadow-sm text-left transition-all duration-200 cursor-pointer w-full"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-lg shadow-2xs group-hover:scale-105 group-hover:border-blue-300 transition-transform">
              {item.icone}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-heading font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors truncate">
                  {item.titulo}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${item.corBadge}`}
                >
                  {item.badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1 leading-snug">
                {item.descricao}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
