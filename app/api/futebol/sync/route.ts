import { NextResponse } from "next/server";
import { runFootballSync } from "@/lib/futebol-sync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const result = await runFootballSync();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
