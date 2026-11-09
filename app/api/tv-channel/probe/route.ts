import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_M3U8 =
  "https://Stmv1.samcast.com.br/tvapucarana/tvapucarana/playlist.m3u8";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url") || DEFAULT_M3U8;

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
      return NextResponse.json({
        isLive: false,
        status: res.status,
        reason: `HTTP ${res.status}`,
      });
    }

    const text = await res.text();

    // Valida se o manifesto HLS contém segmentos de vídeo ativos (#EXTINF e .ts/.m4s)
    const hasHeader = text.includes("#EXTM3U");
    const hasSegments =
      text.includes("#EXTINF") &&
      (text.includes(".ts") || text.includes(".m4s") || text.includes("chunk") || text.includes(".mp4"));

    const isLive = hasHeader && hasSegments;

    return NextResponse.json({
      isLive,
      status: 200,
      hasSegments,
      checkedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      isLive: false,
      status: 500,
      error: error.message || "Falha na sondagem do stream M3U8",
      checkedAt: new Date().toISOString(),
    });
  }
}
