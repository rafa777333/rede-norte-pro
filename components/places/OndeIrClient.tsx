"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PlaceItem, PlaceCategory } from "@/types/places";
import { isOpenNow } from "@/lib/mock-places";
import PromoHeroCarousel from "./PromoHeroCarousel";
import PlaceModal from "./PlaceModal";

interface OndeIrClientProps {
  initialPlaces: PlaceItem[];
}

const CATEGORIAS: Array<PlaceCategory | "Todas"> = [
  "Todas",
  "Pizzarias & Lanches",
  "Restaurantes & Almoço",
  "Bares & Vida Noturna",
  "Cafés & Docerias",
  "Hotéis & Lazer",
];

export default function OndeIrClient({ initialPlaces }: OndeIrClientProps) {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<PlaceCategory | "Todas">("Todas");
  const [cidadeFiltro, setCidadeFiltro] = useState<string>("Todas");
  const [apenasAbertos, setApenasAbertos] = useState(false);
  const [apenasComPromo, setApenasComPromo] = useState(false);
  const [localSelecionado, setLocalSelecionado] = useState<PlaceItem | null>(null);

  // Sugestão contextual conforme a hora do dia
  const sugestaoContextual = useMemo(() => {
    const hora = new Date().getHours();
    if (hora >= 11 && hora < 15) {
      return {
        icone: "🍽️",
        titulo: "Hora do Almoço no Vale do Ivaí",
        sub: "Restaurantes executivos, churrascarias e opções com prato feito em Apucarana e região.",
        categoriaRecomendada: "Restaurantes & Almoço" as PlaceCategory,
      };
    }
    if (hora >= 15 && hora < 18) {
      return {
        icone: "☕",
        titulo: "Tarde no Vale: Cafés & Docerias",
        sub: "Espaços charmosos para reuniões de trabalho, café especial e doces finos artesanais.",
        categoriaRecomendada: "Cafés & Docerias" as PlaceCategory,
      };
    }
    if (hora >= 18 || hora < 4) {
      return {
        icone: "🍻",
        titulo: "Noite & Delivery no Vale do Ivaí",
        sub: "Pizzas artesanais, hambúrgueres smash, bares com chopp e música ao vivo para hoje.",
        categoriaRecomendada: "Pizzarias & Lanches" as PlaceCategory,
      };
    }
    return {
      icone: "☀️",
      titulo: "Planeje suas Refeições e Lazer",
      sub: "Encontre os melhores estabelecimentos gastronômicos, hotéis e atrações da região.",
      categoriaRecomendada: "Todas",
    };
  }, []);

  // Lista única de cidades dos estabelecimentos
  const cidadesDisponiveis = useMemo(() => {
    const set = new Set(initialPlaces.map((p) => p.city));
    return ["Todas", ...Array.from(set)];
  }, [initialPlaces]);

  // Filtragem e ordenação inteligente (VIP primeiro)
  const lugaresFiltrados = useMemo(() => {
    return initialPlaces
      .filter((place) => {
        // Categoria
        if (categoriaAtiva !== "Todas" && place.category !== categoriaAtiva) {
          return false;
        }

        // Cidade
        if (cidadeFiltro !== "Todas" && place.city.toLowerCase() !== cidadeFiltro.toLowerCase()) {
          return false;
        }

        // Abertos Agora
        if (apenasAbertos) {
          const st = isOpenNow(place.openHours);
          if (!st.isOpen) return false;
        }

        // Com Promoção
        if (apenasComPromo && !place.activePromo) {
          return false;
        }

        // Busca por texto (nome, pratos do cardápio, bairro ou categoria)
        if (busca.trim()) {
          const termo = busca.toLowerCase();
          const matchNome = place.name.toLowerCase().includes(termo);
          const matchCat = place.category.toLowerCase().includes(termo);
          const matchCidade = place.city.toLowerCase().includes(termo);
          const matchBairro = place.neighborhood.toLowerCase().includes(termo);
          const matchMenu = place.menuHighlights.some(
            (m) => m.name.toLowerCase().includes(termo) || m.description.toLowerCase().includes(termo)
          );
          if (!matchNome && !matchCat && !matchCidade && !matchBairro && !matchMenu) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // VIPs no topo
        if (a.isVip && !b.isVip) return -1;
        if (!a.isVip && b.isVip) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
  }, [initialPlaces, categoriaAtiva, cidadeFiltro, apenasAbertos, apenasComPromo, busca]);

  return (
    <div className="w-full">
      {/* =========================================================================
          HERO EDITORIAL COM CONTEXTO HORÁRIO
         ========================================================================= */}
      <section className="bg-gradient-to-b from-slate-950 via-[#131b2e] to-slate-900 text-white py-12 sm:py-16 px-4 relative overflow-hidden border-b border-slate-800">
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          {/* Badge Contextual de Horário */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-950/80 border border-orange-800/60 text-orange-300 text-xs font-bold mb-4 shadow-inner">
            <span>{sugestaoContextual.icone}</span>
            <span>{sugestaoContextual.titulo}</span>
          </div>

          <h1 className="editorial-headline text-3xl sm:text-5xl text-white font-black tracking-tight max-w-3xl mx-auto">
            Onde Ir no Vale do Ivaí
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mt-3 leading-relaxed">
            A vitrine interativa com tours em vídeo (9:16), cardápios com pedido direto no WhatsApp e promoções exclusivas em Apucarana, Arapongas e região.
          </p>

          {/* Barra de Pesquisa Rápida */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Busque por pizza, churrascaria, chopp, hotel, bairro ou nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full px-5 py-3.5 pl-12 rounded-2xl bg-white/95 text-slate-900 text-sm placeholder-slate-400 font-medium outline-none shadow-2xl focus:ring-4 focus:ring-orange-500/30 transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                🍽️
              </span>
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FAIXA DE PROMOÇÕES & CUPONS ATIVOS DO DIA
         ========================================================================= */}
      <div className="container mx-auto max-w-6xl px-4 pt-10">
        <PromoHeroCarousel
          places={initialPlaces}
          onSelectPlace={(p) => setLocalSelecionado(p)}
        />
      </div>

      {/* =========================================================================
          BARRA DE FILTROS INTELIGENTES (CATEGORIA + HORÁRIO + PROMOÇÕES)
         ========================================================================= */}
      <section className="container mx-auto max-w-6xl px-4 mb-8">
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          {/* Categorias em Pílulas */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Filtrar por Experiência:
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaAtiva(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    categoriaAtiva === cat
                      ? "bg-orange-600 text-white shadow-md scale-[1.02]"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros Rápidos & Cidades */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro Abertos Agora */}
              <button
                type="button"
                onClick={() => setApenasAbertos(!apenasAbertos)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  apenasAbertos
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <span>🟢</span>
                <span>Abertos Agora</span>
              </button>

              {/* Filtro Com Promoção */}
              <button
                type="button"
                onClick={() => setApenasComPromo(!apenasComPromo)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  apenasComPromo
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <span>🔥</span>
                <span>Com Promoção / Cupom</span>
              </button>
            </div>

            {/* Seletor de Cidades */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                Cidade:
              </span>
              <select
                value={cidadeFiltro}
                onChange={(e) => setCidadeFiltro(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 border border-slate-200 text-slate-800 outline-none cursor-pointer"
              >
                {cidadesDisponiveis.map((c) => (
                  <option key={c} value={c}>
                    {c === "Todas" ? "Todas as Cidades" : c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          GRID DE ESTABELECIMENTOS (CARDS DE VITRINE)
         ========================================================================= */}
      <section className="container mx-auto max-w-6xl px-4 mb-16">
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight">
              Vitrine de Estabelecimentos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Exibindo {lugaresFiltrados.length} locais recomendados no Vale do Ivaí
            </p>
          </div>
        </div>

        {lugaresFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lugaresFiltrados.map((place) => {
              const status = isOpenNow(place.openHours);

              return (
                <article
                  key={place.id}
                  className={`bg-white rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between group ${
                    place.isVip
                      ? "border-amber-400/90 shadow-md hover:shadow-xl ring-1 ring-amber-400/50"
                      : "border-slate-200/90 shadow-sm hover:shadow-lg"
                  }`}
                >
                  {/* Foto de Capa com Badges */}
                  <div
                    className="aspect-[16/10] w-full bg-slate-900 overflow-hidden relative cursor-pointer"
                    onClick={() => setLocalSelecionado(place)}
                  >
                    <img
                      src={place.coverImage}
                      alt={place.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                    {/* Badge de Categoria */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white shadow-md">
                        {place.category}
                      </span>
                    </div>

                    {/* Destaque VIP / Verificado */}
                    {place.isVip && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                          <span>★</span>
                          <span>Parceiro VIP</span>
                        </span>
                      </div>
                    )}

                    {/* Status Aberto/Fechado + Cidade */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                      <div>
                        <span className="text-[11px] font-semibold text-orange-200 uppercase tracking-wider block">
                          📍 {place.city} · {place.neighborhood}
                        </span>
                        <h3 className="text-lg font-bold text-white leading-tight group-hover:text-orange-300 transition-colors line-clamp-1">
                          {place.name}
                        </h3>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          status.isOpen
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-800/90 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                    <div>
                      {place.tagline && (
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {place.tagline}
                        </p>
                      )}

                      {/* Faixa de Promoção Ativa no Card */}
                      {place.activePromo && (
                        <div className="mt-3 p-2.5 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-between text-xs">
                          <span className="font-bold text-orange-900 truncate pr-2">
                            ⚡ {place.activePromo.title}
                          </span>
                          <span className="font-mono font-bold text-[10px] bg-orange-200 text-orange-950 px-2 py-0.5 rounded shrink-0">
                            {place.activePromo.couponCode}
                          </span>
                        </div>
                      )}

                      {/* Destaque do Carro-Chefe */}
                      {place.menuHighlights[0] && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="truncate pr-2 font-medium">
                            🍴 {place.menuHighlights[0].name}
                          </span>
                          <span className="font-bold text-slate-900 shrink-0">
                            R$ {place.menuHighlights[0].price.toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-2 flex items-center gap-2">
                      {place.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setLocalSelecionado(place)}
                          className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                          title="Assistir Tour em Vídeo 9:16"
                        >
                          <span>▶️</span>
                          <span className="hidden sm:inline">Tour 9:16</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setLocalSelecionado(place)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold text-center transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span>Ver Cardápio & Fotos</span>
                        <span>➔</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <span className="text-4xl block">🔍</span>
            <h3 className="text-lg font-bold text-slate-800">
              Nenhum estabelecimento encontrado com esses filtros
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tente limpar a busca ou selecionar outra categoria e cidade.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setCategoriaAtiva("Todas");
                setCidadeFiltro("Todas");
                setApenasAbertos(false);
                setApenasComPromo(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </section>

      {/* =========================================================================
          BANNER DE CONVERSÃO COMERCIAL PARA DONOS DE ESTABELECIMENTOS
         ========================================================================= */}
      <section className="bg-gradient-to-r from-slate-950 via-[#161c2e] to-slate-950 text-white py-14 px-4 border-t border-slate-800">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/40 px-3.5 py-1 rounded-full">
            Para Donos de Restaurantes, Bares, Cafés e Hotéis
          </span>
          <h2 className="text-2xl sm:text-4xl font-black font-sans mt-4 mb-3 tracking-tight">
            Destaque seu Negócio na Vitrine Onde Ir da Rede Apucarana
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed mb-6">
            O pacote comercial exclusivo inclui: <strong>gravação de Vídeo Vertical 9:16</strong> de apresentação do local e pratos, cardápio interativo com <strong>pedido direto no seu WhatsApp</strong> e posicionamento prioritário na vitrine de promoções do maior portal do Vale do Ivaí.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/5543999999999?text=Ol%C3%A1!%20Tenho%20um%20estabelecimento%20e%20quero%20destacar%20meu%20neg%C3%B3cio%20no%20guia%20Onde%20Ir%20da%20Rede%20Apucarana."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Quero Destacar Meu Negócio</span>
              <span>➔</span>
            </a>

            <Link
              href="/anuncie"
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-colors"
            >
              Ver Tabela de Planos & Mídia Kit
            </Link>
          </div>
        </div>
      </section>

      {/* Modal Interativo de Detalhes (Mini-App) */}
      <PlaceModal
        place={localSelecionado}
        onClose={() => setLocalSelecionado(null)}
      />
    </div>
  );
}
