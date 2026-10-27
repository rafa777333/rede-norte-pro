import { ImageResponse } from "next/og";
import { getSupabase } from "../../../lib/supabase";

export const runtime = "edge";
export const alt = "Vídeo Rede Apucarana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: { id: string } }) {
  const supabase = getSupabase();
  const { data } = supabase
    ? await supabase
        .from("videos")
        .select("titulo,categoria,cidade_slug")
        .eq("id", params.id)
        .eq("status", "published")
        .maybeSingle()
    : { data: null };
  const titulo = data?.titulo || "Vídeos da Rede Apucarana";
  const categoria = data?.categoria || "CORTES DA REDE APUCARANA";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "62px 72px",
          color: "white",
          background: "linear-gradient(135deg, #101114 0%, #172536 62%, #1e40af 100%)",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 3,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 62,
              height: 62,
              borderRadius: 8,
              background: "#1e40af",
              letterSpacing: -1,
            }}
          >
            RA
          </div>
          <span>REDE APUCARANA</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ color: "#93c5fd", fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>
            {categoria.toUpperCase()}
          </div>
          <div
            style={{
              maxWidth: 1020,
              fontSize: titulo.length > 70 ? 48 : 60,
              lineHeight: 1.06,
              fontWeight: 800,
            }}
          >
            {titulo}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#d0d8df" }}>
          Assista e compartilhe pela Rede Apucarana
        </div>
      </div>
    ),
    { ...size }
  );
}
