import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { refineNewsCategory, truncateWords } from "@/lib/text-utils";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 30), 1), 100);
    const cidade = searchParams.get("cidade");
    const categoria = searchParams.get("categoria");

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    let query = supabase
      .from("news")
      .select(
        "id,slug,titulo,categoria,resumo,conteudo,imagem,cidade_slug,autor,published_at,updated_at"
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (cidade && cidade.toLowerCase() !== "geral") {
      query = query.eq("cidade_slug", cidade.toLowerCase());
    }

    if (categoria && categoria.toLowerCase() !== "todas") {
      query = query.ilike("categoria", categoria);
    }

    const { data: news, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const formatted = (news || []).map((item) => ({
      id: item.id,
      slug: item.slug || item.id,
      url: `https://www.redeapucarana.com.br/noticias/${encodeURIComponent(item.slug || item.id)}`,
      titulo: item.titulo,
      categoria: refineNewsCategory(item.categoria, item.titulo, item.conteudo || item.resumo),
      resumo: truncateWords(item.resumo || item.conteudo || "", 180),
      imagem: item.imagem || null,
      cidade: item.cidade_slug || "apucarana",
      autor: item.autor || "Redação Rede Apucarana",
      data_publicacao: item.published_at,
    }));

    return NextResponse.json(
      {
        success: true,
        portal: "Rede Apucarana de Comunicação",
        site: "https://www.redeapucarana.com.br",
        total: formatted.length,
        noticias: formatted,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
