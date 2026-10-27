"use client";

import { useEffect, useState } from "react";
import { getHoroscopoDoDia, type SignoPrevisao } from "../../lib/horoscope";
import HoroscopeModal from "../../components/HoroscopeModal";
import { getSupabase } from "../../lib/supabase";

export default function HoroscopoPage() {
  const [signos, setSignos] = useState<SignoPrevisao[]>(() => getHoroscopoDoDia());
  const [signoSelecionado, setSignoSelecionado] = useState<SignoPrevisao | null>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;
        const { data } = await supabase.from("site_settings").select("value").eq("key", "horoscopo_diario").maybeSingle();
        if (data?.value) {
          const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          setSignos(getHoroscopoDoDia(parsed));
        }
      } catch (err) {
        // Fallback já carregado
      }
    };
    void carregar();
  }, []);

  const hoje = new Date();
  const dataHoje = hoje.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="utility-page horoscope-page">
      <div className="container">
        <a className="eyebrow" href="/" style={{ textDecoration: "none" }}>← Voltar para a Rede Apucarana</a>
        <div style={{ marginTop: "12px", marginBottom: "24px" }}>
          <span className="eyebrow horoscope-kicker">PREVISÃO DO DIA · REDE APUCARANA</span>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", margin: "8px 0 6px", fontWeight: 900 }}>Horóscopo do Dia</h1>
          <p className="horoscope-intro" style={{ color: "var(--muted)", fontSize: "15px", maxWidth: "680px", margin: 0 }}>
            Confira as previsões atualizadas para <strong>{dataHoje}</strong>. Clique no seu signo correspondente para abrir a caixa com a previsão completa, conselho do dia, amor, trabalho e números da sorte.
          </p>
        </div>

        <div className="horoscope-page-grid">
          {signos.map((s) => (
            <article
              className="horoscope-page-card"
              key={s.slug}
              onClick={() => setSignoSelecionado(s)}
              style={{ cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="horoscope-glyph" style={{ fontSize: "32px", lineHeight: 1 }}>{s.simbolo}</span>
                <span className={`horoscope-element-pill element-${s.elemento.toLowerCase()}`}>
                  {s.elemento}
                </span>
              </div>
              <h2 style={{ margin: "4px 0", fontSize: "20px", fontWeight: 900 }}>{s.nome}</h2>
              <small style={{ color: "var(--muted)", display: "block", marginBottom: "10px" }}>{s.periodo}</small>
              <p style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: "13px", color: "#444" }}>
                {s.geral}
              </p>
              <button
                type="button"
                style={{
                  marginTop: "12px",
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  color: "var(--red)",
                  fontWeight: 800,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Abrir previsão completa →
              </button>
            </article>
          ))}
        </div>
      </div>

      <HoroscopeModal
        signo={signoSelecionado}
        signos={signos}
        onClose={() => setSignoSelecionado(null)}
        onSelectSigno={(s) => setSignoSelecionado(s)}
      />
    </main>
  );
}
