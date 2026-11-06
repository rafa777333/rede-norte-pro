import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MOCK_AUTONOMOS, AutonomoItem } from "@/lib/autonomos-data";

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

// GET: Retorna Vagas e Prestadores Autônomos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cidade = searchParams.get("cidade") || "";
    const categoria = searchParams.get("categoria") || "";
    const busca = searchParams.get("busca") || "";

    const supa = getSupabaseAdmin();

    // 1. Buscar Vagas Reais
    let realJobs: any[] = [];
    try {
      const { data: jobsData } = await supa
        .from("jobs")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      realJobs = jobsData || [];
    } catch (e: any) {
      console.warn("[API Empregos] Erro ao buscar jobs:", e.message);
    }

    // 2. Buscar Autônomos Reais
    let realAutonomos: AutonomoItem[] = [];
    try {
      const { data: servData } = await supa
        .from("service_providers")
        .select("*")
        .order("created_at", { ascending: false });

      if (servData && servData.length > 0) {
        realAutonomos = servData.map((s: any) => {
          let prof = s.categoria || "Profissional Autônomo";
          let desc = s.descricao || "";
          if (desc.startsWith("[") && desc.includes("]")) {
            const match = desc.match(/^\[(.*?)\]\s*(.*)$/);
            if (match) {
              prof = match[1];
              desc = match[2];
            }
          }

          return {
            id: s.id,
            nome: s.nome,
            profissao: prof,
            categoria: s.categoria || "Construção & Reforma",
            cidade: s.cidade_slug
              ? s.cidade_slug.charAt(0).toUpperCase() + s.cidade_slug.slice(1).replace(/-/g, " ")
              : "Apucarana",
            cidade_slug: s.cidade_slug || "apucarana",
            descricao: desc,
            whatsapp: s.whatsapp || "",
            verificado: s.verificado ?? true,
            nota: s.nota || 5,
            created_at: s.created_at || new Date().toISOString(),
          };
        });
      }
    } catch (e: any) {
      console.warn("[API Empregos] Erro ao buscar service_providers:", e.message);
    }

    // Combina autônomos reais + mocks
    const realAutoIds = new Set(realAutonomos.map((a) => a.id));
    const mocksFiltered = MOCK_AUTONOMOS.filter((m) => !realAutoIds.has(m.id));
    let combinedAutonomos = [...realAutonomos, ...mocksFiltered];

    // Filtros de Cidade
    if (cidade && cidade.toLowerCase() !== "todas" && cidade.toLowerCase() !== "geral") {
      const cSlug = slugify(cidade);
      realJobs = realJobs.filter(
        (j) => j.cidade_slug === cSlug || (j.cidade && j.cidade.toLowerCase().includes(cidade.toLowerCase()))
      );
      combinedAutonomos = combinedAutonomos.filter(
        (a) => a.cidade_slug === cSlug || a.cidade.toLowerCase().includes(cidade.toLowerCase())
      );
    }

    // Filtros de Categoria em Autônomos
    if (categoria && categoria.toLowerCase() !== "todos" && categoria.toLowerCase() !== "todas") {
      combinedAutonomos = combinedAutonomos.filter(
        (a) => a.categoria.toLowerCase().includes(categoria.toLowerCase())
      );
    }

    // Filtros de Busca
    if (busca) {
      const termo = busca.toLowerCase().trim();
      realJobs = realJobs.filter(
        (j) =>
          (j.vaga && j.vaga.toLowerCase().includes(termo)) ||
          (j.empresa && j.empresa.toLowerCase().includes(termo)) ||
          (j.descricao && j.descricao.toLowerCase().includes(termo))
      );
      combinedAutonomos = combinedAutonomos.filter(
        (a) =>
          a.nome.toLowerCase().includes(termo) ||
          a.profissao.toLowerCase().includes(termo) ||
          a.descricao.toLowerCase().includes(termo)
      );
    }

    return NextResponse.json({
      success: true,
      vagas: realJobs,
      autonomos: combinedAutonomos,
      totalVagas: realJobs.length,
      totalAutonomos: combinedAutonomos.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao carregar vagas e autônomos" },
      { status: 500 }
    );
  }
}

// POST: Auto-publicação gratuita de Vagas ou Autônomos
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipo_anuncio } = body;

    const supa = getSupabaseAdmin();

    // 1. Cadastrar Vaga de Emprego
    if (tipo_anuncio === "vaga") {
      const { cargo, empresa, cidade, tipo, salario, descricao, contato } = body;

      if (!cargo || !cargo.trim()) {
        return NextResponse.json(
          { success: false, error: "Cargo ou título da vaga é obrigatório." },
          { status: 400 }
        );
      }
      if (!contato || !contato.trim()) {
        return NextResponse.json(
          { success: false, error: "Número de WhatsApp para envio de currículos é obrigatório." },
          { status: 400 }
        );
      }
      if (!descricao || !descricao.trim()) {
        return NextResponse.json(
          { success: false, error: "Descrição e requisitos da vaga são obrigatórios." },
          { status: 400 }
        );
      }

      let descFinal = descricao.trim();
      if (salario && salario.trim() && salario.trim().toLowerCase() !== "a combinar") {
        descFinal += `\n\nRemuneração: ${salario.trim()}`;
      }

      const cidadeNome = cidade || "Apucarana";
      const cSlug = slugify(cidadeNome);

      const { data, error } = await supa
        .from("jobs")
        .insert({
          vaga: cargo.trim(),
          empresa: (empresa || "Empresa Local").trim(),
          cidade_slug: cSlug,
          tipo: tipo || "CLT",
          contato: contato.trim(),
          descricao: descFinal,
          imagem: "https://www.redeapucarana.com.br/vagas-padrao.svg",
          status: "published",
        })
        .select();

      if (error) {
        console.error("[API Empregos POST Job Error]:", error);
        return NextResponse.json(
          { success: false, error: `Erro ao salvar vaga: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Vaga cadastrada e publicada com sucesso!",
        item: data?.[0],
      });
    }

    // 2. Cadastrar Prestador de Serviço / Autônomo
    if (tipo_anuncio === "autonomo") {
      const { nome, profissao, categoria, cidade, descricao, whatsapp } = body;

      if (!nome || !nome.trim()) {
        return NextResponse.json(
          { success: false, error: "Nome do profissional é obrigatório." },
          { status: 400 }
        );
      }
      if (!profissao || !profissao.trim()) {
        return NextResponse.json(
          { success: false, error: "Profissão ou especialidade é obrigatória." },
          { status: 400 }
        );
      }
      if (!whatsapp || !whatsapp.trim()) {
        return NextResponse.json(
          { success: false, error: "Número de WhatsApp para contato é obrigatório." },
          { status: 400 }
        );
      }
      if (!descricao || !descricao.trim()) {
        return NextResponse.json(
          { success: false, error: "Resumo dos serviços e experiência é obrigatório." },
          { status: 400 }
        );
      }

      const cSlug = slugify(cidade || "Apucarana");
      const fullDesc = `[${profissao.trim()}] ${descricao.trim()}`;

      const { data, error } = await supa
        .from("service_providers")
        .insert({
          nome: nome.trim(),
          categoria: categoria || "Construção & Reforma",
          cidade_slug: cSlug,
          whatsapp: whatsapp.replace(/\D/g, "").trim(),
          descricao: fullDesc,
          nota: 5,
          verificado: true,
        })
        .select();

      if (error) {
        console.error("[API Empregos POST Autonomo Error]:", error);
        return NextResponse.json(
          { success: false, error: `Erro ao salvar autônomo: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Profissional cadastrado e divulgado com sucesso!",
        item: data?.[0],
      });
    }

    return NextResponse.json(
      { success: false, error: "Tipo de anúncio inválido (escolha 'vaga' ou 'autonomo')." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao processar publicação." },
      { status: 500 }
    );
  }
}
