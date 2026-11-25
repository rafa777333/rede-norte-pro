import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getClient() {
  try {
    return getSupabaseAdmin();
  } catch {
    return getSupabase();
  }
}

// Extrai a base do túnel Cloudflare a partir da URL M3U8 salva no banco
async function getTunnelBaseUrl(): Promise<string | null> {
  try {
    const supa = getClient();
    if (!supa) return null;

    const { data } = await supa
      .from("site_settings")
      .select("value")
      .eq("key", "tv_channel_settings")
      .maybeSingle();

    if (data && data.value) {
      const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      const m3u8Url = parsed?.live_m3u8_url || "";
      if (m3u8Url) {
        const u = new URL(m3u8Url);
        return `${u.protocol}//${u.host}`;
      }
    }
  } catch (err) {
    console.warn("[API WHIP] Falha ao ler tunnel URL do Supabase:", err);
  }
  return null;
}

// GET: Informa o status do túnel e endpoints WHIP
export async function GET() {
  const tunnelBase = await getTunnelBaseUrl();
  const streamKey = "tvapucarana";
  const streamPath = `live/${streamKey}`;

  return NextResponse.json({
    active: !!tunnelBase,
    tunnelBase,
    streamPath,
    whipUrl: tunnelBase ? `${tunnelBase}/${streamPath}/whip` : null,
    checkedAt: new Date().toISOString(),
  });
}

// POST: Handshake WebRTC WHIP (Recebe SDP Offer do Locutor e repassa ao MediaMTX)
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let sdpOffer = "";

    if (contentType.includes("application/sdp") || contentType.includes("text/plain")) {
      sdpOffer = await request.text();
    } else {
      const body = await request.json().catch(() => ({}));
      sdpOffer = body.sdp || "";
    }

    if (!sdpOffer || !sdpOffer.includes("v=0")) {
      return NextResponse.json(
        { error: "Oferta SDP inválida recebida do navegador." },
        { status: 400 }
      );
    }

    // 1. Obtém a URL do túnel do estúdio
    const tunnelBase = await getTunnelBaseUrl();
    if (!tunnelBase) {
      return NextResponse.json(
        {
          error:
            "O Servidor do Estúdio (MediaMTX) está offline ou ainda não conectou o túnel.",
        },
        { status: 503 }
      );
    }

    const streamPath = "live/tvapucarana";
    const whipEndpoint = `${tunnelBase}/${streamPath}/whip`;

    // 2. Encaminha a oferta SDP para o endpoint WHIP do MediaMTX via túnel
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const whipRes = await fetch(whipEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/sdp",
        Accept: "application/sdp",
        "User-Agent": "RedeApucarana-EstudioMovel-WHIP/1.0",
      },
      body: sdpOffer,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!whipRes.ok && whipRes.status !== 201) {
      const errText = await whipRes.text().catch(() => "");
      console.error("[API WHIP] Erro retornado pelo MediaMTX:", whipRes.status, errText);
      return NextResponse.json(
        {
          error: `O MediaMTX recusou a publicação WHIP (HTTP ${whipRes.status}): ${errText || "Verifique se a porta WebRTC está liberada."}`,
        },
        { status: whipRes.status || 502 }
      );
    }

    const sdpAnswer = await whipRes.text();
    const locationHeader = whipRes.headers.get("location") || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/sdp",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    };
    if (locationHeader) {
      headers["Location"] = locationHeader;
    }

    return new NextResponse(sdpAnswer, {
      status: 201,
      headers,
    });
  } catch (error: any) {
    console.error("[API WHIP] Exceção no handshake:", error);
    const isTimeout = error.name === "AbortError";
    return NextResponse.json(
      {
        error: isTimeout
          ? "Tempo esgotado ao contatar o Servidor do Estúdio (timeout de 8s)."
          : error.message || "Falha interna no handshake WebRTC WHIP.",
      },
      { status: 500 }
    );
  }
}

// DELETE: Encerra sessão WHIP se fornecida Location
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const tunnelBase = await getTunnelBaseUrl();

    if (location && tunnelBase) {
      const target = location.startsWith("http") ? location : `${tunnelBase}${location}`;
      await fetch(target, { method: "DELETE" }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
