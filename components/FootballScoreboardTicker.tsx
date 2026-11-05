"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export interface ScoreboardMatch {
  id: string;
  campeonato: string;
  status: "ao_vivo" | "encerrado" | "agendado" | string;
  tempo_jogo?: string;
  data_jogo: string;
  time_casa_nome: string;
  time_casa_sigla?: string;
  time_casa_escudo?: string;
  placar_casa: number;
  time_fora_nome: string;
  time_fora_sigla?: string;
  time_fora_escudo?: string;
  placar_fora: number;
}

// Fallback elegante com grandes clubes do futebol brasileiro e paranaense quando não houver jogos salvos
const JOGOS_FALLBACK: ScoreboardMatch[] = [
  {
    id: "fb-1",
    campeonato: "Brasileirão",
    status: "agendado",
    data_jogo: new Date(Date.now() + 3600000 * 4).toISOString(),
    time_casa_nome: "Athletico-PR",
    time_casa_sigla: "CAP",
    time_casa_escudo: "https://a.espncdn.com/i/teamlogos/soccer/500/3458.png",
    placar_casa: 0,
    time_fora_nome: "Coritiba",
    time_fora_sigla: "CFC",
    time_fora_escudo: "https://a.espncdn.com/i/teamlogos/soccer/500/3455.png",
    placar_fora: 0,
  },
  {
    id: "fb-2",
    campeonato: "Brasileirão",
    status: "encerrado",
    tempo_jogo: "Fim",
    data_jogo: new Date(Date.now() - 3600000 * 20).toISOString(),
    time_casa_nome: "Palmeiras",
    time_casa_sigla: "PAL",
    time_casa_escudo: "https://a.espncdn.com/i/teamlogos/soccer/500/2029.png",
    placar_casa: 2,
    time_fora_nome: "Flamengo",
    time_fora_sigla: "FLA",
    time_fora_escudo: "https://a.espncdn.com/i/teamlogos/soccer/500/819.png",
    placar_fora: 1,
  },
  {
    id: "fb-3",
    campeonato: "Brasileirão",
    status: "encerrado",
    tempo_jogo: "Fim",
    data_jogo: new Date(Date.now() - 3600000 * 24).toISOString(),
    time_casa_nome: "Corinthians",
    time_casa_sigla: "COR",
    time_casa_escudo: "https://a.espncdn.com/i/teamlogos/soccer/500/874.png",
    placar_casa: 1,
    time_fora_nome: "São Paulo",
    time_fora_sigla: "SAO",
    time_fora_escudo: "https://a.espncdn.com/i/teamlogos/soccer/500/2026.png",
    placar_fora: 1,
  },
  {
    id: "fb-4",
    campeonato: "Brasileirão",
    status: "agendado",
    data_jogo: new Date(Date.now() + 3600000 * 28).toISOString(),
    time_casa_nome: "Grêmio",
    time_casa_sigla: "GRE",
    time_casa_escudo: "https://a.espncdn.com/i/teamlogos/soccer/500/6273.png",
    placar_casa: 0,
    time_fora_nome: "Internacional",
    time_fora_sigla: "INT",
    time_fora_escudo: "https://a.espncdn.com/i/teamlogos/soccer/500/1936.png",
    placar_fora: 0,
  },
  {
    id: "fb-5",
    campeonato: "Brasileirão",
    status: "agendado",
    data_jogo: new Date(Date.now() + 3600000 * 30).toISOString(),
    time_casa_nome: "Londrina",
    time_casa_sigla: "LEC",
    time_casa_escudo: "https://a.espncdn.com/i/teamlogos/soccer/500/8210.png",
    placar_casa: 0,
    time_fora_nome: "Maringá",
    time_fora_sigla: "MFC",
    time_fora_escudo: "https://a.espncdn.com/i/teamlogos/soccer/500/18816.png",
    placar_fora: 0,
  },
];

interface FootballScoreboardTickerProps {
  initialMatches?: ScoreboardMatch[];
}

export default function FootballScoreboardTicker({
  initialMatches,
}: FootballScoreboardTickerProps) {
  const sortMatchesByProximity = (list: ScoreboardMatch[]) => {
    const now = Date.now();
    return [...list].sort((a, b) => {
      if (a.status === "ao_vivo" && b.status !== "ao_vivo") return -1;
      if (b.status === "ao_vivo" && a.status !== "ao_vivo") return 1;
      const distA = Math.abs(new Date(a.data_jogo).getTime() - now);
      const distB = Math.abs(new Date(b.data_jogo).getTime() - now);
      return distA - distB;
    });
  };

  const [matches, setMatches] = useState<ScoreboardMatch[]>(
    initialMatches && initialMatches.length > 0
      ? sortMatchesByProximity(initialMatches)
      : JOGOS_FALLBACK
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;
        const { data } = await supabase
          .from("futebol_jogos")
          .select("*")
          .order("data_jogo", { ascending: false })
          .limit(40);

        if (data && data.length > 0) {
          setMatches(sortMatchesByProximity(data));
        }
      } catch {
        // mantém fallback elegante
      }
    };

    void fetchMatches();
    const interval = setInterval(() => void fetchMatches(), 45_000);
    return () => clearInterval(interval);
  }, []);

  const rolar = (direcao: "esq" | "dir") => {
    if (!scrollRef.current) return;
    const scrollAmount = 260;
    scrollRef.current.scrollBy({
      left: direcao === "dir" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full bg-[#0a0f18] text-white border-b border-slate-800/90 h-[50px] flex items-center relative overflow-hidden z-20">
      {/* Botão fixo lateral esquerdo: Atalho Central de Esportes */}
      <Link
        href="/esportes"
        className="h-full px-3.5 bg-gradient-to-r from-emerald-950/80 to-slate-900 border-r border-slate-800 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold text-xs uppercase tracking-wider shrink-0 transition-colors z-10"
        title="Ver classificação, artilharia e tabelas completas"
      >
        <span className="text-sm">⚽</span>
        <span className="hidden sm:inline">Placares</span>
      </Link>

      {/* Flechas de navegação rápida */}
      <button
        type="button"
        onClick={() => rolar("esq")}
        className="hidden md:flex h-full px-1.5 items-center justify-center text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 shrink-0 border-r border-slate-800 transition-colors"
        aria-label="Rolar jogos para a esquerda"
      >
        ‹
      </button>

      {/* Fita horizontal de jogos (Scoreboard Ticker) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-2 px-2.5 h-full"
      >
        {matches.map((j) => {
          const isAoVivo = j.status === "ao_vivo";
          const isEncerrado = j.status === "encerrado";
          const hora = (() => {
            if (isAoVivo) return j.tempo_jogo || "AO VIVO";
            if (isEncerrado) return "FIM";
            try {
              const dt = new Date(j.data_jogo);
              return dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            } catch {
              return "EM BREVE";
            }
          })();

          const casaSigla = j.time_casa_sigla || j.time_casa_nome.substring(0, 3).toUpperCase();
          const foraSigla = j.time_fora_sigla || j.time_fora_nome.substring(0, 3).toUpperCase();

          return (
            <Link
              key={j.id}
              href="/esportes"
              className="shrink-0 h-[38px] px-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 flex items-center gap-2.5 text-xs transition-all hover:border-slate-700 hover:scale-[1.01]"
              title={`${j.time_casa_nome} vs ${j.time_fora_nome} - ${j.campeonato}`}
            >
              {/* Time Casa */}
              <div className="flex items-center gap-1.5 min-w-[50px] justify-end">
                <span className="font-bold text-slate-200">{casaSigla}</span>
                {j.time_casa_escudo ? (
                  <img
                    src={j.time_casa_escudo}
                    alt={j.time_casa_nome}
                    className="w-4 h-4 object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-[9px] flex items-center justify-center font-bold text-slate-400">
                    {casaSigla[0]}
                  </span>
                )}
              </div>

              {/* Placar ou VS */}
              <div className="flex items-center justify-center min-w-[34px] px-1.5 py-0.5 rounded bg-slate-950 font-black text-xs tabular-nums text-white border border-slate-800/80">
                {isEncerrado || isAoVivo ? (
                  <span>
                    {j.placar_casa ?? 0} - {j.placar_fora ?? 0}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">VS</span>
                )}
              </div>

              {/* Time Fora */}
              <div className="flex items-center gap-1.5 min-w-[50px]">
                {j.time_fora_escudo ? (
                  <img
                    src={j.time_fora_escudo}
                    alt={j.time_fora_nome}
                    className="w-4 h-4 object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-[9px] flex items-center justify-center font-bold text-slate-400">
                    {foraSigla[0]}
                  </span>
                )}
                <span className="font-bold text-slate-200">{foraSigla}</span>
              </div>

              {/* Badge de Status / Horário */}
              <div className="pl-1 border-l border-slate-800/80 flex items-center">
                {isAoVivo ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white animate-pulse">
                    {hora}
                  </span>
                ) : isEncerrado ? (
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    Fim
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-emerald-400 tabular-nums">
                    {hora}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => rolar("dir")}
        className="hidden md:flex h-full px-1.5 items-center justify-center text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 shrink-0 border-l border-slate-800 transition-colors"
        aria-label="Rolar jogos para a direita"
      >
        ›
      </button>

      {/* Link Tabela Completa */}
      <Link
        href="/esportes"
        className="h-full px-3.5 bg-slate-900 hover:bg-slate-800 border-l border-slate-800 flex items-center text-[11px] font-bold text-slate-300 hover:text-white shrink-0 transition-colors"
      >
        <span className="hidden lg:inline">Tabela Completa →</span>
        <span className="lg:hidden">Tabela</span>
      </Link>
    </div>
  );
}
