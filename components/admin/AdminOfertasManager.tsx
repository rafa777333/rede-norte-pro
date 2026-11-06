"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  RetailerItem,
  RetailerCategory,
  ThemeDay,
  ThermometerItem,
  PromoProduct,
} from "@/types/ofertas";
import { MOCK_RETAILERS, MOCK_THERMOMETER } from "@/lib/mock-ofertas";
import { getSupabase } from "@/lib/supabase";

const CIDADES = [
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

const CATEGORIAS: RetailerCategory[] = [
  "Supermercados",
  "Açougues & Carnes",
  "Farmácias & Saúde",
  "Hortifrúti & Feira",
  "Gás & Bebidas",
];

const THEME_DAYS: ThemeDay[] = [
  "Todos os Dias",
  "Terça & Quarta Verde",
  "Quinta & Sexta da Carne",
  "Saldão de Fim de Semana",
  "Plantão Farmácia",
];

const emptyRetailer: Partial<RetailerItem> = {
  name: "",
  category: "Supermercados",
  city: "Apucarana",
  neighborhood: "Centro",
  address: "",
  logo: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&h=200&fit=crop&q=80",
  coverImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80",
  whatsapp: "",
  vipGroupUrl: "",
  isVip: false,
  themeDay: "Todos os Dias",
  validUntil: "Ofertas válidas até Domingo!",
  storiesItems: [],
  isActive: true,
};

export default function AdminOfertasManager() {
  const hasFetchedRef = useRef(false);
  const [thermometer, setThermometer] = useState<ThermometerItem[]>([]);
  const [retailers, setRetailers] = useState<RetailerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // Modais
  const [modalRetailerAberto, setModalRetailerAberto] = useState(false);
  const [modalThermometerAberto, setModalThermometerAberto] = useState(false);
  const [editRetailer, setEditRetailer] = useState<Partial<RetailerItem>>(emptyRetailer);
  const [editThermItem, setEditThermItem] = useState<Partial<ThermometerItem> | null>(null);
  const [formTab, setFormTab] = useState<"dados" | "produtos">("dados");

  // Upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFlyer, setUploadingFlyer] = useState(false);
  const [uploadingProdId, setUploadingProdId] = useState<string | null>(null);

  // Carrega dados
  const carregarDados = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ofertas?all=true");
      const json = await res.json();
      if (json.success) {
        setThermometer(json.thermometer || MOCK_THERMOMETER);
        setRetailers(json.retailers || MOCK_RETAILERS);
      } else {
        setThermometer(MOCK_THERMOMETER);
        setRetailers(MOCK_RETAILERS);
      }
    } catch {
      setThermometer(MOCK_THERMOMETER);
      setRetailers(MOCK_RETAILERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    carregarDados();
  }, []);

  // Upload Supabase Storage
  const fazerUploadArquivo = async (file: File, pasta: string): Promise<string> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não configurado.");

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const nomeArquivo = `${pasta}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { error } = await supabase.storage
      .from("rede-norte-media")
      .upload(nomeArquivo, file, { contentType: file.type, upsert: true });

    if (error) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
    }

    const { data } = supabase.storage.from("rede-norte-media").getPublicUrl(nomeArquivo);
    return data.publicUrl;
  };

  // Importar 5 estabelecimentos demonstrativos + termômetro
  const importarExemplos = async () => {
    if (
      !confirm(
        "Deseja importar os dados de exemplo (5 mercados/açougues + 5 itens do termômetro) para o banco no Supabase?"
      )
    )
      return;

    setImporting(true);
    setMensagem(null);
    try {
      const res = await fetch("/api/ofertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const data = await res.json();
      if (data.success) {
        setMensagem({
          tipo: "sucesso",
          texto: "Dados demonstrativos de ofertas salvos com sucesso no Supabase!",
        });
        await carregarDados();
      } else {
        setMensagem({
          tipo: "erro",
          texto: data.hint || data.error || "Erro ao importar dados.",
        });
      }
    } catch (err: any) {
      setMensagem({ tipo: "erro", texto: err.message || "Erro de conexão." });
    } finally {
      setImporting(false);
    }
  };

  // Alternar VIP
  const alternarVip = async (r: RetailerItem) => {
    const novoVip = !r.isVip;
    try {
      const res = await fetch("/api/ofertas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, is_vip: novoVip }),
      });
      const json = await res.json();
      if (json.success) {
        setRetailers((prev) =>
          prev.map((item) => (item.id === r.id ? { ...item, isVip: novoVip } : item))
        );
      } else {
        alert(json.error || "Erro ao alterar VIP");
      }
    } catch {
      alert("Erro ao conectar.");
    }
  };

  // Excluir varejista
  const excluirRetailer = async (id: string, name: string) => {
    if (!confirm(`Deseja excluir "${name}" e todos os seus produtos?`)) return;
    try {
      const res = await fetch(`/api/ofertas?id=${id}&type=retailer`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setRetailers((prev) => prev.filter((r) => r.id !== id));
        setMensagem({ tipo: "sucesso", texto: `"${name}" removido com sucesso.` });
      } else {
        alert(json.error || "Erro ao excluir.");
      }
    } catch {
      alert("Erro ao conectar.");
    }
  };

  // Salvar estabelecimento
  const salvarRetailer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRetailer.name?.trim()) return alert("Nome é obrigatório.");

    setSaving(true);
    setMensagem(null);
    try {
      const res = await fetch("/api/ofertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retailer: editRetailer }),
      });
      const json = await res.json();
      if (json.success) {
        setMensagem({
          tipo: "sucesso",
          texto: `"${editRetailer.name}" salvo com sucesso!`,
        });
        setModalRetailerAberto(false);
        await carregarDados();
      } else {
        alert(json.hint || json.error || "Erro ao salvar.");
      }
    } catch (err: any) {
      alert(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // Salvar item do termômetro
  const salvarThermometerItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editThermItem?.itemName?.trim()) return alert("Nome do item é obrigatório.");

    setSaving(true);
    try {
      const res = await fetch("/api/ofertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_thermometer", item: editThermItem }),
      });
      const json = await res.json();
      if (json.success) {
        setModalThermometerAberto(false);
        await carregarDados();
      } else {
        alert(json.error || "Erro ao salvar item do termômetro.");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Funções de produtos do encarte
  const adicionarProduto = () => {
    const novoProduto: PromoProduct = {
      id: `prod-${Date.now()}`,
      productName: "",
      unit: "kg",
      oldPrice: 0,
      promoPrice: 0,
      discountPercent: 0,
      productImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
      isAnchor: false,
      categoryTag: "Oferta",
    };
    setEditRetailer((prev) => ({
      ...prev,
      storiesItems: [...(prev.storiesItems || []), novoProduto],
    }));
  };

  const atualizarProduto = (index: number, campos: Partial<PromoProduct>) => {
    setEditRetailer((prev) => {
      const list = [...(prev.storiesItems || [])];
      const merged = { ...list[index], ...campos };

      // Calcula % de desconto automaticamente se houver preço antigo
      if (merged.oldPrice && merged.oldPrice > merged.promoPrice && merged.promoPrice > 0) {
        merged.discountPercent = Math.round(
          ((merged.oldPrice - merged.promoPrice) / merged.oldPrice) * 100
        );
      }

      list[index] = merged;
      return { ...prev, storiesItems: list };
    });
  };

  const removerProduto = (index: number) => {
    setEditRetailer((prev) => {
      const list = [...(prev.storiesItems || [])];
      list.splice(index, 1);
      return { ...prev, storiesItems: list };
    });
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* BANNER PRINCIPAL DO MÓDULO DE OFERTAS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-2xl p-6 shadow-sm border border-emerald-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                Central de Ofertas & Varejo
              </span>
              <span className="text-xs text-emerald-300 font-semibold">
                Supermercados, Açougues & Farmácias
              </span>
            </div>
            <h2 className="text-2xl font-bold mt-1 text-white">
              Termômetro da Cesta Básica & Encartes em Stories
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Gerencie os preços mais baratos da cidade, atualize o encarte semanal dos parceiros e monitore produtos âncora com pedidos pelo WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={importarExemplos}
              disabled={importing}
              className="px-4 py-2.5 rounded-xl border border-emerald-500/50 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 font-bold text-xs transition disabled:opacity-50"
            >
              <span>{importing ? "⏳ Gravando..." : "📥 Importar Dados de Exemplo"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditRetailer(emptyRetailer);
                setFormTab("dados");
                setModalRetailerAberto(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <span className="text-base font-black">+</span>
              <span>Cadastrar Novo Mercado</span>
            </button>
          </div>
        </div>

        {mensagem && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
              mensagem.tipo === "sucesso"
                ? "bg-emerald-900/80 text-emerald-200 border border-emerald-500"
                : "bg-red-900/80 text-red-200 border border-red-500"
            }`}
          >
            <span>{mensagem.texto}</span>
            <button onClick={() => setMensagem(null)} className="ml-2 font-bold text-white/70">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1: TERMÔMETRO DA CESTA BÁSICA (5 ITENS ESSENCIAIS) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
              Utilidade Pública
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              📊 Termômetro de Preços da Semana (Cesta Básica & Essenciais)
            </h3>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditThermItem({
                itemName: "",
                category: "Cesta Básica",
                unit: "un",
                avgPrice: 0,
                lowestPrice: 0,
                partnerName: "",
                partnerWhatsapp: "",
                orderIndex: thermometer.length + 1,
              });
              setModalThermometerAberto(true);
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            + Adicionar Item ao Termômetro
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {thermometer.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
                <h4 className="font-bold text-xs text-slate-900 mt-1 line-clamp-2">
                  {item.itemName}
                </h4>
                <span className="text-[10px] text-slate-400 block">{item.unit}</span>

                <div className="mt-2 pt-2 border-t border-slate-200/80 space-y-0.5 text-xs">
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Média:</span>
                    <span>R$ {item.avgPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Menor hoje:</span>
                    <span>R$ {item.lowestPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 truncate mt-1">
                    📍 {item.partnerName}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setEditThermItem(item);
                    setModalThermometerAberto(true);
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <span className="text-[10px] text-slate-400 font-mono">
                  Zap: {item.partnerWhatsapp || "Sem zap"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 2: ESTABELECIDOS DE VAREJO (MERCADOS, AÇOUGUES, FARMÁCIAS) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
              Encartes & Parceiros
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              🛒 Mercados, Açougues & Farmácias Cadastrados ({retailers.length})
            </h3>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-semibold text-slate-500">
            Carregando estabelecimentos de varejo...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {retailers.map((r) => (
              <div
                key={r.id}
                className={`bg-white rounded-xl border overflow-hidden shadow-sm flex flex-col justify-between transition ${
                  r.isVip ? "border-amber-400 ring-1 ring-amber-400/30" : "border-slate-200"
                }`}
              >
                <div>
                  <div className="relative aspect-[16/9] w-full bg-slate-900">
                    <img src={r.coverImage} alt={r.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <img
                        src={r.logo}
                        alt="Logo"
                        className="w-8 h-8 rounded-full border border-white object-cover"
                      />
                      {r.isVip && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[9px]">
                          VIP
                        </span>
                      )}
                    </div>
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded">
                      {r.themeDay}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{r.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.category} · {r.city} ({r.neighborhood})
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800">
                        📸 {r.storiesItems?.length || 0} produtos no encarte
                      </span>
                      <span className="text-[10px] text-slate-500">{r.validUntil}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => alternarVip(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      r.isVip
                        ? "bg-amber-100 text-amber-900"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {r.isVip ? "⭐ VIP Ativo" : "Tornar VIP"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditRetailer(r);
                        setFormTab("dados");
                        setModalRetailerAberto(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => excluirRetailer(r.id, r.name)}
                      className="px-2 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CADASTRO / EDIÇÃO DE VAREJISTA & ENCARTE */}
      {/* ========================================================================= */}
      {modalRetailerAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  {editRetailer.id ? "Editar Estabelecimento" : "Novo Mercado / Açougue / Farmácia"}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {editRetailer.name || "Cadastro de Varejista"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalRetailerAberto(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Abas */}
            <div className="flex border-b border-slate-200 bg-slate-100/70 px-4 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setFormTab("dados")}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition ${
                  formTab === "dados"
                    ? "border-emerald-600 text-emerald-800 bg-white"
                    : "border-transparent text-slate-600"
                }`}
              >
                📌 1. Dados do Estabelecimento
              </button>

              <button
                type="button"
                onClick={() => setFormTab("produtos")}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition ${
                  formTab === "produtos"
                    ? "border-emerald-600 text-emerald-800 bg-white"
                    : "border-transparent text-slate-600"
                }`}
              >
                📸 2. Encarte & Produtos do Dia ({editRetailer.storiesItems?.length || 0})
              </button>
            </div>

            <form onSubmit={salvarRetailer} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {formTab === "dados" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nome do Estabelecimento *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Ex: Hipermercado Vale Atacarejo"
                        value={editRetailer.name || ""}
                        onChange={(e) => setEditRetailer({ ...editRetailer, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Categoria de Varejo *
                      </label>
                      <select
                        value={editRetailer.category || "Supermercados"}
                        onChange={(e) =>
                          setEditRetailer({
                            ...editRetailer,
                            category: e.target.value as RetailerCategory,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                      >
                        {CATEGORIAS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cidade *</label>
                      <select
                        value={editRetailer.city || "Apucarana"}
                        onChange={(e) => setEditRetailer({ ...editRetailer, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                      >
                        {CIDADES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Bairro</label>
                      <input
                        type="text"
                        placeholder="Ex: Centro"
                        value={editRetailer.neighborhood || ""}
                        onChange={(e) =>
                          setEditRetailer({ ...editRetailer, neighborhood: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Dia Temático da Oferta
                      </label>
                      <select
                        value={editRetailer.themeDay || "Todos os Dias"}
                        onChange={(e) =>
                          setEditRetailer({
                            ...editRetailer,
                            themeDay: e.target.value as ThemeDay,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                      >
                        {THEME_DAYS.map((td) => (
                          <option key={td} value={td}>
                            {td}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        WhatsApp (com DDD) *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="43999998888"
                        value={editRetailer.whatsapp || ""}
                        onChange={(e) =>
                          setEditRetailer({ ...editRetailer, whatsapp: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Link do Grupo VIP de WhatsApp
                      </label>
                      <input
                        type="url"
                        placeholder="https://chat.whatsapp.com/..."
                        value={editRetailer.vipGroupUrl || ""}
                        onChange={(e) =>
                          setEditRetailer({ ...editRetailer, vipGroupUrl: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Validade das Ofertas
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Ofertas válidas até Domingo!"
                        value={editRetailer.validUntil || ""}
                        onChange={(e) =>
                          setEditRetailer({ ...editRetailer, validUntil: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  {/* Upload Logo e Capa */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Logo Redondo *</label>
                      <div className="flex items-center gap-3">
                        {editRetailer.logo && (
                          <img
                            src={editRetailer.logo}
                            alt="Logo"
                            className="w-12 h-12 rounded-full object-cover border border-slate-300"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setUploadingLogo(true);
                            try {
                              const url = await fazerUploadArquivo(f, "ofertas/logos");
                              setEditRetailer({ ...editRetailer, logo: url });
                            } finally {
                              setUploadingLogo(false);
                            }
                          }}
                          className="text-xs"
                        />
                        {uploadingLogo && <span className="text-xs text-emerald-600">Enviando...</span>}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Foto de Capa *</label>
                      <div className="flex items-center gap-3">
                        {editRetailer.coverImage && (
                          <img
                            src={editRetailer.coverImage}
                            alt="Capa"
                            className="w-16 h-10 rounded-lg object-cover border border-slate-300"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setUploadingCover(true);
                            try {
                              const url = await fazerUploadArquivo(f, "ofertas/covers");
                              setEditRetailer({ ...editRetailer, coverImage: url });
                            } finally {
                              setUploadingCover(false);
                            }
                          }}
                          className="text-xs"
                        />
                        {uploadingCover && <span className="text-xs text-emerald-600">Enviando...</span>}
                      </div>
                    </div>
                  </div>

                  {/* Chaves VIP e Ativo */}
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editRetailer.isVip)}
                        onChange={(e) => setEditRetailer({ ...editRetailer, isVip: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-bold text-xs text-slate-900">
                        ⭐ Parceiro VIP (Destaque Patrocinado no Topo)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editRetailer.isActive !== false}
                        onChange={(e) =>
                          setEditRetailer({ ...editRetailer, isActive: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-emerald-600"
                      />
                      <span className="font-bold text-xs text-slate-900">Ativo na Vitrine</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ABA 2: PRODUTOS DO ENCARTE */}
              {formTab === "produtos" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Produtos em Oferta (Encarte em Stories)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Cada produto vira um slide de Stories com pedido direto no WhatsApp.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={adicionarProduto}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
                    >
                      + Adicionar Produto
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editRetailer.storiesItems?.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-slate-400">
                            Oferta #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removerProduto(idx)}
                            className="text-xs text-red-600 font-bold hover:underline"
                          >
                            Excluir
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700">
                              Nome do Produto *
                            </label>
                            <input
                              required
                              type="text"
                              placeholder="Ex: Arroz Tipo 1 (5kg)"
                              value={p.productName}
                              onChange={(e) =>
                                atualizarProduto(idx, { productName: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700">
                              Unidade *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: kg, un, 5kg"
                              value={p.unit}
                              onChange={(e) => atualizarProduto(idx, { unit: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700">
                              Tag / Categoria
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Açougue, Feira"
                              value={p.categoryTag || ""}
                              onChange={(e) =>
                                atualizarProduto(idx, { categoryTag: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700">
                              Preço Antigo (R$)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Ex: 28.90"
                              value={p.oldPrice || ""}
                              onChange={(e) =>
                                atualizarProduto(idx, {
                                  oldPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-emerald-800">
                              Preço em Oferta (R$) *
                            </label>
                            <input
                              required
                              type="number"
                              step="0.01"
                              placeholder="Ex: 22.89"
                              value={p.promoPrice || ""}
                              onChange={(e) =>
                                atualizarProduto(idx, {
                                  promoPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded border border-emerald-300 text-xs font-bold text-emerald-800 bg-white"
                            />
                          </div>

                          <div className="flex items-center gap-2 pt-4">
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800">
                              <input
                                type="checkbox"
                                checked={Boolean(p.isAnchor)}
                                onChange={(e) =>
                                  atualizarProduto(idx, { isAnchor: e.target.checked })
                                }
                                className="w-4 h-4 rounded text-amber-500"
                              />
                              <span>⭐ Produto Âncora</span>
                            </label>
                          </div>
                        </div>

                        {/* Foto do Produto */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Foto do Produto
                          </label>
                          <div className="flex items-center gap-3">
                            {p.productImage && (
                              <img
                                src={p.productImage}
                                alt="Foto"
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                              />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                setUploadingProdId(p.id);
                                try {
                                  const url = await fazerUploadArquivo(f, "ofertas/produtos");
                                  atualizarProduto(idx, { productImage: url });
                                } finally {
                                  setUploadingProdId(null);
                                }
                              }}
                              className="text-xs"
                            />
                            {uploadingProdId === p.id && (
                              <span className="text-xs text-emerald-600">Enviando...</span>
                            )}
                            <input
                              type="url"
                              placeholder="Ou link da imagem..."
                              value={p.productImage || ""}
                              onChange={(e) =>
                                atualizarProduto(idx, { productImage: e.target.value })
                              }
                              className="flex-1 px-2.5 py-1.5 rounded border border-slate-200 text-xs bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalRetailerAberto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar Mercado e Encarte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIÇÃO DE ITEM DO TERMÔMETRO DA CESTA BÁSICA */}
      {/* ========================================================================= */}
      {modalThermometerAberto && editThermItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                📊 Editar Item do Termômetro da Cesta Básica
              </h3>
              <button
                type="button"
                onClick={() => setModalThermometerAberto(false)}
                className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={salvarThermometerItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Item *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Arroz Tipo 1 (Pacote 5kg)"
                  value={editThermItem.itemName || ""}
                  onChange={(e) =>
                    setEditThermItem({ ...editThermItem, itemName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Cesta Básica"
                    value={editThermItem.category || ""}
                    onChange={(e) =>
                      setEditThermItem({ ...editThermItem, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidade</label>
                  <input
                    type="text"
                    placeholder="Ex: pct 5kg, kg, botijão"
                    value={editThermItem.unit || ""}
                    onChange={(e) => setEditThermItem({ ...editThermItem, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preço Médio (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="28.90"
                    value={editThermItem.avgPrice || ""}
                    onChange={(e) =>
                      setEditThermItem({
                        ...editThermItem,
                        avgPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-800 mb-1">Menor Preço Hoje (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="22.89"
                    value={editThermItem.lowestPrice || ""}
                    onChange={(e) =>
                      setEditThermItem({
                        ...editThermItem,
                        lowestPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-emerald-300 font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mercado Parceiro *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Vale Atacarejo"
                    value={editThermItem.partnerName || ""}
                    onChange={(e) =>
                      setEditThermItem({ ...editThermItem, partnerName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp Parceiro</label>
                  <input
                    type="text"
                    placeholder="43999998888"
                    value={editThermItem.partnerWhatsapp || ""}
                    onChange={(e) =>
                      setEditThermItem({ ...editThermItem, partnerWhatsapp: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalThermometerAberto(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-bold"
                >
                  {saving ? "Salvando..." : "Salvar no Termômetro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
