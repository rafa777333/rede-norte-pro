"use client";

import { useEffect } from "react";
import type { SignoPrevisao } from "../lib/horoscope";

type Props = {
  signo: SignoPrevisao | null;
  signos: SignoPrevisao[];
  onClose: () => void;
  onSelectSigno: (s: SignoPrevisao) => void;
};

export default function HoroscopeModal({ signo, signos, onClose, onSelectSigno }: Props) {
  useEffect(() => {
    if (!signo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [signo, signos]);

  if (!signo) return null;

  const currentIndex = signos.findIndex((s) => s.slug === signo.slug);
  const prevSigno = currentIndex > 0 ? signos[currentIndex - 1] : signos[signos.length - 1];
  const nextSigno = currentIndex < signos.length - 1 ? signos[currentIndex + 1] : signos[0];

  const handlePrev = () => onSelectSigno(prevSigno);
  const handleNext = () => onSelectSigno(nextSigno);

  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="horoscope-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="horoscope-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="horoscope-modal-header">
          <div className="horoscope-modal-title-row">
            <span className="horoscope-modal-glyph">{signo.simbolo}</span>
            <div>
              <div className="horoscope-modal-kicker">
                <span>SIGNO DO ZODÍACO</span>
                <span className={`horoscope-element-pill element-${signo.elemento.toLowerCase()}`}>
                  {signo.elemento}
                </span>
              </div>
              <h2>{signo.nome}</h2>
              <small className="horoscope-modal-periodo">{signo.periodo}</small>
            </div>
          </div>
          <button className="horoscope-modal-close" onClick={onClose} aria-label="Fechar previsão">
            ✕
          </button>
        </header>

        <div className="horoscope-modal-date-bar">
          <span>📅 Previsão para hoje · {dataFormatada}</span>
        </div>

        <div className="horoscope-modal-body">
          <section className="horoscope-section horoscope-section--general">
            <div className="horoscope-section-title">
              <span>✨</span>
              <strong>Energia Geral do Dia</strong>
            </div>
            <p>{signo.geral}</p>
          </section>

          <div className="horoscope-dual-grid">
            <section className="horoscope-section horoscope-section--love">
              <div className="horoscope-section-title">
                <span>❤️</span>
                <strong>Amor & Relações</strong>
              </div>
              <p>{signo.amor}</p>
            </section>

            <section className="horoscope-section horoscope-section--work">
              <div className="horoscope-section-title">
                <span>💼</span>
                <strong>Trabalho & Finanças</strong>
              </div>
              <p>{signo.trabalho}</p>
            </section>
          </div>

          <section className="horoscope-lucky-bar">
            <div className="lucky-item">
              <small>NÚMERO DA SORTE</small>
              <strong>{signo.numeroSorte}</strong>
            </div>
            <div className="lucky-divider" />
            <div className="lucky-item">
              <small>COR DO DIA</small>
              <strong>{signo.corDia}</strong>
            </div>
          </section>
        </div>

        <footer className="horoscope-modal-footer">
          <button type="button" className="horoscope-nav-btn" onClick={handlePrev}>
            ‹ {prevSigno.simbolo} {prevSigno.nome}
          </button>
          <button type="button" className="horoscope-close-btn" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="horoscope-nav-btn" onClick={handleNext}>
            {nextSigno.nome} {nextSigno.simbolo} ›
          </button>
        </footer>
      </div>
    </div>
  );
}
