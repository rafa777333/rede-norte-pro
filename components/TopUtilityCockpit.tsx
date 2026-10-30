"use client";

import React, { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

interface TopUtilityCockpitProps {
  radioTocando?: boolean;
  onToggleRadio?: () => void;
  whatsappUrl?: string;
}

export default function TopUtilityCockpit({
  radioTocando = false,
  onToggleRadio,
  whatsappUrl = "https://chat.whatsapp.com/Irl8tuJypYR1kNqTZklqwz",
}: TopUtilityCockpitProps) {
  const [agora, setAgora] = useState(new Date());
  const [weatherInfo, setWeatherInfo] = useState<{
    cidade: string;
    temp: number | null;
    condicao: string;
    icone: string;
  }>({
    cidade: "Apucarana",
    temp: 24,
    condicao: "Parcialmente nublado",
    icone: "⛅",
  });

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        const supabase = getSupabase();
        if (supabase) {
          const { data } = await supabase
            .from("weather_current")
            .select("cidade_nome,temperatura,condicao")
            .eq("cidade_slug", "apucarana")
            .maybeSingle();

          if (data && typeof data.temperatura === "number") {
            setWeatherInfo({
              cidade: "Apucarana",
              temp: Math.round(data.temperatura),
              condicao: data.condicao || "Estável",
              icone: "⛅",
            });
            return;
          }
        }

        // Fallback open-meteo
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-23.55&longitude=-51.46&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo"
        );
        if (res.ok) {
          const json = await res.json();
          const temp = Math.round(json?.current?.temperature_2m ?? 24);
          setWeatherInfo({
            cidade: "Apucarana",
            temp,
            condicao: "Vale do Ivaí",
            icone: "⛅",
          });
        }
      } catch {
        // Keep default
      }
    };

    void loadWeather();
  }, []);

  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(agora);

  const dataCap = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
  const horaFormatada = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(agora);

  return (
    <div className="h-10 bg-slate-900 text-slate-200 text-xs border-b border-slate-800">
      <div className="container mx-auto h-full px-4 flex items-center justify-between gap-4">
        {/* Esquerda: Plantão ao Vivo + Data + Tempo */}
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Indicador duplo pulsante */}
          <div className="inline-flex items-center gap-1.5 bg-red-950/80 text-red-300 border border-red-800/80 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wider shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="tabular-nums">AO VIVO</span>
          </div>

          <span className="hidden sm:inline-block text-slate-400 font-medium whitespace-nowrap">
            {dataCap} · <span className="tabular-nums text-slate-300 font-semibold">{horaFormatada}</span>
          </span>

          <span className="hidden md:inline-block text-slate-700">|</span>

          {/* Clima de Apucarana */}
          <div className="inline-flex items-center gap-1.5 text-slate-300 whitespace-nowrap font-medium">
            <span className="text-sm">{weatherInfo.icone}</span>
            <span>{weatherInfo.cidade}:</span>
            <strong className="text-white tabular-nums font-bold">
              {weatherInfo.temp !== null ? `${weatherInfo.temp}°C` : "--"}
            </strong>
          </div>
        </div>

        {/* Direita: Atalhos Rápidos */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onToggleRadio && (
            <button
              type="button"
              onClick={onToggleRadio}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                radioTocando
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/20"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${radioTocando ? "bg-white animate-pulse" : "bg-red-500"}`} />
              <span className="hidden sm:inline">{radioTocando ? "Rádio Tocando" : "Ouvir Rádio"}</span>
              <span className="sm:hidden">Rádio</span>
            </button>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            title="Enviar sugestão de matéria ou vídeo pelo WhatsApp"
          >
            <span>📱</span>
            <span className="hidden lg:inline">Enviar Sugestão / WhatsApp</span>
            <span className="lg:hidden hidden sm:inline">WhatsApp</span>
          </a>

          <span className="text-slate-700 hidden sm:inline-block">|</span>

          <a
            href="/admin"
            className="text-slate-300 hover:text-white font-medium transition-colors"
          >
            Anuncie
          </a>

          <a
            href="/admin"
            className="text-slate-400 hover:text-slate-200 font-medium transition-colors hidden sm:inline"
          >
            Redação
          </a>
        </div>
      </div>
    </div>
  );
}
