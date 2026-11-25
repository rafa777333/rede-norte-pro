import { NextResponse } from "next/server";
import { indexUrlAndNotifySitemap, normalizeUrl } from "@/lib/google-indexing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Corpo da requisição inválido (JSON esperado)." },
        { status: 400 }
      );
    }

    const rawUrl = body?.url;
    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "O parâmetro 'url' é obrigatório no corpo da requisição." },
        { status: 400 }
      );
    }

    const type = body?.type === "URL_DELETED" ? "URL_DELETED" : "URL_UPDATED";
    let targetUrl: string;
    try {
      targetUrl = normalizeUrl(rawUrl);
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err?.message || "URL inválida." },
        { status: 400 }
      );
    }

    const result = await indexUrlAndNotifySitemap(targetUrl, type);

    const httpStatus = result.success ? 200 : 502;
    return NextResponse.json(result, { status: httpStatus });
  } catch (err: any) {
    console.error("[API Indexar Erro Inesperado]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Erro interno ao processar indexação.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get("url");

    if (!rawUrl) {
      return NextResponse.json({
        service: "Rede Apucarana - Google Indexing & Search Console Automation API",
        status: "online",
        usage: {
          endpoint: "/api/indexar",
          methods: ["POST", "GET"],
          examplePost: {
            method: "POST",
            body: {
              url: "https://www.redeapucarana.com.br/noticia/exemplo-de-materia",
              type: "URL_UPDATED",
            },
          },
          exampleGet: "/api/indexar?url=https://www.redeapucarana.com.br/noticia/exemplo-de-materia",
        },
      });
    }

    const targetUrl = normalizeUrl(rawUrl);
    const result = await indexUrlAndNotifySitemap(targetUrl, "URL_UPDATED");

    const httpStatus = result.success ? 200 : 502;
    return NextResponse.json(result, { status: httpStatus });
  } catch (err: any) {
    console.error("[API Indexar GET Erro]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Erro interno ao indexar via GET.",
      },
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
