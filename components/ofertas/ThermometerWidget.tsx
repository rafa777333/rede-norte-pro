"use client";

import React from "react";
import { ThermometerItem } from "@/types/ofertas";

interface ThermometerWidgetProps {
  items: ThermometerItem[];
  onSelectItem?: (item: ThermometerItem) => void;
}

export default function ThermometerWidget({ items }: ThermometerWidgetProps) {
  const formatMoney = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <section
      className="w-full my-6 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-emerald-500/30 overflow-hidden relative"
      aria-label="Termômetro de Preços da Semana"
    >
      {/* Detalhes luminosos no fundo */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Topo do Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-emerald-500/20">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-7 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                Utilidade Pública & Economia Regional
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ATUALIZADO HOJE
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
              <span>📊 Termômetro do Vale: 5 Itens Essenciais</span>
            </h3>
          </div>
        </div>

        <div className="text-xs text-slate-300 font-medium">
          Pesquisa de preços na gôndola em Apucarana e região
        </div>
      </div>

      {/* Grid dos 5 Itens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {items.slice(0, 5).map((item) => {
          const economia = Math.max(item.avgPrice - item.lowestPrice, 0);
          const percentual = item.avgPrice > 0 ? Math.round((economia / item.avgPrice) * 100) : 0;
          const cleanZap = (item.partnerWhatsapp || "").replace(/\D/g, "");

          const msgZap = encodeURIComponent(
            `Olá! Vi no Termômetro de Preços da *Rede Apucarana* que o *${item.itemName}* está por *${formatMoney(
              item.lowestPrice
            )}* hoje e gostaria de aproveitar!`
          );

          const zapUrl = cleanZap
            ? `https://wa.me/55${cleanZap}?text=${msgZap}`
            : "#";

          return (
            <div
              key={item.id}
              className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-700/80 hover:border-emerald-400/70 transition-all flex flex-col justify-between shadow-sm group hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    {item.category}
                  </span>
                  {percentual > 0 && (
                    <span className="text-[10px] font-black text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded">
                      -{percentual}%
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-white line-clamp-2 leading-snug">
                  {item.itemName}
                </h4>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Unidade: {item.unit}
                </span>

                {/* Comparativo de Preço */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Preço Médio:</span>
                    <span className="line-through">{formatMoney(item.avgPrice)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">
                      Menor Hoje:
                    </span>
                    <span className="text-base font-black text-emerald-300">
                      {formatMoney(item.lowestPrice)}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-300 font-semibold truncate pt-1 flex items-center gap-1">
                    <span>📍</span>
                    <span className="truncate">{item.partnerName}</span>
                  </div>
                </div>
              </div>

              {/* Botão de Rastreio WhatsApp */}
              <div className="mt-3 pt-2 border-t border-slate-800">
                <a
                  href={zapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <span>Garantir no Zap</span>
                  <span>📲</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
