import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabase } from "@/lib/supabase";
import {
  DEFAULT_TV_SETTINGS,
  INITIAL_TV_PLAYLIST,
  TvSettings,
  TvPlaylistItem,
} from "@/lib/tv-channel-data";
import { extractYouTubeId } from "@/lib/tv-videos-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getClient() {
  try {
    return getSupabaseAdmin();
  } catch {
    return getSupabase();
  }
}

// GET: Retorna as configurações gerais da TV (Modo OBS vs. YouTube) e a Grade Programada (Playlist)
export async function GET() {
  try {
    const supa = getClient();
    let settings: TvSettings = { ...DEFAULT_TV_SETTINGS };
    let playlist: TvPlaylistItem[] = [...INITIAL_TV_PLAYLIST];

    if (supa) {
      try {
        const { data, error } = await supa
          .from("site_settings")
          .select("key, value")
          .in("key", ["tv_channel_settings", "tv_channel_playlist"]);

        if (!error && Array.isArray(data)) {
          for (const item of data) {
            if (item.key === "tv_channel_settings" && item.value) {
              try {
                const parsed =
                  typeof item.value === "string" ? JSON.parse(item.value) : item.value;
                if (parsed && typeof parsed === "object") {
                  settings = {
                    ...DEFAULT_TV_SETTINGS,
                    ...parsed,
                  };
                }
              } catch (e) {
                console.warn("[API tv-channel] Erro ao parsear settings:", e);
              }
            }

            if (item.key === "tv_channel_playlist" && item.value) {
              try {
                const parsed =
                  typeof item.value === "string" ? JSON.parse(item.value) : item.value;
                if (Array.isArray(parsed) && parsed.length > 0) {
                  playlist = parsed.map((p, idx) => ({
                    ...p,
                    sort_order: typeof p.sort_order === "number" ? p.sort_order : idx + 1,
                    youtube_id: p.youtube_id || extractYouTubeId(p.youtube_url) || "",
                  }));
                }
              } catch (e) {
                console.warn("[API tv-channel] Erro ao parsear playlist:", e);
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn("[API tv-channel DB Warn]:", dbErr);
      }
    }

    // Ordena por sort_order
    playlist.sort((a, b) => a.sort_order - b.sort_order);

    const response = NextResponse.json({
      success: true,
      settings,
      playlist,
    });
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch (error: any) {
    console.error("[API tv-channel GET Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao carregar dados do canal",
        settings: DEFAULT_TV_SETTINGS,
        playlist: INITIAL_TV_PLAYLIST,
      },
      { status: 500 }
    );
  }
}

// POST: Salva ou atualiza configurações da TV e playlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, settings, playlist, item, itemId, newOrderIds } = body;

    const supa = getClient();
    if (!supa) {
      return NextResponse.json(
        { success: false, error: "Conexão com o banco de dados indisponível." },
        { status: 503 }
      );
    }

    // 1. Atualizar Configurações Gerais da TV (Chave do OBS, M3U8, Título Ao Vivo)
    if (action === "update_settings" || settings) {
      const mergedSettings: TvSettings = {
        ...DEFAULT_TV_SETTINGS,
        ...(settings || {}),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supa.from("site_settings").upsert(
        {
          key: "tv_channel_settings",
          value: JSON.stringify(mergedSettings),
        },
        { onConflict: "key" }
      );

      if (error) throw error;
    }

    // 2. Salvar toda a Playlist
    if (action === "save_playlist" || (action === "save_all" && Array.isArray(playlist))) {
      const sanitizedPlaylist = (playlist as TvPlaylistItem[]).map((p, idx) => ({
        ...p,
        sort_order: typeof p.sort_order === "number" ? p.sort_order : idx + 1,
        youtube_id: p.youtube_id || extractYouTubeId(p.youtube_url) || "",
      }));

      const { error } = await supa.from("site_settings").upsert(
        {
          key: "tv_channel_playlist",
          value: JSON.stringify(sanitizedPlaylist),
        },
        { onConflict: "key" }
      );

      if (error) throw error;
    }

    // 3. Reordenar Itens
    if (action === "reorder" && Array.isArray(newOrderIds)) {
      // Busca a playlist atual
      const { data } = await supa
        .from("site_settings")
        .select("value")
        .eq("key", "tv_channel_playlist")
        .single();

      let currentList: TvPlaylistItem[] = [...INITIAL_TV_PLAYLIST];
      if (data?.value) {
        try {
          currentList = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        } catch {}
      }

      const mapById = new Map(currentList.map((i) => [i.id, i]));
      const reordered: TvPlaylistItem[] = [];

      newOrderIds.forEach((id: string, index: number) => {
        const found = mapById.get(id);
        if (found) {
          reordered.push({
            ...found,
            sort_order: index + 1,
          });
          mapById.delete(id);
        }
      });

      // Itens remanescentes
      mapById.forEach((remaining) => {
        reordered.push({
          ...remaining,
          sort_order: reordered.length + 1,
        });
      });

      const { error } = await supa.from("site_settings").upsert(
        {
          key: "tv_channel_playlist",
          value: JSON.stringify(reordered),
        },
        { onConflict: "key" }
      );

      if (error) throw error;
    }

    // 4. Adicionar Novo Item à Playlist
    if (action === "add_item" && item) {
      const { data } = await supa
        .from("site_settings")
        .select("value")
        .eq("key", "tv_channel_playlist")
        .single();

      let currentList: TvPlaylistItem[] = [...INITIAL_TV_PLAYLIST];
      if (data?.value) {
        try {
          currentList = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        } catch {}
      }

      const ytId = item.youtube_id || extractYouTubeId(item.youtube_url) || "";
      const newItem: TvPlaylistItem = {
        id: `tv-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: item.title?.trim() || "Vídeo da Grade",
        youtube_url: item.youtube_url?.trim() || "",
        youtube_id: ytId,
        type: item.type || "podcast",
        duration_seconds: Number(item.duration_seconds) || 300,
        sort_order: currentList.length + 1,
        active: typeof item.active === "boolean" ? item.active : true,
        created_at: new Date().toISOString(),
      };

      currentList.push(newItem);

      const { error } = await supa.from("site_settings").upsert(
        {
          key: "tv_channel_playlist",
          value: JSON.stringify(currentList),
        },
        { onConflict: "key" }
      );

      if (error) throw error;
    }

    // 5. Excluir Item da Playlist
    if (action === "delete_item" && itemId) {
      const { data } = await supa
        .from("site_settings")
        .select("value")
        .eq("key", "tv_channel_playlist")
        .single();

      let currentList: TvPlaylistItem[] = [...INITIAL_TV_PLAYLIST];
      if (data?.value) {
        try {
          currentList = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        } catch {}
      }

      const filtered = currentList
        .filter((i) => i.id !== itemId)
        .map((item, idx) => ({ ...item, sort_order: idx + 1 }));

      const { error } = await supa.from("site_settings").upsert(
        {
          key: "tv_channel_playlist",
          value: JSON.stringify(filtered),
        },
        { onConflict: "key" }
      );

      if (error) throw error;
    }

    // 6. Atualizar Item Específico (ex: toggle active ou edição)
    if (action === "update_item" && item && item.id) {
      const { data } = await supa
        .from("site_settings")
        .select("value")
        .eq("key", "tv_channel_playlist")
        .single();

      let currentList: TvPlaylistItem[] = [...INITIAL_TV_PLAYLIST];
      if (data?.value) {
        try {
          currentList = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        } catch {}
      }

      const updated = currentList.map((i) =>
        i.id === item.id
          ? {
              ...i,
              ...item,
              youtube_id: item.youtube_id || extractYouTubeId(item.youtube_url) || i.youtube_id,
            }
          : i
      );

      const { error } = await supa.from("site_settings").upsert(
        {
          key: "tv_channel_playlist",
          value: JSON.stringify(updated),
        },
        { onConflict: "key" }
      );

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Configurações da TV atualizadas com sucesso!",
    });
  } catch (error: any) {
    console.error("[API tv-channel POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao salvar alterações da TV" },
      { status: 500 }
    );
  }
}
