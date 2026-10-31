/**
 * Tipagens do Módulo de Publicação Automatizada de Notícias nas Redes Sociais
 * Tabela: public.social_publications (Supabase)
 */

export type SocialPublicationNetwork = "instagram" | "facebook" | "instagram_stories" | string;

export type SocialPublicationStatus =
  | "queued"
  | "validating"
  | "generating"
  | "asset_ready"
  | "publishing"
  | "published"
  | "failed";

export type SocialPublicationMetaPostIds = {
  facebook?: string;
  instagram?: string;
  [key: string]: string | undefined;
};

export interface SocialPublication {
  id: string;
  news_id: string;
  networks: SocialPublicationNetwork[];
  status: SocialPublicationStatus;
  canva_job_id: string | null;
  supabase_image_url: string | null;
  meta_post_ids: SocialPublicationMetaPostIds;
  error_log: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPublicationInsert {
  id?: string;
  news_id: string;
  networks: SocialPublicationNetwork[];
  status?: SocialPublicationStatus;
  canva_job_id?: string | null;
  supabase_image_url?: string | null;
  meta_post_ids?: SocialPublicationMetaPostIds;
  error_log?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SocialPublicationUpdate {
  news_id?: string;
  networks?: SocialPublicationNetwork[];
  status?: SocialPublicationStatus;
  canva_job_id?: string | null;
  supabase_image_url?: string | null;
  meta_post_ids?: SocialPublicationMetaPostIds;
  error_log?: string | null;
  updated_at?: string;
}

/**
 * Metadados Visuais para Renderização de Status no Painel Administrativo
 */
export const SOCIAL_STATUS_CONFIG: Record<
  SocialPublicationStatus,
  {
    label: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    icon: string;
    isLoading: boolean;
  }
> = {
  queued: {
    label: "Na Fila",
    description: "Publicação aguardando início do processamento pelo webhook",
    badgeBg: "#f1f5f9",
    badgeText: "#475569",
    badgeBorder: "#cbd5e1",
    icon: "⏳",
    isLoading: false,
  },
  validating: {
    label: "Validando",
    description: "Validando dados da matéria e integridade da imagem",
    badgeBg: "#e0f2fe",
    badgeText: "#0369a1",
    badgeBorder: "#7dd3fc",
    icon: "🔍",
    isLoading: true,
  },
  generating: {
    label: "Criando no Canva",
    description: "Gerando arte personalizada via API do Canva",
    badgeBg: "#f3e8ff",
    badgeText: "#7e22ce",
    badgeBorder: "#d8b4fe",
    icon: "🎨",
    isLoading: true,
  },
  asset_ready: {
    label: "Arte Pronta",
    description: "Imagem gerada e salva no Supabase Storage",
    badgeBg: "#ecfdf5",
    badgeText: "#047857",
    badgeBorder: "#a7f3d0",
    icon: "🖼️",
    isLoading: true,
  },
  publishing: {
    label: "Publicando",
    description: "Enviando postagem para as APIs da Meta (Facebook/Instagram)",
    badgeBg: "#dbeafe",
    badgeText: "#1d4ed8",
    badgeBorder: "#93c5fd",
    icon: "🚀",
    isLoading: true,
  },
  published: {
    label: "Publicado",
    description: "Publicado com sucesso em todas as redes selecionadas",
    badgeBg: "#dcfce7",
    badgeText: "#15803d",
    badgeBorder: "#86efac",
    icon: "✅",
    isLoading: false,
  },
  failed: {
    label: "Falha",
    description: "Ocorreu um erro durante o fluxo de automação",
    badgeBg: "#fee2e2",
    badgeText: "#b91c1c",
    badgeBorder: "#fca5a5",
    icon: "❌",
    isLoading: false,
  },
};
