/**
 * Sistema da TV Rede Apucarana 24h (FAST Channel Híbrido)
 * Unificação da Grade Programada do YouTube (AutoVJ 24h) com Entrada Ao Vivo do OBS via SamCast M3U8.
 */

import { extractYouTubeId } from "./tv-videos-data";

export type TvChannelMode = "auto" | "force_live_m3u8" | "force_youtube_grid";

export interface TvSettings {
  mode: TvChannelMode;
  live_m3u8_url: string;
  live_program_title: string;
  updated_at?: string;
}

export type TvPlaylistItemType = "podcast" | "reportagem" | "comercial" | "musical";

export interface TvPlaylistItem {
  id: string;
  title: string;
  video_url?: string;
  youtube_url: string;
  youtube_id: string;
  type: TvPlaylistItemType;
  duration_seconds: number;
  sort_order: number;
  active: boolean;
  day_of_week: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  start_time?: string | null; // ex: "12:00" (Horário de Brasília) ou null/vazio para Sequência contínua
  created_at?: string;
}

export interface DayOfWeekOption {
  day: number;
  label: string;
  shortLabel: string;
}

export const DAYS_OF_WEEK: DayOfWeekOption[] = [
  { day: 1, label: "Segunda-feira", shortLabel: "Segunda" },
  { day: 2, label: "Terça-feira", shortLabel: "Terça" },
  { day: 3, label: "Quarta-feira", shortLabel: "Quarta" },
  { day: 4, label: "Quinta-feira", shortLabel: "Quinta" },
  { day: 5, label: "Sexta-feira", shortLabel: "Sexta" },
  { day: 6, label: "Sábado", shortLabel: "Sábado" },
  { day: 0, label: "Domingo", shortLabel: "Domingo" },
];

export function getTodayDayOfWeek(): number {
  return new Date().getDay();
}

export function getDayLabel(day: number): string {
  const found = DAYS_OF_WEEK.find((d) => d.day === day);
  return found ? found.label : "Segunda-feira";
}

export function getDayShortLabel(day: number): string {
  const found = DAYS_OF_WEEK.find((d) => d.day === day);
  return found ? found.shortLabel : "Segunda";
}

export const DEFAULT_TV_SETTINGS: TvSettings = {
  mode: "auto",
  live_m3u8_url: "https://Stmv1.samcast.com.br/tvapucarana/tvapucarana/playlist.m3u8",
  live_program_title: "🔴 AO VIVO: Jornalismo & Giro Rede Apucarana",
};

/**
 * Grade Inicial Demonstrativa (Playlist 24h Intercalada: Podcasts, Comerciais, Reportagens e Música)
 * Utiliza IDs reais do YouTube para que a TV entre no ar instantaneamente.
 */
export const INITIAL_TV_PLAYLIST: TvPlaylistItem[] = [
  {
    id: "tv-item-1",
    title: "RedeCast • Terra de Cowboy & Entrevistas do Vale",
    video_url: "https://www.youtube.com/watch?v=siHRXs-J-R8",
    youtube_url: "https://www.youtube.com/watch?v=siHRXs-J-R8",
    youtube_id: "siHRXs-J-R8",
    type: "podcast",
    duration_seconds: 4200, // 1h 10m
    sort_order: 1,
    active: true,
    day_of_week: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "tv-item-2",
    title: "Conexão Sertaneja • Show e Bate-papo com Josy Rosseto",
    video_url: "https://www.youtube.com/watch?v=s_EhTC5GMjQ",
    youtube_url: "https://www.youtube.com/watch?v=s_EhTC5GMjQ",
    youtube_id: "s_EhTC5GMjQ",
    type: "musical",
    duration_seconds: 3600, // 1h 00m
    sort_order: 2,
    active: true,
    day_of_week: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "tv-item-3",
    title: "RedeCast • Bate-papo com Nenê de Paula (Músico & Produtor Cultural)",
    video_url: "https://www.youtube.com/watch?v=lBJIN6tE0zw",
    youtube_url: "https://www.youtube.com/watch?v=lBJIN6tE0zw",
    youtube_id: "lBJIN6tE0zw",
    type: "podcast",
    duration_seconds: 4500, // 1h 15m
    sort_order: 3,
    active: true,
    day_of_week: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "tv-item-4",
    title: "RedeCast Entrevista • Eliane Tapira & Histórias Regionais",
    video_url: "https://www.youtube.com/watch?v=y2zdEohCZDs",
    youtube_url: "https://www.youtube.com/watch?v=y2zdEohCZDs",
    youtube_id: "y2zdEohCZDs",
    type: "podcast",
    duration_seconds: 3600, // 1h 00m
    sort_order: 4,
    active: true,
    day_of_week: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "tv-item-5",
    title: "RedeCast Política & Sociedade • Deputada Carol Dartora no Estúdio",
    video_url: "https://www.youtube.com/watch?v=5TXJP8-U94k",
    youtube_url: "https://www.youtube.com/watch?v=5TXJP8-U94k",
    youtube_id: "5TXJP8-U94k",
    type: "podcast",
    duration_seconds: 3900, // 1h 05m
    sort_order: 5,
    active: true,
    day_of_week: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "tv-item-6",
    title: "O Pior Programa do Mundo #6 • Entrevista com Rafa Carraro",
    video_url: "https://www.youtube.com/watch?v=R6-QAtKZM3Q",
    youtube_url: "https://www.youtube.com/watch?v=R6-QAtKZM3Q",
    youtube_id: "R6-QAtKZM3Q",
    type: "podcast",
    duration_seconds: 3300, // 55m
    sort_order: 6,
    active: true,
    day_of_week: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "tv-item-7",
    title: "RedeCast Especial • Autismo em Pauta com Especialistas de Apucarana",
    video_url: "https://www.youtube.com/watch?v=DdvQWXAue0U",
    youtube_url: "https://www.youtube.com/watch?v=DdvQWXAue0U",
    youtube_id: "DdvQWXAue0U",
    type: "reportagem",
    duration_seconds: 3600, // 1h 00m
    sort_order: 7,
    active: true,
    day_of_week: 1,
    created_at: new Date().toISOString(),
  },
];

/**
 * Formata segundos no formato legível de tempo (ex: "03h 45m" ou "12m 30s")
 */
export function formatDurationSeconds(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 0) return "00m 00s";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

/**
 * Formata segundos no formato numérico relógio (ex: "01:15:30" ou "08:45")
 */
export function formatClockTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 0) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Retorna os metadados visuais de cada tipo de programação
 */
export function getPlaylistItemTypeMeta(type: TvPlaylistItemType) {
  switch (type) {
    case "podcast":
      return {
        label: "Podcast RedeCast",
        icon: "🎙️",
        badgeBg: "bg-purple-600/90 text-white border-purple-500/40",
        borderHighlight: "border-purple-600",
      };
    case "reportagem":
      return {
        label: "Reportagem / Jornalismo",
        icon: "🚨",
        badgeBg: "bg-red-600/90 text-white border-red-500/40",
        borderHighlight: "border-red-600",
      };
    case "comercial":
      return {
        label: "Comercial / Patrocínio",
        icon: "💰",
        badgeBg: "bg-amber-500/90 text-slate-950 font-black border-amber-400/40",
        borderHighlight: "border-amber-500",
      };
    case "musical":
      return {
        label: "Música / Clipe",
        icon: "🎸",
        badgeBg: "bg-emerald-600/90 text-white border-emerald-500/40",
        borderHighlight: "border-emerald-600",
      };
    default:
      return {
        label: "Vídeo",
        icon: "📺",
        badgeBg: "bg-slate-700 text-white border-slate-600",
        borderHighlight: "border-slate-700",
      };
  }
}

export interface CurrentTvSchedule {
  currentItem: TvPlaylistItem;
  currentIndex: number;
  nextItem: TvPlaylistItem;
  nextIndex: number;
  offsetInCurrentVideo: number;
  remainingInCurrent: number;
  totalDuration: number;
  activeList: TvPlaylistItem[];
}

/**
 * Calcula qual vídeo está passando no exato segundo atual, com base no relógio de Brasília.
 * Suporta programas de hora marcada (start_time) e fila contínua (Sequência).
 */
export function calculateTvProgramAtTime(
  playlist: TvPlaylistItem[],
  nowTimestampSeconds?: number,
  dayOfWeek?: number
): CurrentTvSchedule | null {
  const targetDay = dayOfWeek !== undefined ? dayOfWeek : new Date().getDay();
  let activeList = playlist
    .filter((item) => {
      const itemDay = typeof item.day_of_week === "number" ? item.day_of_week : 1;
      return item.active && itemDay === targetDay;
    })
    .sort((a, b) => a.sort_order - b.sort_order);

  // Se o dia específico não tiver itens cadastrados, busca quaisquer itens ativos como fallback
  if (activeList.length === 0) {
    activeList = playlist
      .filter((item) => item.active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  if (activeList.length === 0) {
    return null;
  }

  const sync = calculateBrasiliaScheduleSync(activeList);
  const currentItem = activeList[sync.currentVideoIndex] || activeList[0];
  const nextIndex = (sync.currentVideoIndex + 1) % activeList.length;
  const nextItem = activeList[nextIndex] || currentItem;
  const dur = currentItem.duration_seconds > 0 ? currentItem.duration_seconds : 1800;

  return {
    currentItem,
    currentIndex: sync.currentVideoIndex,
    nextItem,
    nextIndex,
    offsetInCurrentVideo: sync.startOffsetSeconds,
    remainingInCurrent: Math.max(0, dur - sync.startOffsetSeconds),
    totalDuration: activeList.reduce((acc, i) => acc + (i.duration_seconds || 1800), 0),
    activeList,
  };
}

/**
 * Retorna os segundos decorridos desde a meia-noite (00:00:00) no horário oficial de Brasília.
 * Utiliza o fuso America/Sao_Paulo com fallback para horário local.
 * Garante que todos os usuários ao redor do mundo estejam alinhados ao mesmo segundo de transmissão.
 */
export function getSecondsSinceMidnightBrasilia(now = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    let h = 0;
    let m = 0;
    let s = 0;
    for (const p of parts) {
      if (p.type === "hour") h = parseInt(p.value, 10);
      if (p.type === "minute") m = parseInt(p.value, 10);
      if (p.type === "second") s = parseInt(p.value, 10);
    }
    if (h === 24) h = 0;
    return h * 3600 + m * 60 + s + now.getMilliseconds() / 1000;
  } catch {
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
  }
}

/**
 * Retorna o dia da semana atual (0 = Domingo, 1 = Segunda, etc.) no horário de Brasília.
 */
export function getDayOfWeekBrasilia(now = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      weekday: "short",
    });
    const dayStr = formatter.format(now);
    const map: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return map[dayStr] ?? now.getDay();
  } catch {
    return now.getDay();
  }
}

/**
 * Sincronização Global Linear (Simulcast / Pseudo-Live)
 * Calcula exatamente qual vídeo da grade do dia está no ar e em qual segundo
 * com base no relógio global desde a meia-noite.
 */
export interface GlobalSyncResult {
  currentVideoIndex: number;
  startOffsetSeconds: number;
  totalPlaylistDuration: number;
  currentCycleTime: number;
  secondsSinceMidnight: number;
}

export function calculateGlobalLinearSync(
  playlist: TvPlaylistItem[],
  now = new Date()
): GlobalSyncResult {
  if (!playlist || playlist.length === 0) {
    return {
      currentVideoIndex: 0,
      startOffsetSeconds: 0,
      totalPlaylistDuration: 0,
      currentCycleTime: 0,
      secondsSinceMidnight: 0,
    };
  }

  // 1. Horário atual exato em segundos decorridos desde a meia-noite de hoje (00:00:00 no fuso de Brasília)
  const secondsSinceMidnight = getSecondsSinceMidnightBrasilia(now);

  // 2. Soma da duração de todos os vídeos da playlist do dia (fallback seguro de 1800s se não houver duração)
  const totalPlaylistDuration = playlist.reduce((acc, item) => {
    const dur =
      typeof item.duration_seconds === "number" && item.duration_seconds > 10
        ? item.duration_seconds
        : 1800;
    return acc + dur;
  }, 0);

  if (totalPlaylistDuration <= 0) {
    return {
      currentVideoIndex: 0,
      startOffsetSeconds: 0,
      totalPlaylistDuration: 0,
      currentCycleTime: 0,
      secondsSinceMidnight,
    };
  }

  // 3. Operador de módulo para descobrir o ponto exato no ciclo diário da TV
  const currentCycleTime = secondsSinceMidnight % totalPlaylistDuration;

  // 4. Percorre o array de vídeos somando as durações até encontrar o vídeo atual e o segundo exato
  let accumulated = 0;
  let currentVideoIndex = 0;
  let startOffsetSeconds = 0;

  for (let i = 0; i < playlist.length; i++) {
    const item = playlist[i];
    const dur =
      typeof item.duration_seconds === "number" && item.duration_seconds > 10
        ? item.duration_seconds
        : 1800;

    if (currentCycleTime < accumulated + dur) {
      currentVideoIndex = i;
      startOffsetSeconds = Math.max(0, Math.floor(currentCycleTime - accumulated));
      break;
    }
    accumulated += dur;
  }

  return {
    currentVideoIndex,
    startOffsetSeconds,
    totalPlaylistDuration,
    currentCycleTime,
    secondsSinceMidnight,
  };
}

/**
 * Converte string de horário "HH:MM" ou "HH:MM:SS" em segundos decorridos desde a meia-noite.
 * Retorna null se a string for vazia ou inválida.
 */
export function parseTimeToSeconds(timeStr?: string | null): number | null {
  if (!timeStr || typeof timeStr !== "string") return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return null;
  }
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Retorna o horário atual no fuso oficial de Brasília formatado como "HH:MM".
 */
export function getBrasiliaTimeHHMM(now = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    let h = "00";
    let m = "00";
    for (const p of parts) {
      if (p.type === "hour") h = p.value.padStart(2, "0");
      if (p.type === "minute") m = p.value.padStart(2, "0");
    }
    return `${h}:${m}`;
  } catch {
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }
}

/**
 * Resultado da Sincronização Híbrida:
 * Prioriza programas com horário fixo de início (start_time).
 * Quando nenhum programa fixo está no ar, roda a sequência contínua (linear).
 */
export interface ScheduleSyncResult {
  currentVideoIndex: number;
  startOffsetSeconds: number;
  isScheduledTime: boolean;
  activeProgram: TvPlaylistItem | null;
}

export function calculateBrasiliaScheduleSync(
  playlist: TvPlaylistItem[],
  now = new Date()
): ScheduleSyncResult {
  if (!playlist || playlist.length === 0) {
    return {
      currentVideoIndex: 0,
      startOffsetSeconds: 0,
      isScheduledTime: false,
      activeProgram: null,
    };
  }

  const nowSeconds = getSecondsSinceMidnightBrasilia(now);

  // 1. Procurar programas do dia que possuem horário fixo (start_time)
  const scheduledWithSec = playlist
    .map((item, index) => {
      const sec = parseTimeToSeconds(item.start_time);
      return { item, index, startSec: sec };
    })
    .filter(
      (entry): entry is { item: TvPlaylistItem; index: number; startSec: number } =>
        entry.startSec !== null && entry.startSec <= nowSeconds
    );

  // Ordena pelo horário de início mais recente primeiro
  scheduledWithSec.sort((a, b) => b.startSec - a.startSec);

  // Verifica se o programa de horário fixo mais recente ainda está no ar
  if (scheduledWithSec.length > 0) {
    const mostRecent = scheduledWithSec[0];
    const elapsed = nowSeconds - mostRecent.startSec;
    const dur =
      typeof mostRecent.item.duration_seconds === "number" && mostRecent.item.duration_seconds > 10
        ? mostRecent.item.duration_seconds
        : 1800; // Duração fallback segura

    if (elapsed < dur) {
      // O programa de hora marcada está NO AR agora!
      return {
        currentVideoIndex: mostRecent.index,
        startOffsetSeconds: Math.max(0, Math.floor(elapsed)),
        isScheduledTime: true,
        activeProgram: mostRecent.item,
      };
    }
  }

  // 2. Se nenhum programa agendado está no ar agora, mantém a reprodução contínua
  // dos vídeos Sequência da fila usando o cálculo linear
  const sequentialItems = playlist.filter((i) => !i.start_time || !i.start_time.trim());
  const pool = sequentialItems.length > 0 ? sequentialItems : playlist;

  const linear = calculateGlobalLinearSync(pool, now);
  const chosenItem = pool[linear.currentVideoIndex] || playlist[0];
  const realIndex = playlist.findIndex((i) => i.id === chosenItem.id);

  return {
    currentVideoIndex: realIndex >= 0 ? realIndex : 0,
    startOffsetSeconds: linear.startOffsetSeconds,
    isScheduledTime: false,
    activeProgram: chosenItem,
  };
}
