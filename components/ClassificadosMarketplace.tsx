"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ClassifiedAdItem,
  CLASSIFICADOS_CATEGORIAS,
  CIDADES_VALE,
} from "@/lib/classificados-data";
import { compressImageClient } from "@/lib/image-compression";

interface ClassificadosMarketplaceProps {
  initialAds: ClassifiedAdItem[];
  cidadeFixa?: string;
}

export default function ClassificadosMarketplace({
  initialAds,
  cidadeFixa,
}: ClassificadosMarketplaceProps) {
  // Lista de anúncios
  const [ads, setAds] = useState<ClassifiedAdItem[]>(initialAds);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("todas");
  const [cidadeAtiva, setCidadeAtiva] = useState(
    cidadeFixa && cidadeFixa !== "Geral" ? cidadeFixa : "Todas"
  );
  const [somenteTroca, setSomenteTroca] = useState(false);
  const [somenteUrgente, setSomenteUrgente] = useState(false);

  // Modais
  const [anuncioModal, setAnuncioModal] = useState<ClassifiedAdItem | null>(null);
  const [fotoModalIndex, setFotoModalIndex] = useState(0);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Estado do Formulário de Anúncio
  const [formTitulo, setFormTitulo] = useState("");
  const [formCategoria, setFormCategoria] = useState("Veículos & Motos");
  const [formCidade, setFormCidade] = useState(
    cidadeFixa && cidadeFixa !== "Geral" ? cidadeFixa : "Apucarana"
  );
  const [formPreco, setFormPreco] = useState("");
  const [formContato, setFormContato] = useState("");
  const [formNome, setFormNome] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formAceitaTroca, setFormAceitaTroca] = useState(false);
  const [formUrgente, setFormUrgente] = useState(false);

  // Fotos comprimidas (até 3)
  const [fotosComprimidas, setFotosComprimidas] = useState<
    { dataUrl: string; sizeKb: number }[]
  >([]);
  const [comprimindo, setComprimindo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState("");
  const [erroMsg, setErroMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincroniza se a cidade fixa mudar via props
  useEffect(() => {
    if (cidadeFixa && cidadeFixa !== "Geral") {
      setCidadeAtiva(cidadeFixa);
    }
  }, [cidadeFixa]);

  // Recarregar anúncios da API
  const carregarAnuncios = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/classificados");
      const json = await res.json();
      if (json.success && Array.isArray(json.ads)) {
        setAds(json.ads);
      }
    } catch (e) {
      console.warn("Erro ao recarregar classificados:", e);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem no cliente (reativa e instantânea)
  const anunciosFiltrados = useMemo(() => {
    return ads.filter((ad) => {
      // Filtro de Cidade
      if (
        cidadeAtiva !== "Todas" &&
        ad.cidade.toLowerCase() !== cidadeAtiva.toLowerCase()
      ) {
        return false;
      }

      // Filtro de Categoria
      if (categoriaAtiva === "troca") {
        if (!ad.aceita_troca) return false;
      } else if (categoriaAtiva !== "todas") {
        const catObj = CLASSIFICADOS_CATEGORIAS.find(
          (c) => c.id === categoriaAtiva
        );
        if (
          catObj &&
          !ad.categoria.toLowerCase().includes(catObj.nome.toLowerCase())
        ) {
          return false;
        }
      }

      // Checkboxes Rápidos
      if (somenteTroca && !ad.aceita_troca) return false;
      if (somenteUrgente && !ad.urgente) return false;

      // Busca textual
      if (busca.trim()) {
        const termo = busca.toLowerCase().trim();
        const texto = `${ad.titulo} ${ad.descricao} ${ad.cidade} ${ad.categoria} ${ad.preco}`.toLowerCase();
        if (!texto.includes(termo)) return false;
      }

      return true;
    });
  }, [ads, cidadeAtiva, categoriaAtiva, somenteTroca, somenteUrgente, busca]);

  // Compressão client-side das fotos selecionadas
  const handleSelecionarFotos = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const restantes = 3 - fotosComprimidas.length;
    if (restantes <= 0) {
      alert("Você já adicionou o limite máximo de 3 fotos para este anúncio.");
      return;
    }

    const arquivosParaProcessar = Array.from(files).slice(0, restantes);
    setComprimindo(true);
    setErroMsg("");

    try {
      const novasFotos: { dataUrl: string; sizeKb: number }[] = [];

      for (const file of arquivosParaProcessar) {
        const res = await compressImageClient(file, 1200, 0.8);
        novasFotos.push({
          dataUrl: res.dataUrl,
          sizeKb: res.sizeKb,
        });
      }

      setFotosComprimidas((prev) => [...prev, ...novasFotos]);
    } catch (err: any) {
      console.error("Erro na compressão:", err);
      setErroMsg(err.message || "Erro ao processar as fotos selecionadas.");
    } finally {
      setComprimindo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removerFoto = (index: number) => {
    setFotosComprimidas((prev) => prev.filter((_, i) => i !== index));
  };

  // Envio do Anúncio para a API
  const handleSubmitAnuncio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formContato.trim() || !formDescricao.trim()) {
      setErroMsg("Por favor, preencha o título, contato de WhatsApp e descrição.");
      return;
    }

    setEnviando(true);
    setErroMsg("");
    setSucessoMsg("");

    try {
      const payload = {
        titulo: formTitulo.trim(),
        categoria: formCategoria,
        cidade: formCidade,
        preco: formPreco.trim() || "A Combinar",
        descricao: formDescricao.trim(),
        contato: formContato.trim(),
        nome_anunciante: formNome.trim() || "Anunciante Local",
        aceita_troca: formAceitaTroca,
        urgente: formUrgente,
        fotos: fotosComprimidas.map((f) => f.dataUrl),
        status: "pending",
      };

      const res = await fetch("/api/classificados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Não foi possível enviar seu anúncio.");
      }

      setSucessoMsg(
        "🎉 Seu anúncio foi enviado com sucesso! Ele foi encaminhado para a moderação da equipe e ficará visível em instantes."
      );

      // Limpa formulário
      setFormTitulo("");
      setFormPreco("");
      setFormContato("");
      setFormNome("");
      setFormDescricao("");
      setFormAceitaTroca(false);
      setFormUrgente(false);
      setFotosComprimidas([]);

      // Recarrega os anúncios
      await carregarAnuncios();

      // Fecha o modal após 3 segundos
      setTimeout(() => {
        setIsFormModalOpen(false);
        setSucessoMsg("");
      }, 3500);
    } catch (err: any) {
      setErroMsg(err.message || "Erro ao conectar com o servidor.");
    } finally {
      setEnviando(false);
    }
  };

  // Monta link do WhatsApp com mensagem viral pré-formatada
  const getWhatsAppLink = (ad: ClassifiedAdItem) => {
    const rawNum = ad.contato.replace(/\D/g, "");
    const ddiNum = rawNum.length <= 11 ? `55${rawNum}` : rawNum;
    const msg = `Olá! Vi seu anúncio "*${ad.titulo}*" (Valor: ${ad.preco}) nos Classificados da *Rede Apucarana* e tenho interesse! Ainda está disponível?`;
    return `https://wa.me/${ddiNum}?text=${encodeURIComponent(msg)}`;
  };

  // Compartilhamento viral nos grupos de WhatsApp
  const handleShareAd = (ad: ClassifiedAdItem) => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/comprasevendas?id=${ad.id}`
        : `https://www.redeapucarana.com.br/comprasevendas?id=${ad.id}`;

    const texto = `🛒 *Classificados Rede Apucarana*\n\nOlha esse anúncio em *${ad.cidade}*:\n"*${ad.titulo}*"\n💰 *Preço:* ${ad.preco}\n${ad.aceita_troca ? "🤝 *Aceita Troca / Rolo!*\n" : ""}${ad.urgente ? "⚡ *Oportunidade / Negociável!*\n" : ""}\nConfira fotos e contate o vendedor:\n${url}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: ad.titulo,
          text: texto,
          url: url,
        })
        .catch(() => {
          window.open(
            `https://wa.me/?text=${encodeURIComponent(texto)}`,
            "_blank"
          );
        });
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(texto)}`,
        "_blank"
      );
    }
  };

  return (
    <div className="w-full bg-[#f8fafc] text-slate-800 py-6 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* 1. HERO COMPACTO + CTA DE ALTO DESTAQUE                                   */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8 border border-amber-900/30">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Feira & Marketplace Regional
                </span>
                <span className="text-xs text-slate-300">
                  • 27 Cidades do Vale do Ivaí
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-white tracking-tight">
                Classificados & Rolo do Vale
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
                Compre, venda veículos, imóveis, eletrônicos ou faça troca direta com quem mora na sua cidade pelo WhatsApp.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="text-center sm:text-right hidden sm:block">
                <span className="block text-xl font-black text-amber-400">
                  {anunciosFiltrados.length}
                </span>
                <span className="text-[11px] text-slate-300 uppercase font-bold tracking-wider">
                  Anúncios Ativos
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsFormModalOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="text-lg">➕</span>
                <span>Anunciar Grátis (Em 1 Minuto)</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. BARRA DE BUSCA E FILTROS RÁPIDOS                                      */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 mb-6 space-y-4">
          {/* Linha 1: Input de Busca + Dropdown de Cidade */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                🔍
              </span>
              <input
                type="text"
                placeholder="O que você está procurando? (Ex: Moto Titan, iPhone 13, Casa para alugar, Gol...)"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50/50"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="sm:col-span-4 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                📍
              </span>
              <select
                value={cidadeAtiva}
                onChange={(e) => setCidadeAtiva(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50/50 cursor-pointer"
              >
                {CIDADES_VALE.map((c) => (
                  <option key={c} value={c}>
                    {c === "Todas" ? "Todas as 27 Cidades do Vale" : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha 2: Abas de Categorias estilo OLX (Scroll Horizontal no Mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CLASSIFICADOS_CATEGORIAS.map((cat) => {
              const ativa = categoriaAtiva === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    ativa
                      ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}

            {/* Separador e Filtros de Troca / Urgente */}
            <div className="h-6 w-px bg-slate-300 shrink-0 mx-1 hidden sm:block" />

            <button
              type="button"
              onClick={() => setSomenteTroca(!somenteTroca)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1 ${
                somenteTroca
                  ? "bg-amber-100 text-amber-800 border-amber-300 font-black shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>🤝</span>
              <span>Aceita Troca</span>
            </button>

            <button
              type="button"
              onClick={() => setSomenteUrgente(!somenteUrgente)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1 ${
                somenteUrgente
                  ? "bg-red-100 text-red-800 border-red-300 font-black shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>⚡</span>
              <span>Urgente / Preço Baixo</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. VITRINE DE ANÚNCIOS (GRID DE ALTO IMPACTO COM GATILHOS)               */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-600">
            Mostrando{" "}
            <span className="text-amber-700 font-black">
              {anunciosFiltrados.length}
            </span>{" "}
            anúncios em{" "}
            <span className="text-slate-900 font-black">
              {cidadeAtiva === "Todas" ? "todo o Vale do Ivaí" : cidadeAtiva}
            </span>
          </p>

          {(busca ||
            categoriaAtiva !== "todas" ||
            cidadeAtiva !== "Todas" ||
            somenteTroca ||
            somenteUrgente) && (
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setCategoriaAtiva("todas");
                setCidadeAtiva("Todas");
                setSomenteTroca(false);
                setSomenteUrgente(false);
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
            >
              Limpar todos os filtros ✕
            </button>
          )}
        </div>

        {anunciosFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-sm max-w-lg mx-auto">
            <span className="text-5xl block mb-3">🔍</span>
            <h3 className="text-lg font-bold text-slate-900">
              Nenhum anúncio encontrado com esses filtros
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Tente alterar a palavra-chave ou selecionar outra cidade do Vale do Ivaí.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setCategoriaAtiva("todas");
                setCidadeAtiva("Todas");
                setSomenteTroca(false);
                setSomenteUrgente(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Ver todos os anúncios
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {anunciosFiltrados.map((ad) => {
              const temMultiplasFotos = ad.fotos && ad.fotos.length > 1;

              return (
                <article
                  key={ad.id}
                  onClick={() => {
                    setAnuncioModal(ad);
                    setFotoModalIndex(0);
                  }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-amber-300 transition-all flex flex-col justify-between group cursor-pointer"
                >
                  {/* Foto Principal com Badges */}
                  <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden relative">
                    <img
                      src={ad.imagem}
                      alt={ad.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Badge de Multiplas Fotos */}
                    {temMultiplasFotos && (
                      <span className="absolute bottom-2.5 right-2.5 bg-slate-900/80 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-xs flex items-center gap-1 shadow-sm">
                        <span>📷</span>
                        <span>{ad.fotos.length} fotos</span>
                      </span>
                    )}

                    {/* Badges de Topo (Cidade e Categoria) */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      <span className="bg-slate-900/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        📍 {ad.cidade}
                      </span>
                      <span className="bg-amber-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {ad.categoria}
                      </span>
                    </div>

                    {/* Selos de Troca e Urgente */}
                    <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                      {ad.aceita_troca && (
                        <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm">
                          🤝 Aceita Troca
                        </span>
                      )}
                      {ad.urgente && (
                        <span className="bg-red-600 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm">
                          ⚡ Oportunidade
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Preço em Destaque */}
                      <div className="text-xl font-black text-slate-950 font-sans tracking-tight mb-1">
                        {ad.preco}
                      </div>

                      {/* Título */}
                      <h2 className="font-heading font-bold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors">
                        {ad.titulo}
                      </h2>

                      {/* Resumo da descrição */}
                      {ad.descricao && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {ad.descricao}
                        </p>
                      )}
                    </div>

                    {/* Rodapé do Card com CTA */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {ad.is_mock ? "Verificado RA" : "Anúncio do Vale"}
                      </span>

                      <span className="text-xs font-extrabold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1">
                        <span>Ver & Negociar</span>
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. MODAL DE DETALHES DO PRODUTO + MOTOR VIRAL DE WHATSAPP                 */}
        {/* ========================================================================= */}
        {anuncioModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative my-auto">
              {/* Botão de Fechar */}
              <button
                type="button"
                onClick={() => setAnuncioModal(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                title="Fechar detalhes"
              >
                ✕
              </button>

              {/* Galeria de Fotos com Navegação */}
              <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden rounded-t-3xl">
                <img
                  src={anuncioModal.fotos[fotoModalIndex] || anuncioModal.imagem}
                  alt={anuncioModal.titulo}
                  className="w-full h-full object-contain"
                />

                {anuncioModal.fotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setFotoModalIndex((prev) =>
                          prev === 0 ? anuncioModal.fotos.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center font-bold text-base transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFotoModalIndex((prev) =>
                          prev === anuncioModal.fotos.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center font-bold text-base transition-colors"
                    >
                      ›
                    </button>
                  </>
                )}

                {/* Contador de fotos */}
                <span className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs">
                  Foto {fotoModalIndex + 1} de {anuncioModal.fotos.length}
                </span>
              </div>

              {/* Miniaturas das Fotos */}
              {anuncioModal.fotos.length > 1 && (
                <div className="flex gap-2 p-3 bg-slate-100 border-b border-slate-200 overflow-x-auto">
                  {anuncioModal.fotos.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFotoModalIndex(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        fotoModalIndex === i
                          ? "border-amber-600 scale-95 shadow-md"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={f}
                        alt="Miniatura"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Corpo dos Detalhes */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  {/* Badges e Localização */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-md border border-slate-200">
                      📍 {anuncioModal.cidade}
                    </span>
                    <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-md border border-amber-200">
                      {anuncioModal.categoria}
                    </span>
                    {anuncioModal.aceita_troca && (
                      <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-md">
                        🤝 Aceita Troca / Rolo
                      </span>
                    )}
                    {anuncioModal.urgente && (
                      <span className="bg-red-600 text-white text-xs font-black px-2.5 py-0.5 rounded-md">
                        ⚡ Venda Urgente / Negociável
                      </span>
                    )}
                  </div>

                  {/* Preço Grande */}
                  <div className="text-3xl sm:text-4xl font-black text-slate-950 font-sans tracking-tight mb-2">
                    {anuncioModal.preco}
                  </div>

                  {/* Título */}
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                    {anuncioModal.titulo}
                  </h2>
                </div>

                {/* Descrição */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Descrição do Produto / Negócio
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {anuncioModal.descricao}
                  </p>
                </div>

                {/* Box de Segurança */}
                <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/90 text-xs text-amber-900 space-y-1">
                  <strong className="block font-bold flex items-center gap-1.5 text-amber-950">
                    <span>🛡️</span>
                    <span>Dicas de Segurança Rede Apucarana:</span>
                  </strong>
                  <p className="leading-relaxed">
                    Marque encontros sempre em locais públicos e movimentados de sua cidade (postos, praças, shoppings). Nunca faça transferências ou PIX antecipados sem antes ver e testar o produto pessoalmente.
                  </p>
                </div>

                {/* BOTÕES DE CONVERSÃO VIRAL */}
                <div className="space-y-3 pt-2">
                  {/* Botão Principal: Chamar Vendedor */}
                  <a
                    href={getWhatsAppLink(anuncioModal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-base py-4 rounded-2xl shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition-all text-center"
                  >
                    <span className="text-2xl">💬</span>
                    <span>Chamar Vendedor no WhatsApp</span>
                  </a>

                  {/* Botão Viral: Compartilhar no Zap */}
                  <button
                    type="button"
                    onClick={() => handleShareAd(anuncioModal)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm py-3 rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>📲</span>
                    <span>Compartilhar este Anúncio nos Grupos de Zap</span>
                  </button>
                </div>

                {/* Seção "Veja Também no Vale do Ivaí" */}
                <div className="pt-6 border-t border-slate-200">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                    👀 Veja Também no Vale do Ivaí
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ads
                      .filter((x) => x.id !== anuncioModal.id)
                      .slice(0, 3)
                      .map((outro) => (
                        <div
                          key={outro.id}
                          onClick={() => {
                            setAnuncioModal(outro);
                            setFotoModalIndex(0);
                          }}
                          className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 hover:border-amber-400 cursor-pointer transition-all flex flex-col justify-between"
                        >
                          <div className="aspect-[4/3] w-full rounded-lg bg-slate-200 overflow-hidden mb-2">
                            <img
                              src={outro.imagem}
                              alt={outro.titulo}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 block truncate">
                              {outro.preco}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600 block line-clamp-1 leading-snug">
                              {outro.titulo}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              📍 {outro.cidade}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. MODAL DE CADASTRO ("ANUNCIAR GRÁTIS EM 1 MINUTO")                       */}
        {/* ========================================================================= */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative my-auto">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>

              <div className="p-6 sm:p-8">
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <span className="text-[11px] font-black uppercase text-amber-600 tracking-wider">
                    Anuncie Grátis no Vale do Ivaí
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 font-heading">
                    Criar Anúncio de Compra / Venda
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Preencha os dados abaixo. Você pode enviar até 3 fotos direto da câmera do seu celular!
                  </p>
                </div>

                {sucessoMsg ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                    <span className="text-4xl block">🎉</span>
                    <h4 className="text-base font-bold text-emerald-900">
                      Anúncio Enviado com Sucesso!
                    </h4>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      {sucessoMsg}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitAnuncio} className="space-y-4">
                    {erroMsg && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                        ⚠️ {erroMsg}
                      </div>
                    )}

                    {/* Título */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Título do Anúncio *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Honda CG 160 Titan 2022 Azul Impecável"
                        value={formTitulo}
                        onChange={(e) => setFormTitulo(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Categoria + Cidade */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Categoria *
                        </label>
                        <select
                          value={formCategoria}
                          onChange={(e) => setFormCategoria(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white cursor-pointer"
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
                          Sua Cidade no Vale *
                        </label>
                        <select
                          value={formCidade}
                          onChange={(e) => setFormCidade(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white cursor-pointer"
                        >
                          {CIDADES_VALE.filter((c) => c !== "Todas").map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Preço + WhatsApp */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Valor (R$)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: R$ 15.800 (ou A Combinar)"
                          value={formPreco}
                          onChange={(e) => setFormPreco(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          WhatsApp para Contato *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 43 99988-7766"
                          value={formContato}
                          onChange={(e) => setFormContato(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Gatilhos de Engajamento: Checkboxes de Troca e Urgente */}
                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 space-y-2">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={formAceitaTroca}
                          onChange={(e) => setFormAceitaTroca(e.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                        />
                        <span>🤝 Aceito Troca / Rolo por outro item</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={formUrgente}
                          onChange={(e) => setFormUrgente(e.target.checked)}
                          className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                        />
                        <span>⚡ Venda Urgente / Preço Negociável</span>
                      </label>
                    </div>

                    {/* FIM DO LIMITE DE 1,5 MB: SELETOR DE ATÉ 3 FOTOS COM COMPRESSÃO AUTOMÁTICA */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Fotos do Anúncio ({fotosComprimidas.length}/3)
                        </label>
                        <span className="text-[11px] text-emerald-700 font-bold">
                          Compressão automática ativada ⚡
                        </span>
                      </div>

                      {/* Grade de Preview das fotos adicionadas */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {fotosComprimidas.map((f, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-xl overflow-hidden border border-slate-300 bg-slate-100 group"
                          >
                            <img
                              src={f.dataUrl}
                              alt={`Foto ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                              {f.sizeKb} KB
                            </span>
                            <button
                              type="button"
                              onClick={() => removerFoto(idx)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xs shadow-md hover:bg-red-700"
                              title="Remover foto"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        {/* Botão de Adicionar mais fotos se < 3 */}
                        {fotosComprimidas.length < 3 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={comprimindo}
                            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/40 text-slate-500 hover:text-amber-700 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer p-2 text-center"
                          >
                            <span className="text-xl">
                              {comprimindo ? "⏳" : "📷"}
                            </span>
                            <span className="text-[11px] font-bold leading-tight">
                              {comprimindo ? "Otimizando..." : "+ Foto"}
                            </span>
                          </button>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleSelecionarFotos}
                        className="hidden"
                      />
                      <p className="text-[11px] text-slate-400">
                        Aceita qualquer foto do celular (mesmo 10 MB ou 15 MB). O sistema comprime transparentemente para WebP leve sem travar.
                      </p>
                    </div>

                    {/* Descrição */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Descrição Completa *
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Descreva o estado de conservação, detalhes, motivo da venda, o que aceita em caso de troca..."
                        value={formDescricao}
                        onChange={(e) => setFormDescricao(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Botão Submit */}
                    <button
                      type="submit"
                      disabled={enviando || comprimindo}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-sm shadow-md transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {enviando
                        ? "Enviando anúncio..."
                        : comprimindo
                        ? "Otimizando fotos..."
                        : "🚀 Publicar Anúncio Grátis"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
