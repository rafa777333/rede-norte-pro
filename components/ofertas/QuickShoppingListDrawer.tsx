"use client";

import React, { useState } from "react";
import { ShoppingListItem } from "@/types/ofertas";

interface QuickShoppingListDrawerProps {
  items: ShoppingListItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearList: () => void;
}

export default function QuickShoppingListDrawer({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearList,
}: QuickShoppingListDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = items.reduce(
    (acc, i) => acc + i.product.promoPrice * i.quantity,
    0
  );

  const formatMoney = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (items.length === 0) return null;

  // Monta mensagem formatada para compartilhar no WhatsApp
  const gerarMensagemZap = () => {
    let msg = `🛒 *MINHA LISTA DE COMPRAS & ECONOMIA*\n_Portal Rede Apucarana - Central de Ofertas_\n\n`;
    items.forEach((it, idx) => {
      msg += `${idx + 1}. *${it.product.productName}*\n`;
      msg += `   Qtd: ${it.quantity}x (${it.product.unit}) | Preço: ${formatMoney(
        it.product.promoPrice
      )}\n`;
      msg += `   Onde: _${it.retailerName}_\n\n`;
    });
    msg += `💵 *TOTAL ESTIMADO: ${formatMoney(totalPrice)}*\n`;
    msg += `🔗 Confira as ofertas completas em: https://www.redeapucarana.com.br/ofertas`;
    return encodeURIComponent(msg);
  };

  return (
    <>
      {/* Botão Flutuante no Canto Inferior Direito */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl border-2 border-white flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95"
      >
        <span className="text-xl">🛒</span>
        <div className="text-left hidden sm:block">
          <div className="text-[10px] font-black uppercase text-emerald-200 leading-none">
            Minha Lista de Compras
          </div>
          <div className="text-xs font-bold leading-tight mt-0.5">
            {totalItems} {totalItems === 1 ? "item" : "itens"} · {formatMoney(totalPrice)}
          </div>
        </div>
        <span className="sm:hidden px-2 py-0.5 rounded-full bg-white text-emerald-700 font-black text-xs">
          {totalItems}
        </span>
      </button>

      {/* Drawer / Modal Lateral */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Topo do Drawer */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Planejamento de Economia
                </span>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>🛒 Lista de Compras</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {totalItems}
                  </span>
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Lista dos Itens Selecionados */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {items.map((it) => (
                <div
                  key={it.product.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                >
                  <img
                    src={it.product.productImage}
                    alt={it.product.productName}
                    className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">
                      {it.product.productName}
                    </h4>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {it.retailerName} · {formatMoney(it.product.promoPrice)} / {it.product.unit}
                    </span>

                    {/* Controles de Quantidade */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuantity(it.product.id, Math.max(it.quantity - 1, 1))
                        }
                        className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-slate-800">
                        {it.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(it.product.id, it.quantity + 1)}
                        className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-xs text-emerald-700 block">
                      {formatMoney(it.product.promoPrice * it.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(it.product.id)}
                      className="text-[11px] text-red-500 hover:underline font-semibold mt-1"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé com Total e Disparo WhatsApp */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-semibold">Total Estimado:</span>
                <span className="text-xl font-black text-emerald-700">
                  {formatMoney(totalPrice)}
                </span>
              </div>

              <div className="space-y-2">
                <a
                  href={`https://wa.me/?text=${gerarMensagemZap()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <span>📲 Enviar Lista para o meu WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={onClearList}
                  className="w-full py-2 px-3 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Limpar lista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
