export type SignoPrevisao = {
  slug: string;
  nome: string;
  simbolo: string;
  elemento: "Fogo" | "Terra" | "Ar" | "Água";
  periodo: string;
  geral: string;
  amor: string;
  trabalho: string;
  numeroSorte: number;
  corDia: string;
};

export const SIGNOS_INFO = [
  {
    slug: "aries",
    nome: "Áries",
    simbolo: "♈",
    elemento: "Fogo" as const,
    periodo: "21/03 a 19/04",
    numeroBase: 9,
    corPadrao: "Vermelho Rubi",
    geralBase: "O momento pede foco e iniciativa para dar o primeiro passo naquele projeto que estava parado. Confie na sua intuição.",
    amorBase: "Excelente fase para diálogos sinceros e cumplicidade. Se solteiro(a), uma surpresa agradável pode alegrar seu dia.",
    trabalhoBase: "Sua liderança natural ganha destaque. Priorize o que é essencial para colher frutos a médio prazo.",
  },
  {
    slug: "touro",
    nome: "Touro",
    simbolo: "♉",
    elemento: "Terra" as const,
    periodo: "20/04 a 20/05",
    numeroBase: 6,
    corPadrao: "Verde Esmeralda",
    geralBase: "Mantenha a calma e avance com estabilidade. Valorize momentos simples de conforto e tranquilidade.",
    amorBase: "Demonstrações práticas de carinho e segurança fortalecem laços duradouros. Abra o coração.",
    trabalhoBase: "Bom período para organizar finanças e planejar investimentos futuros com prudência e pés no chão.",
  },
  {
    slug: "gemeos",
    nome: "Gêmeos",
    simbolo: "♊",
    elemento: "Ar" as const,
    periodo: "21/05 a 20/06",
    numeroBase: 5,
    corPadrao: "Amarelo Solar",
    geralBase: "Sua comunicação e curiosidade estão em alta. Um contato inesperado pode render uma ótima ideia.",
    amorBase: "Conversas descontraídas abrem caminhos para novas conexões e harmonia a dois. Aposte no bom humor.",
    trabalhoBase: "Versatilidade e jogo de cintura ajudarão a resolver pendências de forma rápida e inovadora.",
  },
  {
    slug: "cancer",
    nome: "Câncer",
    simbolo: "♋",
    elemento: "Água" as const,
    periodo: "21/06 a 22/07",
    numeroBase: 2,
    corPadrao: "Prata Lunar",
    geralBase: "Sensibilidade aguçada favorece o acolhimento à família e aos amigos próximos. Cuide da sua energia.",
    amorBase: "Trocas emocionais calorosas e cumplicidade renovada. Demonstre sem receio o que você sente.",
    trabalhoBase: "Trabalhos colaborativos fluem com mais facilidade hoje. Sua empatia será um grande diferencial.",
  },
  {
    slug: "leao",
    nome: "Leão",
    simbolo: "♌",
    elemento: "Fogo" as const,
    periodo: "23/07 a 22/08",
    numeroBase: 1,
    corPadrao: "Dourado",
    geralBase: "Seu carisma e presença inspiram as pessoas ao seu redor. Assuma o protagonismo das suas escolhas.",
    amorBase: "Romantismo em destaque. Um gesto afetuoso reacende o entusiasmo na relação.",
    trabalhoBase: "Reconhecimento à vista. Mostre sua criatividade e confiança para liderar tarefas importantes.",
  },
  {
    slug: "virgem",
    nome: "Virgem",
    simbolo: "♍",
    elemento: "Terra" as const,
    periodo: "23/08 a 22/09",
    numeroBase: 4,
    corPadrao: "Azul Marinho",
    geralBase: "Organização e disciplina aliviam a mente. Liste prioridades e resolva uma tarefa de cada vez.",
    amorBase: "Apoio mútuo e atenção aos detalhes fortalecem o relacionamento. O diálogo claro evita mal-entendidos.",
    trabalhoBase: "Atenção cirúrgica aos prazos e detalhes renderá elogios. Seu método de trabalho é eficiente.",
  },
  {
    slug: "libra",
    nome: "Libra",
    simbolo: "♎",
    elemento: "Ar" as const,
    periodo: "23/09 a 22/10",
    numeroBase: 7,
    corPadrao: "Rosa Pastel",
    geralBase: "Busque harmonia em suas decisões e cultive a paz interior. Evite absorver conflitos alheios.",
    amorBase: "Clima de romance, charme e conciliação. Ótimo momento para passeios e momentos a dois.",
    trabalhoBase: "Sua habilidade de mediação ajuda a harmonizar a equipe e fechar acordos equilibrados.",
  },
  {
    slug: "escorpiao",
    nome: "Escorpião",
    simbolo: "♏",
    elemento: "Água" as const,
    periodo: "23/10 a 21/11",
    numeroBase: 8,
    corPadrao: "Bordô",
    geralBase: "Momento propício para transformar hábitos e focar no que realmente importa para sua evolução pessoal.",
    amorBase: "Intensidade e conexão profunda. Momentos a dois ganham intensidade e verdade.",
    trabalhoBase: "Determinação e foco inabaláveis. Você conseguirá superar obstáculos complexos com inteligência.",
  },
  {
    slug: "sagitario",
    nome: "Sagitário",
    simbolo: "♐",
    elemento: "Fogo" as const,
    periodo: "22/11 a 21/12",
    numeroBase: 3,
    corPadrao: "Púrpura",
    geralBase: "Otimismo e vontade de expandir horizontes. Planeje novos estudos, viagens ou novas rotinas.",
    amorBase: "Leveza e liberdade fortalecem a convivência. Rir juntos será o melhor tempero do dia.",
    trabalhoBase: "Visão estratégica ampliada. Uma ideia arrojada pode ser muito bem recebida por colegas e clientes.",
  },
  {
    slug: "capricornio",
    nome: "Capricórnio",
    simbolo: "♑",
    elemento: "Terra" as const,
    periodo: "22/12 a 19/01",
    numeroBase: 10,
    corPadrao: "Cinza Chumbo",
    geralBase: "Persistência e maturidade guiam o seu dia. Cada passo firme consolida suas conquistas.",
    amorBase: "Companheirismo sólido. Valorize quem está ao seu lado nos momentos fáceis e desafiadores.",
    trabalhoBase: "Produtividade em alta. Sua dedicação consistente aproxima você das metas mais ambiciosas.",
  },
  {
    slug: "aquario",
    nome: "Aquário",
    simbolo: "♒",
    elemento: "Ar" as const,
    periodo: "20/01 a 18/02",
    numeroBase: 11,
    corPadrao: "Azul Turquesa",
    geralBase: "Pensamento inovador e senso de comunidade. Uma conversa com amigos trará ótimos insights.",
    amorBase: "Autenticidade e companheirismo em primeiro lugar. Surpreenda com uma atitude original e leve.",
    trabalhoBase: "Soluções tecnológicas e novas abordagens resolvem problemas antigos com maestria.",
  },
  {
    slug: "peixes",
    nome: "Peixes",
    simbolo: "♓",
    elemento: "Água" as const,
    periodo: "19/02 a 20/03",
    numeroBase: 12,
    corPadrao: "Verde Água",
    geralBase: "Intuição aguçada e criatividade vibrante. Reserve um tempo para recarregar sua espiritualidade.",
    amorBase: "Ternura, empatia e carinho renovados. Ouça com o coração e apoie quem você ama.",
    trabalhoBase: "Inspiração para criar e resolver pendências com sensibilidade e talento artístico.",
  },
];

const VARIANTES_DIARIAS = [
  "Energias favoráveis estimulam o bem-estar e o equilíbrio mental ao longo de todo o dia.",
  "Momento de clareza mental e renovação de propósitos. Confie nas suas escolhas conscientes.",
  "Bons ventos trazem alívio e oportunidades para renovar laços importantes e planos futuros.",
  "Dia excelente para desacelerar quando necessário e ouvir a voz da sua própria sabedoria.",
  "A vibração de hoje inspira coragem, generosidade e capacidade de superar desafios com serenidade.",
  "Período fértil para novos começos e para valorizar o aprendizado de cada etapa da jornada.",
  "Sua sensibilidade orienta decisões seguras. Mantenha a mente aberta e o coração tranquilo.",
];

export function getHoroscopoDoDia(dadosExternos?: Record<string, Partial<SignoPrevisao>>): SignoPrevisao[] {
  const hoje = new Date();
  const diaDoAno = Math.floor((hoje.getTime() - new Date(hoje.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);

  return SIGNOS_INFO.map((signo, index) => {
    const seed = (diaDoAno + index * 7) % VARIANTES_DIARIAS.length;
    const variacao = VARIANTES_DIARIAS[seed];
    const numeroSorte = ((signo.numeroBase + diaDoAno * 3 + index) % 60) + 1;

    const externo = dadosExternos?.[signo.slug] || dadosExternos?.[signo.nome.toLowerCase()];

    return {
      slug: signo.slug,
      nome: signo.nome,
      simbolo: signo.simbolo,
      elemento: signo.elemento,
      periodo: signo.periodo,
      geral: externo?.geral || `${signo.geralBase} ${variacao}`,
      amor: externo?.amor || signo.amorBase,
      trabalho: externo?.trabalho || signo.trabalhoBase,
      numeroSorte: externo?.numeroSorte || numeroSorte,
      corDia: externo?.corDia || signo.corPadrao,
    };
  });
}
