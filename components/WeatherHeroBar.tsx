"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

function weatherLabel(code: number) {
  if (code === 0) return ["☀️", "Céu limpo e ensolarado"];
  if (code <= 3) return ["⛅", "Parcialmente nublado"];
  if (code <= 48) return ["🌫️", "Névoa / Neblina"];
  if (code <= 67) return ["🌦️", "Chuva leve"];
  if (code <= 77) return ["❄️", "Frio intenso"];
  if (code <= 82) return ["🌧️", "Pancadas de chuva"];
  return ["⛈️", "Trovoada / Instabilidade"];
}

interface WeatherItem {
  cidade: string;
  temperatura: number;
  code: number;
  condicao?: string;
}

export default function WeatherHeroBar({ currentCity }: { currentCity?: string }) {
  const [weather, setWeather] = useState<WeatherItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const supabase = getSupabase();
        if (supabase) {
          const { data } = await supabase
            .from("weather_current")
            .select("cidade_nome,temperatura,codigo_tempo,condicao")
            .order("cidade_nome")
            .limit(30);

          if (data && data.length > 0) {
            const list = data.map((item: any) => ({
              cidade: item.cidade_nome,
              temperatura: Math.round(Number(item.temperatura)),
              code: Number(item.codigo_tempo || 0),
              condicao: item.condicao || undefined,
            }));
            setWeather(list);

            if (currentCity && currentCity !== "Geral") {
              const idx = list.findIndex(
                (w) => w.cidade.toLowerCase() === currentCity.toLowerCase()
              );
              if (idx !== -1) setActiveIdx(idx);
            }
          }
        }
      } catch (err) {
        console.warn("Erro ao carregar clima:", err);
      }
    };

    void carregar();
    const interval = setInterval(() => void carregar(), 15 * 60_000);
    return () => clearInterval(interval);
  }, [currentCity]);

  // Rotação suave entre cidades do Vale do Ivaí
  useEffect(() => {
    if (!weather.length || paused) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % weather.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [weather.length, paused]);

  if (!weather.length) return null;

  const atual = weather[activeIdx] || weather[0];
  const [icon, defaultDesc] = weatherLabel(atual.code);
  const desc = atual.condicao || defaultDesc;

  return (
    <section className="container weather-hero-wrap" aria-label="Tempo do Vale do Ivaí">
      <div
        className="weather-hero-card"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Lado Esquerdo: Identificação & Radar */}
        <div className="weather-hero-left">
          <div className="weather-hero-badges">
            <span className="weather-live-pill">
              <span className="weather-live-dot" /> AO VIVO
            </span>
            <span className="weather-title-tag">
              TEMPO NO VALE DO IVAÍ
            </span>
            <span className="weather-update-chip">
              ⚡ Atualização a cada 15 min
            </span>
          </div>

          <div className="weather-hero-main">
            <div className="weather-hero-icon-orb">{icon}</div>
            <div className="weather-hero-city-info">
              <div className="weather-hero-city-row">
                <strong className="weather-hero-city-name">{atual.cidade}</strong>
                <span className="weather-hero-city-count">
                  {activeIdx + 1}/{weather.length} cidades
                </span>
              </div>
              <span className="weather-hero-cond">{desc}</span>
            </div>
          </div>
        </div>

        {/* Centro / Destaque de Temperatura */}
        <div className="weather-hero-center">
          <div className="weather-temp-display">
            <span className="weather-temp-value">{atual.temperatura}°</span>
            <span className="weather-temp-unit">C</span>
          </div>
        </div>

        {/* Lado Direito: Chips Rápidos do Vale do Ivaí */}
        <div className="weather-hero-right">
          <span className="weather-strip-label">Cidades do Vale do Ivaí:</span>
          <div className="weather-chips-scroll">
            {weather.map((item, index) => {
              const isSelected = index === activeIdx;
              const [cIcon] = weatherLabel(item.code);
              return (
                <button
                  key={item.cidade}
                  type="button"
                  className={`weather-mini-chip ${isSelected ? "active" : ""}`}
                  onClick={() => setActiveIdx(index)}
                  title={`Ver previsão de ${item.cidade}`}
                >
                  <span className="chip-icon">{cIcon}</span>
                  <span className="chip-city">{item.cidade}</span>
                  <strong className="chip-temp">{item.temperatura}°C</strong>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
