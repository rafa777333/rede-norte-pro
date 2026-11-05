import { RetailerItem, RetailerCategory, ThemeDay, ThermometerItem } from "@/types/ofertas";
import { MOCK_RETAILERS, MOCK_THERMOMETER } from "@/lib/mock-ofertas";
import { getSupabase, cidadeSlug } from "@/lib/supabase";

export function getCurrentThemeDay(): { themeDay: ThemeDay; title: string; subtitle: string; icon: string } {
  const day = new Date().getDay(); // 0 Dom, 1 Seg, 2 Ter, 3 Qua, 4 Qui, 5 Sex, 6 Sab
  if (day === 2 || day === 3) {
    return {
      themeDay: "Terça & Quarta Verde",
      title: "🥦 Terça & Quarta Verde no Vale",
      subtitle: "Feira fresca, hortifrúti direto do produtor e os menores preços da horta.",
      icon: "🥬",
    };
  }
  if (day === 4 || day === 5) {
    return {
      themeDay: "Quinta & Sexta da Carne",
      title: "🥩 Quinta & Sexta da Carne & Churrasco",
      subtitle: "Cortes nobres, alcatra, contrafilé e costela com descontos agressivos para o fim de semana.",
      icon: "🥩",
    };
  }
  if (day === 6 || day === 0) {
    return {
      themeDay: "Saldão de Fim de Semana",
      title: "🔥 Saldão de Fim de Semana do Varejo",
      subtitle: "Supermercados, atacarejos e bebidas com ofertas relâmpago de Sábado e Domingo.",
      icon: "🛒",
    };
  }
  return {
    themeDay: "Todos os Dias",
    title: "🏷️ Economia da Semana & Varejo Essencial",
    subtitle: "Termômetro da cesta básica, farmácias de plantão e encartes digitais atualizados.",
    icon: "💰",
  };
}

export function mapDbToRetailer(row: any): RetailerItem {
  return {
    id: String(row.id),
    slug: row.slug || String(row.id),
    name: row.name || "Estabelecimento",
    category: (row.category || "Supermercados") as RetailerCategory,
    city: row.city || "Apucarana",
    neighborhood: row.neighborhood || "Centro",
    address: row.address || "Apucarana - PR",
    logo: row.logo || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&h=200&fit=crop&q=80",
    coverImage: row.cover_image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80",
    flyerPdfOrImage: row.flyer_pdf_or_image || undefined,
    whatsapp: (row.whatsapp || "").replace(/\D/g, ""),
    vipGroupUrl: row.vip_group_url || undefined,
    isVip: Boolean(row.is_vip),
    themeDay: (row.theme_day || "Todos os Dias") as ThemeDay,
    validUntil: row.valid_until || "Ofertas válidas hoje!",
    storiesItems: Array.isArray(row.stories_items) ? row.stories_items : [],
    isActive: row.is_active !== false,
    updatedAt: row.updated_at,
  };
}

export function mapRetailerToDb(item: Partial<RetailerItem>): any {
  const baseSlug = item.slug || (item.name ? cidadeSlug(item.name) : "varejo");
  const record: any = {
    slug: baseSlug,
    name: item.name,
    category: item.category || "Supermercados",
    city: item.city || "Apucarana",
    neighborhood: item.neighborhood || "Centro",
    address: item.address || null,
    logo: item.logo || "",
    cover_image: item.coverImage || "",
    flyer_pdf_or_image: item.flyerPdfOrImage || null,
    whatsapp: (item.whatsapp || "").replace(/\D/g, ""),
    vip_group_url: item.vipGroupUrl || null,
    is_vip: Boolean(item.isVip),
    theme_day: item.themeDay || "Todos os Dias",
    valid_until: item.validUntil || "Ofertas válidas hoje!",
    stories_items: item.storiesItems || [],
    is_active: item.isActive !== false,
  };

  if (item.id && !item.id.startsWith("ret-")) {
    record.id = item.id;
  }

  return record;
}

export function mapDbToThermometer(row: any): ThermometerItem {
  return {
    id: String(row.id),
    itemName: row.item_name || "Item Essencial",
    category: row.category || "Cesta Básica",
    unit: row.unit || "un",
    avgPrice: Number(row.avg_price || 0),
    lowestPrice: Number(row.lowest_price || 0),
    partnerName: row.partner_name || "Comércio Local",
    partnerWhatsapp: (row.partner_whatsapp || "").replace(/\D/g, ""),
    partnerId: row.partner_id ? String(row.partner_id) : undefined,
    orderIndex: typeof row.order_index === "number" ? row.order_index : 0,
    updatedAt: row.updated_at,
  };
}

export function mapThermometerToDb(item: Partial<ThermometerItem>): any {
  const record: any = {
    item_name: item.itemName,
    category: item.category || "Cesta Básica",
    unit: item.unit || "un",
    avg_price: item.avgPrice || 0,
    lowest_price: item.lowestPrice || 0,
    partner_name: item.partnerName || "Comércio Local",
    partner_whatsapp: (item.partnerWhatsapp || "").replace(/\D/g, ""),
    partner_id: item.partnerId || null,
    order_index: item.orderIndex || 0,
    is_active: true,
  };

  if (item.id && !item.id.startsWith("therm-")) {
    record.id = item.id;
  }

  return record;
}

export async function fetchOfertasData(): Promise<{
  thermometer: ThermometerItem[];
  retailers: RetailerItem[];
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { thermometer: MOCK_THERMOMETER, retailers: MOCK_RETAILERS };
  }

  try {
    const [thermRes, retRes] = await Promise.all([
      supabase
        .from("ofertas_thermometer")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true })
        .limit(10),
      supabase
        .from("ofertas_retailers")
        .select("*")
        .eq("is_active", true)
        .order("is_vip", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const thermometer =
      thermRes.data && thermRes.data.length > 0
        ? thermRes.data.map(mapDbToThermometer)
        : MOCK_THERMOMETER;

    const retailers =
      retRes.data && retRes.data.length > 0
        ? retRes.data.map(mapDbToRetailer)
        : MOCK_RETAILERS;

    return { thermometer, retailers };
  } catch (err) {
    console.warn("fetchOfertasData error, using fallback mocks:", err);
    return { thermometer: MOCK_THERMOMETER, retailers: MOCK_RETAILERS };
  }
}
