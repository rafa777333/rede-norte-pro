"use client";

import React, { useState, useEffect, useRef } from "react";
import { PlaceItem, PlaceCategory, MenuItem, ActivePromo } from "@/types/places";
import { MOCK_PLACES } from "@/lib/mock-places";
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

const CATEGORIAS: PlaceCategory[] = [
  "Pizzarias & Lanches",
  "Restaurantes & Almoço",
  "Bares & Vida Noturna",
  "Cafés & Docerias",
  "Hotéis & Lazer",
];

const emptyPlace: Partial<PlaceItem> = {
  name: "",
  tagline: "",
  category: "Restaurantes & Almoço",
  city: "Apucarana",
  neighborhood: "Centro",
  address: "",
  whatsapp: "",
  instagram: "",
  googleMapsUrl: "",
  isVip: false,
  isActive: true,
  rating: 5.0,
  openHours: { open: "18:00", close: "23:30", days: "Terça a Domingo" },
  coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
  logo: "",
  videoUrl: "",
  activePromo: {
    title: "",
    discountBadge: "10% OFF",
    couponCode: "REDE10",
    validUntil: "Válido este mês",
    description: "",
  },
  menuHighlights: [],
  description: "",
  promoActive: true,
  promoHighlight: false,
  promoText: "",
};

export default function AdminOndeIrManager() {
  const hasFetchedRef = useRef(false);
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [filtroCidade, setFiltroCidade] = useState("Todas");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // Modal de edição / cadastro
  const [modalAberto, setModalAberto] = useState(false);
  const [editPlace, setEditPlace] = useState<Partial<PlaceItem>>(emptyPlace);
  const [formTab, setFormTab] = useState<"dados" | "midia" | "promo" | "cardapio">("dados");
  const [promoAtiva, setPromoAtiva] = useState(false);

  // Estados de upload de arquivo
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingMenuItemId, setUploadingMenuItemId] = useState<string | null>(null);

  // Carrega os dados da API
  const carregarLocais = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onde-ir?all=true");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPlaces(json.data);
      } else {
        setPlaces(MOCK_PLACES);
      }
    } catch {
      setPlaces(MOCK_PLACES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    carregarLocais();
  }, []);

  // Upload para Supabase Storage usando o bucket "rede-norte-media"
  const fazerUploadArquivo = async (file: File, pasta: string): Promise<string> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não configurado.");

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const nomeArquivo = `${pasta}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { error } = await supabase.storage
      .from("rede-norte-media")
      .upload(nomeArquivo, file, { contentType: file.type, upsert: true });

    if (error) {
      console.warn("Storage upload falhou, tentando converter para Base64:", error.message);
      // Fallback para Base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
    }

    const { data } = supabase.storage.from("rede-norte-media").getPublicUrl(nomeArquivo);
    return data.publicUrl;
  };

  // Importa os 6 exemplos demonstrativos para o banco
  const importarExemplos = async () => {
    if (!confirm("Deseja importar os 6 estabelecimentos demonstrativos completos para a tabela onde_ir_places no Supabase?")) return;
    setImporting(true);
    setMensagem(null);
    try {
      const res = await fetch("/api/onde-ir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const data = await res.json();
      if (data.success) {
        setMensagem({ tipo: "sucesso", texto: "6 estabelecimentos demonstrativos salvos com sucesso no Supabase!" });
        await carregarLocais();
      } else {
        setMensagem({ tipo: "erro", texto: data.hint || data.error || "Erro ao importar dados." });
      }
    } catch (err: any) {
      setMensagem({ tipo: "erro", texto: err.message || "Erro de conexão ao importar." });
    } finally {
      setImporting(false);
    }
  };

  // Alterna status VIP diretamente na lista
  const alternarVip = async (place: PlaceItem) => {
    const novoVip = !place.isVip;
    try {
      const res = await fetch("/api/onde-ir", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: place.id, is_vip: novoVip }),
      });
      const json = await res.json();
      if (json.success) {
        setPlaces((prev) =>
          prev.map((p) => (p.id === place.id ? { ...p, isVip: novoVip } : p))
        );
      } else {
        alert(json.error || "Não foi possível alterar status VIP no banco.");
      }
    } catch {
      alert("Erro ao conectar com a API.");
    }
  };

  // Exclui estabelecimento
  const excluirLocal = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${nome}" permanentemente da vitrine?`)) return;
    try {
      const res = await fetch(`/api/onde-ir?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setPlaces((prev) => prev.filter((p) => p.id !== id));
        setMensagem({ tipo: "sucesso", texto: `"${nome}" foi removido com sucesso.` });
      } else {
        alert(json.error || "Erro ao excluir.");
      }
    } catch {
      alert("Erro ao conectar com a API.");
    }
  };

  // Abre modal para novo cadastro
  const abrirNovo = () => {
    setEditPlace({
      ...emptyPlace,
      openHours: { open: "18:00", close: "23:30", days: "Terça a Domingo" },
      activePromo: {
        title: "",
        discountBadge: "20% OFF",
        couponCode: "REDE20",
        validUntil: "Válido este mês",
        description: "",
      },
      menuHighlights: [],
    });
    setPromoAtiva(false);
    setFormTab("dados");
    setModalAberto(true);
  };

  // Abre modal para edição
  const abrirEdicao = (place: PlaceItem) => {
    setEditPlace({
      ...place,
      promoActive: place.promoActive !== undefined ? place.promoActive : (place.activePromo?.isActive !== false),
      promoHighlight: Boolean(place.promoHighlight || place.activePromo?.isHighlight),
      promoText: place.promoText || place.activePromo?.title || "",
      openHours: place.openHours || { open: "18:00", close: "23:30", days: "Terça a Domingo" },
      activePromo: place.activePromo || {
        title: "",
        discountBadge: "10% OFF",
        couponCode: "REDE10",
        validUntil: "Válido este mês",
        description: "",
      },
      menuHighlights: place.menuHighlights ? [...place.menuHighlights] : [],
    });
    setPromoAtiva(Boolean((place.activePromo && place.activePromo.title) || place.promoText));
    setFormTab("dados");
    setModalAberto(true);
  };

  // Alterna status da promoção (Ativa / Esgotada) com 1 clique rápido no card
  const alternarPromoAtiva = async (place: PlaceItem) => {
    const novoStatus = place.promoActive === false ? true : false;
    try {
      const res = await fetch("/api/onde-ir", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: place.id,
          promo_active: novoStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPlaces((prev) =>
          prev.map((p) =>
            p.id === place.id ? { ...p, promoActive: novoStatus } : p
          )
        );
        setMensagem({
          tipo: "sucesso",
          texto: `Promoção de "${place.name}" alterada para: ${novoStatus ? "🟢 ATIVA" : "🔴 ESGOTADA"}!`,
        });
        setTimeout(() => setMensagem(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Alterna Destaque Extra (Topo do App) com 1 clique rápido no card
  const alternarHighlight = async (place: PlaceItem) => {
    const novoHighlight = !place.promoHighlight;
    try {
      const res = await fetch("/api/onde-ir", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: place.id,
          promo_highlight: novoHighlight,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPlaces((prev) =>
          prev.map((p) =>
            p.id === place.id ? { ...p, promoHighlight: novoHighlight } : p
          )
        );
        setMensagem({
          tipo: "sucesso",
          texto: `Destaque Extra de "${place.name}": ${novoHighlight ? "🔥 NO TOPO (ATIVADO)" : "Normal"}!`,
        });
        setTimeout(() => setMensagem(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Salvar cadastro/edição
  const salvarEstabelecimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlace.name?.trim()) return alert("O nome do estabelecimento é obrigatório.");

    setSaving(true);
    setMensagem(null);

    const payload: Partial<PlaceItem> = {
      ...editPlace,
      promoActive: promoAtiva ? (editPlace.promoActive !== false) : false,
      promoHighlight: Boolean(editPlace.promoHighlight),
      promoText: editPlace.activePromo?.title || editPlace.promoText || "",
      activePromo: promoAtiva && (editPlace.activePromo?.title || editPlace.promoText) ? {
        ...editPlace.activePromo!,
        title: editPlace.activePromo?.title || editPlace.promoText || "",
        isActive: editPlace.promoActive !== false,
        isHighlight: Boolean(editPlace.promoHighlight),
      } : undefined,
    };

    try {
      const res = await fetch("/api/onde-ir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setMensagem({
          tipo: "sucesso",
          texto: `"${editPlace.name}" foi salvo com sucesso no banco de dados!`,
        });
        setModalAberto(false);
        await carregarLocais();
      } else {
        alert(json.hint || json.error || "Erro ao salvar local.");
      }
    } catch (err: any) {
      alert(err.message || "Erro ao salvar local.");
    } finally {
      setSaving(false);
    }
  };

  // Funções do Cardápio Dinâmico
  const adicionarItemCardapio = () => {
    const novoItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: "",
      description: "",
      price: 0,
      badge: "",
      image: "",
    };
    setEditPlace((prev) => ({
      ...prev,
      menuHighlights: [...(prev.menuHighlights || []), novoItem],
    }));
  };

  const atualizarItemCardapio = (index: number, campos: Partial<MenuItem>) => {
    setEditPlace((prev) => {
      const list = [...(prev.menuHighlights || [])];
      list[index] = { ...list[index], ...campos };
      return { ...prev, menuHighlights: list };
    });
  };

  const removerItemCardapio = (index: number) => {
    setEditPlace((prev) => {
      const list = [...(prev.menuHighlights || [])];
      list.splice(index, 1);
      return { ...prev, menuHighlights: list };
    });
  };

  const moverItemCardapio = (index: number, direcao: -1 | 1) => {
    setEditPlace((prev) => {
      const list = [...(prev.menuHighlights || [])];
      const targetIndex = index + direcao;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return { ...prev, menuHighlights: list };
    });
  };

  // Filtra locais na listagem
  const locaisFiltrados = places.filter((p) => {
    const matchCidade = filtroCidade === "Todas" || p.city.toLowerCase() === filtroCidade.toLowerCase();
    const matchCat = filtroCategoria === "Todas" || p.category === filtroCategoria;
    const matchBusca =
      !busca.trim() ||
      p.name.toLowerCase().includes(busca.toLowerCase()) ||
      p.city.toLowerCase().includes(busca.toLowerCase()) ||
      p.address?.toLowerCase().includes(busca.toLowerCase());
    return matchCidade && matchCat && matchBusca;
  });

  return (
    <div className="space-y-6">
      {/* Banner / Cabeçalho da Seção */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                Módulo Onde Ir · Vitrine 2026
              </span>
              <span className="text-xs text-slate-500 font-medium">Supabase Database & Storage</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Gerenciamento de Restaurantes, Bares & Comércio
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Controle completo dos parceiros da região: Tours em Vídeo 9:16, Cardápio com Pedido no WhatsApp e Cupons do Dia.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={importarExemplos}
              disabled={importing}
              className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{importing ? "⏳ Gravando..." : "📥 Importar 6 Exemplos para o Banco"}</span>
            </button>

            <button
              type="button"
              onClick={abrirNovo}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <span className="text-base font-black">+</span>
              <span>Cadastrar Novo Local</span>
            </button>
          </div>
        </div>

        {/* Feedback de Mensagem */}
        {mensagem && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
              mensagem.tipo === "sucesso"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{mensagem.texto}</span>
            <button
              onClick={() => setMensagem(null)}
              className="text-slate-400 hover:text-slate-700 ml-2 font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Buscar por nome, endereço ou cidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filtroCidade}
            onChange={(e) => setFiltroCidade(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
          >
            <option value="Todas">Todas as Cidades ({places.length})</option>
            {CIDADES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
          >
            <option value="Todas">Todas as Categorias</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={carregarLocais}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            title="Atualizar lista"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Grid de Estabelecimentos Cadastrados */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs font-semibold bg-white border border-slate-200 rounded-xl">
          Carregando estabelecimentos da vitrine...
        </div>
      ) : locaisFiltrados.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
          <span className="text-3xl">🍽️</span>
          <p className="text-sm font-bold text-slate-800 mt-2">Nenhum estabelecimento encontrado</p>
          <p className="text-xs text-slate-500 mt-1">
            Clique no botão acima &quot;Importar 6 Exemplos para o Banco&quot; para preencher o Supabase instantaneamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locaisFiltrados.map((place) => (
            <div
              key={place.id}
              className={`bg-white rounded-xl border overflow-hidden shadow-sm flex flex-col justify-between transition hover:shadow-md ${
                place.isVip ? "border-amber-400 ring-1 ring-amber-400/40" : "border-slate-200"
              }`}
            >
              {/* Topo do Card com Imagem e Badges */}
              <div>
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                  <img
                    src={place.coverImage}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                  {place.isVip && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow">
                      ⭐ VIP
                    </span>
                  )}
                  {place.videoUrl && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-black bg-black/70 backdrop-blur text-amber-300 border border-amber-400/30">
                      ▶ 9:16
                    </span>
                  )}
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white/90 drop-shadow">
                    <span className="font-bold">{place.city}</span>
                    <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded">
                      {place.category}
                    </span>
                  </div>
                </div>

                {/* Conteúdo Informativo */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {place.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {place.tagline || place.address}
                      </p>
                    </div>
                  </div>

                  {/* Promoção / Escassez / Destaque */}
                  {place.activePromo?.title || place.promoText ? (
                    <div
                      className={`p-2.5 rounded-xl border text-xs flex flex-col gap-2 ${
                        place.promoActive !== false
                          ? "bg-emerald-50/80 border-emerald-200"
                          : "bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold truncate pr-2 ${
                            place.promoActive !== false
                              ? "text-emerald-950"
                              : "text-slate-500 line-through"
                          }`}
                        >
                          ⚡ {place.promoText || place.activePromo?.title}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                            place.promoActive !== false
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-300 text-slate-600"
                          }`}
                        >
                          {place.promoActive !== false ? "🟢 ATIVA" : "🔴 ESGOTADA"}
                        </span>
                      </div>

                      {/* Botões de Ação Rápida */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/70">
                        <button
                          type="button"
                          onClick={() => alternarPromoAtiva(place)}
                          className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                            place.promoActive !== false
                              ? "bg-red-100 hover:bg-red-200 text-red-800"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                          }`}
                          title="Alternar entre Ativa e Esgotada com 1 clique"
                        >
                          {place.promoActive !== false
                            ? "Desativar (Esgotar)"
                            : "Reativar Promoção"}
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarHighlight(place)}
                          className={`py-1 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 ${
                            place.promoHighlight
                              ? "bg-amber-400 text-slate-950 shadow-sm"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                          title="Alternar Destaque Extra no Topo Absoluto"
                        >
                          <span>🔥</span>
                          <span>{place.promoHighlight ? "No Topo" : "Destacar"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      Sem cupom ativo no momento
                    </div>
                  )}

                  {/* Detalhes de Cardápio e Contato */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      🍔 {place.menuHighlights?.length || 0} itens no cardápio
                    </span>
                    <span>📲 Zap: {place.whatsapp || "Não cadastrado"}</span>
                  </div>
                </div>
              </div>

              {/* Ações do Card */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => alternarVip(place)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    place.isVip
                      ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                  title="Alternar destaque VIP"
                >
                  {place.isVip ? "⭐ VIP Ativo" : "Tornar VIP"}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => abrirEdicao(place)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => excluirLocal(place.id, place.name)}
                    className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition"
                    title="Excluir estabelecimento"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CADASTRO E EDIÇÃO COMPLETO COM ABAS */}
      {/* ========================================================================= */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Topo do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                  {editPlace.id ? "Editar Estabelecimento" : "Novo Estabelecimento"}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {editPlace.name || "Cadastro no Guia Onde Ir"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Abas Internas do Modal */}
            <div className="flex border-b border-slate-200 bg-slate-100/70 px-4 gap-2 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFormTab("dados")}
                className={`py-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  formTab === "dados"
                    ? "border-amber-500 text-amber-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                📌 1. Dados Básicos & Destaque
              </button>

              <button
                type="button"
                onClick={() => setFormTab("midia")}
                className={`py-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  formTab === "midia"
                    ? "border-amber-500 text-amber-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                📸 2. Mídia & Vídeo 9:16
              </button>

              <button
                type="button"
                onClick={() => setFormTab("promo")}
                className={`py-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  formTab === "promo"
                    ? "border-amber-500 text-amber-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                🔥 3. Promoção & Cupom do Dia
              </button>

              <button
                type="button"
                onClick={() => setFormTab("cardapio")}
                className={`py-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  formTab === "cardapio"
                    ? "border-amber-500 text-amber-700 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                🍔 4. Cardápio Interativo ({editPlace.menuHighlights?.length || 0})
              </button>
            </div>

            {/* Conteúdo do Formulário */}
            <form onSubmit={salvarEstabelecimento} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* ================================================================= */}
              {/* ABA 1: DADOS BÁSICOS & DESTAQUE */}
              {/* ================================================================= */}
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
                        placeholder="Ex: La Bella Forneria & Pizzeria"
                        value={editPlace.name || ""}
                        onChange={(e) => setEditPlace({ ...editPlace, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Frase de Destaque / Tagline
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Autêntica pizza napoletana com forno a lenha"
                        value={editPlace.tagline || ""}
                        onChange={(e) => setEditPlace({ ...editPlace, tagline: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Categoria *
                      </label>
                      <select
                        value={editPlace.category || "Restaurantes & Almoço"}
                        onChange={(e) =>
                          setEditPlace({ ...editPlace, category: e.target.value as PlaceCategory })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                      >
                        {CATEGORIAS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Cidade *
                      </label>
                      <select
                        value={editPlace.city || "Apucarana"}
                        onChange={(e) => setEditPlace({ ...editPlace, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                      >
                        {CIDADES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Centro"
                        value={editPlace.neighborhood || ""}
                        onChange={(e) => setEditPlace({ ...editPlace, neighborhood: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Endereço Completo
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Av. Curitiba, 1420 - Centro, Apucarana - PR"
                        value={editPlace.address || ""}
                        onChange={(e) => setEditPlace({ ...editPlace, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Link do Google Maps
                      </label>
                      <input
                        type="url"
                        placeholder="https://maps.google.com/..."
                        value={editPlace.googleMapsUrl || ""}
                        onChange={(e) => setEditPlace({ ...editPlace, googleMapsUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
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
                        placeholder="Ex: 43999998888"
                        value={editPlace.whatsapp || ""}
                        onChange={(e) => setEditPlace({ ...editPlace, whatsapp: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <small className="text-[10px] text-slate-400">
                        Usado para o rastreio de pedidos e resgate de cupons.
                      </small>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Instagram
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: @labella.apucarana ou link"
                        value={editPlace.instagram || ""}
                        onChange={(e) => setEditPlace({ ...editPlace, instagram: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Horário de Funcionamento
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Abre (18:00)"
                          value={editPlace.openHours?.open || "18:00"}
                          onChange={(e) =>
                            setEditPlace({
                              ...editPlace,
                              openHours: { ...editPlace.openHours!, open: e.target.value },
                            })
                          }
                          className="w-1/2 px-2 py-2 rounded-lg border border-slate-200 text-xs text-center"
                        />
                        <span className="text-slate-400">às</span>
                        <input
                          type="text"
                          placeholder="Fecha (23:30)"
                          value={editPlace.openHours?.close || "23:30"}
                          onChange={(e) =>
                            setEditPlace({
                              ...editPlace,
                              openHours: { ...editPlace.openHours!, close: e.target.value },
                            })
                          }
                          className="w-1/2 px-2 py-2 rounded-lg border border-slate-200 text-xs text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Destaques VIP e Ativo */}
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editPlace.isVip)}
                        onChange={(e) => setEditPlace({ ...editPlace, isVip: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">
                          ⭐ Parceiro VIP (Destaque no Topo com Borda Dourada)
                        </span>
                        <span className="text-[11px] text-slate-600 block">
                          Aparece primeiro em todas as listagens com selo de verificação.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editPlace.isActive !== false}
                        onChange={(e) => setEditPlace({ ...editPlace, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-xs text-slate-900">
                        Ativo na Vitrine Pública
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* ABA 2: MÍDIA & VÍDEO 9:16 */}
              {/* ================================================================= */}
              {formTab === "midia" && (
                <div className="space-y-6">
                  {/* Foto de Capa */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Foto de Capa Principal (Horizontal) *
                      </label>
                      <span className="text-[10px] text-slate-500">Recomendado: 1200x800px</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {editPlace.coverImage && (
                        <div className="w-36 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-300 shrink-0">
                          <img
                            src={editPlace.coverImage}
                            alt="Capa"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingCover(true);
                              try {
                                const url = await fazerUploadArquivo(file, "onde-ir/covers");
                                setEditPlace({ ...editPlace, coverImage: url });
                              } catch (err: any) {
                                alert("Erro no upload: " + err.message);
                              } finally {
                                setUploadingCover(false);
                              }
                            }}
                            className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200"
                          />
                          {uploadingCover && <span className="text-xs text-amber-600 font-bold">Enviando...</span>}
                        </div>

                        <input
                          type="url"
                          placeholder="Ou cole a URL direta da imagem (https://...)"
                          value={editPlace.coverImage?.startsWith("data:") ? "Imagem em base64 carregada" : editPlace.coverImage || ""}
                          onChange={(e) => setEditPlace({ ...editPlace, coverImage: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo do Estabelecimento */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <label className="text-xs font-bold text-slate-800 block">
                      Logo do Estabelecimento (Opcional)
                    </label>

                    <div className="flex items-center gap-4">
                      {editPlace.logo && (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-slate-300 shrink-0">
                          <img src={editPlace.logo} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex-1 space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingLogo(true);
                            try {
                              const url = await fazerUploadArquivo(file, "onde-ir/logos");
                              setEditPlace({ ...editPlace, logo: url });
                            } catch (err: any) {
                              alert("Erro no upload: " + err.message);
                            } finally {
                              setUploadingLogo(false);
                            }
                          }}
                          className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-800"
                        />
                        {uploadingLogo && <span className="text-xs text-amber-600 font-bold ml-2">Enviando...</span>}
                        <input
                          type="url"
                          placeholder="Ou URL do logo (https://...)"
                          value={editPlace.logo || ""}
                          onChange={(e) => setEditPlace({ ...editPlace, logo: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vídeo Vertical 9:16 */}
                  <div className="p-4 rounded-xl border border-amber-300/60 bg-amber-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <span>▶</span> Vídeo Vertical 9:16 (Tour / Pratos / Ambiente estilo Reels/TikTok)
                        </span>
                        <span className="text-[11px] text-slate-600 block mt-0.5">
                          Faça upload de arquivo .mp4 para o Supabase Storage ou cole a URL direta.
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {editPlace.videoUrl && (
                        <div className="w-28 aspect-[9/16] rounded-xl overflow-hidden bg-black shrink-0 border border-slate-300 shadow">
                          <video
                            src={editPlace.videoUrl}
                            className="w-full h-full object-cover"
                            controls
                            preload="none"
                            muted
                            playsInline
                          />
                        </div>
                      )}

                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,video/webm"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingVideo(true);
                              try {
                                const url = await fazerUploadArquivo(file, "onde-ir/videos");
                                setEditPlace({ ...editPlace, videoUrl: url });
                              } catch (err: any) {
                                alert("Erro no upload do vídeo: " + err.message);
                              } finally {
                                setUploadingVideo(false);
                              }
                            }}
                            className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600"
                          />
                          {uploadingVideo && <span className="text-xs text-amber-700 font-bold">Enviando vídeo 9:16...</span>}
                        </div>

                        <input
                          type="url"
                          placeholder="Ou cole a URL direta do vídeo MP4 ou Reels (https://...)"
                          value={editPlace.videoUrl || ""}
                          onChange={(e) => setEditPlace({ ...editPlace, videoUrl: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* ABA 3: PROMOÇÃO & CUPOM DO DIA */}
              {/* ================================================================= */}
              {formTab === "promo" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={promoAtiva}
                        onChange={(e) => setPromoAtiva(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">
                          🔥 Ativar Promoção na Faixa de Topo do Onde Ir
                        </span>
                        <span className="text-[11px] text-slate-600 block">
                          Exibe este estabelecimento no carrossel de ofertas com selo pulsante e cupom no WhatsApp.
                        </span>
                      </div>
                    </label>
                  </div>

                  {promoAtiva && (
                    <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-white">
                      {/* 1. INTERRUPTOR DE AÇÃO RÁPIDA: STATUS DA PROMOÇÃO (ATIVA / ESGOTADA) */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">
                            Status da Promoção (Cota Comercial)
                          </span>
                          <span className="text-[11px] text-slate-600 block">
                            {editPlace.promoActive !== false
                              ? "🟢 ATIVA: Botão vermelho liberado para resgate no caixa"
                              : "🔴 ESGOTADA: Botão cinza desativado com '🚫 PROMOÇÃO ESGOTADA' (Gera FOMO)"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setEditPlace({
                              ...editPlace,
                              promoActive: editPlace.promoActive === false ? true : false,
                            })
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm ${
                            editPlace.promoActive !== false
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                              : "bg-red-600 hover:bg-red-500 text-white"
                          }`}
                        >
                          {editPlace.promoActive !== false ? "🟢 Ativa (Ligada)" : "🔴 Esgotada (Desligada)"}
                        </button>
                      </div>

                      {/* 2. INTERRUPTOR DE DESTAQUE EXTRA (PROPAGANDA TURBINADA NO TOPO) */}
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                        <div>
                          <span className="font-bold text-xs text-amber-950 block">
                            🔥 Destaque Extra (Propaganda Turbinada / Topo Absoluto)
                          </span>
                          <span className="text-[11px] text-amber-800 block">
                            Posiciona este estabelecimento no topo absoluto do app com borda dourada e selo "🔥 OFERTA LIMITADA".
                          </span>
                        </div>

                        <input
                          type="checkbox"
                          checked={Boolean(editPlace.promoHighlight)}
                          onChange={(e) =>
                            setEditPlace({
                              ...editPlace,
                              promoHighlight: e.target.checked,
                            })
                          }
                          className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Título da Oferta do Dia *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Terça Napoletana - 20% OFF em qualquer Pizza Especial"
                          value={editPlace.activePromo?.title || ""}
                          onChange={(e) =>
                            setEditPlace({
                              ...editPlace,
                              activePromo: {
                                ...editPlace.activePromo!,
                                title: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Selo de Desconto *
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 20% OFF ou Chopp em Dobro"
                            value={editPlace.activePromo?.discountBadge || ""}
                            onChange={(e) =>
                              setEditPlace({
                                ...editPlace,
                                activePromo: {
                                  ...editPlace.activePromo!,
                                  discountBadge: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Código do Cupom *
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: REDE20 ou VALENAPOLI"
                            value={editPlace.activePromo?.couponCode || ""}
                            onChange={(e) =>
                              setEditPlace({
                                ...editPlace,
                                activePromo: {
                                  ...editPlace.activePromo!,
                                  couponCode: e.target.value.toUpperCase().replace(/\s+/g, ""),
                                },
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Validade
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Válido até 30/11 ou Terça e Quarta"
                            value={editPlace.activePromo?.validUntil || ""}
                            onChange={(e) =>
                              setEditPlace({
                                ...editPlace,
                                activePromo: {
                                  ...editPlace.activePromo!,
                                  validUntil: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Regras / Descrição da Promoção
                        </label>
                        <textarea
                          placeholder="Ex: Válido exclusivamente para consumo no salão ou pedidos via WhatsApp até as 22h."
                          value={editPlace.activePromo?.description || ""}
                          onChange={(e) =>
                            setEditPlace({
                              ...editPlace,
                              activePromo: {
                                ...editPlace.activePromo!,
                                description: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs h-16 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================================================================= */}
              {/* ABA 4: CARDÁPIO INTERATIVO COM PEDIDO DIRETO */}
              {/* ================================================================= */}
              {formTab === "cardapio" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Itens em Destaque do Cardápio / Catálogo
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Cada prato ganha o botão &quot;Pedir no Zap&quot; com o nome e preço já preenchidos.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={adicionarItemCardapio}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1"
                    >
                      <span>+ Adicionar Item</span>
                    </button>
                  </div>

                  {(!editPlace.menuHighlights || editPlace.menuHighlights.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                      <span className="text-2xl">🍔</span>
                      <p className="text-xs font-bold text-slate-700 mt-2">Nenhum prato adicionado ao cardápio</p>
                      <button
                        type="button"
                        onClick={adicionarItemCardapio}
                        className="mt-2 text-xs font-bold text-amber-600 underline"
                      >
                        + Adicionar primeiro prato
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editPlace.menuHighlights.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-black uppercase text-slate-400">
                              Item #{index + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moverItemCardapio(index, -1)}
                                disabled={index === 0}
                                className="w-6 h-6 rounded bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-30"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => moverItemCardapio(index, 1)}
                                disabled={index === editPlace.menuHighlights!.length - 1}
                                className="w-6 h-6 rounded bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-30"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={() => removerItemCardapio(index)}
                                className="w-6 h-6 rounded bg-red-100 text-red-600 text-xs font-bold hover:bg-red-200 ml-1"
                                title="Remover item"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                Nome do Prato / Serviço *
                              </label>
                              <input
                                required
                                type="text"
                                placeholder="Ex: Pizza Margherita D.O.P."
                                value={item.name}
                                onChange={(e) => atualizarItemCardapio(index, { name: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                Preço em R$ *
                              </label>
                              <input
                                required
                                type="number"
                                step="0.01"
                                placeholder="Ex: 59.90"
                                value={item.price || ""}
                                onChange={(e) =>
                                  atualizarItemCardapio(index, { price: parseFloat(e.target.value) || 0 })
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                Descrição Curta (Ingredientes, etc.)
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Molho de tomate San Marzano, mozzarella di bufala e manjericão"
                                value={item.description}
                                onChange={(e) =>
                                  atualizarItemCardapio(index, { description: e.target.value })
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                Selo (Opcional)
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Mais Pedido ou Novidade"
                                value={item.badge || ""}
                                onChange={(e) => atualizarItemCardapio(index, { badge: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                              />
                            </div>
                          </div>

                          {/* Foto do Prato */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                              Foto do Prato (Upload para Supabase Storage ou URL)
                            </label>
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt="Foto do item"
                                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploadingMenuItemId(item.id);
                                  try {
                                    const url = await fazerUploadArquivo(file, "onde-ir/menu");
                                    atualizarItemCardapio(index, { image: url });
                                  } catch (err: any) {
                                    alert("Erro no upload: " + err.message);
                                  } finally {
                                    setUploadingMenuItemId(null);
                                  }
                                }}
                                className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-slate-200"
                              />
                              {uploadingMenuItemId === item.id && (
                                <span className="text-xs text-amber-600 font-bold">Enviando...</span>
                              )}
                              <input
                                type="url"
                                placeholder="Ou link da imagem..."
                                value={item.image || ""}
                                onChange={(e) =>
                                  atualizarItemCardapio(index, { image: e.target.value })
                                }
                                className="flex-1 px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Botões do Rodapé do Modal */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {saving ? "Salvando no Banco..." : editPlace.id ? "Salvar Alterações" : "Cadastrar Local"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
