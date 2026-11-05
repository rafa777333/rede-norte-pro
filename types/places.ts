export type PlaceCategory =
  | "Pizzarias & Lanches"
  | "Restaurantes & Almoço"
  | "Bares & Vida Noturna"
  | "Cafés & Docerias"
  | "Hotéis & Lazer";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  badge?: string; // ex: 'Mais Pedido', 'Especial do Chef', 'Novidade'
}

export interface ActivePromo {
  title: string;
  discountBadge: string; // ex: '20% OFF' ou 'Chopp em Dobro'
  couponCode: string; // ex: 'REDE10'
  validUntil?: string;
  description?: string;
}

export interface PlaceOpenHours {
  open: string; // '18:00'
  close: string; // '23:30'
  days?: string; // 'Terça a Domingo'
}

export interface PlaceItem {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  category: PlaceCategory;
  city: string;
  neighborhood: string;
  address: string;
  googleMapsUrl?: string;
  instagram?: string;
  isVip: boolean;
  rating?: number;
  ratingCount?: number;
  openHours: PlaceOpenHours;
  videoUrl?: string; // 9:16 video URL
  videoThumbnail?: string;
  coverImage: string;
  logo?: string;
  gallery?: string[];
  whatsapp: string; // DDD + número limpo
  activePromo?: ActivePromo;
  menuHighlights: MenuItem[];
  description?: string;
}
