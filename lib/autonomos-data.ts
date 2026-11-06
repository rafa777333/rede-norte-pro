export interface AutonomoItem {
  id: string;
  nome: string;
  profissao: string;
  categoria: string;
  cidade: string;
  cidade_slug: string;
  descricao: string;
  whatsapp: string;
  verificado?: boolean;
  nota?: number;
  created_at: string;
  is_mock?: boolean;
}

export const CATEGORIAS_AUTONOMOS = [
  { id: "todos", label: "🛠️ Todos os Serviços", nome: "Todos" },
  { id: "construcao", label: "🧱 Construção & Reforma", nome: "Construção & Reforma" },
  { id: "eletrica-hidraulica", label: "⚡ Elétrica & Hidráulica", nome: "Elétrica & Hidráulica" },
  { id: "limpeza", label: "🧹 Limpeza & Diarista", nome: "Limpeza & Diarista" },
  { id: "fretes", label: "🚚 Fretes & Mudanças", nome: "Fretes & Mudanças" },
  { id: "beleza", label: "💇 Beleza & Estética", nome: "Beleza & Estética" },
  { id: "informatica", label: "💻 Informática & Outros", nome: "Informática & Outros" },
];

export const MOCK_AUTONOMOS: AutonomoItem[] = [
  {
    id: "auto-1",
    nome: "Marcos Eletricista Profissional",
    profissao: "Eletricista Residencial e Comercial",
    categoria: "Elétrica & Hidráulica",
    cidade: "Apucarana",
    cidade_slug: "apucarana",
    descricao: "Instalação de padrão Copel, troca de fiação, disjuntores, chuveiros, luminárias e reparos de curto-circuito em geral. Atendimento rápido.",
    whatsapp: "43996549318",
    verificado: true,
    nota: 5,
    created_at: new Date().toISOString(),
    is_mock: true,
  },
  {
    id: "auto-2",
    nome: "Carlos Encanador & Desentupidora",
    profissao: "Encanador Especializado",
    categoria: "Elétrica & Hidráulica",
    cidade: "Arapongas",
    cidade_slug: "arapongas",
    descricao: "Caça-vazamentos, conserto de tubulações tigre/amanco, desentupimento de pias, ralos e vasos, instalação de caixas d'água e bombas.",
    whatsapp: "43999809454",
    verificado: true,
    nota: 5,
    created_at: new Date().toISOString(),
    is_mock: true,
  },
  {
    id: "auto-3",
    nome: "Dona Maria - Diarista & Faxina",
    profissao: "Diarista e Limpeza Pós-Obra",
    categoria: "Limpeza & Diarista",
    cidade: "Apucarana",
    cidade_slug: "apucarana",
    descricao: "Limpeza residencial e comercial diária ou semanal. Experiência de mais de 8 anos, caprichosa, com excelentes referências no centro e bairros.",
    whatsapp: "43996549318",
    verificado: true,
    nota: 5,
    created_at: new Date().toISOString(),
    is_mock: true,
  },
  {
    id: "auto-4",
    nome: "Roberto Silva - Pinturas & Texturas",
    profissao: "Pintor Residencial e Predial",
    categoria: "Construção & Reforma",
    cidade: "Jandaia do Sul",
    cidade_slug: "jandaia-do-sul",
    descricao: "Pintura interna e externa, aplicação de massa corrida, grafiato, cimento queimado e impermeabilização de lajes e paredes.",
    whatsapp: "43999809454",
    verificado: true,
    nota: 5,
    created_at: new Date().toISOString(),
    is_mock: true,
  },
  {
    id: "auto-5",
    nome: "Vanderlei Fretes & Mudanças",
    profissao: "Freteiro com Caminhão Baú",
    categoria: "Fretes & Mudanças",
    cidade: "Apucarana",
    cidade_slug: "apucarana",
    descricao: "Fretes rápidos e mudanças para todo o Vale do Ivaí, Londrina e Maringá. Ajudantes disponíveis, mantas de proteção e segurança total.",
    whatsapp: "43996549318",
    verificado: true,
    nota: 5,
    created_at: new Date().toISOString(),
    is_mock: true,
  },
  {
    id: "auto-6",
    nome: "Mestre Zé - Pedreiro & Assentador",
    profissao: "Pedreiro de Alvenaria e Acabamentos",
    categoria: "Construção & Reforma",
    cidade: "Apucarana",
    cidade_slug: "apucarana",
    descricao: "Construção do alicerce ao telhado, colocação de pisos cerâmicos e porcelanato, reboco, muros e reformas de banheiros.",
    whatsapp: "43999809454",
    verificado: true,
    nota: 5,
    created_at: new Date().toISOString(),
    is_mock: true,
  },
  {
    id: "auto-7",
    nome: "Fernando - Marido de Aluguel 24h",
    profissao: "Pequenos Reparos e Manutenções",
    categoria: "Construção & Reforma",
    cidade: "Apucarana",
    cidade_slug: "apucarana",
    descricao: "Montagem de móveis, instalação de cortinas, varais, fechaduras, torneiras, tomadas e suportes de TV na parede com rapidez.",
    whatsapp: "43996549318",
    verificado: true,
    nota: 5,
    created_at: new Date().toISOString(),
    is_mock: true,
  },
  {
    id: "auto-8",
    nome: "Lucas Tech - Assistência Informática",
    profissao: "Técnico em Informática e Redes",
    categoria: "Informática & Outros",
    cidade: "Apucarana",
    cidade_slug: "apucarana",
    descricao: "Formatação de computadores e notebooks, limpeza de vírus, instalação de impressoras, roteadores Wi-Fi e atendimento em domicílio.",
    whatsapp: "43999809454",
    verificado: true,
    nota: 5,
    created_at: new Date().toISOString(),
    is_mock: true,
  },
];
