import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabase } from "@/lib/supabase";
import { MOCK_RETAILERS, MOCK_THERMOMETER } from "@/lib/mock-ofertas";
import {
  mapDbToRetailer,
  mapRetailerToDb,
  mapDbToThermometer,
  mapThermometerToDb,
} from "@/lib/ofertas-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        thermometer: MOCK_THERMOMETER,
        retailers: MOCK_RETAILERS,
        fallback: true,
      });
    }

    let thermQuery = supabase
      .from("ofertas_thermometer")
      .select("*")
      .order("order_index", { ascending: true });

    let retQuery = supabase
      .from("ofertas_retailers")
      .select("*")
      .order("is_vip", { ascending: false })
      .order("created_at", { ascending: false });

    if (!all) {
      thermQuery = thermQuery.eq("is_active", true);
      retQuery = retQuery.eq("is_active", true);
    }

    const [thermRes, retRes] = await Promise.all([thermQuery, retQuery]);

    const thermometer =
      thermRes.data && thermRes.data.length > 0
        ? thermRes.data.map(mapDbToThermometer)
        : MOCK_THERMOMETER;

    const retailers =
      retRes.data && retRes.data.length > 0
        ? retRes.data.map(mapDbToRetailer)
        : MOCK_RETAILERS;

    return NextResponse.json({
      success: true,
      thermometer,
      retailers,
      fallback: !thermRes.data?.length && !retRes.data?.length,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      thermometer: MOCK_THERMOMETER,
      retailers: MOCK_RETAILERS,
      fallback: true,
      error: err.message,
    });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    // 1. IMPORTAR DADOS DE EXEMPLO (SEED)
    if (body.action === "seed") {
      const thermRecords = MOCK_THERMOMETER.map((t) => {
        const row = mapThermometerToDb(t);
        delete row.id;
        return row;
      });

      const retRecords = MOCK_RETAILERS.map((r) => {
        const row = mapRetailerToDb(r);
        delete row.id;
        return row;
      });

      const [resTherm, resRet] = await Promise.all([
        supabase.from("ofertas_thermometer").insert(thermRecords),
        supabase.from("ofertas_retailers").upsert(retRecords, { onConflict: "slug" }),
      ]);

      if (resTherm.error || resRet.error) {
        const err = resTherm.error || resRet.error;
        return NextResponse.json(
          {
            success: false,
            error: err?.message,
            hint: "Certifique-se de ter executado o SQL em supabase/ofertas_schema.sql no painel do Supabase.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "5 estabelecimentos e 5 itens do termômetro importados com sucesso!",
      });
    }

    // 2. SALVAR ITEM DO TERMÔMETRO
    if (body.action === "save_thermometer") {
      const record = mapThermometerToDb(body.item);
      let res;
      if (record.id) {
        res = await supabase
          .from("ofertas_thermometer")
          .update(record)
          .eq("id", record.id)
          .select()
          .single();
      } else {
        res = await supabase
          .from("ofertas_thermometer")
          .insert(record)
          .select()
          .single();
      }

      if (res.error) {
        return NextResponse.json({ success: false, error: res.error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: mapDbToThermometer(res.data) });
    }

    // 3. SALVAR / ATUALIZAR ESTABELECIMENTO DE VAREJO
    const retailerData = body.retailer || body;
    if (!retailerData.name) {
      return NextResponse.json(
        { success: false, error: "Nome do estabelecimento é obrigatório." },
        { status: 400 }
      );
    }

    const dbRecord = mapRetailerToDb(retailerData);
    let res;
    if (dbRecord.id) {
      res = await supabase
        .from("ofertas_retailers")
        .update(dbRecord)
        .eq("id", dbRecord.id)
        .select()
        .single();
    } else {
      res = await supabase
        .from("ofertas_retailers")
        .insert(dbRecord)
        .select()
        .single();
    }

    if (res.error) {
      return NextResponse.json(
        {
          success: false,
          error: res.error.message,
          hint: "Execute supabase/ofertas_schema.sql se a tabela não tiver sido criada.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: mapDbToRetailer(res.data) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { id, is_vip, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID é obrigatório." }, { status: 400 });
    }

    const payload: any = {};
    if (typeof is_vip === "boolean") payload.is_vip = is_vip;
    if (typeof is_active === "boolean") payload.is_active = is_active;

    const { data, error } = await supabase
      .from("ofertas_retailers")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mapDbToRetailer(data) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "retailer";

    if (!id) {
      return NextResponse.json({ success: false, error: "ID é obrigatório." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const table = type === "thermometer" ? "ofertas_thermometer" : "ofertas_retailers";

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Item excluído com sucesso." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
