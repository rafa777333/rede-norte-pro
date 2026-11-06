export interface ClassifiedAdItem {
  id: string;
  titulo: string;
  slug?: string | null;
  cidade: string;
  cidade_slug: string;
  categoria: string;
  preco: string;
  descricao: string;
  imagem: string;
  fotos: string[];
  contato: string;
  nome_anunciante?: string;
  aceita_troca?: boolean;
  urgente?: boolean;
  status: "published" | "pending";
  created_at: string;
  is_mock?: boolean;
}

export const CLASSIFICADOS_CATEGORIAS = [
  { id: "todas", label: "🔥 Tudo", nome: "Todas" },
  { id: "veiculos", label: "🚗 Veículos & Motos", nome: "Veículos & Motos" },
  { id: "imoveis", label: "🏠 Imóveis & Aluguel", nome: "Imóveis & Aluguel" },
  { id: "eletronicos", label: "📱 Celulares & Eletrônicos", nome: "Celulares & Eletrônicos" },
  { id: "moveis", label: "🛋️ Móveis & Casa", nome: "Móveis & Casa" },
  { id: "agro", label: "🚜 Agro & Ferramentas", nome: "Agro & Ferramentas" },
  { id: "troca", label: "🤝 Aceita Troca / Rolo", nome: "Aceita Troca" },
];

export const CIDADES_VALE = [
  "Todas",
  "Apucarana",
  "Arapongas",
  "Arapuã",
  "Ariranha do Ivaí",
  "Bom Sucesso",
  "Borrazópolis",
  "Califórnia",
  "Cambira",
  "Cruzmaltina",
  "Faxinal",
  "Godoy Moreira",
  "Grandes Rios",
  "Ivaiporã",
  "Jandaia do Sul",
  "Jardim Alegre",
  "Kaloré",
  "Lidianópolis",
  "Lunardelli",
  "Marilândia do Sul",
  "Marumbi",
  "Mauá da Serra",
  "Novo Itacolomi",
  "Rio Bom",
  "Rio Branco do Ivaí",
  "Rosário do Ivaí",
  "São João do Ivaí",
  "São Pedro do Ivaí",
];

export function parseAdImages(imagem?: string | null): string[] {
  if (!imagem) return [];
  const trimmed = imagem.trim();
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) {
        return arr.filter((x) => typeof x === "string" && x.trim().length > 0);
      }
    } catch {}
  }
  if (trimmed.includes(",")) {
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [trimmed];
}

export function parseAdDetails(descricaoText?: string | null) {
  const desc = descricaoText || "";
  const aceita_troca =
    desc.includes("[TROCA]") ||
    desc.toLowerCase().includes("aceita troca") ||
    desc.toLowerCase().includes("aceito troca") ||
    desc.toLowerCase().includes("rolo");
  const urgente =
    desc.includes("[URGENTE]") ||
    desc.toLowerCase().includes("urgente") ||
    desc.toLowerCase().includes("preço negociável") ||
    desc.toLowerCase().includes("oportunidade");

  const cleanDescricao = desc
    .replace(/\[TROCA\]/gi, "")
    .replace(/\[URGENTE\]/gi, "")
    .trim();

  return { aceita_troca, urgente, cleanDescricao };
}

export function normalizeClassifiedAd(raw: any): ClassifiedAdItem {
  const rawImageInput = Array.isArray(raw.fotos)
    ? raw.fotos
    : Array.isArray(raw.images)
    ? raw.images
    : raw.imagem;
  const fotos = Array.isArray(rawImageInput)
    ? rawImageInput.filter((x: any) => typeof x === "string" && x.trim().length > 0)
    : parseAdImages(rawImageInput);
  const { aceita_troca, urgente, cleanDescricao } = parseAdDetails(raw.descricao);

  const citySlugToName: Record<string, string> = {
    apucarana: "Apucarana",
    arapongas: "Arapongas",
    arapua: "Arapuã",
    "ariranha-do-ivai": "Ariranha do Ivaí",
    "bom-sucesso": "Bom Sucesso",
    borrazopolis: "Borrazópolis",
    california: "Califórnia",
    cambira: "Cambira",
    cruzmaltina: "Cruzmaltina",
    faxinal: "Faxinal",
    "godoy-moreira": "Godoy Moreira",
    "grandes-rios": "Grandes Rios",
    ivaipora: "Ivaiporã",
    "jandaia-do-sul": "Jandaia do Sul",
    "jardim-alegre": "Jardim Alegre",
    kalore: "Kaloré",
    lidianopolis: "Lidianópolis",
    lunardelli: "Lunardelli",
    "marilandia-do-sul": "Marilândia do Sul",
    marumbi: "Marumbi",
    "maua-da-serra": "Mauá da Serra",
    "novo-itacolomi": "Novo Itacolomi",
    "rio-bom": "Rio Bom",
    "rio-branco-do-ivai": "Rio Branco do Ivaí",
    "rosario-do-ivai": "Rosário do Ivaí",
    "sao-joao-do-ivai": "São João do Ivaí",
    "sao-pedro-do-ivai": "São Pedro do Ivaí",
  };

  const cidade =
    raw.cidade ||
    (raw.cidade_slug ? citySlugToName[raw.cidade_slug] || raw.cidade_slug : "Apucarana");

  return {
    id: String(raw.id),
    titulo: raw.titulo || "Sem título",
    slug: raw.slug || null,
    cidade,
    cidade_slug: raw.cidade_slug || "apucarana",
    categoria: raw.categoria || "Outros",
    preco: raw.preco || "A Combinar",
    descricao: cleanDescricao || raw.descricao || "",
    imagem: fotos[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    fotos:
      fotos.length > 0
        ? fotos
        : ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80"],
    contato: raw.contato || "",
    nome_anunciante: raw.nome_anunciante || "Anunciante da Região",
    aceita_troca: raw.aceita_troca !== undefined ? Boolean(raw.aceita_troca) : aceita_troca,
    urgente: raw.urgente !== undefined ? Boolean(raw.urgente) : urgente,
    status: raw.status || "published",
    created_at: raw.created_at || new Date().toISOString(),
    is_mock: Boolean(raw.is_mock),
  };
}

export const MOCK_CLASSIFICADOS: ClassifiedAdItem[] = [
  {
    id: "mock-1",
    titulo: "Honda CG 160 Titan 2022 Azul Metálico - Único Dono Impecável",
    slug: "honda-cg-160-titan-2022-apucarana",
    cidade: "Apucarana",
    cidade_slug: "apucarana",
    categoria: "Veículos & Motos",
    preco: "R$ 15.800",
    descricao:
      "Moto com apenas 18.000 km rodados, revisões feitas na concessionária Honda. Pneus novos Michelin, partida elétrica, freio a disco CBS e alarme positron instalado. Documentação 2026 100% paga, recibo em branco pronto para transferir.",
    imagem: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=900&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=900&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=900&q=80",
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&q=80",
    ],
    contato: "43999887766",
    nome_anunciante: "Carlos Eduardo (Dudu)",
    aceita_troca: true,
    urgente: false,
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min atrás
    is_mock: true,
  },
  {
    id: "mock-2",
    titulo: "Casa 3 Quartos com Edícula, Garagem Coberta e Churrasqueira",
    slug: "casa-3-quartos-aluguel-arapongas",
    cidade: "Arapongas",
    cidade_slug: "arapongas",
    categoria: "Imóveis & Aluguel",
    preco: "R$ 1.650 / mês",
    descricao:
      "Excelente residência no Jardim Aeroporto em Arapongas. 3 quartos sendo 1 suíte, sala ampla dois ambientes com sanca de gesso, cozinha planejada, edícula nos fundos com churrasqueira, banheiro social e área de serviço coberta. Garagem para 2 carros.",
    imagem: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
    ],
    contato: "43991234567",
    nome_anunciante: "Mariana Imóveis",
    aceita_troca: false,
    urgente: true,
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2h atrás
    is_mock: true,
  },
  {
    id: "mock-3",
    titulo: "iPhone 13 128GB Estelar Impecável na Caixa - Saúde da Bateria 89%",
    slug: "iphone-13-128gb-estelar-jandaia",
    cidade: "Jandaia do Sul",
    cidade_slug: "jandaia-do-sul",
    categoria: "Celulares & Eletrônicos",
    preco: "R$ 2.450",
    descricao:
      "Aparelho sem nenhum detalhe, trinco ou risco. Sempre usado com película de vidro 3D e capa anti-impacto. Acompanha cabo original Apple, caixa com manual e nota fiscal. Face ID 100%, câmeras perfeitas. Aceito iPhone inferior + volta em dinheiro.",
    imagem: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=900&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=900&q=80",
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=900&q=80",
    ],
    contato: "43998765432",
    nome_anunciante: "Lucas Martins",
    aceita_troca: true,
    urgente: false,
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 200).toISOString(), // 3h atrás
    is_mock: true,
  },
  {
    id: "mock-4",
    titulo: "Sofá Retrátil e Reclinável 2,50m Tecido Veludo Marrom Café",
    slug: "sofa-retratil-reclinavel-apucarana",
    cidade: "Apucarana",
    cidade_slug: "apucarana",
    categoria: "Móveis & Casa",
    preco: "R$ 950",
    descricao:
      "Sofá com apenas 7 meses de uso em apartamento, tecido impermeabilizado, espuma D33 muito macia e molas ensacadas no assento. Abre até 1,80m de profundidade, ideal para sala de TV. Motivo da venda: mudança para casa mobiliada.",
    imagem: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=900&q=80",
    ],
    contato: "43996543210",
    nome_anunciante: "Fernanda Ribeiro",
    aceita_troca: false,
    urgente: true,
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    is_mock: true,
  },
  {
    id: "mock-5",
    titulo: "Volkswagen Gol 1.6 Trendline Flex 2018 Completo de Tudo",
    slug: "volkswagen-gol-16-trendline-2018-ivaipora",
    cidade: "Ivaiporã",
    cidade_slug: "ivaipora",
    categoria: "Veículos & Motos",
    preco: "R$ 44.900",
    descricao:
      "Carro muito conservado, motor 1.6 MSI forte e econômico. Ar-condicionado gelando muito, direção hidráulica, vidros e travas elétricas, som com bluetooth, sensor de ré e 4 pneus Pirelli seminovos. Manual e chave reserva inclusos.",
    imagem: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&q=80",
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=900&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80",
    ],
    contato: "43997654321",
    nome_anunciante: "Roberto Silva (Beto Veículos)",
    aceita_troca: true,
    urgente: false,
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    is_mock: true,
  },
  {
    id: "mock-6",
    titulo: "Trator Valmet 68 Especial com Guincho e Carreta Agrícola",
    slug: "trator-valmet-68-especial-faxinal",
    cidade: "Faxinal",
    cidade_slug: "faxinal",
    categoria: "Agro & Ferramentas",
    preco: "R$ 48.000",
    descricao:
      "Trator revisado recentemente: bicos e bomba injetora novos, sistema elétrico 100%, pneus traseiros com 80% de borracha. Tomada de força e hidráulico funcionando perfeitamente. Acompanha guincho traseiro e carreta de 2 eixos para cafezal ou milho.",
    imagem: "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=900&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=900&q=80",
      "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=900&q=80",
    ],
    contato: "43994321098",
    nome_anunciante: "Sítio São José (Sr. Valdir)",
    aceita_troca: true,
    urgente: false,
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 700).toISOString(),
    is_mock: true,
  },
  {
    id: "mock-7",
    titulo: "Terreno 360m² Plano no Jardim Interlagos Pronto para Construir",
    slug: "terreno-360m-jardim-interlagos-apucarana",
    cidade: "Apucarana",
    cidade_slug: "apucarana",
    categoria: "Imóveis & Aluguel",
    preco: "R$ 78.000",
    descricao:
      "Lote residencial 12x30 metros, totalmente plano, sem aterro, com asfalto novo na porta, água encanada, energia elétrica e esgoto. Bairro em alta valorização próximo à UTFPR de Apucarana. Escriturado e registrado, aceita financiamento pela Caixa.",
    imagem: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80",
      "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=900&q=80",
    ],
    contato: "43993210987",
    nome_anunciante: "Paulo Andrade",
    aceita_troca: false,
    urgente: true,
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 900).toISOString(),
    is_mock: true,
  },
  {
    id: "mock-8",
    titulo: "Smart TV Samsung 55 Polegadas 4K Crystal UHD com Controle Smart",
    slug: "smart-tv-samsung-55-4k-arapongas",
    cidade: "Arapongas",
    cidade_slug: "arapongas",
    categoria: "Celulares & Eletrônicos",
    preco: "R$ 1.800",
    descricao:
      "Televisor em estado de novo, tela impecável sem dead pixels. Sistema Tizen super rápido com Netflix, YouTube, Prime Video e Disney+. Acompanha controle remoto inteligente solar e pezinhos originais. Pouco tempo de uso, motivo: comprei uma maior.",
    imagem: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=900&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=900&q=80",
      "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=900&q=80",
    ],
    contato: "43992109876",
    nome_anunciante: "Juliana Castro",
    aceita_troca: true,
    urgente: false,
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
    is_mock: true,
  },
];
