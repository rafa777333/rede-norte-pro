import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import {
  MOCK_CLASSIFICADOS,
  normalizeClassifiedAd,
  ClassifiedAdItem,
} from "@/lib/classificados-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mrbgxfpxubjodgmcrtuq.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase não configurado.");
  }
  return createClient(url, key);
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET: Retorna anúncios reais do Supabase complementados pelos mock ads
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cidade = searchParams.get("cidade") || "";
    const categoria = searchParams.get("categoria") || "";
    const busca = searchParams.get("busca") || "";
    const statusParam = searchParams.get("status") || "published";
    const incluirTodos = searchParams.get("all") === "true";

    let realAds: ClassifiedAdItem[] = [];

    try {
      const supa = getSupabaseAdmin();
      let query = supa
        .from("classified_ads")
        .select("*")
        .order("created_at", { ascending: false });

      if (!incluirTodos && statusParam !== "all") {
        query = query.eq("status", statusParam);
      }

      const { data, error } = await query;
      if (!error && data) {
        realAds = data.map(normalizeClassifiedAd);
      }
    } catch (e: any) {
      console.warn("[API Classificados GET] Falha ao consultar Supabase:", e.message);
    }

    // Se estamos buscando apenas pendentes para o /admin, retornamos somente os reais do banco
    if (statusParam === "pending") {
      return NextResponse.json({
        success: true,
        ads: realAds.filter((a) => a.status === "pending"),
        total: realAds.filter((a) => a.status === "pending").length,
      });
    }

    // Na vitrine pública: une os anúncios reais publicados + anúncios demonstrativos hiper-realistas
    const publishedReal = realAds.filter((a) => a.status === "published");

    // Filtra mocks para não duplicar IDs
    const realIds = new Set(publishedReal.map((a) => a.id));
    const mocks = MOCK_CLASSIFICADOS.filter((m) => !realIds.has(m.id));

    // Combina: reais primeiro, depois mocks
    let combined = [...publishedReal, ...mocks];

    // Filtros de Cidade
    if (cidade && cidade.toLowerCase() !== "todas" && cidade.toLowerCase() !== "geral") {
      const cSlug = slugify(cidade);
      combined = combined.filter(
        (a) =>
          a.cidade_slug === cSlug ||
          a.cidade.toLowerCase().includes(cidade.toLowerCase())
      );
    }

    // Filtros de Categoria
    if (categoria && categoria.toLowerCase() !== "todas" && categoria.toLowerCase() !== "tudo") {
      if (categoria.toLowerCase() === "troca") {
        combined = combined.filter((a) => a.aceita_troca === true);
      } else {
        combined = combined.filter((a) =>
          a.categoria.toLowerCase().includes(categoria.toLowerCase())
        );
      }
    }

    // Filtro de Busca por palavra-chave
    if (busca) {
      const term = busca.toLowerCase().trim();
      combined = combined.filter(
        (a) =>
          a.titulo.toLowerCase().includes(term) ||
          a.descricao.toLowerCase().includes(term) ||
          a.cidade.toLowerCase().includes(term) ||
          a.categoria.toLowerCase().includes(term)
      );
    }

    return NextResponse.json({
      success: true,
      ads: combined,
      total: combined.length,
      realCount: publishedReal.length,
      mockCount: mocks.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro desconhecido" },
      { status: 500 }
    );
  }
}

// POST: Cria um anúncio com upload de até 3 fotos
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      titulo,
      categoria,
      cidade,
      preco,
      descricao,
      contato,
      nome_anunciante,
      aceita_troca,
      urgente,
      fotos = [],
      images = [],
      status = "pending",
    } = body;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json(
        { success: false, error: "Título do anúncio é obrigatório." },
        { status: 400 }
      );
    }
    if (!contato || !contato.trim()) {
      return NextResponse.json(
        { success: false, error: "Número de WhatsApp para contato é obrigatório." },
        { status: 400 }
      );
    }
    if (!descricao || !descricao.trim()) {
      return NextResponse.json(
        { success: false, error: "Descrição detalhada é obrigatória." },
        { status: 400 }
      );
    }

    const supa = getSupabaseAdmin();
    const uploadedUrls: string[] = [];

    // Processa até 10 fotos (comprime no cliente e armazena no bucket)
    const rawInput =
      Array.isArray(fotos) && fotos.length > 0
        ? fotos
        : Array.isArray(images)
        ? images
        : [];
    const rawFotos = rawInput.slice(0, 10);

    for (let i = 0; i < rawFotos.length; i++) {
      const foto = rawFotos[i];
      if (!foto || typeof foto !== "string") continue;

      if (foto.startsWith("data:image/")) {
        try {
          // Extrai os bytes da imagem em base64
          const matches = foto.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, "base64");
            const ext = mimeType.includes("webp")
              ? "webp"
              : mimeType.includes("png")
              ? "png"
              : "jpg";

            const fileName = `classifieds/${crypto.randomUUID()}.${ext}`;

            const { data: uploadData, error: uploadErr } = await supa.storage
              .from("rede-norte-media")
              .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: false,
              });

            if (!uploadErr && uploadData?.path) {
              const { data: pubData } = supa.storage
                .from("rede-norte-media")
                .getPublicUrl(uploadData.path);

              if (pubData?.publicUrl) {
                uploadedUrls.push(pubData.publicUrl);
                continue;
              }
            }
          }
        } catch (uploadException) {
          console.warn("[Upload Foto Exception]:", uploadException);
        }
      }

      // Se for URL HTTP ou fallback
      if (foto.startsWith("http://") || foto.startsWith("https://")) {
        uploadedUrls.push(foto);
      }
    }

    // Se nenhuma foto foi enviada ou upload falhou, usa imagem padrão
    const finalFotos =
      uploadedUrls.length > 0
        ? uploadedUrls
        : ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80"];

    // Formata a descrição com tags de engajamento para compatibilidade total
    let finalDescricao = descricao.trim();
    if (aceita_troca && !finalDescricao.includes("[TROCA]")) {
      finalDescricao = `[TROCA] ${finalDescricao}`;
    }
    if (urgente && !finalDescricao.includes("[URGENTE]")) {
      finalDescricao = `[URGENTE] ${finalDescricao}`;
    }

    const cidadeNome = cidade || "Apucarana";
    const cidadeSlug = slugify(cidadeNome);

    // Salva a imagem como JSON array se tiver múltiplas ou URL única
    const imagemValue =
      finalFotos.length === 1 ? finalFotos[0] : JSON.stringify(finalFotos);

    const recordToInsert = {
      titulo: titulo.trim(),
      slug: `${slugify(titulo)}-${Date.now().toString(36)}`,
      cidade_slug: cidadeSlug,
      categoria: categoria || "Outros",
      preco: preco ? preco.trim() : "A Combinar",
      descricao: finalDescricao,
      imagem: imagemValue,
      contato: contato.trim().replace(/\D/g, ""),
      status: status || "pending",
    };

    const { data: inserted, error: insertError } = await supa
      .from("classified_ads")
      .insert(recordToInsert)
      .select()
      .single();

    if (insertError) {
      console.error("[Classificados Insert Error]:", insertError);
      return NextResponse.json(
        { success: false, error: `Erro ao cadastrar: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ad: inserted,
      message:
        status === "published"
          ? "Anúncio publicado com sucesso!"
          : "Anúncio enviado com sucesso! Ele será revisado pela nossa equipe antes de ir ao ar.",
    });
  } catch (err: any) {
    console.error("[Classificados POST Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro no processamento" },
      { status: 500 }
    );
  }
}

// PATCH: Atualiza status (ex: aprovar anúncio no /admin) ou editar
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, titulo, preco, categoria, cidade, descricao, contato, fotos } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID do anúncio é obrigatório." },
        { status: 400 }
      );
    }

    const supa = getSupabaseAdmin();
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (titulo) updateData.titulo = titulo.trim();
    if (preco) updateData.preco = preco.trim();
    if (categoria) updateData.categoria = categoria;
    if (cidade) updateData.cidade_slug = slugify(cidade);
    if (descricao) updateData.descricao = descricao.trim();
    if (contato) updateData.contato = contato.trim().replace(/\D/g, "");

    if (fotos && Array.isArray(fotos) && fotos.length > 0) {
      updateData.imagem = fotos.length === 1 ? fotos[0] : JSON.stringify(fotos);
    }

    const { data: updated, error } = await supa
      .from("classified_ads")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ad: updated,
      message: "Anúncio atualizado com sucesso!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao atualizar" },
      { status: 500 }
    );
  }
}

// DELETE: Exclui anúncio
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID é obrigatório para exclusão." },
        { status: 400 }
      );
    }

    const supa = getSupabaseAdmin();
    const { error } = await supa.from("classified_ads").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Anúncio excluído com sucesso.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao excluir" },
      { status: 500 }
    );
  }
}
