"use client";

import React, { useState } from "react";
import { Globe, Send, CheckCircle2, AlertCircle, Loader2, Sparkles, ExternalLink } from "lucide-react";

export function AdminGoogleIndexButton({
  url,
  title,
  compact = true,
}: {
  url: string;
  title?: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleIndex = async () => {
    if (loading) return;
    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch("/api/indexar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setMessage("Enviado ao Google com sucesso!");
        setTimeout(() => setSuccess(null), 7000);
      } else {
        setSuccess(false);
        setMessage(data?.error || data?.indexing?.error || "Erro ao indexar.");
        setTimeout(() => setSuccess(null), 7000);
      }
    } catch (err: any) {
      setSuccess(false);
      setMessage(err?.message || "Erro de conexão ao indexar.");
      setTimeout(() => setSuccess(null), 7000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <button
        type="button"
        onClick={handleIndex}
        disabled={loading}
        title={title || "Enviar esta matéria imediatamente para indexação no Google"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          fontSize: compact ? "11px" : "12px",
          fontWeight: 700,
          padding: compact ? "4px 9px" : "6px 12px",
          borderRadius: "6px",
          border: success ? "1px solid #16a34a" : success === false ? "1px solid #dc2626" : "1px solid #0284c7",
          backgroundColor: success ? "#f0fdf4" : success === false ? "#fef2f2" : "#f0f9ff",
          color: success ? "#15803d" : success === false ? "#b91c1c" : "#0369a1",
          cursor: loading ? "wait" : "pointer",
          transition: "all 0.15s ease",
        }}
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ animation: "spin 1s linear infinite" }} />
            <span>Indexando...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#16a34a" }} />
            <span>Enviado ao Google!</span>
          </>
        ) : success === false ? (
          <>
            <AlertCircle className="w-3.5 h-3.5" style={{ color: "#dc2626" }} />
            <span>Falha</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" style={{ color: "#0284c7" }} />
            <span>⚡ Indexar no Google</span>
          </>
        )}
      </button>

      {message && (
        <span
          style={{
            fontSize: "11px",
            color: success ? "#15803d" : "#b91c1c",
            fontWeight: 500,
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
}

export default function AdminGoogleIndexer() {
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleIndex = async (overrideUrl?: string) => {
    const target = (overrideUrl || urlInput || "").trim();
    if (!target) {
      setErrorMsg("Informe a URL ou o slug que deseja indexar no Google.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setResult(null);

      const res = await fetch("/api/indexar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
        if (!overrideUrl) setUrlInput("");
      } else {
        setErrorMsg(
          data?.error ||
          data?.indexing?.error ||
          data?.sitemap?.error ||
          "Não foi possível concluir a indexação no Google."
        );
        if (data) setResult(data);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro de conexão ao chamar API de indexação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "20px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
      }}
    >
      {/* Cabeçalho do Card */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563eb",
            }}
          >
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
              Indexador Instantâneo Google
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "10px", backgroundColor: "#dbeafe", color: "#1d4ed8" }}>
                API + Search Console
              </span>
            </h3>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
              Envie qualquer matéria, vaga ou link diretamente para o robô do Google rastrear na hora.
            </p>
          </div>
        </div>

        {/* Atalhos Rápidos */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleIndex("https://www.redeapucarana.com.br/")}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            🏠 Capa
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleIndex("https://www.redeapucarana.com.br/noticias")}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            📰 Notícias
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleIndex("https://www.redeapucarana.com.br/empregos")}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            💼 Vagas de Emprego
          </button>
        </div>
      </div>

      {/* Formulário de Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleIndex();
        }}
        style={{ display: "flex", gap: "8px", alignItems: "center" }}
      >
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Cole o link completo ou o slug (ex: ferreira-junior-questiona... ou https://...)"
          disabled={loading}
          style={{
            flex: 1,
            fontSize: "12px",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            outline: "none",
            backgroundColor: "#ffffff",
            color: "#0f172a",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 14px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            transition: "background-color 0.15s ease",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ animation: "spin 1s linear infinite" }} />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Indexar Agora</span>
            </>
          )}
        </button>
      </form>

      {/* Feedback de Erro */}
      {errorMsg && (
        <div
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            borderRadius: "6px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Feedback de Sucesso */}
      {result && result.success && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px 14px",
            borderRadius: "8px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            fontSize: "11px",
            color: "#166534",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Notificação recebida com sucesso pelos servidores do Google!</span>
          </div>
          <div style={{ color: "#15803d", wordBreak: "break-all" }}>
            <strong>URL:</strong> {result.url}
          </div>
          <div style={{ display: "flex", gap: "14px", marginTop: "2px", color: "#166534", fontSize: "10.5px" }}>
            <span>✅ Indexing API: <strong>HTTP {result.indexing?.status || 200} (OK)</strong></span>
            <span>✅ Search Console: <strong>HTTP {result.sitemap?.status || 204} (Sitemap Reenviado)</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
