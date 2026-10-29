import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Dados base de segurança para 2026 caso a API oficial esteja temporariamente indisponível
const BASELINES: Record<string, { Valor: number; Incremento: number; Midnight: string }> = {
  brasil: {
    Valor: 3359891687861.18,
    Incremento: 136990.08,
    Midnight: new Date().toISOString().split("T")[0] + "T00:00:00.0000000",
  },
  parana: {
    Valor: 187487042472.13,
    Incremento: 7644.25,
    Midnight: new Date().toISOString().split("T")[0] + "T00:00:00.0000000",
  },
  apucarana: {
    Valor: 85440600.04,
    Incremento: 3.48,
    Midnight: new Date().toISOString().split("T")[0] + "T00:00:00.0000000",
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = (searchParams.get("scope") || "brasil").toLowerCase();
  const estado = (searchParams.get("estado") || "pr").toLowerCase();
  const municipio = (searchParams.get("municipio") || "").toLowerCase();

  let targetUrl = "https://impostometro.com.br/Contador/Brasil";
  if (scope === "parana") {
    targetUrl = `https://impostometro.com.br/Contador/Estado?estado=pr&ano=2026`;
  } else if (scope === "municipio" && municipio) {
    targetUrl = `https://impostometro.com.br/Contador/Municipios?estado=${estado}&municipio=${encodeURIComponent(municipio)}&ano=2026`;
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      data: {
        Valor: Number(data.Valor) || 0,
        Incremento: Number(data.Incremento) || 0,
        Data: data.Data || new Date().toISOString(),
        Midnight: data.Midnight || new Date().toISOString().split("T")[0] + "T00:00:00.0000000",
      },
    });
  } catch (err: any) {
    const fallbackKey = scope === "municipio" ? municipio : scope;
    const fallback = BASELINES[fallbackKey] || BASELINES.apucarana;
    return NextResponse.json({
      success: true,
      fallback: true,
      data: fallback,
    });
  }
}
