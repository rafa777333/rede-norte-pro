"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  getPlacesAnalytics,
  resetPlacesAnalytics,
  PlaceAnalyticsData,
} from "@/lib/places-analytics";
import { fetchOndeIrPlaces } from "@/lib/places-service";
import { PlaceItem } from "@/types/places";

export default function AdminPlacesAnalytics() {
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, PlaceAnalyticsData>>({});
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [cidadeFiltro, setCidadeFiltro] = useState("Todas");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modoPrint, setModoPrint] = useState(false);

  // Carrega os dados de locais e de analytics
  const carregarDados = async () => {
    setLoading(true);
    try {
      const [placesList, analyticsList] = await Promise.all([
        fetchOndeIrPlaces({ allStatus: true }),
        getPlacesAnalytics(),
      ]);

      setPlaces(placesList);

      const map: Record<string, PlaceAnalyticsData> = {};
      analyticsList.forEach((item) => {
        map[item.place_id] = item;
      });
      setAnalytics(map);
    } catch (err) {
      console.error("[AdminAnalytics] Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Lista única de cidades
  const cidades = useMemo(() => {
    const set = new Set(places.map((p) => p.city));
    return ["Todas", ...Array.from(set)];
  }, [places]);

  // Combina lista de locais com suas respectivas métricas
  const relatorio = useMemo(() => {
    return places
      .map((place) => {
        const stats = analytics[place.id] ||
          analytics[place.slug] || {
            place_id: place.id,
            views_count: 0,
            clicks_count: 0,
            updated_at: new Date().toISOString(),
          };

        const views = stats.views_count || 0;
        const clicks = stats.clicks_count || 0;
        const taxaConversao = views > 0 ? (clicks / views) * 100 : 0;

        return {
          place,
          views,
          clicks,
          taxaConversao: Number(taxaConversao.toFixed(1)),
          updatedAt: stats.updated_at,
        };
      })
      .filter((item) => {
        if (cidadeFiltro !== "Todas" && item.place.city !== cidadeFiltro) {
          return false;
        }
        if (busca.trim()) {
          const q = busca.toLowerCase();
          const matchNome = item.place.name.toLowerCase().includes(q);
          const matchCidade = item.place.city.toLowerCase().includes(q);
          const matchCupom = item.place.activePromo?.couponCode?.toLowerCase().includes(q);
          return matchNome || matchCidade || matchCupom;
        }
        return true;
      })
      .sort((a, b) => b.clicks - a.clicks || b.views - a.views);
  }, [places, analytics, cidadeFiltro, busca]);

  // Estatísticas Totais Agregadas
  const totais = useMemo(() => {
    const totalViews = relatorio.reduce((acc, curr) => acc + curr.views, 0);
    const totalClicks = relatorio.reduce((acc, curr) => acc + curr.clicks, 0);
    const taxaMedia = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    return {
      totalViews,
      totalClicks,
      taxaMedia: Number(taxaMedia.toFixed(1)),
      totalParceiros: relatorio.length,
    };
  }, [relatorio]);

  // Zera métricas de um estabelecimento individual
  const handleZerarLocal = async (place: PlaceItem) => {
    const conf = window.confirm(
      `Deseja realmente zerar o contador de visualizações e cupons de "${place.name}" para iniciar um novo mês comercial?`
    );
    if (!conf) return;

    setActionLoading(place.id);
    const ok = await resetPlacesAnalytics(place.id);
    if (ok) {
      setAnalytics((prev) => ({
        ...prev,
        [place.id]: {
          place_id: place.id,
          views_count: 0,
          clicks_count: 0,
          updated_at: new Date().toISOString(),
        },
      }));
      setFeedback(`Contador de "${place.name}" zerado para o novo mês!`);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      alert("Falha ao zerar contador. Tente novamente.");
    }
    setActionLoading(null);
  };

  // Zera métricas de todos os estabelecimentos (Fechamento do Mês)
  const handleZerarTodos = async () => {
    const conf = window.confirm(
      "⚠️ ATENÇÃO: Deseja realmente zerar as estatísticas de TODOS os estabelecimentos cadastrados? Essa ação inicia o novo mês de relatórios comerciais."
    );
    if (!conf) return;

    setActionLoading("all");
    const ok = await resetPlacesAnalytics("all");
    if (ok) {
      await carregarDados();
      setFeedback("Todos os contadores foram zerados para o novo mês comercial!");
      setTimeout(() => setFeedback(null), 4000);
    } else {
      alert("Falha ao zerar contadores. Tente novamente.");
    }
    setActionLoading(null);
  };

  // Copia mensagem pronta para o WhatsApp do parceiro
  const handleCopiarMensagemParceiro = (item: (typeof relatorio)[0]) => {
    const msg = `Olá, ${item.place.name}! 🚀\n\nConfira o relatório oficial de engajamento do seu estabelecimento no Super App da *Rede Apucarana* este mês:\n\n👀 *Visualizações Totais no App:* ${item.views.toLocaleString("pt-BR")}\n🎯 *Cupons de Desconto Gerados no Caixa:* ${item.clicks.toLocaleString("pt-BR")}\n📈 *Taxa de Conversão de Clientes:* ${item.taxaConversao}%\n\nSeu anúncio está trazendo clientes reais direto para o balcão. Conte sempre com a Rede Apucarana!`;

    navigator.clipboard.writeText(msg).then(() => {
      setFeedback(`Mensagem de Prova de Valor copiada para "${item.place.name}"! Pode colar no WhatsApp.`);
      setTimeout(() => setFeedback(null), 4000);
    });
  };

  return (
    <div className={`space-y-6 ${modoPrint ? "bg-white p-6 rounded-2xl shadow-xl" : ""}`}>
      {/* ===================================================================== */}
      {/* TOPO: TÍTULO, SUBTÍTULO E CONTROLES DE AÇÃO                           */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xl font-bold">
              📊
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                Relatório de Parceiros (Vendas & Prova de Valor)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Rastreamento silencioso de visualizações e cupons resgatados no caixa para comprovar retorno comercial aos clientes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModoPrint(!modoPrint)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              modoPrint
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
            title="Oculta controles desnecessários para tirar print ou mostrar ao cliente"
          >
            <span>{modoPrint ? "🔙 Modo Normal" : "📸 Modo Apresentação / Print"}</span>
          </button>

          <button
            type="button"
            onClick={carregarDados}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <span>🔄</span>
            <span>Atualizar</span>
          </button>

          {!modoPrint && (
            <button
              type="button"
              onClick={handleZerarTodos}
              disabled={actionLoading !== null}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Zera todos os dados para início de um novo mês comercial"
            >
              <span>🗓️</span>
              <span>Iniciar Novo Mês (Zerar Todos)</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK TEMPORÁRIO */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <span>✅</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CARDS DE DESTAQUE COMERCIAL (NÚMEROS GRANDES EM VERDE PARA SCREENSHOT)*/}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Visualizações */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span>Visualizações Totais</span>
            <span>👀</span>
          </div>
          <div className="mt-2 text-2xl sm:text-4xl font-black text-emerald-700 tracking-tight font-heading">
            {loading ? "..." : totais.totalViews.toLocaleString("pt-BR")}
          </div>
          <p className="text-[11px] text-emerald-800/80 mt-1 font-medium">
            Pessoas que viram a vitrine no app
          </p>
        </div>

        {/* Card 2: Cupons / Cliques */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 sm:p-5 rounded-2xl text-white shadow-md shadow-emerald-500/20">
          <div className="flex items-center justify-between text-emerald-100 text-xs font-bold uppercase tracking-wider">
            <span>Cupons no Caixa</span>
            <span>🎯</span>
          </div>
          <div className="mt-2 text-2xl sm:text-4xl font-black text-white tracking-tight font-heading">
            {loading ? "..." : totais.totalClicks.toLocaleString("pt-BR")}
          </div>
          <p className="text-[11px] text-emerald-100 mt-1 font-medium">
            Resgates reais de clientes no caixa
          </p>
        </div>

        {/* Card 3: Taxa de Conversão */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wider">
            <span>Taxa de Conversão</span>
            <span>📈</span>
          </div>
          <div className="mt-2 text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-heading">
            {loading ? "..." : `${totais.taxaMedia}%`}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Interesse direto de compra / pedido
          </p>
        </div>

        {/* Card 4: Parceiros Rastreados */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wider">
            <span>Locais Rastreados</span>
            <span>🏬</span>
          </div>
          <div className="mt-2 text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-heading">
            {loading ? "..." : totais.totalParceiros}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Parceiros cadastrados na Rede
          </p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FILTROS E BUSCA RÁPIDA                                               */}
      {/* ===================================================================== */}
      {!modoPrint && (
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar por estabelecimento, cidade ou cupom..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={cidadeFiltro}
              onChange={(e) => setCidadeFiltro(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {cidades.map((cid) => (
                <option key={cid} value={cid}>
                  Cidade: {cid}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TABELA GERENCIAL DE ESTABELECIMENTOS & CONVERSÕES                    */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4 sm:px-6">Estabelecimento</th>
                <th className="py-3.5 px-4">Cupom Ativo</th>
                <th className="py-3.5 px-4 text-center">Visualizações</th>
                <th className="py-3.5 px-4 text-center">Cupons no Caixa</th>
                <th className="py-3.5 px-4 text-center">Conversão</th>
                {!modoPrint && <th className="py-3.5 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Carregando métricas dos parceiros...
                  </td>
                </tr>
              ) : relatorio.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Nenhum estabelecimento encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                relatorio.map((item) => (
                  <tr
                    key={item.place.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Estabelecimento */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.place.coverImage}
                          alt={item.place.name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate max-w-[220px] sm:max-w-xs">
                            {item.place.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 block truncate">
                            📍 {item.place.city} • {item.place.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Cupom Ativo */}
                    <td className="py-4 px-4">
                      {item.place.activePromo ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-950 font-mono text-xs font-black border border-orange-200">
                            {item.place.activePromo.couponCode}
                          </span>
                          <span className="text-[11px] text-orange-800 font-medium truncate max-w-[150px]">
                            {item.place.activePromo.discountBadge}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Sem cupom ativo</span>
                      )}
                    </td>

                    {/* Visualizações (Destaque Verde Suave) */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-heading font-black text-base text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/80 inline-block min-w-[70px]">
                        {item.views.toLocaleString("pt-BR")}
                      </span>
                    </td>

                    {/* Cupons Gerados / Cliques (Destaque Verde Vibrante) */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-black text-base shadow-sm font-heading min-w-[80px] justify-center">
                        <span>🎯</span>
                        <span>{item.clicks.toLocaleString("pt-BR")}</span>
                      </div>
                    </td>

                    {/* Conversão */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-slate-800 text-xs">
                          {item.taxaConversao}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, item.taxaConversao * 4)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Ações */}
                    {!modoPrint && (
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopiarMensagemParceiro(item)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 transition-colors"
                            title="Copiar texto de prova de valor para enviar no WhatsApp"
                          >
                            <span>📲</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleZerarLocal(item.place)}
                            disabled={actionLoading === item.place.id}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-bold transition-colors disabled:opacity-50"
                            title="Zerar visualizações e cupons deste local (iniciar novo mês)"
                          >
                            <span>{actionLoading === item.place.id ? "..." : "Zerar"}</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Exibindo <strong>{relatorio.length}</strong> estabelecimentos rastreados.
          </span>
          <span className="text-[11px] text-slate-400">
            * As métricas são gravadas de forma silenciosa e anônima para comprovação comercial de resultados.
          </span>
        </div>
      </div>
    </div>
  );
}
