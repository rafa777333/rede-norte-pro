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
  youtube_url: string;
  youtube_id: string;
  type: TvPlaylistItemType;
  duration_seconds: number;
  sort_order: number;
  active: boolean;
  created_at?: string;
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
    youtube_url: "https://www.youtube.com/watch?v=siHRXs-J-R8",
    youtube_id: "siHRXs-J-R8",
    type: "podcast",
    duration_seconds: 4200, // 1h 10m
    sort_order: 1,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "tv-item-2",
    title: "Conexão Sertaneja • Show e Bate-papo com Josy Rosseto",
    youtube_url: "https://www.youtube.com/watch?v=s_EhTC5GMjQ",
    youtube_id: "s_EhTC5GMjQ",
    type: "musical",
    duration_seconds: 3600, // 1h 00m
    sort_order: 2,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "tv-item-3",
    title: "RedeCast • Bate-papo com Nenê de Paula (Músico & Produtor Cultural)",
    youtube_url: "https://www.youtube.com/watch?v=lBJIN6tE0zw",
    youtube_id: "lBJIN6tE0zw",
    type: "podcast",
    duration_seconds: 4500, // 1h 15m
    sort_order: 3,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "tv-item-4",
    title: "RedeCast Entrevista • Eliane Tapira & Histórias Regionais",
    youtube_url: "https://www.youtube.com/watch?v=y2zdEohCZDs",
    youtube_id: "y2zdEohCZDs",
    type: "podcast",
    duration_seconds: 3600, // 1h 00m
    sort_order: 4,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "tv-item-5",
    title: "RedeCast Política & Sociedade • Deputada Carol Dartora no Estúdio",
    youtube_url: "https://www.youtube.com/watch?v=5TXJP8-U94k",
    youtube_id: "5TXJP8-U94k",
    type: "podcast",
    duration_seconds: 3900, // 1h 05m
    sort_order: 5,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "tv-item-6",
    title: "O Pior Programa do Mundo #6 • Entrevista com Rafa Carraro",
    youtube_url: "https://www.youtube.com/watch?v=R6-QAtKZM3Q",
    youtube_id: "R6-QAtKZM3Q",
    type: "podcast",
    duration_seconds: 3300, // 55m
    sort_order: 6,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "tv-item-7",
    title: "RedeCast Especial • Autismo em Pauta com Especialistas de Apucarana",
    youtube_url: "https://www.youtube.com/watch?v=DdvQWXAue0U",
    youtube_id: "DdvQWXAue0U",
    type: "reportagem",
    duration_seconds: 3600, // 1h 00m
    sort_order: 7,
    active: true,
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
 * Calcula qual vídeo está passando no exato segundo atual, com base no relógio real sincronizado.
 * Fórmula: nowSeconds % totalPlaylistDurationSeconds
 */
export function calculateTvProgramAtTime(
  playlist: TvPlaylistItem[],
  nowTimestampSeconds?: number
): CurrentTvSchedule | null {
  const activeList = playlist
    .filter((item) => item.active && item.duration_seconds > 0)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (activeList.length === 0) {
    return null;
  }

  const totalDuration = activeList.reduce((acc, item) => acc + item.duration_seconds, 0);
  if (totalDuration <= 0) return null;

  const now = nowTimestampSeconds ?? Math.floor(Date.now() / 1000);
  const currentCycleOffset = ((now % totalDuration) + totalDuration) % totalDuration;

  let accumulated = 0;
  let currentIndex = 0;
  let offsetInCurrentVideo = 0;

  for (let i = 0; i < activeList.length; i++) {
    const item = activeList[i];
    const itemStart = accumulated;
    const itemEnd = accumulated + item.duration_seconds;

    if (currentCycleOffset >= itemStart && currentCycleOffset < itemEnd) {
      currentIndex = i;
      offsetInCurrentVideo = currentCycleOffset - itemStart;
      break;
    }
    accumulated += item.duration_seconds;
  }

  const currentItem = activeList[currentIndex] || activeList[0];
  const nextIndex = (currentIndex + 1) % activeList.length;
  const nextItem = activeList[nextIndex] || currentItem;
  const remainingInCurrent = Math.max(0, currentItem.duration_seconds - offsetInCurrentVideo);

  return {
    currentItem,
    currentIndex,
    nextItem,
    nextIndex,
    offsetInCurrentVideo,
    remainingInCurrent,
    totalDuration,
    activeList,
  };
}
