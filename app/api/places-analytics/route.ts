import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface AnalyticsRecord {
  place_id: string;
  views_count: number;
  clicks_count: number;
  updated_at: string;
}

interface AnalyticsMap {
  [placeId: string]: {
    views: number;
    clicks: number;
    updated_at: string;
  };
}

/**
 * Lê estatísticas do site_settings (Fallback transparente se a tabela places_analytics não existir)
 */
async function getFallbackSettings(supabase: any): Promise<AnalyticsMap> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "places_analytics_data")
      .maybeSingle();

    if (data?.value) {
      const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {}
  return {};
}

/**
 * Salva estatísticas no site_settings (Fallback)
 */
async function saveFallbackSettings(supabase: any, map: AnalyticsMap) {
  try {
    await supabase.from("site_settings").upsert(
      {
        key: "places_analytics_data",
        value: JSON.stringify(map),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  } catch (err) {
    console.warn("[PlacesAnalytics] Erro ao salvar fallback em site_settings:", err);
  }
}

// =============================================================================
// GET: Retorna todas as métricas agregadas para o Dashboard do /admin
// =============================================================================
export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, data: [] });
  }

  try {
    // 1. Tenta buscar direto na tabela oficial places_analytics
    const { data: dbData, error: dbError } = await supabase
      .from("places_analytics")
      .select("place_id, views_count, clicks_count, updated_at");

    if (!dbError && dbData) {
      return NextResponse.json({
        success: true,
        source: "places_analytics",
        data: dbData,
      });
    }

    // 2. Se a tabela não existir, carrega do fallback em site_settings
    const fallbackMap = await getFallbackSettings(supabase);
    const formattedData: AnalyticsRecord[] = Object.entries(fallbackMap).map(
      ([place_id, stats]) => ({
        place_id,
        views_count: stats.views || 0,
        clicks_count: stats.clicks || 0,
        updated_at: stats.updated_at || new Date().toISOString(),
      })
    );

    return NextResponse.json({
      success: true,
      source: "site_settings_fallback",
      data: formattedData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, data: [] },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST: Rastreamento silencioso (view de impressão ou clique em cupom) e reset
// =============================================================================
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Sem conexão com Supabase" });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, placeId, placeIds } = body;

    const now = new Date().toISOString();

    // -------------------------------------------------------------------------
    // AÇÃO: ZERAR / LIMPAR ESTATÍSTICAS (NOVO MÊS COMERCIAL)
    // -------------------------------------------------------------------------
    if (action === "reset") {
      const targetId = placeId;

      // Tenta reset na tabela oficial
      try {
        if (!targetId || targetId === "all") {
          await supabase
            .from("places_analytics")
            .update({ views_count: 0, clicks_count: 0, updated_at: now })
            .neq("place_id", "");
        } else {
          await supabase
            .from("places_analytics")
            .update({ views_count: 0, clicks_count: 0, updated_at: now })
            .eq("place_id", targetId);
        }
      } catch {}

      // Atualiza também no fallback site_settings
      const fallbackMap = await getFallbackSettings(supabase);
      if (!targetId || targetId === "all") {
        for (const k of Object.keys(fallbackMap)) {
          fallbackMap[k] = { views: 0, clicks: 0, updated_at: now };
        }
      } else if (fallbackMap[targetId]) {
        fallbackMap[targetId] = { views: 0, clicks: 0, updated_at: now };
      }
      await saveFallbackSettings(supabase, fallbackMap);

      return NextResponse.json({ success: true, message: "Estatísticas zeradas com sucesso" });
    }

    // -------------------------------------------------------------------------
    // AÇÃO: RASTREAMENTO SILENCIOSO DE VIEWS (IMPRESSÃO DE CARDS)
    // -------------------------------------------------------------------------
    if (action === "view") {
      const ids: string[] = Array.isArray(placeIds)
        ? placeIds
        : placeId
        ? [placeId]
        : [];

      if (ids.length === 0) {
        return NextResponse.json({ success: true, count: 0 });
      }

      let usedDb = false;

      // Tenta incrementar via RPC ou tabela oficial places_analytics
      try {
        for (const pid of ids) {
          const { error: rpcErr } = await supabase.rpc("increment_place_analytics", {
            target_place_id: String(pid),
            increment_views: 1,
            increment_clicks: 0,
          });

          if (rpcErr) {
            // Se a RPC não existir, faz upsert direto
            const { data: existing } = await supabase
              .from("places_analytics")
              .select("views_count")
              .eq("place_id", String(pid))
              .maybeSingle();

            const curViews = existing?.views_count || 0;
            await supabase.from("places_analytics").upsert(
              {
                place_id: String(pid),
                views_count: curViews + 1,
                updated_at: now,
              },
              { onConflict: "place_id" }
            );
          }
        }
        usedDb = true;
      } catch {
        usedDb = false;
      }

      // Sincroniza também no fallback site_settings para garantia total
      const fallbackMap = await getFallbackSettings(supabase);
      for (const pid of ids) {
        const key = String(pid);
        if (!fallbackMap[key]) {
          fallbackMap[key] = { views: 1, clicks: 0, updated_at: now };
        } else {
          fallbackMap[key].views = (fallbackMap[key].views || 0) + 1;
          fallbackMap[key].updated_at = now;
        }
      }
      await saveFallbackSettings(supabase, fallbackMap);

      return NextResponse.json({
        success: true,
        trackedViews: ids.length,
        storage: usedDb ? "database" : "fallback",
      });
    }

    // -------------------------------------------------------------------------
    // AÇÃO: RASTREAMENTO SILENCIOSO DE CLIQUE EM CUPOM ("RESGATAR NO CAIXA")
    // -------------------------------------------------------------------------
    if (action === "click") {
      const targetId = String(placeId || "");
      if (!targetId) {
        return NextResponse.json({ success: false, error: "placeId obrigatório" }, { status: 400 });
      }

      let usedDb = false;

      try {
        const { error: rpcErr } = await supabase.rpc("increment_place_analytics", {
          target_place_id: targetId,
          increment_views: 0,
          increment_clicks: 1,
        });

        if (rpcErr) {
          const { data: existing } = await supabase
            .from("places_analytics")
            .select("clicks_count")
            .eq("place_id", targetId)
            .maybeSingle();

          const curClicks = existing?.clicks_count || 0;
          await supabase.from("places_analytics").upsert(
            {
              place_id: targetId,
              clicks_count: curClicks + 1,
              updated_at: now,
            },
            { onConflict: "place_id" }
          );
        }
        usedDb = true;
      } catch {
        usedDb = false;
      }

      // Sincroniza fallback em site_settings
      const fallbackMap = await getFallbackSettings(supabase);
      if (!fallbackMap[targetId]) {
        fallbackMap[targetId] = { views: 0, clicks: 1, updated_at: now };
      } else {
        fallbackMap[targetId].clicks = (fallbackMap[targetId].clicks || 0) + 1;
        fallbackMap[targetId].updated_at = now;
      }
      await saveFallbackSettings(supabase, fallbackMap);

      return NextResponse.json({
        success: true,
        placeId: targetId,
        storage: usedDb ? "database" : "fallback",
      });
    }

    return NextResponse.json({ success: false, error: "Ação inválida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
