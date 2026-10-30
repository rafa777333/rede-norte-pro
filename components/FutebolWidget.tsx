"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { getSupabase } from "../lib/supabase";

export interface FutebolJogo {
  id: string;
  campeonato: string;
  rodada?: string;
  data_jogo: string;
  status: "agendado" | "ao_vivo" | "encerrado" | string;
  tempo_jogo?: string;
  time_casa_nome: string;
  time_casa_sigla?: string;
  time_casa_escudo?: string;
  placar_casa: number;
  time_fora_nome: string;
  time_fora_sigla?: string;
  time_fora_escudo?: string;
  placar_fora: number;
  updated_at?: string;
}

export interface FutebolClassificacao {
  id: string;
  campeonato: string;
  posicao: number;
  time_nome: string;
  time_escudo?: string;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  saldo_gols: number;
  updated_at?: string;
}

interface FutebolWidgetProps {
  variant?: "carousel" | "full" | "compact";
  initialCampeonato?: string;
}

export default function FutebolWidget({
  variant = "carousel",
  initialCampeonato = "Todos",
}: FutebolWidgetProps) {
  const [jogos, setJogos] = useState<FutebolJogo[]>([]);
  const [classificacao, setClassificacao] = useState<FutebolClassificacao[]>([]);
  const [campeonato, setCampeonato] = useState(initialCampeonato);
  const [tabelaCamp, setTabelaCamp] = useState("Brasileirão Série A");
  const [abaVisualizacao, setAbaVisualizacao] = useState<"jogos" | "tabela">("jogos");
  const [carregando, setCarregando] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Carrega jogos e classificação do Supabase
  const carregarDados = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const [resJogos, resClassificacao] = await Promise.all([
        supabase
          .from("futebol_jogos")
          .select("*")
          .order("data_jogo", { ascending: true }),
        supabase
          .from("futebol_classificacao")
          .select("*")
          .order("posicao", { ascending: true }),
      ]);

      if (resJogos.data) setJogos(resJogos.data as FutebolJogo[]);
      if (resClassificacao.data) setClassificacao(resClassificacao.data as FutebolClassificacao[]);
    } catch (err) {
      console.error("Erro ao carregar dados de futebol:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregarDados();
    // Atualização em tempo real / polling a cada 45 segundos
    const interval = setInterval(() => {
      void carregarDados();
    }, 45_000);
    return () => clearInterval(interval);
  }, []);

  // Lista de campeonatos únicos presentes nos jogos
  const campeonatosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    jogos.forEach((j) => {
      if (j.campeonato) set.add(j.campeonato);
    });
    // Ordem preferencial
    const ordem = [
      "Brasileirão Série A",
      "Brasileirão Série B",
      "Copa do Brasil",
      "Libertadores",
    ];
    const ordenados = Array.from(set).sort((a, b) => {
      const idxA = ordem.indexOf(a);
      const idxB = ordem.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
    return ["Todos", ...ordenados];
  }, [jogos]);

  // Jogos filtrados pela aba de campeonato
  const jogosFiltrados = useMemo(() => {
    let filtrados = jogos;
    if (campeonato !== "Todos") {
      filtrados = filtrados.filter((j) => j.campeonato === campeonato);
    }
    // Prioriza jogos ao vivo, depois agendados, depois encerrados
    return [...filtrados].sort((a, b) => {
      const pesoStatus = (st: string) => {
        if (st === "ao_vivo") return 0;
        if (st === "agendado") return 1;
        return 2;
      };
      const pesoDiff = pesoStatus(a.status) - pesoStatus(b.status);
      if (pesoDiff !== 0) return pesoDiff;
      return new Date(a.data_jogo).getTime() - new Date(b.data_jogo).getTime();
    });
  }, [jogos, campeonato]);

  // Contagem de jogos ao vivo
  const totalAoVivo = useMemo(() => {
    return jogos.filter((j) => j.status === "ao_vivo").length;
  }, [jogos]);

  // Tabela filtrada
  const tabelaFiltrada = useMemo(() => {
    return classificacao.filter((c) => c.campeonato === tabelaCamp);
  }, [classificacao, tabelaCamp]);

  const rolar = (direcao: "esq" | "dir") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 340;
    scrollContainerRef.current.scrollBy({
      left: direcao === "dir" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  const formataDataHora = (dataIso: string, tempoJogo?: string, status?: string) => {
    if (status === "ao_vivo") {
      return tempoJogo || "Ao vivo";
    }
    if (status === "encerrado") {
      return "Fim de jogo";
    }
    try {
      const dt = new Date(dataIso);
      const agora = new Date();
      const mesmoDia = dt.toDateString() === agora.toDateString();
      const amanha = new Date();
      amanha.setDate(agora.getDate() + 1);
      const ehAmanha = dt.toDateString() === amanha.toDateString();

      const horaStr = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      if (mesmoDia) return `Hoje · ${horaStr}`;
      if (ehAmanha) return `Amanhã · ${horaStr}`;

      const diaMes = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      return `${diaMes} · ${horaStr}`;
    } catch {
      return tempoJogo || "Agendado";
    }
  };

  if (!carregando && jogos.length === 0 && classificacao.length === 0) {
    return null; // Nada a exibir
  }

  if (variant === "compact") {
    const exibidos = jogosFiltrados.slice(0, 3);
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <div>
              <h3 className="font-heading font-extrabold text-slate-900 text-base leading-tight">
                Jogos & Placares
              </h3>
              <span className="text-xs text-slate-500">Resultados da rodada</span>
            </div>
          </div>
          {totalAoVivo > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-black uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              AO VIVO
            </span>
          ) : (
            <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              ESPN
            </span>
          )}
        </div>

        {/* Abas Rápidas */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2.5 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {campeonatosDisponiveis.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCampeonato(c)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                campeonato === c
                  ? "bg-blue-50 text-blue-700 border-blue-200 font-bold"
                  : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100"
              }`}
            >
              {c.replace("Brasileirão ", "")}
            </button>
          ))}
        </div>

        {/* Lista de jogos compacta */}
        <div className="space-y-2">
          {exibidos.map((jogo) => {
            const isAoVivo = jogo.status === "ao_vivo";
            const isEncerrado = jogo.status === "encerrado";
            return (
              <div
                key={jogo.id}
                className={`p-2.5 rounded-xl border transition-all ${
                  isAoVivo
                    ? "bg-red-50/40 border-red-200 shadow-2xs"
                    : "bg-slate-50/60 border-slate-100 hover:bg-white hover:border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1.5">
                  <span className="truncate max-w-[140px]">{jogo.campeonato}</span>
                  {isAoVivo ? (
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                      {jogo.tempo_jogo || "AO VIVO"}
                    </span>
                  ) : isEncerrado ? (
                    <span className="text-slate-500 font-medium">Fim</span>
                  ) : (
                    <span className="text-blue-600 font-medium tabular-nums">
                      {formataDataHora(jogo.data_jogo, jogo.tempo_jogo, jogo.status)}
                    </span>
                  )}
                </div>

                {/* Mandante */}
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {jogo.time_casa_escudo ? (
                      <img src={jogo.time_casa_escudo} alt={jogo.time_casa_nome} className="w-5 h-5 object-contain shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                        {jogo.time_casa_sigla || "M"}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {jogo.time_casa_nome}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 tabular-nums">
                    {isAoVivo || isEncerrado ? jogo.placar_casa : "-"}
                  </span>
                </div>

                {/* Visitante */}
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {jogo.time_fora_escudo ? (
                      <img src={jogo.time_fora_escudo} alt={jogo.time_fora_nome} className="w-5 h-5 object-contain shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                        {jogo.time_fora_sigla || "V"}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {jogo.time_fora_nome}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 tabular-nums">
                    {isAoVivo || isEncerrado ? jogo.placar_fora : "-"}
                  </span>
                </div>
              </div>
            );
          })}

          {exibidos.length === 0 && (
            <div className="text-center py-4 text-xs text-slate-500">
              Sem partidas agendadas no momento.
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <a
            href="/esportes"
            className="text-blue-600 hover:text-blue-700 font-bold transition-colors inline-flex items-center gap-1"
          >
            Ver classificação e tabela completa →
          </a>
        </div>
      </div>
    );
  }

  return (
    <section className={`google-sports-widget google-sports-widget--${variant}`} aria-label="Jogos de Hoje e Classificação">
      {/* Header do Widget estilo Google */}
      <div className="google-sports-header">
        <div className="google-sports-title-row">
          <div className="google-sports-brand">
            <span className="google-sports-icon">⚽</span>
            <div className="google-sports-heading">
              <h3 className="google-sports-title">Futebol ao Vivo & Placares</h3>
              <span className="google-sports-subtitle">
                Resultados em tempo real, jogos da rodada e tabelas
              </span>
            </div>
          </div>

          {totalAoVivo > 0 && (
            <div className="google-sports-live-counter" title={`${totalAoVivo} partida(s) em andamento agora`}>
              <span className="google-sports-pulse" />
              <span>{totalAoVivo} {totalAoVivo === 1 ? "jogo ao vivo" : "jogos ao vivo"}</span>
            </div>
          )}

          {variant === "carousel" && (
            <a href="/esportes" className="google-sports-view-all">
              Ver classificação e tabela completa →
            </a>
          )}
        </div>

        {/* Abas Superiores estilo Google (Pills) */}
        <div className="google-sports-tabs-bar">
          <div className="google-sports-tabs-scroll">
            {variant === "full" && (
              <div className="google-sports-view-toggle">
                <button
                  type="button"
                  className={`google-sports-pill ${abaVisualizacao === "jogos" ? "is-active" : ""}`}
                  onClick={() => setAbaVisualizacao("jogos")}
                >
                  Partidas
                </button>
                <button
                  type="button"
                  className={`google-sports-pill ${abaVisualizacao === "tabela" ? "is-active" : ""}`}
                  onClick={() => setAbaVisualizacao("tabela")}
                >
                  Classificação
                </button>
                <span className="google-sports-divider" />
              </div>
            )}

            {abaVisualizacao === "jogos" && (
              <>
                {campeonatosDisponiveis.map((camp) => (
                  <button
                    key={camp}
                    type="button"
                    className={`google-sports-pill ${campeonato === camp ? "is-active" : ""}`}
                    onClick={() => setCampeonato(camp)}
                  >
                    {camp}
                  </button>
                ))}
              </>
            )}

            {abaVisualizacao === "tabela" && (
              <>
                {["Brasileirão Série A", "Brasileirão Série B"].map((camp) => (
                  <button
                    key={camp}
                    type="button"
                    className={`google-sports-pill ${tabelaCamp === camp ? "is-active" : ""}`}
                    onClick={() => setTabelaCamp(camp)}
                  >
                    {camp}
                  </button>
                ))}
              </>
            )}
          </div>

          {variant === "carousel" && abaVisualizacao === "jogos" && jogosFiltrados.length > 3 && (
            <div className="google-sports-nav-arrows">
              <button
                type="button"
                className="google-sports-nav-btn"
                onClick={() => rolar("esq")}
                aria-label="Rolar para esquerda"
              >
                ‹
              </button>
              <button
                type="button"
                className="google-sports-nav-btn"
                onClick={() => rolar("dir")}
                aria-label="Rolar para direita"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo: Jogos ou Tabela */}
      {abaVisualizacao === "jogos" && (
        <div
          ref={scrollContainerRef}
          className={`google-sports-cards-container ${
            variant === "full" ? "google-sports-cards-grid" : "google-sports-cards-carousel"
          }`}
        >
          {jogosFiltrados.map((jogo) => {
            const isAoVivo = jogo.status === "ao_vivo";
            const isEncerrado = jogo.status === "encerrado";
            const casaVenceu = isEncerrado && jogo.placar_casa > jogo.placar_fora;
            const foraVenceu = isEncerrado && jogo.placar_fora > jogo.placar_casa;

            return (
              <article key={jogo.id} className={`google-match-card ${isAoVivo ? "is-live" : ""}`}>
                {/* Topo do Card: Campeonato + Status */}
                <div className="google-match-header">
                  <span className="google-match-meta">
                    <span className="google-match-league">{jogo.campeonato}</span>
                    {jogo.rodada && <span className="google-match-round"> · {jogo.rodada}</span>}
                  </span>

                  {isAoVivo ? (
                    <span className="google-match-badge google-match-badge--live">
                      <span className="google-sports-pulse" />
                      AO VIVO {jogo.tempo_jogo ? `· ${jogo.tempo_jogo}` : ""}
                    </span>
                  ) : isEncerrado ? (
                    <span className="google-match-badge google-match-badge--ended">
                      FIM
                    </span>
                  ) : (
                    <span className="google-match-badge google-match-badge--scheduled">
                      {formataDataHora(jogo.data_jogo, jogo.tempo_jogo, jogo.status)}
                    </span>
                  )}
                </div>

                {/* Corpo do Card: Times e Placares */}
                <div className="google-match-body">
                  {/* Linha Time Mandante */}
                  <div className={`google-match-team-row ${casaVenceu ? "is-winner" : ""} ${foraVenceu ? "is-loser" : ""}`}>
                    <div className="google-match-team-info">
                      {jogo.time_casa_escudo ? (
                        <img
                          src={jogo.time_casa_escudo}
                          alt={jogo.time_casa_nome}
                          className="google-match-crest"
                          loading="lazy"
                        />
                      ) : (
                        <div className="google-match-crest-placeholder">
                          {jogo.time_casa_sigla || jogo.time_casa_nome.slice(0, 3)}
                        </div>
                      )}
                      <span className="google-match-team-name" title={jogo.time_casa_nome}>
                        {jogo.time_casa_nome}
                      </span>
                    </div>

                    <div className="google-match-score">
                      {isAoVivo || isEncerrado ? (
                        <span className="google-match-score-num">{jogo.placar_casa}</span>
                      ) : (
                        <span className="google-match-score-vs">-</span>
                      )}
                    </div>
                  </div>

                  {/* Linha Time Visitante */}
                  <div className={`google-match-team-row ${foraVenceu ? "is-winner" : ""} ${casaVenceu ? "is-loser" : ""}`}>
                    <div className="google-match-team-info">
                      {jogo.time_fora_escudo ? (
                        <img
                          src={jogo.time_fora_escudo}
                          alt={jogo.time_fora_nome}
                          className="google-match-crest"
                          loading="lazy"
                        />
                      ) : (
                        <div className="google-match-crest-placeholder">
                          {jogo.time_fora_sigla || jogo.time_fora_nome.slice(0, 3)}
                        </div>
                      )}
                      <span className="google-match-team-name" title={jogo.time_fora_nome}>
                        {jogo.time_fora_nome}
                      </span>
                    </div>

                    <div className="google-match-score">
                      {isAoVivo || isEncerrado ? (
                        <span className="google-match-score-num">{jogo.placar_fora}</span>
                      ) : (
                        <span className="google-match-score-vs">-</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="google-match-footer">
                  <span className="google-match-clock-detail">
                    {isAoVivo
                      ? `Em andamento (${jogo.tempo_jogo || "Tempo normal"})`
                      : isEncerrado
                      ? "Partida finalizada"
                      : formataDataHora(jogo.data_jogo, jogo.tempo_jogo, jogo.status)}
                  </span>
                </div>
              </article>
            );
          })}

          {jogosFiltrados.length === 0 && (
            <div className="google-sports-empty">
              Nenhuma partida encontrada para {campeonato} no momento.
            </div>
          )}
        </div>
      )}

      {/* Conteúdo: Tabela de Classificação Completa (Estilo Google Search) */}
      {(abaVisualizacao === "tabela" || variant === "full") && (
        <div className={`google-sports-standings-section ${variant === "carousel" ? "is-hidden" : ""}`}>
          {variant === "full" && abaVisualizacao !== "tabela" && (
            <div className="google-sports-section-title">
              <h4>Tabela de Classificação — {tabelaCamp}</h4>
              <div className="google-sports-subtabs">
                {["Brasileirão Série A", "Brasileirão Série B"].map((camp) => (
                  <button
                    key={camp}
                    type="button"
                    className={`google-sports-subpill ${tabelaCamp === camp ? "is-active" : ""}`}
                    onClick={() => setTabelaCamp(camp)}
                  >
                    {camp}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="google-table-wrapper">
            <table className="google-standings-table">
              <thead>
                <tr>
                  <th className="th-pos">#</th>
                  <th className="th-club">Clube</th>
                  <th className="th-num th-pts">P</th>
                  <th className="th-num">J</th>
                  <th className="th-num">V</th>
                  <th className="th-num">E</th>
                  <th className="th-num">D</th>
                  <th className="th-num th-sg">SG</th>
                </tr>
              </thead>
              <tbody>
                {tabelaFiltrada.map((item) => {
                  const pos = item.posicao;
                  // Zonas de Classificação Brasileirão Série A / B
                  let zoneClass = "";
                  if (tabelaCamp === "Brasileirão Série A") {
                    if (pos <= 4) zoneClass = "zone-libertadores"; // G4 Direto
                    else if (pos <= 6) zoneClass = "zone-pre-libertadores"; // Pré
                    else if (pos <= 12) zoneClass = "zone-sulamericana"; // Sul-Americana
                    else if (pos >= 17) zoneClass = "zone-rebaixamento"; // Z4
                  } else if (tabelaCamp === "Brasileirão Série B") {
                    if (pos <= 4) zoneClass = "zone-acesso"; // G4 Acesso Série A
                    else if (pos >= 17) zoneClass = "zone-rebaixamento"; // Z4 Série C
                  }

                  return (
                    <tr key={item.id} className={`tr-team ${zoneClass}`}>
                      <td className="td-pos">
                        <span className={`pos-indicator ${zoneClass}`} />
                        <span className="pos-number">{item.posicao}</span>
                      </td>
                      <td className="td-club">
                        {item.time_escudo ? (
                          <img
                            src={item.time_escudo}
                            alt={item.time_nome}
                            className="google-table-crest"
                            loading="lazy"
                          />
                        ) : (
                          <div className="google-table-crest-fallback">
                            {item.time_nome.slice(0, 3)}
                          </div>
                        )}
                        <span className="google-table-team-name">{item.time_nome}</span>
                      </td>
                      <td className="td-num td-pts">
                        <strong>{item.pontos}</strong>
                      </td>
                      <td className="td-num">{item.jogos}</td>
                      <td className="td-num">{item.vitorias}</td>
                      <td className="td-num">{item.empates}</td>
                      <td className="td-num">{item.derrotas}</td>
                      <td className="td-num td-sg">
                        {item.saldo_gols > 0 ? `+${item.saldo_gols}` : item.saldo_gols}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legenda das cores de classificação estilo Google */}
          <div className="google-standings-legend">
            {tabelaCamp === "Brasileirão Série A" ? (
              <>
                <div className="legend-item">
                  <span className="legend-dot legend-dot--libertadores" />
                  <span>Fase de grupos da Libertadores (G4)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot legend-dot--pre-libertadores" />
                  <span>Qualificatórias da Libertadores (G6)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot legend-dot--sulamericana" />
                  <span>Fase de grupos da Sul-Americana</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot legend-dot--rebaixamento" />
                  <span>Rebaixamento para a Série B (Z4)</span>
                </div>
              </>
            ) : (
              <>
                <div className="legend-item">
                  <span className="legend-dot legend-dot--libertadores" />
                  <span>Acesso à Série A (G4)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot legend-dot--rebaixamento" />
                  <span>Rebaixamento para a Série C (Z4)</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
