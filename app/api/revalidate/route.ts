import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

const VALID_SECRET = process.env.REVALIDATE_SECRET || "redeapucarana2026";

function isAuthorized(request: NextRequest, bodySecret?: string): boolean {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const headerSecret =
    request.headers.get("x-revalidate-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const provided = querySecret || headerSecret || bodySecret;
  return Boolean(provided && provided === VALID_SECRET);
}

function performRevalidation(customPath?: string, slug?: string) {
  const pathsRevalidated: string[] = [];

  // 1. Revalidação da Home e do Layout Raiz (limpa cache de páginas filhas)
  revalidatePath("/", "layout");
  pathsRevalidated.push("/ (layout)");

  // 2. Revalidação da listagem principal de notícias
  revalidatePath("/noticias");
  pathsRevalidated.push("/noticias");

  // 3. Revalidação das editorias alimentadas por automações (n8n)
  try {
    revalidatePath("/esportes");
    pathsRevalidated.push("/esportes");
  } catch {}

  try {
    revalidatePath("/horoscopo");
    pathsRevalidated.push("/horoscopo");
  } catch {}

  // 4. Se uma matéria específica foi inserida com slug (ex: /noticia/slug)
  if (slug && typeof slug === "string") {
    const cleanSlug = encodeURIComponent(slug.trim());
    try {
      revalidatePath(`/noticia/${cleanSlug}`);
      revalidatePath(`/noticias/${cleanSlug}`);
      pathsRevalidated.push(`/noticia/${cleanSlug}`);
    } catch {}
  }

  // 5. Se um caminho específico foi solicitado (ex: /cidades/apucarana)
  if (customPath && typeof customPath === "string" && customPath.startsWith("/")) {
    try {
      revalidatePath(customPath);
      pathsRevalidated.push(customPath);
    } catch {}
  }

  // Revalidação por tags caso alguma consulta esteja tagueada
  try {
    revalidateTag("news");
    revalidateTag("portal");
  } catch {}

  return pathsRevalidated;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Acesso não autorizado. Informe o secret correto (ex: ?secret=redeapucarana2026)." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const customPath = searchParams.get("path") || undefined;
  const slug = searchParams.get("slug") || undefined;

  const revalidatedPaths = performRevalidation(customPath, slug);

  return NextResponse.json({
    revalidated: true,
    now: Date.now(),
    revalidatedPaths,
  });
}

export async function POST(request: NextRequest) {
  let bodySecret: string | undefined;
  let customPath: string | undefined;
  let slug: string | undefined;

  try {
    const body = await request.json();
    bodySecret = body?.secret;
    customPath = body?.path;
    slug = body?.slug;
  } catch {
    // Body pode não ser JSON ou vir vazio, continua
  }

  if (!isAuthorized(request, bodySecret)) {
    return NextResponse.json(
      { error: "Acesso não autorizado. Informe o secret correto (ex: secret=redeapucarana2026)." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  if (!customPath) customPath = searchParams.get("path") || undefined;
  if (!slug) slug = searchParams.get("slug") || undefined;

  const revalidatedPaths = performRevalidation(customPath, slug);

  return NextResponse.json({
    revalidated: true,
    now: Date.now(),
    revalidatedPaths,
  });
}
