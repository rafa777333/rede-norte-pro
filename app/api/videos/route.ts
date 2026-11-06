import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  MOCK_PORTAL_VIDEOS,
  normalizePortalVideo,
  extractYouTubeId,
  getYouTubeThumbnail,
  ChannelSource,
  VideoCategory,
} from "@/lib/tv-videos-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");
    const category = searchParams.get("category");
    const featuredOnly = searchParams.get("featured") === "true";

    const supa = getSupabase();
    let dbVideos: any[] = [];

    if (supa) {
      try {
        let query = supa
          .from("portal_videos")
          .select("*")
          .eq("status", "publicado")
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false });

        if (channel && (channel === "TV Apucarana" || channel === "RedeCast")) {
          query = query.eq("channel_source", channel);
        }

        if (category) {
          query = query.eq("category", category);
        }

        if (featuredOnly) {
          query = query.eq("is_featured", true);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          dbVideos = data.map(normalizePortalVideo);
        }
      } catch (errDb) {
        console.warn("[API Videos DB Warning]:", errDb);
      }
    }

    // Se houver vídeos no banco, retorna-os combinados com mocks ou apenas os do banco
    if (dbVideos.length > 0) {
      return NextResponse.json({
        success: true,
        videos: dbVideos,
        is_mock: false,
      });
    }

    // Fallback: filtra a lista MOCK em memória
    let filteredMocks = [...MOCK_PORTAL_VIDEOS];
    if (channel && (channel === "TV Apucarana" || channel === "RedeCast")) {
      filteredMocks = filteredMocks.filter((v) => v.channel_source === channel);
    }
    if (category) {
      filteredMocks = filteredMocks.filter((v) => v.category === category);
    }
    if (featuredOnly) {
      filteredMocks = filteredMocks.filter((v) => v.is_featured);
    }

    return NextResponse.json({
      success: true,
      videos: filteredMocks,
      is_mock: true,
    });
  } catch (error: any) {
    console.error("[API Videos GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao listar vídeos." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      youtube_url,
      channel_source = "TV Apucarana",
      category = "Reportagens TV",
      duration = "10:00",
      is_featured = false,
      status = "publicado",
      thumbnail_url,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "O título do vídeo é obrigatório." },
        { status: 400 }
      );
    }

    if (!youtube_url || !youtube_url.trim()) {
      return NextResponse.json(
        { success: false, error: "A URL do YouTube é obrigatória." },
        { status: 400 }
      );
    }

    const youtube_id = extractYouTubeId(youtube_url);
    if (!youtube_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Não foi possível extrair o ID do YouTube desta URL. Verifique o link e tente novamente.",
        },
        { status: 400 }
      );
    }

    const finalThumbnail = getYouTubeThumbnail(youtube_id, thumbnail_url);
    const supa = getSupabase();

    const record = {
      title: title.trim(),
      youtube_url: youtube_url.trim(),
      youtube_id,
      channel_source: (channel_source === "RedeCast" ? "RedeCast" : "TV Apucarana") as ChannelSource,
      category: category as VideoCategory,
      duration: duration?.trim() || "10:00",
      is_featured: Boolean(is_featured),
      status: status || "publicado",
      thumbnail_url: finalThumbnail,
      views_count: "Recente",
    };

    if (supa) {
      const { data, error } = await supa
        .from("portal_videos")
        .insert(record)
        .select()
        .single();

      if (error) {
        console.warn("[Insert portal_videos Supabase error]:", error);
        // Fallback: tentar também inserir em videos_portal caso exista
        try {
          await supa.from("videos_portal").insert({
            titulo: record.title,
            url_video: record.youtube_url,
            plataforma: "youtube",
            thumbnail_url: finalThumbnail,
            status: record.status,
          });
        } catch {}
      }

      return NextResponse.json({
        success: true,
        video: data ? normalizePortalVideo(data) : normalizePortalVideo(record),
      });
    }

    return NextResponse.json({
      success: true,
      video: normalizePortalVideo(record),
      note: "Banco Supabase não conectado; gravado em modo offline.",
    });
  } catch (error: any) {
    console.error("[API Videos POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao salvar vídeo." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID do vídeo é obrigatório para exclusão." },
        { status: 400 }
      );
    }

    const supa = getSupabase();
    if (supa) {
      await supa.from("portal_videos").delete().eq("id", id);
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao deletar vídeo." },
      { status: 500 }
    );
  }
}
