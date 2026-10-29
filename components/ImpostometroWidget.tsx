"use client";

import React, { useState, useMemo } from "react";

interface ImpostometroWidgetProps {
  cidadeAtual?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ImpostometroWidget({ cidadeAtual = "Geral" }: ImpostometroWidgetProps) {
  const [scope, setScope] = useState<"brasil" | "parana" | "municipio">("brasil");
  const [loading, setLoading] = useState(true);

  // Determina a cidade municipal a exibir (se for Geral ou Todas, usa Apucarana como polo)
  const cidadeNome = useMemo(() => {
    if (!cidadeAtual || cidadeAtual === "Geral" || cidadeAtual === "Todas") {
      return "Apucarana";
    }
    return cidadeAtual;
  }, [cidadeAtual]);

  const cidadeSlug = useMemo(() => {
    return slugify(cidadeNome);
  }, [cidadeNome]);

  // URL oficial do widget do Impostômetro (ACSP / IBPT)
  const widgetUrl = useMemo(() => {
    if (scope === "parana") {
      return "https://impostometro.com.br/widget/contador/pr";
    }
    if (scope === "municipio") {
      return `https://impostometro.com.br/widget/contador/pr?municipio=${cidadeSlug}`;
    }
    return "https://impostometro.com.br/widget/contador/";
  }, [scope, cidadeSlug]);

  const scopeLabel = useMemo(() => {
    if (scope === "parana") return "Paraná";
    if (scope === "municipio") return cidadeNome;
    return "Brasil";
  }, [scope, cidadeNome]);

  const handleScopeChange = (newScope: "brasil" | "parana" | "municipio") => {
    if (newScope !== scope) {
      setLoading(true);
      setScope(newScope);
    }
  };

  return (
    <div className="impostometro-card" id="impostometro">
      <div className="impostometro-head">
        <div className="impostometro-badge">
          <span className="impostometro-live-dot" />
          <span>IMPOSTÔMETRO · TEMPO REAL</span>
        </div>
        <strong className="impostometro-title">Arrecadação de Tributos</strong>
        <p className="impostometro-desc">
          Total de impostos, taxas e contribuições pagos em {scopeLabel} neste ano:
        </p>
      </div>

      <div className="impostometro-tabs" role="tablist" aria-label="Seletor de abrangência do Impostômetro">
        <button
          type="button"
          role="tab"
          aria-selected={scope === "brasil"}
          className={`impostometro-tab ${scope === "brasil" ? "active" : ""}`}
          onClick={() => handleScopeChange("brasil")}
          title="Ver arrecadação nacional (Brasil)"
        >
          🇧🇷 Brasil
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === "parana"}
          className={`impostometro-tab ${scope === "parana" ? "active" : ""}`}
          onClick={() => handleScopeChange("parana")}
          title="Ver arrecadação estadual (Paraná)"
        >
          🏛️ Paraná
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === "municipio"}
          className={`impostometro-tab ${scope === "municipio" ? "active" : ""}`}
          onClick={() => handleScopeChange("municipio")}
          title={`Ver arrecadação municipal (${cidadeNome})`}
        >
          📍 {cidadeNome.length > 10 ? cidadeNome.slice(0, 9) + "…" : cidadeNome}
        </button>
      </div>

      <div className="impostometro-frame-wrap">
        {loading && (
          <div className="impostometro-loading-overlay">
            <div className="impostometro-spinner" />
            <span>Atualizando contador...</span>
          </div>
        )}
        <iframe
          key={widgetUrl}
          src={widgetUrl}
          title={`Impostômetro Oficial - ${scopeLabel}`}
          className={`impostometro-iframe ${loading ? "is-loading" : "is-loaded"}`}
          scrolling="no"
          frameBorder="0"
          loading="lazy"
          onLoad={() => setLoading(false)}
        />
      </div>

      <div className="impostometro-footer">
        <span className="impostometro-source">
          Fonte: <strong>ACSP / IBPT</strong>
        </span>
        <a
          href="https://impostometro.com.br/"
          target="_blank"
          rel="noreferrer"
          className="impostometro-link"
          title="Acessar portal oficial do Impostômetro"
        >
          impostometro.com.br ↗
        </a>
      </div>
    </div>
  );
}
