"use client";

import React, { useEffect, useState, useTransition } from "react";
import { getSupabase } from "@/lib/supabase";
import { decodeHtmlEntities } from "@/lib/text-utils";
import {
  SocialPublication,
  SocialPublicationNetwork,
  SocialPublicationStatus,
  SOCIAL_STATUS_CONFIG,
} from "@/types/social";

interface SocialPublishWidgetProps {
  newsId: string;
  title: string;
  imageUrl?: string;
  initialPublication?: SocialPublication | null;
  onPublished?: (pub: SocialPublication) => void;
  compact?: boolean;
}

const AVAILABLE_NETWORKS: Array<{
  id: SocialPublicationNetwork;
  label: string;
  badge: string;
  icon: string;
  accentColor: string;
}> = [
  {
    id: "facebook",
    label: "Facebook",
    badge: "Página",
    icon: "📘",
    accentColor: "#1877F2",
  },
  {
    id: "instagram",
    label: "Instagram Feed",
    badge: "Feed",
    icon: "📸",
    accentColor: "#E1306C",
  },
  {
    id: "instagram_stories",
    label: "Instagram Stories",
    badge: "Stories",
    icon: "📱",
    accentColor: "#833AB4",
  },
];

const ORDERED_STEPS: SocialPublicationStatus[] = [
  "queued",
  "validating",
  "generating",
  "asset_ready",
  "publishing",
  "published",
];

export default function SocialPublishWidget({
  newsId,
  title,
  imageUrl,
  initialPublication = null,
  onPublished,
  compact = false,
}: SocialPublishWidgetProps) {
  const [selectedNetworks, setSelectedNetworks] = useState<SocialPublicationNetwork[]>([
    "facebook",
    "instagram",
  ]);
  const [publication, setPublication] = useState<SocialPublication | null>(
    initialPublication
  );
  const [loadingInitial, setLoadingInitial] = useState<boolean>(!initialPublication);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // 1. Busca publicação mais recente desta notícia e inscreve no Supabase Realtime
  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabase();
    if (!supabase || !newsId) {
      setLoadingInitial(false);
      return;
    }

    // Busca o status mais recente no banco
    const carregarPublicacaoRecente = async () => {
      try {
        const { data, error } = await supabase
          .from("social_publications")
          .select("*")
          .eq("news_id", newsId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (isMounted) {
          if (!error && data) {
            setPublication(data as SocialPublication);
            if (data.networks && Array.isArray(data.networks) && data.networks.length > 0) {
              setSelectedNetworks(data.networks as SocialPublicationNetwork[]);
            }
          }
          setLoadingInitial(false);
        }
      } catch {
        if (isMounted) setLoadingInitial(false);
      }
    };

    void carregarPublicacaoRecente();

    // Inscrição Supabase Realtime para escutar UPDATE / INSERT em social_publications desta notícia
    const channelName = `social-pub-${newsId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "social_publications",
          filter: `news_id=eq.${newsId}`,
        },
        (payload) => {
          if (!isMounted) return;
          const updated = payload.new as SocialPublication;
          if (updated && updated.id) {
            startTransition(() => {
              setPublication(updated);
              if (updated.status === "published" && onPublished) {
                onPublished(updated);
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [newsId, onPublished]);

  // Alterna a seleção de uma rede
  const toggleNetwork = (net: SocialPublicationNetwork) => {
    setSelectedNetworks((prev) =>
      prev.includes(net) ? prev.filter((item) => item !== net) : [...prev, net]
    );
  };

  // Verifica se existe processamento ativo
  const isProcessing =
    publication?.status === "queued" ||
    publication?.status === "validating" ||
    publication?.status === "generating" ||
    publication?.status === "asset_ready" ||
    publication?.status === "publishing";

  const isButtonDisabled = submitting || isProcessing || selectedNetworks.length === 0;

  // Disparo para a API Route /api/social/publish
  const handlePublish = async () => {
    if (selectedNetworks.length === 0) {
      setActionError("Selecione pelo menos uma rede social para publicar.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error("Cliente Supabase não inicializado.");
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        throw new Error("Sua sessão expirou. Faça login novamente no painel.");
      }

      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          news_id: newsId,
          title: decodeHtmlEntities(title),
          image_url: imageUrl,
          networks: selectedNetworks,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          json?.error || `Falha no envio para o servidor (${res.status}).`
        );
      }

      if (json?.publication) {
        setPublication(json.publication);
      }
    } catch (err: any) {
      console.error("Erro ao solicitar publicação automatizada:", err);
      setActionError(err?.message || "Ocorreu um erro ao disparar a publicação.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = publication
    ? SOCIAL_STATUS_CONFIG[publication.status] || SOCIAL_STATUS_CONFIG.queued
    : null;

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: compact ? "10px 12px" : "14px 16px",
        background: "#ffffff",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        display: "grid",
        gap: "10px",
      }}
    >
      {/* CABEÇALHO DO WIDGET */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px" }}>⚡</span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#1e293b",
              letterSpacing: "-0.2px",
            }}
          >
            Publicação Social Automatizada (Carimbo Oficial RA)
          </span>
        </div>

        {/* BADGE DE STATUS DINÂMICO */}
        {publication && statusConfig && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 9px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 700,
              backgroundColor: statusConfig.badgeBg,
              color: statusConfig.badgeText,
              border: `1px solid ${statusConfig.badgeBorder}`,
            }}
          >
            <span>{statusConfig.icon}</span>
            <span>{statusConfig.label}</span>
            {statusConfig.isLoading && (
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  border: `2px solid ${statusConfig.badgeText}`,
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* SELETOR DE REDES SOCIAIS (CHECKBOXES) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>
          Redes:
        </span>
        {AVAILABLE_NETWORKS.map((net) => {
          const isSelected = selectedNetworks.includes(net.id);
          const disabled = isProcessing || submitting;

          return (
            <label
              key={net.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                border: `1px solid ${isSelected ? net.accentColor : "#cbd5e1"}`,
                backgroundColor: isSelected ? `${net.accentColor}12` : "#f8fafc",
                color: isSelected ? net.accentColor : "#475569",
                opacity: disabled ? 0.65 : 1,
                transition: "all 0.15s ease",
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={disabled}
                onChange={() => toggleNetwork(net.id)}
                style={{
                  cursor: disabled ? "not-allowed" : "pointer",
                  accentColor: net.accentColor,
                }}
              />
              <span>{net.icon}</span>
              <span>{net.label}</span>
            </label>
          );
        })}
      </div>

      {/* ESTEIRA VISUAL DE PROGRESSO (TIMELINE) */}
      {publication && publication.status !== "failed" && (
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "8px",
            padding: "8px 10px",
            border: "1px solid #e2e8f0",
            display: "grid",
            gap: "6px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "10px",
              fontWeight: 700,
              color: "#64748b",
            }}
          >
            <span>Fluxo de Publicação</span>
            <span style={{ color: statusConfig?.badgeText }}>
              {statusConfig?.description}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${ORDERED_STEPS.length}, 1fr)`,
              gap: "4px",
            }}
          >
            {ORDERED_STEPS.map((stepKey, idx) => {
              const currentIdx = ORDERED_STEPS.indexOf(publication.status);
              const isDone = currentIdx > idx || publication.status === "published";
              const isCurrent = publication.status === stepKey;

              let bg = "#e2e8f0";
              let textColor = "#94a3b8";
              if (isDone) {
                bg = "#10b981";
                textColor = "#ffffff";
              } else if (isCurrent) {
                bg = "#3b82f6";
                textColor = "#ffffff";
              }

              return (
                <div
                  key={stepKey}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                  }}
                  title={SOCIAL_STATUS_CONFIG[stepKey]?.description}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "5px",
                      borderRadius: "3px",
                      backgroundColor: bg,
                      transition: "background-color 0.3s ease",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent ? "#1e293b" : textColor === "#ffffff" ? "#10b981" : "#94a3b8",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {SOCIAL_STATUS_CONFIG[stepKey]?.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MENSAGEM DE ERRO (CASO HAJA FALHA OU ERRO NA AÇÃO) */}
      {!submitting && (actionError || (publication?.status === "failed" && publication.error_log)) && (
        <div
          style={{
            fontSize: "11px",
            color: "#991b1b",
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "6px",
            padding: "6px 10px",
            display: "grid",
            gap: "2px",
          }}
        >
          <strong>Falha na Publicação:</strong>
          <span>{actionError || publication?.error_log}</span>
        </div>
      )}

      {/* RESULTADO DE SUCESSO E LINKS DAS PUBLICAÇÕES */}
      {publication?.status === "published" && (
        <div
          style={{
            fontSize: "11px",
            color: "#166534",
            background: "#dcfce7",
            border: "1px solid #86efac",
            borderRadius: "6px",
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span>✅</span>
            <strong>Publicado com sucesso em todas as redes selecionadas!</strong>
          </div>
          <div style={{ display: "inline-flex", gap: "6px" }}>
            {publication.meta_post_ids?.facebook && (
              <span
                style={{
                  fontSize: "10px",
                  background: "#ffffff",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid #bbf7d0",
                }}
              >
                FB ID: {publication.meta_post_ids.facebook.slice(-8)}
              </span>
            )}
            {publication.meta_post_ids?.instagram && (
              <span
                style={{
                  fontSize: "10px",
                  background: "#ffffff",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid #bbf7d0",
                }}
              >
                IG ID: {publication.meta_post_ids.instagram.slice(-8)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* BOTÃO PRINCIPAL DE DISPARO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          borderTop: "1px solid #f1f5f9",
          paddingTop: "8px",
        }}
      >
        <div style={{ fontSize: "11px", color: "#64748b" }}>
          {loadingInitial ? (
            <span>Carregando histórico...</span>
          ) : isProcessing ? (
            <span style={{ color: "#2563eb", fontWeight: 600 }}>
              Processamento em andamento via n8n...
            </span>
          ) : publication?.status === "published" ? (
            <span style={{ color: "#166534", fontWeight: 600 }}>
              Notícia já divulgada nas redes sociais
            </span>
          ) : (
            <span>Pronto para carimbar arte oficial e postar</span>
          )}
        </div>

        <button
          type="button"
          disabled={isButtonDisabled}
          onClick={handlePublish}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#ffffff",
            backgroundColor: isButtonDisabled
              ? "#94a3b8"
              : publication?.status === "failed"
              ? "#dc2626"
              : "#0284c7",
            border: "none",
            cursor: isButtonDisabled ? "not-allowed" : "pointer",
            boxShadow: isButtonDisabled
              ? "none"
              : "0 2px 4px rgba(2, 132, 199, 0.25)",
            transition: "all 0.15s ease",
          }}
        >
          {submitting ? (
            <>
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  border: "2px solid #ffffff",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span>Enfileirando...</span>
            </>
          ) : isProcessing ? (
            <>
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  border: "2px solid #ffffff",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span>
                {publication?.status === "generating"
                  ? "Carimbando Arte..."
                  : publication?.status === "publishing"
                  ? "Postando na Meta..."
                  : "Processando..."}
              </span>
            </>
          ) : publication?.status === "failed" ? (
            <>
              <span>🔄</span>
              <span>Tentar Novamente</span>
            </>
          ) : publication?.status === "published" ? (
            <>
              <span>🚀</span>
              <span>Republicar nas Redes</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Publicar nas Redes</span>
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
