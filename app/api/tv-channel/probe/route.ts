import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_M3U8 =
  "https://Stmv1.samcast.com.br/tvapucarana/tvapucarana/playlist.m3u8";

// Cache em memória do servidor para rastrear se o OBS está produzindo segmentos novos
// ou se o servidor SamCast está repetindo os mesmos fragmentos .ts em cache após o OBS desligar
interface ServerStreamTracker {
  lastSegment: string | null;
  lastSequence: number | null;
  lastChangedAt: number;
  firstSeenAt: number;
}

const trackerMap = new Map<string, ServerStreamTracker>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url") || DEFAULT_M3U8;
    const cacheKey = targetUrl.trim().toLowerCase();
    const now = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      // Servidor caiu ou retornou erro HTTP (404/500/etc.) -> OFFLINE
      trackerMap.delete(cacheKey);
      return NextResponse.json(
        {
          isLive: false,
          isFrozen: false,
          status: res.status,
          reason: `HTTP ${res.status}`,
          checkedAt: new Date().toISOString(),
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    let text = await res.text();

    // Se for Master Playlist (contém #EXT-X-STREAM-INF), busca a subplaylist (chunklist.m3u8)
    if (text.includes("#EXT-X-STREAM-INF")) {
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const subUri = lines.find((l) => !l.startsWith("#"));
      if (subUri) {
        try {
          const subUrl = new URL(subUri, targetUrl).toString();
          const subRes = await fetch(subUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0",
              Accept: "*/*",
            },
            cache: "no-store",
          });
          if (subRes.ok) {
            text = await subRes.text();
          }
        } catch {}
      }
    }

    const hasHeader = text.includes("#EXTM3U");
    const hasEndList = text.includes("#EXT-X-ENDLIST");
    const hasExtInf = text.includes("#EXTINF");

    // 1. Regra de corte rápido:
    // Se não tem cabeçalho EXTM3U, se tiver #EXT-X-ENDLIST (sinal encerrado) ou não contiver #EXTINF
    if (!hasHeader || hasEndList || !hasExtInf) {
      trackerMap.delete(cacheKey);
      return NextResponse.json(
        {
          isLive: false,
          isFrozen: false,
          hasEndList,
          hasExtInf,
          status: 200,
          reason: hasEndList ? "ENDLIST_DETECTED" : "NO_EXTINF_SEGMENTS",
          checkedAt: new Date().toISOString(),
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    // 2. Extração do Media-Sequence e dos arquivos .ts
    const seqMatch = text.match(/#EXT-X-MEDIA-SEQUENCE:\s*(\d+)/i);
    const mediaSequence = seqMatch ? parseInt(seqMatch[1], 10) : null;

    const segments = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && (l.includes(".ts") || l.includes(".m4s") || l.includes("chunk") || l.includes(".mp4")));

    const lastSegment = segments.length > 0 ? segments[segments.length - 1] : null;

    if (segments.length === 0 || !lastSegment) {
      trackerMap.delete(cacheKey);
      return NextResponse.json(
        {
          isLive: false,
          isFrozen: false,
          status: 200,
          reason: "NO_ACTIVE_CHUNKS",
          checkedAt: new Date().toISOString(),
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    // 3. Verificação de Sequência Viva e Detecção de Stream Congelado no Servidor
    let tracker = trackerMap.get(cacheKey);
    let hasNewSegment = false;

    if (!tracker) {
      tracker = {
        lastSegment,
        lastSequence: mediaSequence,
        lastChangedAt: now,
        firstSeenAt: now,
      };
      trackerMap.set(cacheKey, tracker);
    } else {
      const segmentChanged = tracker.lastSegment !== lastSegment;
      const sequenceIncremented =
        mediaSequence !== null &&
        tracker.lastSequence !== null &&
        mediaSequence > tracker.lastSequence;

      hasNewSegment = segmentChanged || sequenceIncremented;

      if (hasNewSegment) {
        tracker.lastSegment = lastSegment;
        tracker.lastSequence = mediaSequence;
        tracker.lastChangedAt = now;
      }
    }

    const timeUnchangedMs = now - tracker.lastChangedAt;
    // Se o segmento permanecer idêntico por 8 segundos ou mais, é cache fantasma do SamCast!
    const isFrozen = timeUnchangedMs >= 8_000;
    const isLive = !isFrozen;

    return NextResponse.json(
      {
        isLive,
        isFrozen,
        status: 200,
        mediaSequence,
        lastSegment,
        segmentsCount: segments.length,
        hasNewSegment,
        timeUnchangedMs,
        reason: isFrozen ? "STREAM_FROZEN_UNCHANGED" : "LIVE_STREAM_ACTIVE",
        checkedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        isLive: false,
        isFrozen: false,
        status: 500,
        error: error.message || "Falha na sondagem do stream M3U8",
        checkedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
}
