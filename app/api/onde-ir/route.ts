import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabase } from "@/lib/supabase";
import { MOCK_PLACES } from "@/lib/mock-places";
import { mapDbToPlace, mapPlaceToDb } from "@/lib/places-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const city = searchParams.get("city");
    const category = searchParams.get("category");

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: true, data: MOCK_PLACES, fallback: true });
    }

    let query = supabase
      .from("onde_ir_places")
      .select("*")
      .order("is_vip", { ascending: false })
      .order("created_at", { ascending: false });

    if (!all) {
      query = query.eq("is_active", true);
    }

    if (city && city !== "Geral" && city !== "Todas") {
      query = query.ilike("city", city);
    }

    if (category && category !== "Todas") {
      query = query.eq("category", category);
    }

    const { data, error } = await query.limit(40);

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: MOCK_PLACES,
        fallback: true,
        dbError: error ? error.message : null,
      });
    }

    return NextResponse.json({
      success: true,
      data: data.map(mapDbToPlace),
      fallback: false,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      data: MOCK_PLACES,
      fallback: true,
      error: err.message,
    });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    // 1. AÇÃO: IMPORTAR MOCKS PARA O SUPABASE
    if (body.action === "seed") {
      const recordsToInsert = MOCK_PLACES.map((p) => {
        const dbRow = mapPlaceToDb(p);
        delete dbRow.id; // Gera novos UUIDs no Postgres
        return dbRow;
      });

      const { data, error } = await supabase
        .from("onde_ir_places")
        .upsert(recordsToInsert, { onConflict: "slug" })
        .select();

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            hint:
              error.message.includes("does not exist") || error.code === "42P01"
                ? "A tabela onde_ir_places ainda não foi criada no banco. Execute o SQL em supabase/onde_ir_schema.sql no editor do Supabase."
                : error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        count: data?.length || recordsToInsert.length,
        message: "6 estabelecimentos demonstrativos importados com sucesso!",
      });
    }

    // 2. AÇÃO: SALVAR / ATUALIZAR ESTABELECIMENTO
    const placeData = body.place || body;
    if (!placeData.name) {
      return NextResponse.json(
        { success: false, error: "Nome do estabelecimento é obrigatório." },
        { status: 400 }
      );
    }

    const dbRecord = mapPlaceToDb(placeData);

    let result;
    if (dbRecord.id) {
      result = await supabase
        .from("onde_ir_places")
        .update(dbRecord)
        .eq("id", dbRecord.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("onde_ir_places")
        .insert(dbRecord)
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.message,
          hint:
            result.error.message.includes("does not exist") || result.error.code === "42P01"
              ? "A tabela onde_ir_places ainda não foi criada no banco. Execute o script supabase/onde_ir_schema.sql."
              : result.error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mapDbToPlace(result.data),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro desconhecido ao processar requisição" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { id, is_vip, is_active, promo_active, promo_highlight, promo_text } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID é obrigatório." },
        { status: 400 }
      );
    }

    const updatePayload: any = {};
    if (typeof is_vip === "boolean") updatePayload.is_vip = is_vip;
    if (typeof is_active === "boolean") updatePayload.is_active = is_active;
    if (typeof promo_active === "boolean") updatePayload.promo_active = promo_active;
    if (typeof promo_highlight === "boolean") updatePayload.promo_highlight = promo_highlight;
    if (typeof promo_text === "string") updatePayload.promo_text = promo_text;

    // Busca o registro atual para sincronizar o JSONB active_promo também
    const { data: currentPlace } = await supabase
      .from("onde_ir_places")
      .select("active_promo")
      .eq("id", id)
      .maybeSingle();

    if (currentPlace && currentPlace.active_promo) {
      updatePayload.active_promo = {
        ...currentPlace.active_promo,
        ...(typeof promo_active === "boolean" ? { isActive: promo_active } : {}),
        ...(typeof promo_highlight === "boolean" ? { isHighlight: promo_highlight } : {}),
        ...(typeof promo_text === "string" ? { title: promo_text } : {}),
      };
    }

    let { data, error } = await supabase
      .from("onde_ir_places")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    // Fallback: se as colunas diretas ainda não existirem no Supabase, tenta atualizar somente active_promo, is_vip, is_active
    if (error && (error.message.includes("column") || error.code === "42703")) {
      const fallbackPayload: any = {};
      if (typeof is_vip === "boolean") fallbackPayload.is_vip = is_vip;
      if (typeof is_active === "boolean") fallbackPayload.is_active = is_active;
      if (updatePayload.active_promo) fallbackPayload.active_promo = updatePayload.active_promo;

      const fallbackRes = await supabase
        .from("onde_ir_places")
        .update(fallbackPayload)
        .eq("id", id)
        .select()
        .single();

      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mapDbToPlace(data),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID é obrigatório para exclusão." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("onde_ir_places").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Estabelecimento excluído com sucesso.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
