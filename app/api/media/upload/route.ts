import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "noticias";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Nenhum arquivo foi enviado." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const rawName = file.name.replace(/\.[^/.]+$/, "");
    const cleanName = rawName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .toLowerCase()
      .slice(0, 45);

    const storagePath = `${folder}/${cleanName}-${Date.now().toString(36)}.${ext}`;
    const contentType =
      file.type || (ext === "mp4" ? "video/mp4" : ext === "png" ? "image/png" : "image/jpeg");

    const { data, error } = await supabaseAdmin.storage
      .from("media")
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error("[Upload] Erro ao salvar no bucket media:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("media")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
      fileType: file.type.startsWith("video/") || ext === "mp4" ? "video" : "image",
      name: file.name,
      size: file.size,
    });
  } catch (err: any) {
    console.error("[Upload] Erro interno:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Falha no upload do arquivo." },
      { status: 500 }
    );
  }
}
