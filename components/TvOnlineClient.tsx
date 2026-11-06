"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tv,
  Radio,
  Share2,
  MessageCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Play,
  ChevronRight,
  ShieldCheck,
  Building2,
  Film,
  ExternalLink,
  Volume2,
} from "lucide-react";
import LiveTvPlayer from "./LiveTvPlayer";

interface ProgramBlock {
  inicio: string;
  fim: string;
  titulo: string;
  subtitulo: string;
  categoria: string;
  destaque?: boolean;
}

const GRADE_PROGRAMACAO: ProgramBlock[] = [
  {
    inicio: "06:00",
    fim: "08:30",
    titulo: "Despertar do Vale & Agro",
    subtitulo: "Cotações agrícolas, previsão do tempo e primeiras notícias da manhã.",
    categoria: "Jornalismo",
  },
  {
    inicio: "08:30",
    fim: "11:30",
    titulo: "Giro de Notícias do Vale & Plantão",
    subtitulo: "Cobertura regional das 27 cidades, trânsito e utilidade pública.",
    categoria: "Notícias",
    destaque: true,
  },
  {
    inicio: "11:30",
    fim: "13:30",
    titulo: "Jornal da Tarde • Rede Apucarana",
    subtitulo: "O resumo completo dos principais acontecimentos do dia no Vale do Ivaí.",
    categoria: "Ao Vivo",
    destaque: true,
  },
  {
    inicio: "13:30",
    fim: "16:00",
    titulo: "Clipes, Sertanejo & Cultura Paranaense",
    subtitulo: "Os maiores sucessos da música, artistas locais e agenda cultural.",
    categoria: "Entretenimento",
  },
  {
    inicio: "16:00",
    fim: "18:00",
    titulo: "RedeCast • Entrevistas & Debates",
    subtitulo: "Grandes personalidades, líderes comunitários, política e empreendedorismo.",
    categoria: "Talk Show",
    destaque: true,
  },
  {
    inicio: "18:00",
    fim: "19:30",
    titulo: "Plantão Policial & Ronda da Noite",
    subtitulo: "Ocorrências policiais, segurança pública e informações em tempo real.",
    categoria: "Policial",
  },
  {
    inicio: "19:30",
    fim: "22:00",
    titulo: "Noite Viva & Especial Musical",
    subtitulo: "Séries especiais, documentários regionais e apresentações exclusivas.",
    categoria: "Variedades",
  },
  {
    inicio: "22:00",
    fim: "06:00",
    titulo: "Madrugada AutoVJ 24h • Melhores Momentos",
    subtitulo: "Programação contínua de clipes, reprises do RedeCast e giros noturnos.",
    categoria: "AutoVJ 24h",
  },
];

const CORTES_DESTAQUES = [
  {
    id: "corte-1",
    titulo: "Debate sobre obras da duplicação da BR-376 em Apucarana",
    duracao: "3:45",
    visualizacoes: "4.2k",
  },
  {
    id: "corte-2",
    titulo: "Entrevista RedeCast: O avanço do polo têxtil e geração de empregos",
    duracao: "5:12",
    visualizacoes: "6.8k",
  },
  {
    id: "corte-3",
    titulo: "Operação da Polícia Militar desarticula quadrilha na região",
    duracao: "2:30",
    visualizacoes: "8.1k",
  },
];

export default function TvOnlineClient() {
  const [isTheater, setIsTheater] = useState(false);
  const [horaAtual, setHoraAtual] = useState("");
  const [programaNoAr, setProgramaNoAr] = useState<ProgramBlock>(GRADE_PROGRAMACAO[1]);

  useEffect(() => {
    const atualizarHorario = () => {
      const now = new Date();
      const horas = String(now.getHours()).padStart(2, "0");
      const minutos = String(now.getMinutes()).padStart(2, "0");
      const horaStr = `${horas}:${minutos}`;
      setHoraAtual(horaStr);

      // Descobre o programa ativo no momento
      const blocoAtual = GRADE_PROGRAMACAO.find((item) => {
        if (item.inicio <= item.fim) {
          return horaStr >= item.inicio && horaStr < item.fim;
        } else {
          // Madrugada (ex: 22:00 às 06:00)
          return horaStr >= item.inicio || horaStr < item.fim;
        }
      });

      if (blocoAtual) {
        setProgramaNoAr(blocoAtual);
      }
    };

    atualizarHorario();
    const interval = setInterval(atualizarHorario, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      "📺 Estou assistindo à TV Rede Apucarana ao vivo em HD 1080p! Acompanhe a transmissão e notícias do Vale do Ivaí aqui: https://www.redeapucarana.com.br/tv-online"
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleParticiparWhatsApp = () => {
    const text = encodeURIComponent(
      "Olá TV Rede Apucarana! Estou assistindo à transmissão ao vivo e gostaria de mandar uma mensagem / sugestão para a redação."
    );
    window.open(`https://wa.me/5543999809454?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-red-600 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOPLINE ESCURA COM LINKS RÁPIDOS E RETORNO                             */}
      {/* ========================================================================= */}
      <div className="bg-black/90 border-b border-slate-800/80 text-xs py-2.5 px-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-bold transition-colors"
            >
              <span>←</span>
              <span>Voltar ao Portal Principal</span>
            </Link>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">
              Emissora Oficial da Rede Apucarana de Comunicação
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-red-400 font-bold text-[11px] bg-red-950/60 border border-red-800/60 px-2.5 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              SINAL DIGITAL 24H
            </span>
            <a
              href="https://wa.me/5543999809454?text=Ol%C3%A1%2C%20quero%20anunciar%20na%20TV%20Rede%20Apucarana"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Anuncie na TV
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CABEÇALHO DA EMISSORA (BRANDING PREMIUM)                              */}
      {/* ========================================================================= */}
      <header className="bg-slate-900/60 border-b border-slate-800/90 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="shrink-0 group">
              <img
                src="/logo-rede-apucarana-oficial.png"
                alt="Logo TV Rede Apucarana"
                className="h-12 sm:h-14 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            <div className="border-l border-slate-800 pl-4">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-lg sm:text-xl text-white tracking-tight">
                  TV REDE APUCARANA
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-600/90 text-white font-extrabold text-[10px] uppercase tracking-wider">
                  AO VIVO
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Jornalismo Regional, Entrevistas do RedeCast & Transmissão 24h para o Vale do Ivaí
              </p>
            </div>
          </div>

          {/* Botões de Ação no Topo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Compartilhar</span>
            </button>

            <button
              type="button"
              onClick={handleParticiparWhatsApp}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md hover:shadow-emerald-600/30 active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp da TV</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. CONTEÚDO PRINCIPAL (MODO CINEMA)                                      */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div
          className={`grid gap-8 transition-all duration-300 ${
            isTheater
              ? "grid-cols-1"
              : "grid-cols-1 lg:grid-cols-12"
          }`}
        >
          {/* COLUNA PRINCIPAL: PLAYER DE ALTA DEFINIÇÃO + CONTROLES (8 COLUNAS) */}
          <div
            className={`space-y-5 transition-all ${
              isTheater ? "w-full" : "lg:col-span-8"
            }`}
          >
            {/* Player HLS Oficial */}
            <div className="relative">
              <LiveTvPlayer
                onTheaterToggle={() => setIsTheater(!isTheater)}
                isTheater={isTheater}
                streamUrl="https://Stmv1.samcast.com.br/tvapucarana/tvapucarana/playlist.m3u8"
              />
            </div>

            {/* Barra de Informações do Programa no Ar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-red-400">
                    NO AR AGORA • {programaNoAr.inicio} às {programaNoAr.fim}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {programaNoAr.categoria}
                  </span>
                </div>

                <h1 className="font-heading font-extrabold text-lg sm:text-xl text-white">
                  {programaNoAr.titulo}
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  {programaNoAr.subtitulo}
                </p>
              </div>

              {/* Botões de Ação Imediata */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleParticiparWhatsApp}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="Envie sua mensagem para a produção da TV"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Mandar Mensagem</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  title="Compartilhar link da transmissão"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Compartilhar</span>
                </button>
              </div>
            </div>

            {/* Informações Institucionais da Emissora */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-800/60 text-red-400 flex items-center justify-center shrink-0">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-white">
                    Estúdios em Apucarana
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Transmissão própria com estrutura profissional no coração do Vale do Ivaí.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-white">
                    Cobertura das 27 Cidades
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Jornalismo factual, entrevistas e utilidade pública conectando toda a região.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-white">
                    Transmissão 24 Horas
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Programação contínua com tecnologia AutoVJ de última geração em 1080p.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA LATERAL: GRADE DE PROGRAMAÇÃO & INTERATIVIDADE (4 COLUNAS) */}
          <div
            className={`space-y-6 ${
              isTheater ? "w-full grid grid-cols-1 md:grid-cols-3 gap-6 space-y-0" : "lg:col-span-4"
            }`}
          >
            {/* CARD 1: PROGRAMAÇÃO COMPLETA DO DIA */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-3.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h3 className="font-heading font-black text-sm text-white">
                    Grade de Programação
                  </h3>
                </div>
                {horaAtual && (
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    {horaAtual}
                  </span>
                )}
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                {GRADE_PROGRAMACAO.map((bloco, idx) => {
                  const isCurrent = bloco.titulo === programaNoAr.titulo;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-red-950/40 border-red-700/80 shadow-md ring-1 ring-red-500/30"
                          : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            isCurrent ? "text-red-400" : "text-slate-400"
                          }`}
                        >
                          {bloco.inicio} - {bloco.fim}
                        </span>

                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            No Ar
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {bloco.categoria}
                          </span>
                        )}
                      </div>

                      <h4
                        className={`font-heading font-bold text-xs ${
                          isCurrent ? "text-white font-extrabold" : "text-slate-200"
                        }`}
                      >
                        {bloco.titulo}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {bloco.subtitulo}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CARD 2: CORTES EM VÍDEO (9:16) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-3.5">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-red-500" />
                  <h3 className="font-heading font-black text-sm text-white">
                    Cortes & Entrevistas
                  </h3>
                </div>
                <Link
                  href="/videos"
                  className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-0.5"
                >
                  <span>Ver todos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {CORTES_DESTAQUES.map((corte) => (
                  <Link
                    key={corte.id}
                    href="/videos"
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-red-600/60 hover:bg-slate-950/70 transition-all flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all">
                      <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-white line-clamp-2 leading-snug transition-colors">
                        {corte.titulo}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span>⏱ {corte.duracao}</span>
                        <span>·</span>
                        <span>👁 {corte.visualizacoes} views</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* CARD 3: COMERCIAL - ANUNCIE NA TV REDE APUCARANA */}
            <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-600/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase tracking-wider border border-amber-500/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  MÍDIA EM VÍDEO REGIONAL
                </span>

                <h3 className="font-heading font-black text-sm text-white leading-snug">
                  Anuncie sua Empresa na TV Rede Apucarana
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Seu comercial em vídeo rodando 24 horas na programação da TV digital e no Super-App da Rede Apucarana, alcançando milhares de famílias nas 27 cidades do Vale do Ivaí.
                </p>

                <div className="pt-1">
                  <a
                    href="https://wa.me/5543999809454?text=Ol%C3%A1%2C%20gostaria%20de%20receber%20a%20tabela%20comercial%20para%20anunciar%20em%20v%C3%ADdeo%20na%20TV%20Rede%20Apucarana"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg hover:shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Falar com o Comercial da TV</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 4. FOOTER DA EMISSORA                                                    */}
      {/* ========================================================================= */}
      <footer className="bg-black border-t border-slate-900 py-6 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <img
              src="/logo-rede-apucarana-oficial.png"
              alt="Rede Apucarana de Comunicação"
              className="h-8 w-auto object-contain opacity-75"
            />
            <span>
              © {new Date().getFullYear()} TV Rede Apucarana • Conectando todo o Vale do Ivaí
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">
              Página Inicial
            </Link>
            <Link href="/videos" className="hover:text-white transition-colors">
              Cortes & Vídeos
            </Link>
            <Link href="/anuncie" className="hover:text-white transition-colors">
              Publicidade
            </Link>
            <Link href="/contato" className="hover:text-white transition-colors">
              Fale Conosco
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
