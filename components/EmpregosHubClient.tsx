"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  Wrench,
  PlusCircle,
  Search,
  MapPin,
  X,
  CheckCircle,
  ExternalLink,
  MessageCircle,
  Building,
  Clock,
  Sparkles,
  Phone,
} from "lucide-react";
import {
  AutonomoItem,
  CATEGORIAS_AUTONOMOS,
} from "@/lib/autonomos-data";
import { CIDADES_VALE } from "@/lib/classificados-data";

interface JobItem {
  id: string;
  vaga?: string;
  cargo?: string;
  empresa?: string;
  cidade_slug?: string;
  cidade?: string;
  tipo?: string;
  descricao?: string;
  contato?: string;
  created_at?: string;
}

interface EmpregosHubClientProps {
  initialVagas: JobItem[];
  initialAutonomos: AutonomoItem[];
}

export default function EmpregosHubClient({
  initialVagas = [],
  initialAutonomos = [],
}: EmpregosHubClientProps) {
  // Aba ativa: "vagas" ou "autonomos"
  const [abaAtiva, setAbaAtiva] = useState<"vagas" | "autonomos">("vagas");

  // Dados
  const [vagas, setVagas] = useState<JobItem[]>(initialVagas);
  const [autonomos, setAutonomos] = useState<AutonomoItem[]>(initialAutonomos);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [busca, setBusca] = useState("");
  const [cidadeFiltro, setCidadeFiltro] = useState("Todas");
  const [categoriaAutonomo, setCategoriaAutonomo] = useState("todos");

  // Modais de Cadastro
  const [modalTipo, setModalTipo] = useState<"vaga" | "autonomo" | null>(null);

  // Formulário: Vaga
  const [vagaCargo, setVagaCargo] = useState("");
  const [vagaEmpresa, setVagaEmpresa] = useState("");
  const [vagaCidade, setVagaCidade] = useState("Apucarana");
  const [vagaTipo, setVagaTipo] = useState("CLT Integral");
  const [vagaSalario, setVagaSalario] = useState("A combinar");
  const [vagaDescricao, setVagaDescricao] = useState("");
  const [vagaContato, setVagaContato] = useState("");

  // Formulário: Autônomo
  const [autoNome, setAutoNome] = useState("");
  const [autoProfissao, setAutoProfissao] = useState("");
  const [autoCategoria, setAutoCategoria] = useState("Construção & Reforma");
  const [autoCidade, setAutoCidade] = useState("Apucarana");
  const [autoDescricao, setAutoDescricao] = useState("");
  const [autoWhatsApp, setAutoWhatsApp] = useState("");

  // Feedback de envio
  const [enviando, setEnviando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  // Recarregar dados da API
  const recarregarDados = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/empregos");
      const json = await res.json();
      if (json.success) {
        if (Array.isArray(json.vagas)) setVagas(json.vagas);
        if (Array.isArray(json.autonomos)) setAutonomos(json.autonomos);
      }
    } catch (e) {
      console.warn("Erro ao recarregar empregos e autônomos:", e);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem de Vagas
  const vagasFiltradas = useMemo(() => {
    return vagas.filter((v) => {
      // Cidade
      if (cidadeFiltro !== "Todas") {
        const cTerm = cidadeFiltro.toLowerCase();
        const vCidade = (v.cidade_slug || v.cidade || "").toLowerCase().replace(/-/g, " ");
        if (!vCidade.includes(cTerm)) return false;
      }
      // Busca
      if (busca.trim()) {
        const b = busca.toLowerCase().trim();
        const cargo = (v.vaga || v.cargo || "").toLowerCase();
        const empresa = (v.empresa || "").toLowerCase();
        const desc = (v.descricao || "").toLowerCase();
        if (!cargo.includes(b) && !empresa.includes(b) && !desc.includes(b)) {
          return false;
        }
      }
      return true;
    });
  }, [vagas, cidadeFiltro, busca]);

  // Filtragem de Autônomos
  const autonomosFiltrados = useMemo(() => {
    return autonomos.filter((a) => {
      // Cidade
      if (cidadeFiltro !== "Todas") {
        const cTerm = cidadeFiltro.toLowerCase();
        const aCidade = (a.cidade || a.cidade_slug || "").toLowerCase().replace(/-/g, " ");
        if (!aCidade.includes(cTerm)) return false;
      }
      // Categoria
      if (categoriaAutonomo !== "todos") {
        const catObj = CATEGORIAS_AUTONOMOS.find((c) => c.id === categoriaAutonomo);
        if (catObj && !a.categoria.toLowerCase().includes(catObj.nome.toLowerCase())) {
          return false;
        }
      }
      // Busca
      if (busca.trim()) {
        const b = busca.toLowerCase().trim();
        const nome = a.nome.toLowerCase();
        const prof = a.profissao.toLowerCase();
        const desc = a.descricao.toLowerCase();
        if (!nome.includes(b) && !prof.includes(b) && !desc.includes(b)) {
          return false;
        }
      }
      return true;
    });
  }, [autonomos, cidadeFiltro, categoriaAutonomo, busca]);

  // Submeter Vaga
  const handleSubmitVaga = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro("");
    setMensagemSucesso("");

    if (!vagaCargo.trim() || !vagaContato.trim() || !vagaDescricao.trim()) {
      setMensagemErro("Por favor, preencha o cargo, contato e a descrição.");
      return;
    }

    try {
      setEnviando(true);
      const res = await fetch("/api/empregos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_anuncio: "vaga",
          cargo: vagaCargo,
          empresa: vagaEmpresa || "Empresa Local",
          cidade: vagaCidade,
          tipo: vagaTipo,
          salario: vagaSalario,
          descricao: vagaDescricao,
          contato: vagaContato,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erro ao publicar vaga");
      }

      setMensagemSucesso("Vaga cadastrada e publicada com sucesso!");
      setVagaCargo("");
      setVagaEmpresa("");
      setVagaDescricao("");
      setVagaContato("");
      await recarregarDados();
      setTimeout(() => {
        setModalTipo(null);
        setMensagemSucesso("");
      }, 1500);
    } catch (err: any) {
      setMensagemErro(err.message || "Erro de conexão ao salvar vaga.");
    } finally {
      setEnviando(false);
    }
  };

  // Submeter Autônomo
  const handleSubmitAutonomo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro("");
    setMensagemSucesso("");

    if (!autoNome.trim() || !autoProfissao.trim() || !autoWhatsApp.trim() || !autoDescricao.trim()) {
      setMensagemErro("Por favor, preencha nome, profissão, WhatsApp e resumo do serviço.");
      return;
    }

    try {
      setEnviando(true);
      const res = await fetch("/api/empregos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_anuncio: "autonomo",
          nome: autoNome,
          profissao: autoProfissao,
          categoria: autoCategoria,
          cidade: autoCidade,
          descricao: autoDescricao,
          whatsapp: autoWhatsApp,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erro ao cadastrar profissional");
      }

      setMensagemSucesso("Profissional autônomo cadastrado com sucesso!");
      setAutoNome("");
      setAutoProfissao("");
      setAutoDescricao("");
      setAutoWhatsApp("");
      await recarregarDados();
      setTimeout(() => {
        setModalTipo(null);
        setMensagemSucesso("");
      }, 1500);
    } catch (err: any) {
      setMensagemErro(err.message || "Erro de conexão ao salvar autônomo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="w-full">
      {/* 1. SELETOR DE ABAS DUPLAS NO TOPO (Grande, Moderno e Touch-Friendly) */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-slate-200/90 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setAbaAtiva("vagas")}
            className={`flex-1 py-3.5 px-3 rounded-xl font-black text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
              abaAtiva === "vagas"
                ? "bg-white text-slate-900 shadow-md scale-[1.01]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <Briefcase className={`w-4 h-4 sm:w-5 sm:h-5 ${abaAtiva === "vagas" ? "text-blue-600" : "text-slate-500"}`} />
            <span>Vagas de Emprego</span>
            <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold ${
              abaAtiva === "vagas" ? "bg-blue-100 text-blue-800" : "bg-slate-300 text-slate-700"
            }`}>
              {vagas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("autonomos")}
            className={`flex-1 py-3.5 px-3 rounded-xl font-black text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
              abaAtiva === "autonomos"
                ? "bg-white text-slate-900 shadow-md scale-[1.01]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <Wrench className={`w-4 h-4 sm:w-5 sm:h-5 ${abaAtiva === "autonomos" ? "text-amber-600" : "text-slate-500"}`} />
            <span>Prestadores & Autônomos</span>
            <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold ${
              abaAtiva === "autonomos" ? "bg-amber-100 text-amber-800" : "bg-slate-300 text-slate-700"
            }`}>
              {autonomos.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. BOTÕES DE AÇÃO EM DESTAQUE NO TOPO (Grandes e chamativos) */}
      <div className="max-w-4xl mx-auto px-4 mt-4">
        {abaAtiva === "vagas" ? (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-blue-200">
                Para Empresas & Contratantes
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                Precisa Contratar no Vale do Ivaí?
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-lg">
                Publique sua vaga gratuitamente e receba currículos direto no seu WhatsApp em 27 cidades.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalTipo("vaga")}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white text-blue-900 font-black text-xs sm:text-sm shadow-md hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
              <span>➕ Anunciar Vaga Grátis</span>
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-100">
                Para Pedreiros, Diaristas, Eletricistas e Autônomos
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                Divulgue seu Trabalho e Serviços
              </h2>
              <p className="text-xs sm:text-sm text-amber-50 mt-1 max-w-lg">
                Cadastre seus serviços grátis e receba clientes da sua cidade chamando direto no seu WhatsApp.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalTipo("autonomo")}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-950 text-white font-black text-xs sm:text-sm shadow-md hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-amber-400" strokeWidth={2.5} />
              <span>➕ Sou Autônomo: Cadastrar Meu Serviço</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. BARRA DE BUSCA E FILTROS */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder={
                abaAtiva === "vagas"
                  ? "Buscar por cargo, profissão ou empresa..."
                  : "Buscar profissional (ex: Eletricista, Diarista, Pintor)..."
              }
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 text-xs sm:text-sm outline-none transition-all"
            />
          </div>

          {/* Seletor de Cidades */}
          <div className="w-full sm:w-56 shrink-0">
            <select
              value={cidadeFiltro}
              onChange={(e) => setCidadeFiltro(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="Todas">📍 Todas as Cidades</option>
              {CIDADES_VALE.filter((c) => c !== "Todas").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. FILTROS RÁPIDOS POR PÍLULAS (chips horizontais deslizáveis - Aba Autônomos) */}
        {abaAtiva === "autonomos" && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3 mt-1">
            {CATEGORIAS_AUTONOMOS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaAutonomo(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  categoriaAutonomo === cat.id
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. LISTAGEM DO CONTEÚDO */}
      <div className="max-w-4xl mx-auto px-4 my-6">
        {abaAtiva === "vagas" ? (
          /* =========================================================================
             LISTA DE VAGAS DE EMPREGO
             ========================================================================= */
          vagasFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vagasFiltradas.map((v) => {
                const zapNumber = (v.contato || "").replace(/\D/g, "");
                const zapUrl = `https://wa.me/55${zapNumber}?text=${encodeURIComponent(
                  `Olá! Vi a vaga de *${v.vaga || v.cargo}* na Rede Apucarana e gostaria de me candidatar.`
                )}`;

                return (
                  <article
                    key={v.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60">
                          📍 {v.cidade_slug ? v.cidade_slug.toUpperCase().replace(/-/g, " ") : "APUCARANA"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {v.tipo || "CLT"}
                        </span>
                      </div>

                      <h3 className="font-heading font-black text-lg text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                        {v.vaga || v.cargo || "Oportunidade de Trabalho"}
                      </h3>

                      <p className="text-xs font-bold text-slate-600 mt-1 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>Empresa: {v.empresa || "Confidencial"}</span>
                      </p>

                      {v.descricao && (
                        <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed whitespace-pre-line">
                          {v.descricao}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500 font-medium truncate">
                        {v.contato}
                      </span>

                      {zapNumber ? (
                        <a
                          href={zapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black shadow-sm transition-all inline-flex items-center gap-1.5 shrink-0"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Enviar Currículo</span>
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-slate-700">Ver Contato</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <span className="text-4xl block">💼</span>
              <h3 className="text-lg font-bold text-slate-800">
                Nenhuma vaga encontrada para esses filtros
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tente alterar a cidade ou o termo de busca.
              </p>
            </div>
          )
        ) : (
          /* =========================================================================
             LISTA DE PRESTADORES DE SERVIÇO & AUTÔNOMOS
             ========================================================================= */
          autonomosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {autonomosFiltrados.map((a) => {
                const zapNumber = a.whatsapp.replace(/\D/g, "");
                const zapUrl = `https://wa.me/55${zapNumber}?text=${encodeURIComponent(
                  `Olá ${a.nome}! Encontrei seu contato de *${a.profissao}* no portal Rede Apucarana e gostaria de solicitar um orçamento.`
                )}`;

                return (
                  <article
                    key={a.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Topo do Card com Categoria e Cidade */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
                          {a.categoria}
                        </span>
                        <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500" />
                          {a.cidade}
                        </span>
                      </div>

                      {/* Nome do Profissional */}
                      <h3 className="font-heading font-black text-lg text-slate-900 leading-snug group-hover:text-amber-600 transition-colors">
                        {a.nome}
                      </h3>

                      {/* Profissão em Destaque */}
                      <div className="mt-1.5 inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{a.profissao}</span>
                      </div>

                      {/* Descrição dos Serviços */}
                      {a.descricao && (
                        <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed whitespace-pre-line">
                          {a.descricao}
                        </p>
                      )}
                    </div>

                    {/* Rodapé do Card com Botão de Orçamento no WhatsApp */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{a.whatsapp}</span>
                      </div>

                      <a
                        href={zapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black shadow-sm transition-all inline-flex items-center gap-1.5 shrink-0"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chamar no WhatsApp</span>
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <span className="text-4xl block">🛠️</span>
              <h3 className="text-lg font-bold text-slate-800">
                Nenhum prestador de serviço encontrado
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Seja o primeiro a divulgar seus serviços nesta categoria ou cidade!
              </p>
            </div>
          )
        )}
      </div>

      {/* =========================================================================
          MODAIS DE AUTO-PUBLICAÇÃO (Vagas ou Autônomos)
         ========================================================================= */}
      {modalTipo && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setModalTipo(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-600 block">
                  Publicação Gratuita no Vale do Ivaí
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                  {modalTipo === "vaga" ? "➕ Anunciar Vaga de Emprego" : "➕ Cadastrar Meu Serviço Autônomo"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalTipo(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mensagens de Feedback */}
            {mensagemSucesso && (
              <div className="my-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{mensagemSucesso}</span>
              </div>
            )}
            {mensagemErro && (
              <div className="my-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold">
                {mensagemErro}
              </div>
            )}

            {/* Formulário: Vaga */}
            {modalTipo === "vaga" && (
              <form onSubmit={handleSubmitVaga} className="space-y-3.5 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cargo / Título da Vaga *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Vendedora Balcão, Auxiliar de Produção, Mecânico"
                    value={vagaCargo}
                    onChange={(e) => setVagaCargo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome da Empresa / Contratante
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Loja Central (ou Confidencial)"
                      value={vagaEmpresa}
                      onChange={(e) => setVagaEmpresa(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cidade da Vaga *
                    </label>
                    <select
                      value={vagaCidade}
                      onChange={(e) => setVagaCidade(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:border-blue-500 outline-none"
                    >
                      {CIDADES_VALE.filter((c) => c !== "Todas").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tipo de Contrato
                    </label>
                    <select
                      value={vagaTipo}
                      onChange={(e) => setVagaTipo(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:border-blue-500 outline-none"
                    >
                      <option value="CLT Integral">CLT Integral</option>
                      <option value="CLT Meio Período">CLT Meio Período</option>
                      <option value="Temporário / Safra">Temporário / Safra</option>
                      <option value="Estágio / Jovem Aprendiz">Estágio / Jovem Aprendiz</option>
                      <option value="Freelancer / Diária">Freelancer / Diária</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Salário / Remuneração
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: R$ 2.200,00 ou A combinar"
                      value={vagaSalario}
                      onChange={(e) => setVagaSalario(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp para Recebimento de Currículos *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(43) 99999-9999"
                    value={vagaContato}
                    onChange={(e) => setVagaContato(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descrição da Vaga e Requisitos *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Descreva as atividades, horários de trabalho, benefícios e requisitos necessários..."
                    value={vagaDescricao}
                    onChange={(e) => setVagaDescricao(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {enviando ? "Publicando vaga..." : "Publicar Vaga Grátis Agora"}
                </button>
              </form>
            )}

            {/* Formulário: Autônomo */}
            {modalTipo === "autonomo" && (
              <form onSubmit={handleSubmitAutonomo} className="space-y-3.5 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Seu Nome / Nome Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Encanador, Maria Faxinas, Mestre Zé Pedreiro"
                    value={autoNome}
                    onChange={(e) => setAutoNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Profissão / Especialidade *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Eletricista, Diarista, Pintor, Encanador"
                      value={autoProfissao}
                      onChange={(e) => setAutoProfissao(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoria do Serviço *
                    </label>
                    <select
                      value={autoCategoria}
                      onChange={(e) => setAutoCategoria(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:border-amber-500 outline-none"
                    >
                      {CATEGORIAS_AUTONOMOS.filter((c) => c.id !== "todos").map((c) => (
                        <option key={c.id} value={c.nome}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cidade Base de Atendimento *
                    </label>
                    <select
                      value={autoCidade}
                      onChange={(e) => setAutoCidade(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:border-amber-500 outline-none"
                    >
                      {CIDADES_VALE.filter((c) => c !== "Todas").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Seu WhatsApp para Contato *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(43) 99999-9999"
                      value={autoWhatsApp}
                      onChange={(e) => setAutoWhatsApp(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Resumo dos Serviços e Experiência *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Descreva os serviços que você executa, tempo de experiência, se atende emergências e cidades vizinhas..."
                    value={autoDescricao}
                    onChange={(e) => setAutoDescricao(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {enviando ? "Cadastrando profissional..." : "Cadastrar Meu Serviço Gratuitamente"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
