import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { decodeHtmlEntities } from "@/lib/text-utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawTitle = searchParams.get("title") || searchParams.get("headline") || "Notícia | Rede Apucarana";
    const rawCategory = searchParams.get("category") || "NOTÍCIA";
    const imageUrl = searchParams.get("image_url") || searchParams.get("imageUrl") || "";

    const title = decodeHtmlEntities(rawTitle).trim();
    const category = decodeHtmlEntities(rawCategory).trim().toUpperCase();

    // Tenta carregar a imagem remota como base64 no edge
    let bgBase64 = "";
    if (imageUrl && imageUrl.startsWith("http")) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const imgRes = await fetch(imageUrl, {
          signal: controller.signal,
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        clearTimeout(timeoutId);

        if (imgRes.ok) {
          const arr = await imgRes.arrayBuffer();
          const mime = imgRes.headers.get("content-type") || "image/jpeg";
          const base64 = btoa(
            new Uint8Array(arr).reduce((data, byte) => data + String.fromCharCode(byte), "")
          );
          bgBase64 = `data:${mime};base64,${base64}`;
        }
      } catch {
        // Fallback para URL direta ou cor sólida
      }
    }

    const titleFontSize = title.length > 95 ? 38 : title.length > 65 ? 44 : 50;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "0 64px 44px 64px",
            backgroundColor: "#07162c",
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          {/* FOTO DE FUNDO ORIGINAL */}
          {(bgBase64 || imageUrl) && (
            <img
              src={bgBase64 || imageUrl}
              alt={title}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "1200px",
                height: "630px",
                objectFit: "cover",
              }}
            />
          )}

          {/* DEGRADÊ PRETO INFERIOR DE ~50% */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1200px",
              height: "630px",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.88) 45%, rgba(0,0,0,0.40) 75%, rgba(0,0,0,0) 100%)",
            }}
          />

          {/* CONTEÚDO INFERIOR: TAG + MANCHETE + BADGE RA */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              width: "100%",
              position: "relative",
              zIndex: 10,
            }}
          >
            {/* COLUNA ESQUERDA: TAG + MANCHETE */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                maxWidth: "880px",
              }}
            >
              {/* TAG VERMELHA #FF0000 COM CATEGORIA EM CAIXA ALTA */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#FF0000",
                  borderRadius: "8px",
                  padding: "6px 18px",
                  alignSelf: "flex-start",
                }}
              >
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: "20px",
                    fontWeight: 800,
                    letterSpacing: "1.5px",
                  }}
                >
                  {category}
                </span>
              </div>

              {/* MANCHETE BRANCA EM DESTAQUE */}
              <div
                style={{
                  display: "flex",
                  color: "#FFFFFF",
                  fontSize: `${titleFontSize}px`,
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: "-0.5px",
                  textShadow: "0 2px 10px rgba(0, 0, 0, 0.8)",
                }}
              >
                {title}
              </div>
            </div>

            {/* COLUNA DIREITA: LOGO OFICIAL RA (CANTO INFERIOR DIREITO) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "140px",
                height: "115px",
                borderRadius: "14px",
                backgroundColor: "#041639",
                border: "2px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "0 6px 18px rgba(0, 0, 0, 0.4)",
                marginLeft: "24px",
                marginBottom: "6px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  color: "#FFFFFF",
                  fontSize: "56px",
                  fontWeight: 900,
                  letterSpacing: "-2px",
                  lineHeight: 1,
                }}
              >
                RA
              </div>
              <div
                style={{
                  display: "flex",
                  color: "#93c5fd",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "1.5px",
                  marginTop: "3px",
                }}
              >
                REDE APUCARANA
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error: any) {
    console.error("Erro ao gerar imagem OG Facebook 1200x630:", error);
    return new Response(`Erro ao gerar imagem: ${error?.message || "falha interna"}`, {
      status: 500,
    });
  }
}
