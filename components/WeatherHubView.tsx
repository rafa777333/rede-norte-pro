"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

// Mapeamento de coordenadas das 27 cidades do Vale do Ivaí
export const CIDADES_VALE_DO_IVAI: Record<string, { nome: string; lat: number; lon: number }> = {
  Apucarana: { nome: "Apucarana", lat: -23.5514, lon: -51.4611 },
  Arapongas: { nome: "Arapongas", lat: -23.4147, lon: -51.4258 },
  Arapuã: { nome: "Arapuã", lat: -24.3486, lon: -51.7947 },
  "Ariranha do Ivaí": { nome: "Ariranha do Ivaí", lat: -24.3853, lon: -51.5833 },
  "Bom Sucesso": { nome: "Bom Sucesso", lat: -23.7097, lon: -51.7644 },
  Borrazópolis: { nome: "Borrazópolis", lat: -23.9356, lon: -51.5878 },
  Califórnia: { nome: "Califórnia", lat: -23.6597, lon: -51.3556 },
  Cambira: { nome: "Cambira", lat: -23.5856, lon: -51.5794 },
  Cruzmaltina: { nome: "Cruzmaltina", lat: -24.0044, lon: -51.4789 },
  Faxinal: { nome: "Faxinal", lat: -24.0028, lon: -51.3197 },
  "Godoy Moreira": { nome: "Godoy Moreira", lat: -24.4219, lon: -51.9214 },
  "Grandes Rios": { nome: "Grandes Rios", lat: -24.1461, lon: -51.5056 },
  Ivaiporã: { nome: "Ivaiporã", lat: -24.2486, lon: -51.6833 },
  "Jandaia do Sul": { nome: "Jandaia do Sul", lat: -23.6025, lon: -51.6444 },
  "Jardim Alegre": { nome: "Jardim Alegre", lat: -24.1794, lon: -51.6933 },
  Kaloré: { nome: "Kaloré", lat: -23.8183, lon: -51.8153 },
  Lidianópolis: { nome: "Lidianópolis", lat: -24.1089, lon: -51.6528 },
  Lunardelli: { nome: "Lunardelli", lat: -24.0833, lon: -51.7417 },
  "Marilândia do Sul": { nome: "Marilândia do Sul", lat: -23.7456, lon: -51.3175 },
  Marumbi: { nome: "Marumbi", lat: -23.7067, lon: -51.6378 },
  "Mauá da Serra": { nome: "Mauá da Serra", lat: -23.9011, lon: -51.2297 },
  "Novo Itacolomi": { nome: "Novo Itacolomi", lat: -23.7631, lon: -51.5056 },
  "Rio Bom": { nome: "Rio Bom", lat: -23.7594, lon: -51.4117 },
  "Rio Branco do Ivaí": { nome: "Rio Branco do Ivaí", lat: -24.3214, lon: -51.3142 },
  "Rosário do Ivaí": { nome: "Rosário do Ivaí", lat: -24.2753, lon: -51.2725 },
  "São João do Ivaí": { nome: "São João do Ivaí", lat: -23.9819, lon: -51.8211 },
  "São Pedro do Ivaí": { nome: "São Pedro do Ivaí", lat: -23.8647, lon: -51.8581 },
};

function weatherInfoByCode(code: number): { icone: string; descricao: string; bgClass: string } {
  if (code === 0) return { icone: "☀️", descricao: "Céu Limpo e Ensolarado", bgClass: "from-amber-500/20 via-sky-600/20 to-slate-900" };
  if (code <= 3) return { icone: "⛅", descricao: "Parcialmente Nublado", bgClass: "from-blue-600/20 via-slate-800/20 to-slate-900" };
  if (code <= 48) return { icone: "🌫️", descricao: "Nevoeiro / Neblina", bgClass: "from-slate-600/20 via-slate-800/20 to-slate-900" };
  if (code <= 67) return { icone: "🌦️", descricao: "Chuva Leve a Moderada", bgClass: "from-cyan-700/25 via-blue-900/30 to-slate-900" };
  if (code <= 77) return { icone: "❄️", descricao: "Frio Intenso / Geada", bgClass: "from-sky-300/20 via-blue-900/20 to-slate-900" };
  if (code <= 82) return { icone: "🌧️", descricao: "Pancadas de Chuva", bgClass: "from-blue-800/30 via-slate-900 to-slate-950" };
  return { icone: "⛈️", descricao: "Tempestade / Instabilidade", bgClass: "from-purple-900/30 via-slate-900 to-slate-950" };
}

interface PrevisaoHora {
  hora: string;
  temp: number;
  probChuva: number;
  code: number;
}

interface PrevisaoDia {
  data: string;
  diaNome: string;
  min: number;
  max: number;
  probChuva: number;
  code: number;
  uv: number;
}

interface WeatherHubViewProps {
  currentCity?: string;
  onSelectCity?: (cidade: string) => void;
}

export default function WeatherHubView({
  currentCity = "Apucarana",
  onSelectCity,
}: WeatherHubViewProps) {
  const [cidadeAtiva, setCidadeAtiva] = useState(
    currentCity && currentCity !== "Geral" && CIDADES_VALE_DO_IVAI[currentCity]
      ? currentCity
      : "Apucarana"
  );
  const [busca, setBusca] = useState("");
  const [sugestoesBusca, setSugestoesBusca] = useState<Array<{ name: string; admin1?: string; latitude: number; longitude: number }>>([]);
  const [buscando, setBuscando] = useState(false);
  const [coordenadasAtuais, setCoordenadasAtuais] = useState<{ lat: number; lon: number }>({
    lat: CIDADES_VALE_DO_IVAI[cidadeAtiva]?.lat || -23.5514,
    lon: CIDADES_VALE_DO_IVAI[cidadeAtiva]?.lon || -51.4611,
  });

  const [carregando, setCarregando] = useState(true);
  const [dadosTempo, setDadosTempo] = useState<any>(null);

  // Troca de cidade ao mudar a prop externa
  useEffect(() => {
    if (currentCity && currentCity !== "Geral" && CIDADES_VALE_DO_IVAI[currentCity]) {
      setCidadeAtiva(currentCity);
      setCoordenadasAtuais({
        lat: CIDADES_VALE_DO_IVAI[currentCity].lat,
        lon: CIDADES_VALE_DO_IVAI[currentCity].lon,
      });
    }
  }, [currentCity]);

  // Carrega previsão da API meteorológica
  useEffect(() => {
    let cancelado = false;
    const fetchWeather = async () => {
      setCarregando(true);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coordenadasAtuais.lat}&longitude=${coordenadasAtuais.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=America%2FSao_Paulo&forecast_days=7`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Falha na requisição");
        const json = await res.json();
        if (!cancelado) {
          setDadosTempo(json);
          setCarregando(false);
        }
      } catch (err) {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    };

    void fetchWeather();
    return () => {
      cancelado = true;
    };
  }, [coordenadasAtuais]);

  // Busca de cidades fora do Vale do Ivaí (Open-Meteo Geocoding)
  const executarBusca = async (texto: string) => {
    setBusca(texto);
    if (texto.trim().length < 3) {
      setSugestoesBusca([]);
      return;
    }
    setBuscando(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(texto)}&count=5&language=pt&country_code=BR`
      );
      const data = await res.json();
      setSugestoesBusca(data.results || []);
    } catch {
      setSugestoesBusca([]);
    } finally {
      setBuscando(false);
    }
  };

  const selecionarCidadeVale = (nome: string) => {
    const coords = CIDADES_VALE_DO_IVAI[nome];
    if (coords) {
      setCidadeAtiva(nome);
      setCoordenadasAtuais({ lat: coords.lat, lon: coords.lon });
      setBusca("");
      setSugestoesBusca([]);
      if (onSelectCity) onSelectCity(nome);
    }
  };

  const selecionarLocalidadeExterna = (item: { name: string; admin1?: string; latitude: number; longitude: number }) => {
    const rotulo = item.admin1 ? `${item.name} (${item.admin1})` : item.name;
    setCidadeAtiva(rotulo);
    setCoordenadasAtuais({ lat: item.latitude, lon: item.longitude });
    setBusca("");
    setSugestoesBusca([]);
  };

  // Informações processadas
  const atual = dadosTempo?.current;
  const diario = dadosTempo?.daily;
  const horario = dadosTempo?.hourly;
  const infoTempo = weatherInfoByCode(atual?.weather_code ?? 0);

  // Próximas 12 horas
  const proximasHoras = useMemo<PrevisaoHora[]>(() => {
    if (!horario?.time) return [];
    const agoraIdx = new Date().getHours();
    return horario.time.slice(agoraIdx, agoraIdx + 12).map((t: string, i: number) => {
      const idxReal = agoraIdx + i;
      const horaStr = t.split("T")[1]?.slice(0, 5) || t;
      return {
        hora: horaStr,
        temp: Math.round(horario.temperature_2m[idxReal] ?? 0),
        probChuva: horario.precipitation_probability[idxReal] ?? 0,
        code: horario.weather_code[idxReal] ?? 0,
      };
    });
  }, [horario]);

  // Próximos 7 dias
  const proximosDias = useMemo<PrevisaoDia[]>(() => {
    if (!diario?.time) return [];
    const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return diario.time.map((d: string, i: number) => {
      const date = new Date(d + "T12:00:00");
      const diaNome = i === 0 ? "Hoje" : i === 1 ? "Amanhã" : diasSemana[date.getDay()];
      return {
        data: d,
        diaNome,
        min: Math.round(diario.temperature_2m_min[i] ?? 0),
        max: Math.round(diario.temperature_2m_max[i] ?? 0),
        probChuva: diario.precipitation_probability_max[i] ?? 0,
        code: diario.weather_code[i] ?? 0,
        uv: diario.uv_index_max?.[i] ?? 0,
      };
    });
  }, [diario]);

  // URL segura para integração direta com Google Clima
  const googleWeatherUrl = `https://www.google.com/search?q=clima+tempo+${encodeURIComponent(cidadeAtiva + " Paraná")}`;

  return (
    <section className="container mx-auto py-6 px-3 sm:px-4 max-w-6xl" aria-label="Central de Clima e Meteorologia">
      {/* CABEÇALHO EDITORIAL DO CLIMA */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-sky-800/40 shadow-xl mb-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-sky-300">
                Hub Meteorológico · Vale do Ivaí & Região
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-sans tracking-tight">
              Previsão do Tempo e Clima em Tempo Real
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Acompanhe a temperatura, sensação térmica, radar de chuva e previsão estendida de 7 dias para todos os municípios.
            </p>
          </div>

          {/* BOTÃO OFICIAL DO GOOGLE CLIMA (INTEGRAÇÃO SEGURA) */}
          <div className="shrink-0 flex flex-col sm:flex-row gap-2">
            <a
              href={googleWeatherUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
              title={`Ver a previsão completa de ${cidadeAtiva} no Google Clima Oficial`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Ver no Google Clima Oficial ↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS & BUSCA POR LOCALIDADE */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Seletor Rápido das Cidades do Vale do Ivaí */}
          <div className="flex-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Selecione sua Cidade no Vale do Ivaí:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(CIDADES_VALE_DO_IVAI).slice(0, 10).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => selecionarCidadeVale(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    cidadeAtiva === c
                      ? "bg-sky-600 text-white shadow-sm font-bold scale-[1.02]"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {c}
                </button>
              ))}

              {/* Dropdown com as 27 cidades */}
              <select
                value={CIDADES_VALE_DO_IVAI[cidadeAtiva] ? cidadeAtiva : ""}
                onChange={(e) => {
                  if (e.target.value) selecionarCidadeVale(e.target.value);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 border border-slate-300 text-slate-800 outline-none cursor-pointer"
              >
                <option value="">Todas as 27 Cidades ▾</option>
                {Object.keys(CIDADES_VALE_DO_IVAI).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campo de Busca Livre por Qualquer Cidade do Brasil */}
          <div className="w-full md:w-80 relative">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Buscar Qualquer Outra Cidade:
            </span>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Londrina, Maringá, Curitiba..."
                value={busca}
                onChange={(e) => void executarBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                🔍
              </span>
              {buscando && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-sky-600 font-bold animate-pulse">
                  Buscando...
                </span>
              )}
            </div>

            {/* Menu de Sugestões da Busca */}
            {sugestoesBusca.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-30">
                {sugestoesBusca.map((item, idx) => (
                  <button
                    key={`${item.name}-${idx}`}
                    type="button"
                    onClick={() => selecionarLocalidadeExterna(item)}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-sky-50 flex items-center justify-between border-b last:border-b-0 border-slate-100 transition-colors"
                  >
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="text-[11px] text-slate-500">{item.admin1 || "Brasil"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {carregando && !dadosTempo ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 text-sm font-medium">Carregando dados meteorológicos de {cidadeAtiva}...</p>
        </div>
      ) : (
        <>
          {/* GRID PRINCIPAL: DESTAQUE ATUAL + MÉTRICAS CHAVE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
            {/* CARD GIGANTE DO CLIMA ATUAL */}
            <div className={`lg:col-span-7 rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${infoTempo.bgClass} text-white border border-slate-700/60 shadow-xl flex flex-col justify-between relative overflow-hidden`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                    Condição Atual
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                    {cidadeAtiva}
                  </h2>
                </div>
                <div className="text-5xl sm:text-6xl drop-shadow-md">
                  {infoTempo.icone}
                </div>
              </div>

              <div className="my-6 flex items-baseline gap-3">
                <span className="text-6xl sm:text-7xl font-black tracking-tight tabular-nums">
                  {atual ? Math.round(atual.temperature_2m) : "--"}°
                </span>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold text-slate-100">
                    {infoTempo.descricao}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-300 font-medium">
                    Sensação térmica de {atual ? Math.round(atual.apparent_temperature) : "--"}°C
                  </span>
                </div>
              </div>

              {/* Resumo de Máxima e Mínima */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-rose-400 font-bold">
                    ▲ Máx: {diario?.temperature_2m_max?.[0] ? Math.round(diario.temperature_2m_max[0]) : "--"}°C
                  </span>
                  <span className="text-sky-300 font-bold">
                    ▼ Mín: {diario?.temperature_2m_min?.[0] ? Math.round(diario.temperature_2m_min[0]) : "--"}°C
                  </span>
                </div>
                <span className="text-slate-300 text-[11px]">
                  Atualizado em tempo real
                </span>
              </div>
            </div>

            {/* PAINEL DE 6 MÉTRICAS TÉCNICAS */}
            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Umidade */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">💧 Umidade</span>
                <span className="text-2xl font-black text-slate-900 mt-2">
                  {atual?.relative_humidity_2m ?? "--"}%
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {(atual?.relative_humidity_2m ?? 0) > 70 ? "Alta umidade" : "Normal"}
                </span>
              </div>

              {/* Vento */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">💨 Vento</span>
                <span className="text-2xl font-black text-slate-900 mt-2">
                  {atual?.wind_speed_10m ? Math.round(atual.wind_speed_10m) : "--"} <span className="text-xs font-normal">km/h</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1">Brisa local</span>
              </div>

              {/* Probabilidade de Chuva */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">🌧️ Chuva</span>
                <span className="text-2xl font-black text-slate-900 mt-2">
                  {diario?.precipitation_probability_max?.[0] ?? 0}%
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {atual?.precipitation ? `${atual.precipitation} mm` : "Sem chuva agora"}
                </span>
              </div>

              {/* Índice UV */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">☀️ Índice UV</span>
                <span className="text-2xl font-black text-amber-600 mt-2">
                  {diario?.uv_index_max?.[0] ? Math.round(diario.uv_index_max[0]) : "--"}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {(diario?.uv_index_max?.[0] ?? 0) >= 6 ? "Requer protetor" : "Moderado"}
                </span>
              </div>

              {/* Nascer do Sol */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">🌅 Alvorada</span>
                <span className="text-xl font-bold text-slate-900 mt-2">
                  {diario?.sunrise?.[0] ? diario.sunrise[0].split("T")[1]?.slice(0, 5) : "--:--"}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">Nascer do Sol</span>
              </div>

              {/* Pôr do Sol */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">🌇 Ocaso</span>
                <span className="text-xl font-bold text-slate-900 mt-2">
                  {diario?.sunset?.[0] ? diario.sunset[0].split("T")[1]?.slice(0, 5) : "--:--"}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">Pôr do Sol</span>
              </div>
            </div>
          </div>

          {/* PREVISÃO HORA A HORA (PRÓXIMAS 12 HORAS) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Previsão Hora a Hora
              </span>
              <span className="text-xs text-slate-400">Próximas 12 horas</span>
            </div>

            <div className="overflow-x-auto no-scrollbar flex items-center gap-3 pb-2">
              {proximasHoras.map((h, i) => {
                const infoH = weatherInfoByCode(h.code);
                return (
                  <div
                    key={i}
                    className="shrink-0 w-20 p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-between text-center"
                  >
                    <span className="text-xs font-bold text-slate-600">{h.hora}</span>
                    <span className="text-2xl my-2">{infoH.icone}</span>
                    <span className="text-sm font-black text-slate-900">{h.temp}°</span>
                    <span className="text-[10px] font-semibold text-sky-600 mt-1">
                      {h.probChuva > 0 ? `${h.probChuva}%` : "0%"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PREVISÃO ESTENDIDA DE 7 DIAS */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Previsão para os Próximos 7 Dias
              </span>
              <span className="text-xs text-slate-400">{cidadeAtiva}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {proximosDias.map((d, i) => {
                const infoD = weatherInfoByCode(d.code);
                return (
                  <div
                    key={d.data}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                      i === 0
                        ? "bg-sky-50/80 border-sky-200 ring-2 ring-sky-300/40"
                        : "bg-slate-50/80 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800">{d.diaNome}</span>
                    <span className="text-3xl my-2.5">{infoD.icone}</span>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="text-rose-600">{d.max}°</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-sky-600">{d.min}°</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 font-medium">
                      💧 {d.probChuva}% chuva
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RADAR METEOROLÓGICO & ALERTAS AO VIVO */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-8">
            <div className="md:col-span-8 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Radar de Chuva e Nuvens ao Vivo (Paraná & Vale do Ivaí)
                </span>
                <span className="text-[11px] text-slate-400">Satélite em Tempo Real</span>
              </div>
              <div className="relative aspect-[16/9] w-full bg-slate-950 flex items-center justify-center">
                <iframe
                  title="Radar de Precipitação do Paraná"
                  width="100%"
                  height="100%"
                  src={`https://embed.windy.com/embed2.html?lat=${coordenadasAtuais.lat}&lon=${coordenadasAtuais.lon}&detailLat=${coordenadasAtuais.lat}&detailLon=${coordenadasAtuais.lon}&width=650&height=450&zoom=8&level=surface&overlay=radar&product=radar&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
                  frameBorder="0"
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Box de Alertas e Dicas Regionais */}
            <div className="md:col-span-4 flex flex-col gap-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
                <span className="text-xs font-bold uppercase text-amber-600 tracking-wider block mb-1">
                  ⚠️ Cuidados & Saúde no Vale do Ivaí
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  Condições Meteorológicas Locais
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Para motoristas que trafegam na BR-376 entre Apucarana, Marilândia do Sul e Mauá da Serra, fique atento a neblinas repentinas e pistas escorregadias durante pancadas de chuva.
                </p>
              </div>

              <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-5">
                <span className="text-xs font-bold uppercase text-sky-600 tracking-wider block mb-1">
                  🌾 Agricultura & Campo
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  Umidade e Temperatura do Solo
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Monitore as janelas de pulverização e colheita nas culturas de soja, milho e café no Vale do Ivaí com base nos índices de vento e umidade apresentados acima.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
