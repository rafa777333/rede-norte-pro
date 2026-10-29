"use client";

import { useEffect, useRef, useState } from "react";

export interface TopBannerConfig {
  tipo?: "video" | "carousel" | "image";
  videoUrl?: string;
  posterUrl?: string;
  imageUrl?: string;
  linkUrl?: string;
  audioEnabled?: boolean;
  slides?: Array<{
    id: string;
    imagem: string;
    titulo: string;
    linkUrl?: string;
  }>;
}

interface TopHeroBannerProps {
  config?: TopBannerConfig | null;
}

export default function TopHeroBanner({ config }: TopHeroBannerProps) {
  const tipo = config?.tipo || (config?.videoUrl ? "video" : "image");
  const videoUrl = config?.videoUrl?.trim() || "";
  const imageUrl = config?.imageUrl?.trim() || "/banner-rede-apucarana.png?v=2";
  const posterUrl = config?.posterUrl?.trim() || imageUrl;
  const linkUrl = config?.linkUrl?.trim() || "";
  const audioEnabled = Boolean(config?.audioEnabled);
  const slides = (config?.slides || []).filter((s) => Boolean(s?.imagem));

  // Estado para vídeo
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Estado para carrossel
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-play do carrossel
  useEffect(() => {
    if (tipo !== "carousel" || slides.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [tipo, slides.length, paused]);

  // Se for VÍDEO e tiver URL válida
  if (tipo === "video" && videoUrl) {
    const handleWrapperClick = () => {
      if (linkUrl) {
        if (linkUrl.startsWith("http")) {
          window.open(linkUrl, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = linkUrl;
        }
      }
    };

    return (
      <section className="container top-banner" aria-label="Capa Principal - Rede Apucarana de Comunicação">
        <div
          className={`top-banner-frame ${linkUrl ? "top-banner-frame--clickable" : ""}`}
          onClick={linkUrl ? handleWrapperClick : undefined}
          style={{ cursor: linkUrl ? "pointer" : "default" }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            autoPlay
            loop
            muted={muted}
            playsInline
            preload="auto"
            className="top-banner-media"
            aria-label="Animação da Rede Apucarana de Comunicação"
          />

          {audioEnabled && (
            <button
              type="button"
              className="top-banner-audio-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (videoRef.current) {
                  videoRef.current.muted = !muted;
                }
                setMuted(!muted);
              }}
              title={muted ? "Clique para ativar o áudio" : "Clique para silenciar o áudio"}
              aria-label={muted ? "Ativar áudio" : "Silenciar áudio"}
            >
              {muted ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                  <span>Ativar som</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  <span>Silenciar</span>
                </>
              )}
            </button>
          )}
        </div>
      </section>
    );
  }

  // Se for CARROSSEL com pelo menos 1 slide
  if (tipo === "carousel" && slides.length > 0) {
    return (
      <section className="container top-banner" aria-label="Carrossel Principal - Rede Apucarana de Comunicação">
        <div
          className="top-banner-frame top-banner-carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {slides.map((slide, idx) => {
            const isCurrent = idx === currentSlide;
            const content = (
              <img
                src={slide.imagem}
                alt={slide.titulo || `Slide ${idx + 1}`}
                className="top-banner-media"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            );

            return (
              <div
                key={slide.id || idx}
                className={`top-banner-carousel-slide ${isCurrent ? "active" : ""}`}
              >
                {slide.linkUrl ? (
                  <a
                    href={slide.linkUrl}
                    target={slide.linkUrl.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="top-banner-link"
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
              </div>
            );
          })}

          {slides.length > 1 && (
            <>
              <div className="top-banner-dots">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`top-banner-dot ${idx === currentSlide ? "active" : ""}`}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Ir para slide ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="top-banner-arrow prev"
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                aria-label="Slide anterior"
              >
                ‹
              </button>
              <button
                type="button"
                className="top-banner-arrow next"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                aria-label="Próximo slide"
              >
                ›
              </button>
            </>
          )}
        </div>
      </section>
    );
  }

  // Se for IMAGEM (ou fallback)
  const imageElement = (
    <img
      src={imageUrl}
      alt="Rede Apucarana de Comunicação — Jornalismo, Podcast, Rádio, Web TV e Portal"
      className="top-banner-media"
    />
  );

  return (
    <section className="container top-banner" aria-label="Banner Rede Apucarana de Comunicação">
      <div className="top-banner-frame">
        {linkUrl ? (
          <a
            href={linkUrl}
            target={linkUrl.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="top-banner-link"
          >
            {imageElement}
          </a>
        ) : (
          imageElement
        )}
      </div>
    </section>
  );
}
