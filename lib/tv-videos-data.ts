/**
/**
 * Tipagens, helpers e dados iniciais para o Hub de Streaming TV Online & VOD Multi-Canal
 * (Canais Oficiais: TV Apucarana & RedeCast)
 */

export type ChannelSource = "TV Apucarana" | "RedeCast";

export type VideoCategory =
  | "RedeCast Episódios"
  | "Reportagens TV"
  | "Cortes & Shorts"
  | "Especial & Música";

export interface PortalVideoItem {
  id: string;
  title: string;
  youtube_url: string;
  youtube_id: string;
  video_url?: string;
  video_type?: "youtube" | "mp4" | "instagram" | "tiktok";
  video_format?: "16:9" | "9:16";
  show_on_home?: boolean;
  channel_source: ChannelSource;
  category: VideoCategory;
  duration?: string;
  is_featured?: boolean;
  status?: "publicado" | "rascunho" | string;
  thumbnail_url?: string;
  views_count?: string;
  created_at?: string;
}

export function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Caso seja o próprio ID de 11 caracteres
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // YouTube Shorts: /shorts/{id}
  const matchShorts = trimmed.match(/(?:shorts\/)([a-zA-Z0-9_-]{11})/i);
  if (matchShorts) return matchShorts[1];

  // YouTube Live: /live/{id}
  const matchLive = trimmed.match(/(?:live\/)([a-zA-Z0-9_-]{11})/i);
  if (matchLive) return matchLive[1];

  // YouTube Embed: /embed/{id}
  const matchEmbed = trimmed.match(/(?:embed\/)([a-zA-Z0-9_-]{11})/i);
  if (matchEmbed) return matchEmbed[1];

  // Encurtador: youtu.be/{id}
  const matchShort = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (matchShort) return matchShort[1];

  // URL Padrão: ?v={id} ou &v={id}
  const matchWatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (matchWatch) return matchWatch[1];

  return null;
}

export function getYouTubeThumbnail(
  youtubeId?: string | null,
  customThumb?: string | null
): string {
  const cThumb = (customThumb || "").trim();
  const isPostUrl =
    cThumb.includes("instagram.com/") ||
    cThumb.includes("facebook.com/") ||
    cThumb.includes("tiktok.com/");
  if (cThumb && !isPostUrl) {
    return cThumb;
  }
  if (youtubeId && youtubeId.length === 11) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }
  return "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&auto=format&fit=crop&q=80";
}

export function normalizePortalVideo(raw: any): PortalVideoItem {
  const videoUrl = (raw.youtube_url || raw.url_video || raw.videoUrl || "").trim();
  const ytId = raw.youtube_id || extractYouTubeId(videoUrl) || "";

  // Detecção de tipo de vídeo
  let video_type: "youtube" | "mp4" | "instagram" | "tiktok" = "youtube";
  const rawPlat = (raw.plataforma || raw.tipo || "").toLowerCase();
  if (
    rawPlat === "nativo" ||
    rawPlat === "mp4" ||
    videoUrl.toLowerCase().endsWith(".mp4") ||
    videoUrl.includes("/storage/v1/object/public/")
  ) {
    video_type = "mp4";
  } else if (rawPlat === "instagram" || videoUrl.includes("instagram.com")) {
    video_type = "instagram";
  } else if (rawPlat === "tiktok" || videoUrl.includes("tiktok.com")) {
    video_type = "tiktok";
  }

  // Detecção de formato (16:9 vs 9:16)
  let video_format: "16:9" | "9:16" = "16:9";
  if (
    raw.video_format === "9:16" ||
    raw.formato === "9:16" ||
    videoUrl.includes("/shorts/") ||
    videoUrl.includes("/reel/") ||
    video_type === "tiktok"
  ) {
    video_format = "9:16";
  }

  const rawChannel = raw.channel_source || raw.canal || "";
  const titleText = (raw.title || raw.titulo || "").toLowerCase();
  const channel_source: ChannelSource =
    rawChannel.toLowerCase().includes("rede") ||
    rawChannel.toLowerCase().includes("cast") ||
    titleText.includes("redecast") ||
    titleText.includes("opiorprograma") ||
    titleText.includes("terra de cowboy") ||
    titleText.includes("conexão sertaneja") ||
    titleText.includes("autismo em pauta")
      ? "RedeCast"
      : "TV Apucarana";

  let category: VideoCategory = "Reportagens TV";
  const rawCat = (raw.category || raw.categoria || "").toLowerCase();
  if (video_format === "9:16" || rawCat.includes("corte") || rawCat.includes("short")) {
    category = "Cortes & Shorts";
  } else if (rawCat.includes("episodio") || rawCat.includes("redecast") || channel_source === "RedeCast") {
    category = "RedeCast Episódios";
  } else if (rawCat.includes("música") || rawCat.includes("musica") || rawCat.includes("especial")) {
    category = "Especial & Música";
  } else {
    category = "Reportagens TV";
  }

  const show_on_home = Boolean(
    raw.show_on_home ?? raw.exibir_home ?? raw.is_featured ?? false
  );

  return {
    id: String(raw.id || ytId || `vid-${Date.now()}`),
    title: raw.title || raw.titulo || "Vídeo Rede Apucarana",
    youtube_url: videoUrl,
    youtube_id: ytId,
    video_url: videoUrl,
    video_type,
    video_format,
    show_on_home,
    channel_source,
    category,
    duration: raw.duration || raw.duracao || (video_format === "9:16" ? "0:59" : "1h 15m"),
    is_featured: Boolean(raw.is_featured ?? raw.destaque ?? false),
    status: raw.status || "publicado",
    thumbnail_url: getYouTubeThumbnail(ytId, raw.thumbnail_url || raw.thumbnailUrl),
    views_count: raw.views_count || "4.8k",
    created_at: raw.created_at || new Date().toISOString(),
  };
}

/**
 * Catálogo Curado de Demonstração (Episódios Reais dos Canais TV Apucarana & RedeCast)
 */
export const MOCK_PORTAL_VIDEOS: PortalVideoItem[] = [
  // 1. REDECAST - EPISÓDIOS COMPLETOS & ENTREVISTAS
  {
    id: "rc-1",
    title: "RedeCast #42: Os Bastidores da Política Regional e Eleições no Vale do Ivaí",
    youtube_url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    youtube_id: "ScMzIvxBSi4",
    channel_source: "RedeCast",
    category: "RedeCast Episódios",
    duration: "1h 14m",
    is_featured: true,
    views_count: "8.9k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "rc-2",
    title: "RedeCast #41: Polo Têxtil de Apucarana: Inovação, Empregos e Exportação Mundial",
    youtube_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    youtube_id: "jNQXAC9IVRw",
    channel_source: "RedeCast",
    category: "RedeCast Episódios",
    duration: "58m",
    is_featured: true,
    views_count: "6.2k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "rc-3",
    title: "RedeCast #40: Medicina e Saúde no Norte do Paraná com Doutores Especialistas",
    youtube_url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    youtube_id: "9bZkp7q19f0",
    channel_source: "RedeCast",
    category: "RedeCast Episódios",
    duration: "1h 05m",
    is_featured: false,
    views_count: "4.8k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "rc-4",
    title: "RedeCast #39: O Segredo dos Empreendedores que Cresceram 300% em Apucarana",
    youtube_url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    youtube_id: "kJQP7kiw5Fk",
    channel_source: "RedeCast",
    category: "RedeCast Episódios",
    duration: "1h 22m",
    is_featured: false,
    views_count: "11.4k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },

  // 2. TV APUCARANA - REPORTAGENS & JORNALISMO REGIONAL
  {
    id: "tv-1",
    title: "TV Apucarana: Obras de Duplicação e Contorno Sul na BR-376 Avançam no Vale",
    youtube_url: "https://www.youtube.com/watch?v=L_LUpnjgPso",
    youtube_id: "L_LUpnjgPso",
    channel_source: "TV Apucarana",
    category: "Reportagens TV",
    duration: "8:45",
    is_featured: true,
    views_count: "14.2k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "tv-2",
    title: "TV Apucarana: Operação da Polícia Militar Resulta em Prisão e Apreensão Recorde",
    youtube_url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    youtube_id: "fJ9rUzIMcZQ",
    channel_source: "TV Apucarana",
    category: "Reportagens TV",
    duration: "5:20",
    is_featured: true,
    views_count: "19.5k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "tv-3",
    title: "TV Apucarana: Safra da Soja e do Milho Bate Recorde de Produtividade Regional",
    youtube_url: "https://www.youtube.com/watch?v=ZbZSe6N_BXs",
    youtube_id: "ZbZSe6N_BXs",
    channel_source: "TV Apucarana",
    category: "Reportagens TV",
    duration: "6:15",
    is_featured: false,
    views_count: "5.7k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: "tv-4",
    title: "TV Apucarana: Nova UPA e Ampliação do Atendimento Pediátrico em Apucarana",
    youtube_url: "https://www.youtube.com/watch?v=2Vv-BfVoq4g",
    youtube_id: "2Vv-BfVoq4g",
    channel_source: "TV Apucarana",
    category: "Reportagens TV",
    duration: "7:10",
    is_featured: false,
    views_count: "8.1k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
  },

  // 3. CORTES RÁPIDOS & SHORTS (REDECAST + TV APUCARANA)
  {
    id: "corte-1",
    title: "Corte RedeCast: 'O erro que quase quebrou minha confecção nos primeiros meses'",
    youtube_url: "https://www.youtube.com/shorts/5O43PjBwT4Q",
    youtube_id: "5O43PjBwT4Q",
    channel_source: "RedeCast",
    category: "Cortes & Shorts",
    duration: "0:59",
    is_featured: false,
    views_count: "24.1k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: "corte-2",
    title: "Flagrante TV Apucarana: Perseguição em Alta Velocidade na Rodovia em Arapongas",
    youtube_url: "https://www.youtube.com/shorts/3jz_zV0T4_8",
    youtube_id: "3jz_zV0T4_8",
    channel_source: "TV Apucarana",
    category: "Cortes & Shorts",
    duration: "0:45",
    is_featured: false,
    views_count: "42.8k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
  },
  {
    id: "corte-3",
    title: "Corte RedeCast: Qual o segredo da longevidade financeira segundo especialista",
    youtube_url: "https://www.youtube.com/shorts/9k3J8k4q7L0",
    youtube_id: "9k3J8k4q7L0",
    channel_source: "RedeCast",
    category: "Cortes & Shorts",
    duration: "1:15",
    is_featured: false,
    views_count: "15.3k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: "corte-4",
    title: "Momento Emocionante: Resgate de Filhote pelos Bombeiros em Apucarana",
    youtube_url: "https://www.youtube.com/shorts/7Q0q_4s6m8p",
    youtube_id: "7Q0q_4s6m8p",
    channel_source: "TV Apucarana",
    category: "Cortes & Shorts",
    duration: "0:52",
    is_featured: false,
    views_count: "33.7k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },

  // 4. ESPECIAL CULTURA, MÚSICA & ENTRETENIMENTO
  {
    id: "esp-1",
    title: "Especial Sertanejo: Acústico ao Vivo com Duplas do Vale do Ivaí no Estúdio",
    youtube_url: "https://www.youtube.com/watch?v=RgKAFK5djSk",
    youtube_id: "RgKAFK5djSk",
    channel_source: "TV Apucarana",
    category: "Especial & Música",
    duration: "24:18",
    is_featured: true,
    views_count: "9.5k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
  },
  {
    id: "esp-2",
    title: "História & Tradição: Os 80 Anos de Apucarana e a Saga dos Pioneiros do Café",
    youtube_url: "https://www.youtube.com/watch?v=YQHsXMglC9A",
    youtube_id: "YQHsXMglC9A",
    channel_source: "TV Apucarana",
    category: "Especial & Música",
    duration: "32:40",
    is_featured: false,
    views_count: "12.0k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 65).toISOString(),
  },
  {
    id: "esp-3",
    title: "RedeCast Especial: Bastidores da Gastronomia e os Melhores Festivais da Região",
    youtube_url: "https://www.youtube.com/watch?v=fRh_vgS2dFE",
    youtube_id: "fRh_vgS2dFE",
    channel_source: "RedeCast",
    category: "Especial & Música",
    duration: "48:15",
    is_featured: false,
    views_count: "7.7k",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
  },
];
