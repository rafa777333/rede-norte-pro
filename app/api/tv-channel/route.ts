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

// Normaliza e valida um item de playlist
function normalizePlaylistItem(p: any, idx: number): TvPlaylistItem {
  const videoUrl = p.video_url || p.youtube_url || "";
  const ytId = p.youtube_id || extractYouTubeId(videoUrl) || "";
  const day = typeof p.day_of_week === "number" && p.day_of_week >= 0 && p.day_of_week <= 6
    ? p.day_of_week
    : 1; // Default: Segunda-feira

  return {
    id: p.id || `tv-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: p.title?.trim() || "Vídeo da Grade",
    video_url: videoUrl,
    youtube_url: videoUrl,
    youtube_id: ytId,
    type: p.type || "podcast",
    duration_seconds: Math.max(0, Number(p.duration_seconds) || 300),
    sort_order: typeof p.sort_order === "number" ? p.sort_order : idx + 1,
    active: typeof p.active === "boolean" ? p.active : true,
    day_of_week: day,
    created_at: p.created_at || new Date().toISOString(),
  };
}

// GET: Retorna as configurações da TV e a Grade por Dia da Semana (0 a 6)
export async function GET(request: NextRequest) {
  try {
    const supa = getClient();
    let settings: TvSettings = { ...DEFAULT_TV_SETTINGS };
    let playlist: TvPlaylistItem[] = [...INITIAL_TV_PLAYLIST];

    const { searchParams } = new URL(request.url);
    const dayParam = searchParams.get("day");
    const filterDay = dayParam !== null ? parseInt(dayParam, 10) : null;

    if (supa) {
      // 1. Tenta buscar da tabela dedicada tv_schedule caso já exista
      try {
        const { data: scheduleData, error: schedError } = await supa
          .from("tv_schedule")
          .select("*")
          .order("day_of_week", { ascending: true })
          .order("sort_order", { ascending: true });

        if (!schedError && Array.isArray(scheduleData) && scheduleData.length > 0) {
          playlist = scheduleData.map(normalizePlaylistItem);
        } else {
          // 2. Se a tabela tv_schedule não existir ou estiver vazia, lê de site_settings
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
                    playlist = parsed.map(normalizePlaylistItem);
                  }
                } catch (e) {
                  console.warn("[API tv-channel] Erro ao parsear playlist:", e);
                }
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn("[API tv-channel DB Warn]:", dbErr);
      }
    }

    // Se solicitado filtro por dia específico, filtra a lista retornada
    const finalPlaylist =
      filterDay !== null && !isNaN(filterDay)
        ? playlist.filter((p) => p.day_of_week === filterDay)
        : playlist;

    // Ordena por dia da semana e sort_order
    finalPlaylist.sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.sort_order - b.sort_order;
    });

    const response = NextResponse.json({
      success: true,
      settings,
      playlist: finalPlaylist,
      currentDay: new Date().getDay(),
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

// POST: Salva ou atualiza configurações da TV e playlist (suporte a dias da semana 0 a 6)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, settings, playlist, item, itemId, newOrderIds, day_of_week, fromDay, toDay } = body;

    const supa = getClient();
    if (!supa) {
      return NextResponse.json(
        { success: false, error: "Conexão com o banco de dados indisponível." },
        { status: 503 }
      );
    }

    // Helper: Lê a playlist atual
    const getCurrentPlaylist = async (): Promise<TvPlaylistItem[]> => {
      const { data } = await supa
        .from("site_settings")
        .select("value")
        .eq("key", "tv_channel_playlist")
        .single();

      if (data?.value) {
        try {
          const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(normalizePlaylistItem);
          }
        } catch {}
      }
      return [...INITIAL_TV_PLAYLIST].map(normalizePlaylistItem);
    };

    // Helper: Salva a playlist no Supabase
    const savePlaylist = async (list: TvPlaylistItem[]) => {
      const sanitized = list.map(normalizePlaylistItem);

      // 1. Salva em site_settings (garantia de compatibilidade universal)
      const { error: settingsError } = await supa.from("site_settings").upsert(
        {
          key: "tv_channel_playlist",
          value: JSON.stringify(sanitized),
        },
        { onConflict: "key" }
      );
      if (settingsError) throw settingsError;

      // 2. Se a tabela tv_schedule existir, sincroniza também nela
      try {
        await supa.from("tv_schedule").upsert(
          sanitized.map((item) => ({
            id: item.id,
            title: item.title,
            video_url: item.video_url || item.youtube_url,
            youtube_id: item.youtube_id,
            type: item.type,
            duration_seconds: item.duration_seconds,
            day_of_week: item.day_of_week,
            sort_order: item.sort_order,
            active: item.active,
            updated_at: new Date().toISOString(),
          }))
        );
      } catch {
        // Tabela tv_schedule ainda não criada no banco - ignora silenciosamente
      }
    };

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
      await savePlaylist(playlist);
    }

    // 3. Reordenar Itens dentro de um dia específico
    if (action === "reorder" && Array.isArray(newOrderIds)) {
      const currentList = await getCurrentPlaylist();
      const mapById = new Map(currentList.map((i) => [i.id, i]));

      // Determina os itens que estão sendo reordenados
      const reorderedDayItems: TvPlaylistItem[] = [];
      newOrderIds.forEach((id: string, index: number) => {
        const found = mapById.get(id);
        if (found) {
          reorderedDayItems.push({
            ...found,
            sort_order: index + 1,
          });
          mapById.delete(id);
        }
      });

      // Itens dos outros dias permanecem inalterados
      const finalList: TvPlaylistItem[] = [...reorderedDayItems, ...Array.from(mapById.values())];
      await savePlaylist(finalList);
    }

    // 4. Adicionar Novo Item à Playlist em um Dia da Semana (0 a 6)
    if (action === "add_item" && item) {
      const currentList = await getCurrentPlaylist();
      const itemDay =
        typeof item.day_of_week === "number" && item.day_of_week >= 0 && item.day_of_week <= 6
          ? item.day_of_week
          : 1;

      // Encontra a maior sort_order daquele dia específico
      const dayItems = currentList.filter((i) => i.day_of_week === itemDay);
      const nextSortOrder = dayItems.length > 0 ? Math.max(...dayItems.map((i) => i.sort_order)) + 1 : 1;

      const videoUrl = item.video_url?.trim() || item.youtube_url?.trim() || "";
      const ytId = item.youtube_id || extractYouTubeId(videoUrl) || "";

      const newItem: TvPlaylistItem = {
        id: `tv-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: item.title?.trim() || "Vídeo da Grade",
        video_url: videoUrl,
        youtube_url: videoUrl,
        youtube_id: ytId,
        type: item.type || "podcast",
        duration_seconds: Math.max(0, Number(item.duration_seconds) || 300),
        sort_order: nextSortOrder,
        active: typeof item.active === "boolean" ? item.active : true,
        day_of_week: itemDay,
        created_at: new Date().toISOString(),
      };

      currentList.push(newItem);
      await savePlaylist(currentList);
    }

    // 5. Excluir Item da Playlist
    if (action === "delete_item" && itemId) {
      const currentList = await getCurrentPlaylist();
      const deletedItem = currentList.find((i) => i.id === itemId);
      const filtered = currentList.filter((i) => i.id !== itemId);

      // Re-indexa o sort_order do dia do item excluído
      if (deletedItem) {
        let count = 1;
        filtered.forEach((i) => {
          if (i.day_of_week === deletedItem.day_of_week) {
            i.sort_order = count++;
          }
        });
      }

      await savePlaylist(filtered);

      // Se a tabela tv_schedule existir, remove dela também
      try {
        await supa.from("tv_schedule").delete().eq("id", itemId);
      } catch {}
    }

    // 6. Atualizar Item Específico (edição de título, link, duração, dia, active)
    if (action === "update_item" && item && item.id) {
      const currentList = await getCurrentPlaylist();
      const videoUrl = item.video_url?.trim() || item.youtube_url?.trim() || "";
      const ytId = item.youtube_id || extractYouTubeId(videoUrl) || "";

      const updated = currentList.map((i) => {
        if (i.id === item.id) {
          const nextDay =
            typeof item.day_of_week === "number" && item.day_of_week >= 0 && item.day_of_week <= 6
              ? item.day_of_week
              : i.day_of_week;

          return {
            ...i,
            ...item,
            video_url: videoUrl || i.video_url,
            youtube_url: videoUrl || i.youtube_url,
            youtube_id: ytId || i.youtube_id,
            duration_seconds:
              typeof item.duration_seconds === "number" ? Math.max(0, item.duration_seconds) : i.duration_seconds,
            day_of_week: nextDay,
          };
        }
        return i;
      });

      await savePlaylist(updated);
    }

    // 6.1 Atualizar Duração Automática Detectada pelo Player (onDuration / onLoadedMetadata)
    if (action === "update_duration" && itemId && typeof body.duration_seconds === "number" && body.duration_seconds > 0) {
      const currentList = await getCurrentPlaylist();
      let changed = false;
      const targetSec = Math.round(body.duration_seconds);

      const updated = currentList.map((i) => {
        if (i.id === itemId) {
          // Só atualiza se ainda não tinha duração ou se diverge mais de 5 segundos
          if (!i.duration_seconds || Math.abs(i.duration_seconds - targetSec) > 5) {
            changed = true;
            return {
              ...i,
              duration_seconds: targetSec,
            };
          }
        }
        return i;
      });

      if (changed) {
        await savePlaylist(updated);
      }
    }

    // 7. Copiar Grade de um Dia para Outro (Utilitário para emissoras)
    if (action === "copy_day" && typeof fromDay === "number" && typeof toDay === "number") {
      const currentList = await getCurrentPlaylist();
      const sourceItems = currentList.filter((i) => i.day_of_week === fromDay && i.active);

      if (sourceItems.length === 0) {
        return NextResponse.json(
          { success: false, error: "O dia de origem não possui vídeos para copiar." },
          { status: 400 }
        );
      }

      // Remove os vídeos existentes do dia de destino se houver substituição, ou anexa
      const otherItems = currentList.filter((i) => i.day_of_week !== toDay);
      const clonedItems: TvPlaylistItem[] = sourceItems.map((item, idx) => ({
        ...item,
        id: `tv-item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        day_of_week: toDay,
        sort_order: idx + 1,
        created_at: new Date().toISOString(),
      }));

      const merged = [...otherItems, ...clonedItems];
      await savePlaylist(merged);
    }

    return NextResponse.json({
      success: true,
      message: "Grade da TV atualizada com sucesso!",
    });
  } catch (error: any) {
    console.error("[API tv-channel POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao salvar alterações da TV" },
      { status: 500 }
    );
  }
}
