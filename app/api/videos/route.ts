import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabase } from "@/lib/supabase";
import {
  MOCK_PORTAL_VIDEOS,
  normalizePortalVideo,
  extractYouTubeId,
  getYouTubeThumbnail,
  ChannelSource,
  VideoCategory,
  PortalVideoItem,
} from "@/lib/tv-videos-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getClient() {
  try {
    return getSupabaseAdmin();
  } catch {
    return getSupabase();
  }
}

// GET: Lista todos os vídeos mesclando banco real (videos_portal) no topo + amostras opcionais
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");
    const category = searchParams.get("category");
    const format = searchParams.get("format");
    const featuredOnly = searchParams.get("featured") === "true";
    const homeOnly = searchParams.get("home") === "true";
    const allStatus = searchParams.get("all_status") === "true";

    const supa = getClient();
    let realRows: any[] = [];
    let mostrarAmostras = true;
    let videosMeta: Record<string, any> = {};

    if (supa) {
      try {
        // 1. Busca vídeos reais da tabela videos_portal
        let query = supa
          .from("videos_portal")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(60);

        if (!allStatus) {
          query = query.eq("status", "publicado");
        }

        const { data: dbData, error: dbError } = await query;
        if (!dbError && Array.isArray(dbData)) {
          realRows = dbData;
        }

        // 2. Busca configurações de exibição em site_settings
        const { data: settingsData } = await supa
          .from("site_settings")
          .select("key, value")
          .in("key", ["mostrar_videos_amostra", "videos_portal_meta"]);

        if (Array.isArray(settingsData)) {
          for (const s of settingsData) {
            if (s.key === "mostrar_videos_amostra") {
              mostrarAmostras = s.value !== "false";
            }
            if (s.key === "videos_portal_meta" && s.value) {
              try {
                videosMeta = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
              } catch {}
            }
          }
        }
      } catch (errDb) {
        console.warn("[API Videos DB Warn]:", errDb);
      }
    }

    // Normaliza os vídeos reais cadastrados no banco aplicando seus metadados
    const realVideos: PortalVideoItem[] = realRows.map((row) => {
      const meta = videosMeta[row.id] || {};
      const merged = {
        ...row,
        video_format: meta.format || row.video_format,
        show_on_home: typeof meta.show_on_home === "boolean" ? meta.show_on_home : row.show_on_home,
        channel_source: meta.channel || row.channel_source,
        duration: meta.duration || row.duration,
        category: meta.category || row.category,
        is_featured: typeof meta.is_featured === "boolean" ? meta.is_featured : row.is_featured,
      };
      return normalizePortalVideo(merged);
    });

    // Se as amostras estiverem ativadas, complementa com os MOCK_PORTAL_VIDEOS (evitando URLs duplicadas)
    let finalVideos: PortalVideoItem[] = [...realVideos];

    if (mostrarAmostras) {
      const existingIds = new Set(
        realVideos.map((v) => v.youtube_id || v.id).filter(Boolean)
      );

      const complementMocks = MOCK_PORTAL_VIDEOS.filter(
        (m) => !existingIds.has(m.youtube_id) && !existingIds.has(m.id)
      ).map((m) => normalizePortalVideo({ ...m, is_mock: true }));

      finalVideos = [...realVideos, ...complementMocks];
    }

    // Filtros aplicados sobre a lista
    if (channel && (channel === "TV Apucarana" || channel === "RedeCast")) {
      finalVideos = finalVideos.filter((v) => v.channel_source === channel);
    }

    if (category) {
      finalVideos = finalVideos.filter((v) => v.category === category);
    }

    if (format === "9:16" || format === "16:9") {
      finalVideos = finalVideos.filter((v) => v.video_format === format);
    }

    if (featuredOnly) {
      finalVideos = finalVideos.filter((v) => v.is_featured);
    }

    if (homeOnly) {
      const homeMarked = finalVideos.filter((v) => v.show_on_home);
      // Se houver vídeos marcados para a Home, exibe-os; se ainda não houver nenhum marcado, exibe os 6 primeiros
      finalVideos = homeMarked.length > 0 ? homeMarked : finalVideos.slice(0, 8);
    }

    return NextResponse.json({
      success: true,
      videos: finalVideos,
      total_real: realVideos.length,
      mostrar_amostras: mostrarAmostras,
    });
  } catch (error: any) {
    console.error("[API Videos GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao listar vídeos." },
      { status: 500 }
    );
  }
}

// POST: Salva um novo vídeo no banco videos_portal e atualiza os metadados em site_settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      url,
      youtube_url,
      url_video,
      channel_source = "TV Apucarana",
      category = "Reportagens TV",
      duration = "10:00",
      video_format = "16:9",
      show_on_home = false,
      is_featured = false,
      status = "publicado",
      thumbnail_url,
    } = body;

    const finalTitle = (title || "").trim();
    const rawUrl = (url || youtube_url || url_video || "").trim();

    if (!finalTitle) {
      return NextResponse.json(
        { success: false, error: "O título do vídeo é obrigatório." },
        { status: 400 }
      );
    }

    if (!rawUrl) {
      return NextResponse.json(
        { success: false, error: "A URL do vídeo (YouTube, Shorts ou MP4) é obrigatória." },
        { status: 400 }
      );
    }

    // Auto-detecção de plataforma
    let plataforma = "youtube";
    let ytId = extractYouTubeId(rawUrl);

    if (
      rawUrl.toLowerCase().endsWith(".mp4") ||
      rawUrl.includes("/storage/v1/object/public/")
    ) {
      plataforma = "nativo";
      ytId = "";
    } else if (rawUrl.includes("instagram.com")) {
      plataforma = "instagram";
    } else if (rawUrl.includes("tiktok.com")) {
      plataforma = "tiktok";
    }

    // Auto-ajuste de formato se for shorts ou reel
    let finalFormat: "16:9" | "9:16" = video_format === "9:16" ? "9:16" : "16:9";
    if (rawUrl.includes("/shorts/") || rawUrl.includes("/reel/") || plataforma === "tiktok") {
      finalFormat = "9:16";
    }

    const finalThumbnail = getYouTubeThumbnail(ytId, thumbnail_url);
    const supa = getClient();

    if (!supa) {
      throw new Error("Cliente Supabase indisponível no servidor.");
    }

    // 1. Insere o registro na tabela oficial videos_portal
    const dbRecord = {
      titulo: finalTitle,
      url_video: rawUrl,
      plataforma,
      thumbnail_url: finalThumbnail,
      status: status || "publicado",
    };

    const { data: insertedData, error: insertError } = await supa
      .from("videos_portal")
      .insert(dbRecord)
      .select()
      .single();

    if (insertError) {
      console.error("[videos_portal insert error]:", insertError);
      throw new Error(`Falha ao salvar no banco: ${insertError.message}`);
    }

    const insertedId = insertedData.id;

    // 2. Persiste os metadados avançados (formato, canal, home, etc.) em site_settings
    try {
      const { data: currentMetaRow } = await supa
        .from("site_settings")
        .select("value")
        .eq("key", "videos_portal_meta")
        .maybeSingle();

      let currentMeta: Record<string, any> = {};
      if (currentMetaRow?.value) {
        try {
          currentMeta = typeof currentMetaRow.value === "string" ? JSON.parse(currentMetaRow.value) : currentMetaRow.value;
        } catch {}
      }

      currentMeta[insertedId] = {
        format: finalFormat,
        channel: channel_source === "RedeCast" ? "RedeCast" : "TV Apucarana",
        category,
        duration: duration || (finalFormat === "9:16" ? "0:59" : "1h 15m"),
        show_on_home: Boolean(show_on_home),
        is_featured: Boolean(is_featured),
        updated_at: new Date().toISOString(),
      };

      await supa
        .from("site_settings")
        .upsert(
          { key: "videos_portal_meta", value: JSON.stringify(currentMeta) },
          { onConflict: "key" }
        );
    } catch (metaErr) {
      console.warn("[videos_portal_meta warning]:", metaErr);
    }

    const normalized = normalizePortalVideo({
      ...insertedData,
      video_format: finalFormat,
      channel_source,
      category,
      duration,
      show_on_home: Boolean(show_on_home),
      is_featured: Boolean(is_featured),
    });

    return NextResponse.json({
      success: true,
      video: normalized,
      message: "Vídeo salvo com sucesso na central de streaming!",
    });
  } catch (error: any) {
    console.error("[API Videos POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao salvar vídeo." },
      { status: 500 }
    );
  }
}

// PATCH / PUT: Atualiza um vídeo existente ou altera configuração global (ex: alternar vídeos de demonstração)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const supa = getClient();
    if (!supa) throw new Error("Supabase indisponível.");

    // 1. Toggle global de vídeos de demonstração / amostras
    if (typeof body.mostrar_videos_amostra === "boolean") {
      await supa
        .from("site_settings")
        .upsert(
          { key: "mostrar_videos_amostra", value: String(body.mostrar_videos_amostra) },
          { onConflict: "key" }
        );

      return NextResponse.json({
        success: true,
        mostrar_videos_amostra: body.mostrar_videos_amostra,
        message: body.mostrar_videos_amostra
          ? "Vídeos de demonstração ATIVADOS no site público."
          : "Vídeos de demonstração OCULTOS (exibindo apenas vídeos reais).",
      });
    }

    // 2. Atualização de um vídeo existente
    const { id, title, url, video_format, channel_source, category, duration, show_on_home, is_featured, status } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "ID obrigatório para atualização." }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (title) updates.titulo = title.trim();
    if (url) {
      updates.url_video = url.trim();
      const ytId = extractYouTubeId(url);
      if (ytId) {
        updates.plataforma = "youtube";
        updates.thumbnail_url = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      } else if (url.includes(".mp4")) {
        updates.plataforma = "nativo";
      }
    }
    if (status) updates.status = status;

    if (Object.keys(updates).length > 0) {
      await supa.from("videos_portal").update(updates).eq("id", id);
    }

    // Atualiza metadados em site_settings
    if (video_format || channel_source || category || duration !== undefined || show_on_home !== undefined || is_featured !== undefined) {
      const { data: currentMetaRow } = await supa
        .from("site_settings")
        .select("value")
        .eq("key", "videos_portal_meta")
        .maybeSingle();

      let currentMeta: Record<string, any> = {};
      if (currentMetaRow?.value) {
        try {
          currentMeta = typeof currentMetaRow.value === "string" ? JSON.parse(currentMetaRow.value) : currentMetaRow.value;
        } catch {}
      }

      currentMeta[id] = {
        ...(currentMeta[id] || {}),
        ...(video_format ? { format: video_format } : {}),
        ...(channel_source ? { channel: channel_source } : {}),
        ...(category ? { category } : {}),
        ...(duration ? { duration } : {}),
        ...(show_on_home !== undefined ? { show_on_home: Boolean(show_on_home) } : {}),
        ...(is_featured !== undefined ? { is_featured: Boolean(is_featured) } : {}),
        updated_at: new Date().toISOString(),
      };

      await supa
        .from("site_settings")
        .upsert(
          { key: "videos_portal_meta", value: JSON.stringify(currentMeta) },
          { onConflict: "key" }
        );
    }

    return NextResponse.json({ success: true, message: "Vídeo atualizado com sucesso!" });
  } catch (error: any) {
    console.error("[API Videos PATCH Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Erro ao atualizar." }, { status: 500 });
  }
}

// DELETE: Remove o vídeo do banco e limpa seus metadados
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

    const supa = getClient();
    if (supa) {
      await supa.from("videos_portal").delete().eq("id", id);

      try {
        const { data: metaRow } = await supa
          .from("site_settings")
          .select("value")
          .eq("key", "videos_portal_meta")
          .maybeSingle();

        if (metaRow?.value) {
          const meta = typeof metaRow.value === "string" ? JSON.parse(metaRow.value) : metaRow.value;
          delete meta[id];
          await supa
            .from("site_settings")
            .upsert({ key: "videos_portal_meta", value: JSON.stringify(meta) }, { onConflict: "key" });
        }
      } catch {}
    }

    return NextResponse.json({ success: true, id, message: "Vídeo excluído com sucesso." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao deletar vídeo." },
      { status: 500 }
    );
  }
}
