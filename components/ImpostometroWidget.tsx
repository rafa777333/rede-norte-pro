"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";

interface ImpostometroWidgetProps {
  cidadeAtual?: string;
  variant?: "card" | "banner";
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
}

function getBreakdown(total: number): GroupBreakdown[] {
  const fixed = Math.floor(total);
  const parts = fixed.toLocaleString("pt-BR").split(".");
  const n = parts.length;
  const groups: GroupBreakdown[] = [];

  // Ex: 5 grupos = [Trilhões, Bilhões, Milhões, Mil, Reais]
  // 4 grupos = [Bilhões, Milhões, Mil, Reais]
  // 3 grupos = [Milhões, Mil, Reais]
  // 2 grupos = [Mil, Reais]
  const labelsMap: Record<number, string[]> = {
    5: ["Trilhões", "Bilhões", "Milhões", "Mil", "Reais"],
    4: ["Bilhões", "Milhões", "Mil", "Reais"],
    3: ["Milhões", "Mil", "Reais"],
    2: ["Mil", "Reais"],
    1: ["Reais"],
  };

  const labels = labelsMap[n] || [];

  for (let i = 0; i < n; i++) {
    const rawVal = parts[i];
    const unit = labels[i] || "";
    groups.push({
      label: unit,
      value: rawVal,
      unit: unit,
    });
  }

  return groups;
}

export default function ImpostometroWidget({
  cidadeAtual = "Geral",
  variant = "card",
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

  return (
    <article className="impostometro-feature-card" id="impostometro-destaque">
      <div className="impostometro-feature-head">
        <div className="impostometro-kicker-row">
          <span className="impostometro-live-badge">
            <span className="impostometro-live-pulse" />
            TEMPO REAL
          </span>
          <span className="impostometro-year-pill">2026</span>
        </div>
        <h3 className="impostometro-feature-title">Impostômetro Oficial</h3>
        <p className="impostometro-feature-subtitle">
          Arrecadação de impostos, taxas e contribuições em <strong>{scopeLabel}</strong>
        </p>
      </div>

      {/* Seletor de Escopo */}
      <div className="impostometro-scope-pills" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={scope === "brasil"}
          className={`impostometro-pill ${scope === "brasil" ? "active" : ""}`}
          onClick={() => handleScopeChange("brasil")}
        >
          🇧🇷 Brasil
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === "parana"}
          className={`impostometro-pill ${scope === "parana" ? "active" : ""}`}
          onClick={() => handleScopeChange("parana")}
        >
          🏛️ PR
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === "municipio"}
          className={`impostometro-pill ${scope === "municipio" ? "active" : ""}`}
          onClick={() => handleScopeChange("municipio")}
          title={`Arrecadação em ${cidadeNome}`}
        >
          📍 {cidadeNome.length > 9 ? cidadeNome.slice(0, 8) + "…" : cidadeNome}
        </button>
      </div>

      {/* Contador Principal em Destaque */}
      <div className="impostometro-display-box">
        <span className="impostometro-currency-symbol">R$</span>
        <strong className="impostometro-big-number">
          {formatCurrency(currentTotal)}
        </strong>
        <div className="impostometro-speed-indicator">
          <span className="impostometro-speed-dot" />
          <span>{formatRate(data.Incremento)}</span>
        </div>
      </div>

      {/* Detalhamento entre Trilhões, Bilhões, Milhões, Mil e Reais */}
      <div className="impostometro-breakdown-section">
        <span className="impostometro-breakdown-heading">
          Detalhamento da Arrecadação:
        </span>
        <div className="impostometro-breakdown-grid">
          {breakdown.map((item, idx) => (
            <div key={`${item.label}-${idx}`} className="impostometro-breakdown-col">
              <span className="impostometro-breakdown-val">{item.value}</span>
              <span className="impostometro-breakdown-lbl">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé Informativo */}
      <div className="impostometro-feature-footer">
        <span className="impostometro-source-text">
          Fonte: <strong>ACSP / IBPT</strong>
        </span>
        <a
          href="https://impostometro.com.br/"
          target="_blank"
          rel="noreferrer"
          className="impostometro-official-link"
          title="Ver no portal do Impostômetro"
        >
          impostometro.com.br ↗
        </a>
      </div>
    </article>
  );
}
