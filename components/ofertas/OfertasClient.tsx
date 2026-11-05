"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  RetailerItem,
  RetailerCategory,
  ThemeDay,
  ThermometerItem,
  PromoProduct,
  ShoppingListItem,
} from "@/types/ofertas";
import { getCurrentThemeDay } from "@/lib/ofertas-service";
import ThermometerWidget from "./ThermometerWidget";
import StoriesAvatarBar from "./StoriesAvatarBar";
import StoriesViewerModal from "./StoriesViewerModal";
import QuickShoppingListDrawer from "./QuickShoppingListDrawer";

interface OfertasClientProps {
  initialThermometer: ThermometerItem[];
  initialRetailers: RetailerItem[];
}

const CATEGORIAS: Array<RetailerCategory | "Todas"> = [
  "Todas",
  "Supermercados",
  "Açougues & Carnes",
  "Farmácias & Saúde",
  "Hortifrúti & Feira",
  "Gás & Bebidas",
];

const THEME_DAYS: Array<ThemeDay | "Todos"> = [
  "Todos",
  "Terça & Quarta Verde",
  "Quinta & Sexta da Carne",
  "Saldão de Fim de Semana",
  "Plantão Farmácia",
];

export default function OfertasClient({
  initialThermometer,
  initialRetailers,
}: OfertasClientProps) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<RetailerCategory | "Todas">("Todas");
  const [diaTemaAtivo, setDiaTemaAtivo] = useState<ThemeDay | "Todos">("Todos");
  const [cidadeFiltro, setCidadeFiltro] = useState("Todas");
  const [busca, setBusca] = useState("");

  // Stories Modal
  const [retailerStoriesAberto, setRetailerStoriesAberto] = useState<RetailerItem | null>(null);

  // Lista de compras no celular
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);

  // Calendário Inteligente do Dia
  const smartDay = useMemo(() => getCurrentThemeDay(), []);

  // Cidades disponíveis
  const cidades = useMemo(() => {
    const list = Array.from(new Set(initialRetailers.map((r) => r.city)));
    return ["Todas", ...list];
  }, [initialRetailers]);

  // Adicionar produto à lista de compras
  const handleAddToList = (product: PromoProduct, retailer: RetailerItem) => {
    setShoppingList((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product,
          retailerName: retailer.name,
          retailerWhatsapp: retailer.whatsapp,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setShoppingList((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setShoppingList((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearList = () => {
    setShoppingList([]);
  };

  // Produtos Âncora filtrados
  const produtosFiltrados = useMemo(() => {
    const todosProdutos: Array<{ product: PromoProduct; retailer: RetailerItem }> = [];
    initialRetailers.forEach((r) => {
      (r.storiesItems || []).forEach((p) => {
        todosProdutos.push({ product: p, retailer: r });
      });
    });

    return todosProdutos.filter(({ product, retailer }) => {
      // Categoria
      if (categoriaAtiva !== "Todas" && retailer.category !== categoriaAtiva) {
        return false;
      }
      // Dia Temático
      if (diaTemaAtivo !== "Todos" && retailer.themeDay !== diaTemaAtivo) {
        return false;
      }
      // Cidade
      if (cidadeFiltro !== "Todas" && retailer.city.toLowerCase() !== cidadeFiltro.toLowerCase()) {
        return false;
      }
      // Busca
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchProd = product.productName.toLowerCase().includes(termo);
        const matchRet = retailer.name.toLowerCase().includes(termo);
        const matchCat = (product.categoryTag || "").toLowerCase().includes(termo);
        if (!matchProd && !matchRet && !matchCat) return false;
      }
      return true;
    });
  }, [initialRetailers, categoriaAtiva, diaTemaAtivo, cidadeFiltro, busca]);

  const formatMoney = (val?: number) =>
    (val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="w-full min-h-screen bg-slate-100/60 pb-20">
      {/* ========================================================================= */}
      {/* HERO EDITORIAL DE ECONOMIA & SMART DAY BANNER */}
      {/* ========================================================================= */}
      <section className="w-full bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white py-10 sm:py-14 border-b border-emerald-700/40 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3">
              <span>{smartDay.icon}</span>
              <span>Central de Economia & Varejo Regional</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-sans tracking-tight text-white leading-tight">
              Ofertas, Encartes e Preços do Dia no Vale
            </h1>

            <p className="mt-3 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Pesquise o menor preço da cesta básica em Apucarana, folheie encartes em formato Stories de supermercados, açougues e farmácias, e peça no WhatsApp.
            </p>
          </div>

          {/* Banner do Dia Atual (Smart Day) */}
          <div className="mt-6 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">{smartDay.icon}</span>
                <span className="font-black text-sm text-amber-300 uppercase tracking-wider">
                  Destaque de Hoje: {smartDay.title}
                </span>
              </div>
              <p className="text-xs text-white/90 mt-0.5">{smartDay.subtitle}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDiaTemaAtivo(smartDay.themeDay);
                document.getElementById("vitrine-ofertas")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shrink-0"
            >
              Filtrar ofertas de hoje →
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CORPO DA PÁGINA */}
      {/* ========================================================================= */}
      <main className="container mx-auto px-4 -mt-4">
        {/* 1. WIDGET: TERMÔMETRO DA CESTA BÁSICA */}
        <ThermometerWidget items={initialThermometer} />

        {/* 2. ENCARTES EM STORIES (AVATAR BAR) */}
        <StoriesAvatarBar
          retailers={initialRetailers}
          onSelectRetailer={(r) => setRetailerStoriesAberto(r)}
        />

        {/* 3. BARRA DE BUSCA E FILTROS */}
        <section id="vitrine-ofertas" className="my-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="w-full md:w-96">
                <input
                  type="text"
                  placeholder="Buscar produto (ex: arroz, contrafilé, fralda, gás)..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Seletor de Cidade */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-500">Cidade:</span>
                <select
                  value={cidadeFiltro}
                  onChange={(e) => setCidadeFiltro(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none"
                >
                  {cidades.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Abas de Dias Temáticos */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">
                Dias Temáticos:
              </span>
              {THEME_DAYS.map((dia) => (
                <button
                  key={dia}
                  type="button"
                  onClick={() => setDiaTemaAtivo(dia)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    diaTemaAtivo === dia
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {dia}
                </button>
              ))}
            </div>

            {/* Pills de Categorias do Varejo */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaAtiva(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    categoriaAtiva === cat
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 4. GRID DE PRODUTOS ÂNCORA ("MAIS BARATOS DE HOJE NO VALE") */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                Vitrine de Ofertas Ativas
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans tracking-tight">
                🔥 Mais Baratos de Hoje no Vale ({produtosFiltrados.length})
              </h2>
            </div>
          </div>

          {produtosFiltrados.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
              <span className="text-3xl">🛒</span>
              <p className="text-base font-bold text-slate-800 mt-2">Nenhuma oferta encontrada</p>
              <p className="text-xs text-slate-500 mt-1">
                Tente ajustar os filtros de categoria, dia temático ou termo de busca.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {produtosFiltrados.map(({ product, retailer }) => {
                const cleanZap = (retailer.whatsapp || "").replace(/\D/g, "");
                const msgZap = encodeURIComponent(
                  `Olá! Vi no portal *Rede Apucarana* a oferta de *${product.productName}* por *${formatMoney(
                    product.promoPrice
                  )}* no *${retailer.name}* e gostaria de pedir/reservar.`
                );
                const zapUrl = cleanZap ? `https://wa.me/55${cleanZap}?text=${msgZap}` : "#";

                return (
                  <div
                    key={`${retailer.id}-${product.id}`}
                    className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Foto com Badge de Desconto */}
                      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                        <img
                          src={product.productImage}
                          alt={product.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />

                        {product.discountPercent && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md font-black text-[10px] bg-red-600 text-white uppercase tracking-wider shadow">
                            -{product.discountPercent}% OFF
                          </span>
                        )}

                        {product.isAnchor && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-slate-950 uppercase shadow">
                            ÂNCORA
                          </span>
                        )}

                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                          <span className="font-bold truncate">{retailer.name}</span>
                          <span className="text-amber-300 font-bold ml-1 shrink-0">
                            {retailer.city}
                          </span>
                        </div>
                      </div>

                      {/* Informações */}
                      <div className="p-3 sm:p-3.5 space-y-1">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                          {product.productName}
                        </h3>

                        <div className="pt-1.5 flex items-baseline gap-2">
                          {product.oldPrice && (
                            <span className="text-[11px] text-slate-400 line-through">
                              {formatMoney(product.oldPrice)}
                            </span>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="text-base sm:text-lg font-black text-emerald-700">
                              {formatMoney(product.promoPrice)}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              / {product.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ações: Pedir no Zap + Adicionar à Lista */}
                    <div className="p-3 pt-0 space-y-2">
                      <div className="flex gap-1.5">
                        <a
                          href={zapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-sm"
                        >
                          <span>Pedir</span>
                          <span>📲</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleAddToList(product, retailer)}
                          className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center transition border border-slate-200"
                          title="Adicionar à lista de compras"
                        >
                          <span>+ Lista</span>
                          <span>🛒</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setRetailerStoriesAberto(retailer)}
                        className="w-full text-center text-[10px] text-emerald-700 hover:underline font-bold"
                      >
                        Ver encarte completo deste mercado →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 5. CHAMADA COMERCIAL PARA SUPERMERCADOS, AÇOUGUES E FARMÁCIAS */}
        <section className="my-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white border border-emerald-600/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/30">
              Varejo Digital 2026 · Rede Apucarana
            </span>
            <h3 className="text-2xl sm:text-3xl font-black font-sans tracking-tight">
              Substitua o panfleto de papel pelo Encarte Digital no WhatsApp
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Divulgue suas ofertas em formato Stories, apareça no Termômetro de Preços da Semana e receba pedidos de delivery diretamente no seu WhatsApp com rastreio de conversão.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/anuncie"
              className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm text-center shadow-lg transition"
            >
              Quero anunciar meu encarte
            </Link>
          </div>
        </section>
      </main>

      {/* MODAL DE STORIES EM TELA CHEIA */}
      <StoriesViewerModal
        retailer={retailerStoriesAberto}
        onClose={() => setRetailerStoriesAberto(null)}
        onAddToList={handleAddToList}
      />

      {/* DRAWER FLUTUANTE DA LISTA DE COMPRAS */}
      <QuickShoppingListDrawer
        items={shoppingList}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearList={handleClearList}
      />
    </div>
  );
}
