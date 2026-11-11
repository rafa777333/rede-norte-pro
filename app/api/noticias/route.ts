import { NextResponse } from "next/server";
import { getSupabase, cidadeSlug } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { refineNewsCategory, truncateWords } from "@/lib/text-utils";

export const dynamic = "force-dynamic";
export const revalidate = 60;

function generateSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

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
        "id,slug,titulo,categoria,resumo,conteudo,imagem,cidade_slug,autor,published_at,updated_at,video_url,title,seo_description,content"
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
      // Se novas colunas ainda não existirem, fallback para consulta clássica
      const fallbackQuery = supabase
        .from("news")
        .select(
          "id,slug,titulo,categoria,resumo,conteudo,imagem,cidade_slug,autor,published_at,updated_at"
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);

      const { data: fbNews, error: fbError } = await fallbackQuery;
      if (fbError) {
        return NextResponse.json(
          { success: false, error: fbError.message },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        portal: "Rede Apucarana de Comunicação",
        site: "https://www.redeapucarana.com.br",
        total: (fbNews || []).length,
        noticias: (fbNews || []).map(formatItem),
      });
    }

    const formatted = (news || []).map(formatItem);

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
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

function formatItem(item: any) {
  const finalTitle = item.title || item.titulo || "";
  const finalContent = item.content || item.conteudo || "";
  const finalDesc = item.seo_description || item.resumo || "";

  // Suporte a video extraído de fonte (ex: video:9:16:https://... ou video:https://...)
  let video_url = item.video_url || null;
  let video_format = item.video_format || "16:9";
  if (!video_url && item.fonte && item.fonte.startsWith("video:")) {
    const rawVideo = item.fonte.slice(6);
    if (rawVideo.startsWith("9:16:") || rawVideo.startsWith("16:9:")) {
      video_format = rawVideo.slice(0, 4);
      video_url = rawVideo.slice(5);
    } else {
      video_url = rawVideo;
    }
  }

  const cover_image = item.cover_image || item.imagem || "/logo-rede-apucarana.png";

  return {
    id: item.id,
    slug: item.slug || item.id,
    url: `https://www.redeapucarana.com.br/noticia/${encodeURIComponent(item.slug || item.id)}`,
    titulo: finalTitle,
    categoria: refineNewsCategory(item.categoria, finalTitle, finalContent || finalDesc),
    resumo: truncateWords(finalDesc || finalContent, 180),
    imagem: cover_image,
    cover_image: cover_image,
    video_url: video_url,
    video_format: video_format,
    cidade: item.cidade_slug || "apucarana",
    autor: item.autor || "Redação Rede Apucarana",
    data_publicacao: item.published_at || item.created_at,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = (body.title || body.titulo || "").trim();
    const rawSlug = (body.slug || "").trim();
    const seo_description = (body.seo_description || body.resumo || "").trim().slice(0, 160);
    const content = (body.content || body.conteudo || "").trim();
    const video_url = (body.video_url || "").trim();
    const rawCoverImage = (body.cover_image || body.imagem || body.image || "").trim();
    const video_format = (body.video_format || "16:9").trim();
    const categoria = (body.categoria || body.category || "Cidade").trim();
    const cidade = (body.cidade || body.city || "Apucarana").trim();
    const autor = (body.autor || body.author || "Redação Rede Apucarana").trim();

    if (!title) {
      return NextResponse.json(
        { success: false, error: "O título da matéria é obrigatório." },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { success: false, error: "O conteúdo da matéria é obrigatório." },
        { status: 400 }
      );
    }

    // Determina foto de capa de forma estrita:
    // Se o usuário não enviou foto de capa e é um vídeo horizontal de YouTube, extrai o thumb do YouTube.
    // Se for vídeo 9:16 sem capa ou sem imagem, NUNCA usa fotos aleatórias: usa /logo-rede-apucarana.png
    let finalCoverImage = rawCoverImage;
    if (!finalCoverImage && video_url && video_format !== "9:16") {
      const ytMatch = video_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i);
      if (ytMatch && ytMatch[1]) {
        finalCoverImage = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
      }
    }
    if (!finalCoverImage) {
      finalCoverImage = "/logo-rede-apucarana.png";
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Gerar e garantir unicidade do slug
    let baseSlug = generateSlug(rawSlug || title);
    if (!baseSlug) baseSlug = `materia-${Date.now().toString(36)}`;

    let finalSlug = baseSlug;
    const { data: existingSlug } = await supabaseAdmin
      .from("news")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();

    if (existingSlug) {
      finalSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    const nowIso = new Date().toISOString();
    const newId = crypto.randomUUID();

    // 1. Tentar inserção completa com suporte nativo às colunas novas e clássicas
    const payloadFull: Record<string, any> = {
      id: newId,
      title: title,
      titulo: title,
      slug: finalSlug,
      seo_description: seo_description,
      resumo: seo_description || content.slice(0, 160),
      content: content,
      conteudo: content,
      video_url: video_url || null,
      video_format: video_format,
      cover_image: finalCoverImage,
      imagem: finalCoverImage,
      categoria: categoria,
      cidade_slug: cidadeSlug(cidade),
      autor: autor,
      fonte: "Rede Apucarana",
      status: "published",
      published_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };

    let { data: inserted, error: insertError } = await supabaseAdmin
      .from("news")
      .insert(payloadFull)
      .select()
      .single();

    // 2. Se falhar por ausência das novas colunas antes da migração SQL ser executada
    if (insertError && (
      insertError.message.includes("title") ||
      insertError.message.includes("video_url") ||
      insertError.message.includes("video_format") ||
      insertError.message.includes("cover_image") ||
      insertError.message.includes("content") ||
      insertError.message.includes("seo_description")
    )) {
      console.warn("[Noticias POST] Fallback para colunas clássicas devido a:", insertError.message);

      const payloadFallback = {
        id: newId,
        titulo: title,
        slug: finalSlug,
        resumo: seo_description || content.slice(0, 160),
        conteudo: content,
        imagem: finalCoverImage,
        categoria: categoria,
        cidade_slug: cidadeSlug(cidade),
        autor: autor,
        fonte: video_url ? `video:${video_format}:${video_url}` : "Rede Apucarana",
        status: "published",
        published_at: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const fallbackResult = await supabaseAdmin
        .from("news")
        .insert(payloadFallback)
        .select()
        .single();

      if (fallbackResult.error) {
        console.error("[Noticias POST Fallback Erro]:", fallbackResult.error);
        return NextResponse.json(
          { success: false, error: fallbackResult.error.message },
          { status: 500 }
        );
      }

      inserted = fallbackResult.data;
    } else if (insertError) {
      console.error("[Noticias POST Erro]:", insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notícia publicada com sucesso!",
      newsId: inserted?.id || newId,
      slug: finalSlug,
      url: `/noticia/${finalSlug}`,
    });
  } catch (err: any) {
    console.error("[Noticias POST Exception]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erro interno ao publicar notícia." },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
