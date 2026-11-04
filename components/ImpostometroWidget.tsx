"use client";

import React, { useState, useEffect, useMemo } from "react";

interface ImpostometroWidgetProps {
  cidadeAtual?: string;
  variant?: "destaque" | "card" | "banner";
}

interface CounterData {
  Valor: number;
  Incremento: number;
  Midnight: string;
}

const DEFAULT_BASELINES: Record<string, CounterData> = {
  brasil: {
    Valor: 3359891687861.18,
    Incremento: 136990.08,
    Midnight: new Date().toISOString().split("T")[0] + "T00:00:00.0000000",
  },
  parana: {
    Valor: 187487042472.13,
    Incremento: 7644.25,
    Midnight: new Date().toISOString().split("T")[0] + "T00:00:00.0000000",
  },
  apucarana: {
    Valor: 85440600.04,
    Incremento: 3.48,
    Midnight: new Date().toISOString().split("T")[0] + "T00:00:00.0000000",
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatCurrency(val: number): string {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatRate(val: number): string {
  if (val >= 1000) {
    return `+ R$ ${Math.round(val).toLocaleString("pt-BR")} / seg`;
  }
  return `+ R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / seg`;
}

interface GroupBreakdown {
  label: string;
  value: string;
  unit: string;
  icon: string;
}

function getBreakdown(total: number): GroupBreakdown[] {
  const fixed = Math.floor(total);
  const parts = fixed.toLocaleString("pt-BR").split(".");
  const n = parts.length;
  const groups: GroupBreakdown[] = [];

  const labelsMap: Record<number, { label: string; icon: string }[]> = {
    5: [
      { label: "Trilhões", icon: "🏛️" },
      { label: "Bilhões", icon: "💎" },
      { label: "Milhões", icon: "💰" },
      { label: "Mil", icon: "💵" },
      { label: "Reais", icon: "🪙" },
    ],
    4: [
      { label: "Bilhões", icon: "💎" },
      { label: "Milhões", icon: "💰" },
      { label: "Mil", icon: "💵" },
      { label: "Reais", icon: "🪙" },
    ],
    3: [
      { label: "Milhões", icon: "💰" },
      { label: "Mil", icon: "💵" },
      { label: "Reais", icon: "🪙" },
    ],
    2: [
      { label: "Mil", icon: "💵" },
      { label: "Reais", icon: "🪙" },
    ],
    1: [{ label: "Reais", icon: "🪙" }],
  };

  const list = labelsMap[n] || [];

  for (let i = 0; i < n; i++) {
    const rawVal = parts[i];
    const info = list[i] || { label: "Valor", icon: "•" };
    groups.push({
      label: info.label,
      value: rawVal,
      unit: info.label,
      icon: info.icon,
    });
  }

  // Adiciona os centavos
  const cents = Math.floor((total - fixed) * 100);
  groups.push({
    label: "Centavos",
    value: `,${String(cents).padStart(2, "0")}`,
    unit: "Centavos",
    icon: "⏱️",
  });

  return groups;
}

export default function ImpostometroWidget({
  cidadeAtual = "Geral",
  variant = "destaque",
}: ImpostometroWidgetProps) {
  const [scope, setScope] = useState<"brasil" | "parana" | "municipio">("brasil");
  const [data, setData] = useState<CounterData>(DEFAULT_BASELINES.brasil);
  const [currentTotal, setCurrentTotal] = useState<number>(() => {
    const b = DEFAULT_BASELINES.brasil;
    const now = Date.now();
    const mid = new Date(b.Midnight).getTime();
    const sec = Math.max(0, (now - mid) / 1000);
    return b.Valor + b.Incremento * sec;
  });
  const [loading, setLoading] = useState(false);

  const cidadeNome = useMemo(() => {
    if (!cidadeAtual || cidadeAtual === "Geral" || cidadeAtual === "Todas") {
      return "Apucarana";
    }
    return cidadeAtual;
  }, [cidadeAtual]);

  const cidadeSlug = useMemo(() => slugify(cidadeNome), [cidadeNome]);

  const scopeLabel = useMemo(() => {
    if (scope === "parana") return "Paraná";
    if (scope === "municipio") return cidadeNome;
    return "Brasil";
  }, [scope, cidadeNome]);

  // Carrega os dados da API interna quando muda o escopo ou a cidade
  useEffect(() => {
    let active = true;
    const fetchScopeData = async () => {
      setLoading(true);
      try {
        let url = `/api/impostometro?scope=${scope}`;
        if (scope === "municipio") {
          url += `&municipio=${encodeURIComponent(cidadeSlug)}`;
        }
        const res = await fetch(url);
        const json = await res.json();
        if (active && json.data) {
          setData(json.data);
        }
      } catch (err) {
        if (active) {
          const fallbackKey = scope === "municipio" ? "apucarana" : scope;
          setData(DEFAULT_BASELINES[fallbackKey] || DEFAULT_BASELINES.brasil);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchScopeData();
    return () => {
      active = false;
    };
  }, [scope, cidadeSlug]);

  // Atualização contínua do total em tempo real a cada 100ms
  useEffect(() => {
    const timer = setInterval(() => {
      if (!data || !data.Midnight) return;
      const now = Date.now();
      const mid = new Date(data.Midnight).getTime();
      const secPassed = Math.max(0, (now - mid) / 1000);
      const updated = data.Valor + data.Incremento * secPassed;
      setCurrentTotal(updated);
    }, 100);

    return () => clearInterval(timer);
  }, [data]);

  const breakdown = useMemo(() => getBreakdown(currentTotal), [currentTotal]);

  const handleScopeChange = (newScope: "brasil" | "parana" | "municipio") => {
    if (newScope !== scope) {
      setScope(newScope);
      const fallbackKey = newScope === "municipio" ? "apucarana" : newScope;
      const base = DEFAULT_BASELINES[fallbackKey] || DEFAULT_BASELINES.brasil;
      setData(base);
    }
  };

  // VARIANTE BANNER HORIZONTAL: Estilo Infográfico Moderno de Economia
  if (variant === "banner") {
    return (
      <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-800 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Lado Esquerdo: Identificação e Escopos */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/60">
                Impostômetro 2026 · Ao Vivo
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">IBPT / ACSP</span>
            </div>

            {/* Abas Brasil / Paraná / Apucarana */}
            <div className="inline-flex rounded-lg bg-slate-800/90 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => handleScopeChange("brasil")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                  scope === "brasil"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                🇧🇷 Brasil
              </button>
              <button
                type="button"
                onClick={() => handleScopeChange("parana")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                  scope === "parana"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                🏛️ Paraná
              </button>
              <button
                type="button"
                onClick={() => handleScopeChange("municipio")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                  scope === "municipio"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                📍 {cidadeNome}
              </button>
            </div>
          </div>

          {/* Lado Direito: Grande Valor + Ritmo por segundo */}
          <div className="flex flex-wrap items-baseline gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-amber-400">R$</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white tabular-nums font-sans">
                {formatCurrency(currentTotal)}
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60 tabular-nums">
              {formatRate(data.Incremento)}
            </span>
          </div>
        </div>

        {/* Linha Inferior: Escala horizontal compacta */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono">
            {breakdown.map((b, idx) => (
              <span key={idx} className="inline-flex items-center gap-1">
                <strong className="text-slate-200 font-bold">{b.value}</strong>
                <span className="text-slate-400 text-[10px]">{b.label}</span>
                {idx < breakdown.length - 1 && <span className="text-slate-600">·</span>}
              </span>
            ))}
          </div>
          <a
            href="https://impostometro.com.br/"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 hover:text-amber-300 text-[10px] font-semibold underline decoration-amber-500/50"
          >
            Painel oficial IBPT ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <article
      className={`impostometro-feature-card ${variant === "destaque" ? "impostometro-feature-card--span2" : ""}`}
      id="impostometro-destaque"
      aria-label="Painel Impostômetro em tempo real"
    >
      {/* Topo do Card com Título e Seletor de Escopo */}
      <div className="impostometro-feature-head">
        <div className="impostometro-head-main">
          <div className="impostometro-kicker-row">
            <span className="impostometro-live-badge">
              <span className="impostometro-live-pulse" />
              TEMPO REAL
            </span>
            <span className="impostometro-year-pill">2026</span>
            <span className="impostometro-official-badge">ACSP · IBPT</span>
          </div>
          <h3 className="impostometro-feature-title">
            Impostômetro Oficial em Destaque
          </h3>
          <p className="impostometro-feature-subtitle">
            Estimativa em tempo real de tributos federais, estaduais e municipais pagos em{" "}
            <strong>{scopeLabel}</strong>.
          </p>
        </div>

        {/* Seletor de Escopo (Abas) */}
        <div className="impostometro-scope-pills" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={scope === "brasil"}
            className={`impostometro-pill ${scope === "brasil" ? "active" : ""}`}
            onClick={() => handleScopeChange("brasil")}
            title="Arrecadação total do Brasil"
          >
            🇧🇷 Brasil
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "parana"}
            className={`impostometro-pill ${scope === "parana" ? "active" : ""}`}
            onClick={() => handleScopeChange("parana")}
            title="Arrecadação do Estado do Paraná"
          >
            🏛️ Paraná
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "municipio"}
            className={`impostometro-pill ${scope === "municipio" ? "active" : ""}`}
            onClick={() => handleScopeChange("municipio")}
            title={`Arrecadação municipal em ${cidadeNome}`}
          >
            📍 {cidadeNome}
          </button>
        </div>
      </div>

      {/* Caixa Central do Contador (Em Destaque Grande) */}
      <div className="impostometro-display-box">
        <div className="impostometro-display-counter">
          <span className="impostometro-currency-symbol">R$</span>
          <strong className="impostometro-big-number">
            {formatCurrency(currentTotal)}
          </strong>
        </div>

        <div className="impostometro-metrics-row">
          <div className="impostometro-metric-badge">
            <span className="impostometro-speed-dot" />
            <span>Ritmo: <strong>{formatRate(data.Incremento)}</strong></span>
          </div>
          <div className="impostometro-metric-badge">
            <span>📅 Arrecadação acumulada desde 01/01/2026</span>
          </div>
        </div>
      </div>

      {/* Detalhamento entre Trilhões, Bilhões, Milhões, Mil e Reais */}
      <div className="impostometro-breakdown-section">
        <div className="impostometro-breakdown-header">
          <span className="impostometro-breakdown-heading">
            Detalhamento por Escala da Arrecadação:
          </span>
          <small className="impostometro-breakdown-note">
            Atualizado segundo a segundo
          </small>
        </div>
        <div className="impostometro-breakdown-grid">
          {breakdown.map((item, idx) => (
            <div key={`${item.label}-${idx}`} className="impostometro-breakdown-col">
              <span className="impostometro-breakdown-val">
                {item.value}
              </span>
              <span className="impostometro-breakdown-lbl">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé Oficial */}
      <div className="impostometro-feature-footer">
        <span className="impostometro-source-text">
          Fonte oficial: <strong>Associação Comercial de São Paulo (ACSP) / IBPT</strong>
        </span>
        <a
          href="https://impostometro.com.br/"
          target="_blank"
          rel="noreferrer"
          className="impostometro-official-link"
          title="Conferir dados no portal oficial do Impostômetro"
        >
          impostometro.com.br ↗
        </a>
      </div>
    </article>
  );
}
