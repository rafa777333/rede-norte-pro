"use client";

import React from "react";
import Link from "next/link";

interface CommercialAdSlotProps {
  slotId: string;
  slotTitle?: string;
  image?: string | null;
  linkUrl?: string | null;
  variant?: "horizontal" | "sidebar";
  houseAdType?: "anuncie" | "vagas_classificados" | "tv_podcast";
  collapseIfEmpty?: boolean;
}

export default function CommercialAdSlot({
  slotId,
  slotTitle,
  image,
  linkUrl,
  variant = "horizontal",
  houseAdType = "anuncie",
  collapseIfEmpty = false,
}: CommercialAdSlotProps) {
  const hasImage = Boolean(image && image.trim() && image.startsWith("http"));

  // 1. Se tem imagem de anunciante real
  if (hasImage) {
    const hasValidLink = Boolean(linkUrl && linkUrl.trim() && linkUrl !== "#" && !linkUrl.includes("/admin"));

    return (
      <aside
        className={`w-full overflow-hidden rounded-xl border border-slate-200/90 shadow-sm bg-white my-3 ${
          variant === "horizontal" ? "max-w-full" : "w-full"
        }`}
        aria-label={slotTitle || "Espaço Comercial"}
      >
        <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
          <span>Publicidade</span>
          <span>Rede Apucarana</span>
        </div>
        <a
          href={hasValidLink ? linkUrl! : "/anuncie"}
          target={hasValidLink ? "_blank" : undefined}
          rel={hasValidLink ? "noopener noreferrer" : undefined}
          className="block group"
        >
          <img
            src={image!}
            alt={slotTitle || "Publicidade Oficial"}
            className="w-full h-auto object-cover transition-opacity group-hover:opacity-95"
            loading="lazy"
          />
        </a>
      </aside>
    );
  }

  // 2. Se não tem anúncio e foi configurado para colapsar
  if (collapseIfEmpty) {
    return null;
  }

  // 3. House Ad elegante e institucional (Padrão 2026 de portais de notícias)
  if (houseAdType === "anuncie") {
    return (
      <aside className="w-full my-3 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0 p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
              📢
            </span>
            <div>
              <span className="text-[10px] font-bold text-red-400 tracking-wider uppercase">
                Espaço Comercial do Vale do Ivaí
              </span>
              <h4 className="text-base font-bold text-white tracking-tight">
                Anuncie sua marca para milhares de leitores em toda a região
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Formatos exclusivos na capa, matérias patrocinadas e campanhas para Apucarana e 27 municípios.
              </p>
            </div>
          </div>
          <Link
            href="/anuncie"
            className="shrink-0 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm transition-all text-center"
          >
            Conheça os Planos →
          </Link>
        </div>
      </aside>
    );
  }

  if (houseAdType === "vagas_classificados") {
    return (
      <aside className="w-full my-3 p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 text-white border border-emerald-900/40 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0 p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              💼
            </span>
            <div>
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">
                Oportunidades & Negócios Locais
              </span>
              <h4 className="text-base font-bold text-white tracking-tight">
                Tem uma vaga de emprego ou produto para negociar?
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Envie gratuitamente sua vaga ou anúncio para os classificados da Rede Apucarana.
              </p>
            </div>
          </div>
          <Link
            href="/classificados"
            className="shrink-0 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all text-center"
          >
            Publicar Grátis →
          </Link>
        </div>
      </aside>
    );
  }

  // houseAdType === "tv_podcast"
  return (
    <aside className="w-full my-3 p-4 rounded-xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 text-white border border-blue-900/40 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0 p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            🎙
          </span>
          <div>
            <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">
              Web TV & RedeCast
            </span>
            <h4 className="text-base font-bold text-white tracking-tight">
              Assista às entrevistas, bastidores da política e esporte ao vivo
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Programação multimídia diária com transmissão digital para todo o Paraná.
            </p>
          </div>
        </div>
        <Link
          href="/tv-online"
          className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all text-center"
        >
          Assistir TV Online →
        </Link>
      </div>
    </aside>
  );
}
