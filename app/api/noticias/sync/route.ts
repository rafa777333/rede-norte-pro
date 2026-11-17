import { NextResponse } from "next/server";
import { runMunicipalNewsSync } from "@/lib/noticias-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Permite até 60s em funções serverless da Vercel

export async function GET() {
  try {
    const result = await runMunicipalNewsSync();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro na sincronização de notícias" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
