export type RetailerCategory =
  | "Supermercados"
  | "Açougues & Carnes"
  | "Farmácias & Saúde"
  | "Hortifrúti & Feira"
  | "Gás & Bebidas";

export type ThemeDay =
  | "Todos os Dias"
  | "Terça & Quarta Verde"
  | "Quinta & Sexta da Carne"
  | "Saldão de Fim de Semana"
  | "Plantão Farmácia";

export interface PromoProduct {
  id: string;
  productName: string;
  unit: string; // ex: 'kg', 'un', '5kg', '500g', 'pct', 'fardo'
  oldPrice?: number;
  promoPrice: number;
  discountPercent?: number;
  productImage: string;
  isAnchor?: boolean; // Produto âncora de alto impacto
  categoryTag?: string; // ex: 'Açougue', 'Bebidas', 'Mercearia'
}

export interface RetailerItem {
  id: string;
  slug: string;
  name: string;
  category: RetailerCategory;
  city: string;
  neighborhood: string;
  address: string;
  logo: string;
  coverImage: string;
  flyerPdfOrImage?: string; // Arte do encarte completo
  whatsapp: string; // Número limpo com DDD
  vipGroupUrl?: string; // Link convite grupo VIP de ofertas no Zap
  isVip: boolean;
  themeDay: ThemeDay;
  validUntil: string;
  storiesItems: PromoProduct[];
  isActive?: boolean;
  updatedAt?: string;
}

export interface ThermometerItem {
  id: string;
  itemName: string; // ex: 'Arroz Tipo 1 (5kg)'
  category: string; // 'Cesta Básica', 'Carnes', 'Higiene', 'Gás'
  unit: string; // 'pct 5kg', 'kg', 'botijão P13'
  avgPrice: number; // Preço médio
  lowestPrice: number; // Menor preço de hoje
  partnerName: string; // Nome do mercado
  partnerWhatsapp: string; // WhatsApp do mercado
  partnerId?: string;
  orderIndex?: number;
  updatedAt?: string;
}

export interface ShoppingListItem {
  product: PromoProduct;
  retailerName: string;
  retailerWhatsapp: string;
  quantity: number;
}
