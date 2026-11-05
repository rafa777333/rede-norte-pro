import { PlaceItem, PlaceCategory } from "@/types/places";
import { MOCK_PLACES } from "@/lib/mock-places";
import { getSupabase, cidadeSlug } from "@/lib/supabase";

export function mapDbToPlace(row: any): PlaceItem {
  return {
    id: String(row.id),
    slug: row.slug || String(row.id),
    name: row.name || "Estabelecimento",
    tagline: row.tagline || undefined,
    category: (row.category || "Restaurantes & Almoço") as PlaceCategory,
    city: row.city || "Apucarana",
    neighborhood: row.neighborhood || "Centro",
    address: row.address || "Vale do Ivaí - PR",
    googleMapsUrl: row.google_maps_url || undefined,
    instagram: row.instagram || undefined,
    isVip: Boolean(row.is_vip),
    isActive: row.is_active !== false,
    rating: typeof row.rating === "number" ? row.rating : 5.0,
    openHours: row.open_hours || { open: "18:00", close: "23:30", days: "Terça a Domingo" },
    coverImage:
      row.cover_image ||
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
    logo: row.logo || undefined,
    videoUrl: row.video_url || undefined,
    videoThumbnail: row.video_thumbnail || undefined,
    whatsapp: (row.whatsapp || "").replace(/\D/g, ""),
    activePromo: row.active_promo && row.active_promo.title ? row.active_promo : undefined,
    menuHighlights: Array.isArray(row.menu_highlights) ? row.menu_highlights : [],
    description: row.description || undefined,
  };
}

export function mapPlaceToDb(place: Partial<PlaceItem>): any {
  const cleanZap = (place.whatsapp || "").replace(/\D/g, "");
  const baseSlug = place.slug || (place.name ? cidadeSlug(place.name) : "local");

  const record: any = {
    slug: baseSlug,
    name: place.name,
    tagline: place.tagline || null,
    category: place.category || "Restaurantes & Almoço",
    city: place.city || "Apucarana",
    neighborhood: place.neighborhood || "Centro",
    address: place.address || null,
    whatsapp: cleanZap || null,
    instagram: place.instagram || null,
    google_maps_url: place.googleMapsUrl || null,
    is_vip: Boolean(place.isVip),
    is_active: place.isActive !== false,
    rating: typeof place.rating === "number" ? place.rating : 5.0,
    open_hours: place.openHours || { open: "18:00", close: "23:30", days: "Terça a Domingo" },
    cover_image: place.coverImage,
    logo: place.logo || null,
    video_url: place.videoUrl || null,
    video_thumbnail: place.videoThumbnail || null,
    active_promo: place.activePromo && place.activePromo.title ? place.activePromo : null,
    menu_highlights: Array.isArray(place.menuHighlights) ? place.menuHighlights : [],
    description: place.description || null,
  };

  if (place.id && !place.id.startsWith("mock-")) {
    record.id = place.id;
  }

  return record;
}

/**
 * Busca estabelecimentos cadastrados no Supabase com fallback transparente para MOCK_PLACES
 */
export async function fetchOndeIrPlaces(options?: {
  allStatus?: boolean;
  city?: string;
  category?: string;
}): Promise<PlaceItem[]> {
  const supabase = getSupabase();
  if (!supabase) return MOCK_PLACES;

  try {
    let query = supabase
      .from("onde_ir_places")
      .select("*")
      .order("is_vip", { ascending: false })
      .order("created_at", { ascending: false });

    if (!options?.allStatus) {
      query = query.eq("is_active", true);
    }

    if (options?.city && options.city !== "Geral" && options.city !== "Todas") {
      query = query.ilike("city", options.city);
    }

    if (options?.category && options.category !== "Todas") {
      query = query.eq("category", options.category);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // Se a tabela ainda estiver vazia ou não criada no Supabase, retorna os mocks
      return MOCK_PLACES;
    }

    return data.map(mapDbToPlace);
  } catch (err) {
    console.warn("fetchOndeIrPlaces error, using fallback mocks:", err);
    return MOCK_PLACES;
  }
}
