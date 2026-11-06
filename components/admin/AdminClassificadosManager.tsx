"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ClassifiedAdItem,
  CLASSIFICADOS_CATEGORIAS,
  CIDADES_VALE,
  normalizeClassifiedAd,
} from "@/lib/classificados-data";
import { compressImageClient } from "@/lib/image-compression";

export default function AdminClassificadosManager() {
  const hasFetchedRef = useRef(false);
  const [ads, setAds] = useState<ClassifiedAdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"todos" | "pending" | "published">("todos");
  const [filtroCidade, setFiltroCidade] = useState("Todas");
  const [busca, setBusca] = useState("");

  // Formulário de Cadastro/Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formTitulo, setFormTitulo] = useState("");
  const [formCategoria, setFormCategoria] = useState("Veículos & Motos");
  const [formCidade, setFormCidade] = useState("Apucarana");
  const [formPreco, setFormPreco] = useState("");
  const [formContato, setFormContato] = useState("");
  const [formNome, setFormNome] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formAceitaTroca, setFormAceitaTroca] = useState(false);
  const [formUrgente, setFormUrgente] = useState(false);
  const [formStatus, setFormStatus] = useState<"published" | "pending">("published");

  // Fotos (array de dataUrl ou URLs existentes)
  const [fotos, setFotos] = useState<string[]>([]);
  const [comprimindo, setComprimindo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega anúncios reais do banco
  const carregarAnuncios = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/classificados?all=true");
      const json = await res.json();
      if (json.success && Array.isArray(json.ads)) {
        // Mantém apenas os anúncios reais que estão salvos no Supabase
        const reais = json.ads.filter((a: ClassifiedAdItem) => !a.is_mock);
        setAds(reais);
      }
    } catch (e) {
      console.error("Erro ao carregar anúncios:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    void carregarAnuncios();
  }, []);

  // Contadores
  const totalPendentes = ads.filter((a) => a.status === "pending").length;
  const totalPublicados = ads.filter((a) => a.status === "published").length;

  // Filtragem
  const adsFiltrados = ads.filter((ad) => {
    if (filterTab === "pending" && ad.status !== "pending") return false;
    if (filterTab === "published" && ad.status !== "published") return false;
    if (filtroCidade !== "Todas" && ad.cidade.toLowerCase() !== filtroCidade.toLowerCase()) {
      return false;
    }
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const match = `${ad.titulo} ${ad.cidade} ${ad.contato} ${ad.preco} ${ad.descricao}`.toLowerCase();
      if (!match.includes(termo)) return false;
    }
    return true;
  });

  // Ação de 1 Clique: Aprovar Anúncio Pendente
  const handleAprovar = async (id: string) => {
    try {
      const res = await fetch("/api/classificados", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "published" }),
      });
      const data = await res.json();
      if (data.success) {
        setAds((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "published" } : a))
        );
      } else {
        alert("Erro ao aprovar: " + data.error);
      }
    } catch (e: any) {
      alert("Erro ao conectar: " + e.message);
    }
  };

  // Ação de 1 Clique: Ocultar / Pausar
  const handlePausar = async (id: string) => {
    try {
      const res = await fetch("/api/classificados", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "pending" }),
      });
      const data = await res.json();
      if (data.success) {
        setAds((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "pending" } : a))
        );
      } else {
        alert("Erro ao pausar: " + data.error);
      }
    } catch (e: any) {
      alert("Erro ao conectar: " + e.message);
    }
  };

  // Excluir Anúncio
  const handleExcluir = async (id: string, titulo: string) => {
    if (!confirm(`Deseja realmente excluir o anúncio "${titulo}"?`)) return;

    try {
      const res = await fetch(`/api/classificados?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAds((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert("Erro ao excluir: " + data.error);
      }
    } catch (e: any) {
      alert("Erro ao conectar: " + e.message);
    }
  };

  // Prepara Edição
  const iniciarEdicao = (ad: ClassifiedAdItem) => {
    setEditId(ad.id);
    setFormTitulo(ad.titulo);
    setFormCategoria(ad.categoria);
    setFormCidade(ad.cidade);
    setFormPreco(ad.preco);
    setFormContato(ad.contato);
    setFormNome(ad.nome_anunciante || "");
    setFormDescricao(ad.descricao);
    setFormAceitaTroca(Boolean(ad.aceita_troca));
    setFormUrgente(Boolean(ad.urgente));
    setFormStatus(ad.status);
    setFotos(ad.fotos && ad.fotos.length > 0 ? ad.fotos : [ad.imagem]);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Limpa formulário
  const resetForm = () => {
    setEditId(null);
    setFormTitulo("");
    setFormCategoria("Veículos & Motos");
    setFormCidade("Apucarana");
    setFormPreco("");
    setFormContato("");
    setFormNome("");
    setFormDescricao("");
    setFormAceitaTroca(false);
    setFormUrgente(false);
    setFormStatus("published");
    setFotos([]);
    setIsEditing(false);
  };

  // Seleção e compressão client-side no Admin (até 3 fotos)
  const handleUploadFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const restantes = 3 - fotos.length;
    if (restantes <= 0) {
      alert("Limite de 3 fotos já atingido.");
      return;
    }

    setComprimindo(true);
    try {
      const novas: string[] = [];
      for (const file of Array.from(files).slice(0, restantes)) {
        const res = await compressImageClient(file, 1200, 0.8);
        novas.push(res.dataUrl);
      }
      setFotos((prev) => [...prev, ...novas]);
    } catch (err: any) {
      alert("Erro ao processar imagem: " + err.message);
    } finally {
      setComprimindo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Salvar anúncio (Novo ou Edição)
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formContato.trim() || !formDescricao.trim()) {
      alert("Preencha título, contato e descrição.");
      return;
    }

    setSalvando(true);
    try {
      if (editId) {
        // Atualização via PATCH
        const res = await fetch("/api/classificados", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editId,
            titulo: formTitulo.trim(),
            categoria: formCategoria,
            cidade: formCidade,
            preco: formPreco.trim() || "A Combinar",
            descricao: formDescricao.trim(),
            contato: formContato.trim(),
            status: formStatus,
            fotos: fotos,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        alert("Anúncio atualizado com sucesso!");
      } else {
        // Criação via POST
        const res = await fetch("/api/classificados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: formTitulo.trim(),
            categoria: formCategoria,
            cidade: formCidade,
            preco: formPreco.trim() || "A Combinar",
            descricao: formDescricao.trim(),
            contato: formContato.trim(),
            nome_anunciante: formNome.trim() || "Anunciante",
            aceita_troca: formAceitaTroca,
            urgente: formUrgente,
            status: formStatus,
            fotos: fotos,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        alert("Anúncio cadastrado com sucesso!");
      }

      resetForm();
      await carregarAnuncios();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO COM CONTADORES E BOTÃO DE NOVO ANÚNCIO                        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-600">
            Painel de Moderação & Gestão
          </span>
          <h2 className="text-2xl font-black text-slate-900 font-heading">
            Classificados do Vale do Ivaí
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Modere envios de usuários públicos, aprove com 1 clique e cadastre anúncios oficiais.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5">
              {totalPendentes > 0 ? (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              ) : (
                <span>⏳</span>
              )}
              <span>{totalPendentes} pendentes</span>
            </span>

            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
              <span>✅</span>
              <span>{totalPublicados} publicados</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isEditing) resetForm();
              else setIsEditing(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>{isEditing ? "✕ Cancelar Edição" : "➕ Novo Anúncio"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FORMULÁRIO DE CADASTRO / EDIÇÃO                                        */}
      {/* ========================================================================= */}
      {isEditing && (
        <form
          onSubmit={handleSalvar}
          className="bg-white rounded-2xl p-6 border-2 border-amber-400 shadow-md space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              {editId ? "✏️ Editar Anúncio" : "➕ Cadastrar Novo Anúncio Oficial"}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Fechar ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Título do Anúncio *
              </label>
              <input
                type="text"
                required
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder="Ex: Honda CG 160 Titan 2022"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoria
                </label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option>Veículos & Motos</option>
                  <option>Imóveis & Aluguel</option>
                  <option>Celulares & Eletrônicos</option>
                  <option>Móveis & Casa</option>
                  <option>Agro & Ferramentas</option>
                  <option>Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cidade
                </label>
                <select
                  value={formCidade}
                  onChange={(e) => setFormCidade(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  {CIDADES_VALE.filter((c) => c !== "Todas").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preço Formatado (R$)
              </label>
              <input
                type="text"
                value={formPreco}
                onChange={(e) => setFormPreco(e.target.value)}
                placeholder="Ex: R$ 15.800 ou A Combinar"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Contato *
                </label>
                <input
                  type="text"
                  required
                  value={formContato}
                  onChange={(e) => setFormContato(e.target.value)}
                  placeholder="Ex: 43 99988-7766"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-bold"
                >
                  <option value="published">✅ Publicado (Visível)</option>
                  <option value="pending">⏳ Pendente (Oculto)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Gatilhos de Engajamento */}
          <div className="flex gap-4 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formAceitaTroca}
                onChange={(e) => setFormAceitaTroca(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span>🤝 Aceito Troca / Rolo</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formUrgente}
                onChange={(e) => setFormUrgente(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span>⚡ Venda Urgente / Oportunidade</span>
            </label>
          </div>

          {/* Fotos com Compressão Automática */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Fotos ({fotos.length}/3) · Sem limite de 1,5 MB (Compressão automática WebP)
              </label>
            </div>

            <div className="flex gap-3 mb-2 flex-wrap">
              {fotos.map((f, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-300 group"
                >
                  <img
                    src={f}
                    alt="Foto"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {fotos.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={comprimindo}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-500 flex flex-col items-center justify-center text-xs font-bold text-slate-500 hover:text-amber-700 transition-colors"
                >
                  <span>{comprimindo ? "⏳" : "➕ Foto"}</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadFotos}
              className="hidden"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descrição Completa *
            </label>
            <textarea
              required
              rows={3}
              value={formDescricao}
              onChange={(e) => setFormDescricao(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || comprimindo}
              className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm disabled:opacity-60"
            >
              {salvando ? "Salvando..." : editId ? "Salvar Alterações" : "Publicar Anúncio"}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 3. FILTROS E LISTA DE ANÚNCIOS DO SUPABASE                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
        {/* Barra de Abas (Todos / Pendentes / Publicados) + Busca */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setFilterTab("todos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterTab === "todos"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Todos ({ads.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                filterTab === "pending"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-amber-700 hover:text-amber-800"
              }`}
            >
              <span>⏳ Pendentes ({totalPendentes})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("published")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterTab === "published"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-700 hover:text-emerald-800"
              }`}
            >
              Publicados ({totalPublicados})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar por título, cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs w-48 sm:w-60 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            <select
              value={filtroCidade}
              onChange={(e) => setFiltroCidade(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
            >
              {CIDADES_VALE.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela / Cards de Anúncios */}
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Carregando anúncios do banco...
          </div>
        ) : adsFiltrados.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhum anúncio encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {adsFiltrados.map((ad) => {
              const isPendente = ad.status === "pending";

              return (
                <div
                  key={ad.id}
                  className={`py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl transition-colors ${
                    isPendente ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-slate-50"
                  }`}
                >
                  {/* Foto + Informações */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      <img
                        src={ad.imagem}
                        alt={ad.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 leading-tight">
                          {ad.titulo}
                        </span>
                        {isPendente ? (
                          <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-md">
                            Aguardando Aprovação
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md">
                            Publicado
                          </span>
                        )}
                        {ad.aceita_troca && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            🤝 Troca
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2 items-center">
                        <span className="font-extrabold text-slate-900">
                          {ad.preco}
                        </span>
                        <span>•</span>
                        <span>📍 {ad.cidade}</span>
                        <span>•</span>
                        <span>{ad.categoria}</span>
                        <span>•</span>
                        <span>📞 {ad.contato}</span>
                        {ad.fotos && ad.fotos.length > 1 && (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded">
                            📷 {ad.fotos.length} fotos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AÇÕES DE 1 CLIQUE */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Botão de 1 Clique: Aprovar */}
                    {isPendente ? (
                      <button
                        type="button"
                        onClick={() => handleAprovar(ad.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors shadow-2xs flex items-center gap-1"
                        title="Aprovar e publicar anúncio imediatamente"
                      >
                        <span>✅</span>
                        <span>Aprovar</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePausar(ad.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        title="Pausar / Ocultar anúncio da vitrine"
                      >
                        ⏸️ Pausar
                      </button>
                    )}

                    {/* Botão de Testar WhatsApp */}
                    {ad.contato && (
                      <a
                        href={`https://wa.me/55${ad.contato.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
                        title="Abrir WhatsApp do anunciante"
                      >
                        💬 Zap
                      </a>
                    )}

                    {/* Botão Editar */}
                    <button
                      type="button"
                      onClick={() => iniciarEdicao(ad)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
                    >
                      ✏️ Editar
                    </button>

                    {/* Botão Excluir */}
                    <button
                      type="button"
                      onClick={() => handleExcluir(ad.id, ad.titulo)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 text-xs font-bold transition-colors"
                      title="Excluir anúncio permanentemente"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
