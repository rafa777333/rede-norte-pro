"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cidadeSlug, getSupabase } from "../lib/supabase";
import { getHoroscopoDoDia, type SignoPrevisao } from "../lib/horoscope";
import HoroscopeModal from "../components/HoroscopeModal";

type Noticia = {
  id: string;
  slug?: string;
  cidade: string;
  cidade_slug?: string;
  cat: string;
  titulo: string;
  sub: string;
  resumo: string;
  texto: string;
  img: string;
  hora?: string;
  autor?: string;
  credit?: string;
};
type Video = { id: string; titulo: string; descricao: string; cidade: string; categoria: string; videoUrl: string; thumbnailUrl: string; instagramUrl: string; materiaUrl: string; tipo: "upload" | "instagram"; publishedAt?: string };
type Sponsor = { id: string; titulo: string; imagem: string; linkUrl: string; ordem: number };
type MainAd = { imagem: string; linkUrl: string; titulo: string };
type TvAd = { videoUrl: string; linkUrl: string; titulo: string };

const cidades = ["Geral", "Apucarana", "Arapongas", "Arapuã", "Ariranha do Ivaí", "Bom Sucesso", "Borrazópolis", "Califórnia", "Cambira", "Cruzmaltina", "Faxinal", "Godoy Moreira", "Grandes Rios", "Ivaiporã", "Jandaia do Sul", "Jardim Alegre", "Kaloré", "Lidianópolis", "Lunardelli", "Marilândia do Sul", "Marumbi", "Mauá da Serra", "Novo Itacolomi", "Rio Bom", "Rio Branco do Ivaí", "Rosário do Ivaí", "São João do Ivaí", "São Pedro do Ivaí"];
const categorias = ["Todas", "Política", "Cidade", "Segurança", "Mídia", "Esportes"];
const RADIO_STREAM_URL = "https://servidor34-2.brlogic.com:7016/live?source=website";
const weatherLocations = [
  ["Apucarana", -23.55, -51.46], ["Arapongas", -23.42, -51.42], ["Arapuã", -24.30, -51.79], ["Ariranha do Ivaí", -24.39, -51.58], ["Bom Sucesso", -23.71, -51.77], ["Borrazópolis", -23.94, -51.59], ["Califórnia", -23.65, -51.35], ["Cambira", -23.59, -51.58], ["Cruzmaltina", -24.02, -51.45], ["Faxinal", -24.00, -51.32], ["Godoy Moreira", -24.17, -51.92], ["Grandes Rios", -24.15, -51.50], ["Ivaiporã", -24.25, -51.67], ["Jandaia do Sul", -23.60, -51.64], ["Jardim Alegre", -24.18, -51.69], ["Kaloré", -23.82, -51.66], ["Lidianópolis", -24.11, -51.65], ["Lunardelli", -24.08, -51.73], ["Marilândia do Sul", -23.74, -51.31], ["Marumbi", -23.70, -51.64], ["Mauá da Serra", -23.90, -51.23], ["Novo Itacolomi", -23.76, -51.51], ["Rio Bom", -23.76, -51.41], ["Rio Branco do Ivaí", -24.32, -51.32], ["Rosário do Ivaí", -24.27, -51.28], ["São João do Ivaí", -23.98, -51.82], ["São Pedro do Ivaí", -23.86, -51.86],
] as const;

function weatherLabel(code: number) {
  if (code === 0) return ["☀", "Céu limpo"];
  if (code <= 3) return ["⛅", "Parcialmente nublado"];
  if (code <= 48) return ["🌫", "Névoa"];
  if (code <= 67) return ["🌦", "Chuva leve"];
  if (code <= 77) return ["❄", "Frio"];
  if (code <= 82) return ["🌧", "Pancadas de chuva"];
  return ["⛈", "Trovoada"];
}

function WeatherTicker() {
  const [agora, setAgora] = useState(new Date());
  const [weather, setWeather] = useState<{ cidade: string; temperatura: number | null; code: number }[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const tick = window.setInterval(() => setAgora(new Date()), 30_000);
    return () => window.clearInterval(tick);
  }, []);
  useEffect(() => {
    const carregarTempo = async () => {
      try {
        const supabase = getSupabase();
        if (supabase) {
          const { data: dadosSalvos } = await supabase.from("weather_current").select("cidade_slug,cidade_nome,temperatura,codigo_tempo,condicao").order("cidade_nome").limit(100);
          if (dadosSalvos?.length) {
            setWeather(dadosSalvos.map((item: any) => ({ cidade: item.cidade_nome, temperatura: typeof item.temperatura === "number" ? Math.round(item.temperatura) : null, code: Number(item.codigo_tempo ?? 0) })));
            return;
          }
        }
        const latitudes = weatherLocations.map((item) => item[1]).join(",");
        const longitudes = weatherLocations.map((item) => item[2]).join(",");
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo`, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("weather unavailable");
        const payload = await response.json();
        const items = Array.isArray(payload) ? payload : [payload];
        setWeather(items.map((item: any, index: number) => ({ cidade: weatherLocations[index][0], temperatura: typeof item?.current?.temperature_2m === "number" ? Math.round(item.current.temperature_2m) : null, code: Number(item?.current?.weather_code ?? 0) })));
      } catch { setWeather([]); }
    };
    void carregarTempo();
    const refresh = window.setInterval(() => void carregarTempo(), 15 * 60_000);
    return () => window.clearInterval(refresh);
  }, []);
  useEffect(() => {
    if (!weather.length) return;
    const slide = window.setInterval(() => setActive((index) => (index + 1) % weather.length), 5_500);
    return () => window.clearInterval(slide);
  }, [weather.length]);

  const data = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(agora);
  const dataCapitalizada = data.charAt(0).toUpperCase() + data.slice(1);
  const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(agora);
  const atual = weather[active];
  const [icon, condition] = atual ? weatherLabel(atual.code) : ["◌", "Atualizando previsão"];

  return <div className="weather-ticker"><span className="ticker-brand">REDE APUCARANA DE COMUNICAÇÃO <b>·</b> CONECTANDO TODO O VALE DO IVAÍ</span><span className="ticker-date">{dataCapitalizada} · {hora}</span><span className="ticker-weather"><span className="ticker-live">AGORA</span><i>{icon}</i><strong>{atual?.cidade || "Vale do Ivaí"}</strong>{atual?.temperatura !== null && atual?.temperatura !== undefined ? <b>{atual.temperatura}°C</b> : <small>{condition}</small>}<em>{condition}</em></span></div>;
}

function WeatherShowcase() {
  const [weather, setWeather] = useState<{ cidade: string; temperatura: number; code: number }[]>([]);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const carregar = async () => {
      const supabase = getSupabase();
      const { data } = supabase ? await supabase.from("weather_current").select("cidade_nome,temperatura,codigo_tempo").order("cidade_nome").limit(27) : { data: null };
      if (data?.length) setWeather(data.map((item: any) => ({ cidade: item.cidade_nome, temperatura: Math.round(Number(item.temperatura)), code: Number(item.codigo_tempo || 0) })));
    };
    void carregar();
    const refresh = window.setInterval(() => void carregar(), 15 * 60_000);
    return () => window.clearInterval(refresh);
  }, []);
  useEffect(() => { if (!weather.length) return; const timer = window.setInterval(() => setActive((index) => (index + 1) % weather.length), 4_500); return () => window.clearInterval(timer); }, [weather.length]);
  const atual = weather[active];
  const [icon, condition] = atual ? weatherLabel(atual.code) : ["◌", "Atualizando previsão"];
  return <section className="weather-showcase" aria-label="Previsão do tempo do Vale do Ivaí"><div><span className="eyebrow">TEMPO AGORA · VALE DO IVAÍ</span><strong>{icon} {atual?.cidade || "Carregando cidades"}</strong><small>{condition} · atualização automática a cada 15 minutos</small></div><b>{atual ? `${atual.temperatura}°C` : "--"}</b><span className="weather-dots">{weather.slice(0, 9).map((item, index) => <i key={item.cidade} className={index === active % 9 ? "active" : ""} />)}</span></section>;
}

function instagramEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/(reel|p|tv)\/([^/]+)/i);
    return match ? `https://www.instagram.com/${match[1]}/${match[2]}/embed` : url;
  } catch { return url; }
}

const noticiasFixas: Noticia[] = [
  {
    id: "1",
    cidade: "Apucarana",
    cat: "Política",
    titulo: "Datafolha aponta empate técnico entre Flávio Bolsonaro e Lula",
    sub: "Pesquisa mostra Flávio com 51% e Lula com 49% dos votos válidos; rejeição aparece como fator decisivo.",
    resumo: "Nova pesquisa mostra cenário acirrado entre os dois nomes e margem de diferença dentro do empate técnico.",
    texto: "O Datafolha divulgou nesta quinta-feira (15) nova pesquisa mostrando Flávio Bolsonaro com 51% e Lula com 49% dos votos válidos, em empate técnico. A distância, que exclui brancos, nulos e indecisos, era de quatro pontos na semana passada.\n\nJosé Roberto de Toledo analisa que Lula não ganha votos que saem de Flávio, mas pode ser beneficiado pela rejeição. Segundo a pesquisa, Lula é rejeitado por 46% dos eleitores, e Flávio Bolsonaro por 44%.\n\nO governo Lula tem avaliação negativa de 41% e positiva de 35%, segundo o Datafolha. A pesquisa ouviu 2.000 eleitores em todo o país.",
    img: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1400&q=85",
    hora: "09:10",
    autor: "Redação Rede Apucarana",
    credit: "Imagem ilustrativa / Unsplash",
  },
  {
    id: "2",
    cidade: "Arapongas",
    cat: "Cidade",
    titulo: "Senado aprova maior limite de faturamento do MEI e perdão de dívidas",
    sub: "Medida amplia espaço para microempreendedores e prevê condições especiais para regularização.",
    resumo: "Projeto amplia limite de faturamento para microempreendedores.",
    texto: "O Senado aprovou nesta quinta-feira novas regras para o Microempreendedor Individual. A proposta amplia o limite de faturamento e cria condições para a regularização de dívidas.",
    img: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=1000&q=85",
    hora: "08:42",
    autor: "Redação Rede Apucarana",
    credit: "Imagem ilustrativa / Unsplash",
  },
  {
    id: "3",
    cidade: "Apucarana",
    cat: "Segurança",
    titulo: "Alcolumbre desiste de votar hoje a PEC da Segurança",
    sub: "Votação fica para a próxima semana após pedido de líderes do Senado.",
    resumo: "Presidente do Senado adiou votação após pedido de líderes.",
    texto: "O presidente do Senado, Davi Alcolumbre, desistiu de votar nesta quinta-feira a PEC da Segurança. A análise deve ser retomada na próxima semana.",
    img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1000&q=85",
    hora: "08:18",
    autor: "Redação Rede Apucarana",
    credit: "Imagem ilustrativa / Unsplash",
  },
  {
    id: "4",
    cidade: "Ivaiporã",
    cat: "Mídia",
    titulo: "Grupo Globo demite diretor-geral após vazamento de conversas com Vorcaro",
    sub: "Demissão foi comunicada nesta quinta-feira; empresa informou que apura o caso.",
    resumo: "Executivo foi desligado após áudios vazados nas redes sociais.",
    texto: "O Grupo Globo demitiu o diretor-geral após o vazamento de conversas. A empresa informou que a decisão foi tomada nesta quinta-feira.",
    img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1000&q=85",
    hora: "07:55",
    autor: "Redação Rede Apucarana",
    credit: "Imagem ilustrativa / Unsplash",
  },
];

function resumoSeguro(conteudo: unknown, resumo: unknown): string {
  if (typeof resumo === "string" && resumo.trim()) return resumo.trim().slice(0, 180);
  let texto = typeof conteudo === "string" ? conteudo : "";
  try {
    const parsed = JSON.parse(texto);
    if (Array.isArray(parsed)) texto = parsed.filter((part) => typeof part === "string").join(" ");
  } catch { /* usa o texto recebido */ }
  return texto.replace(/\\n/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
}

function noticiaValida(item: any): boolean {
  const titulo = typeof item?.titulo === "string" ? item.titulo.trim() : "";
  if (titulo.length < 5 || titulo.length > 220) return false;
  if (titulo.startsWith("[") || titulo.startsWith("{") || titulo.includes("\"Offline") || titulo.includes("https://") || titulo.includes("http://")) return false;
  if (/\b(offline|whatsapp|instagram\.com|facebook\.com|youtube\.com)\b/i.test(titulo)) return false;
  return Boolean(item?.conteudo || item?.resumo);
}

function formatarNoticiasAdmin(items: any[]): Noticia[] {
  return items.map((n: any, index) => ({
    id: String(n.id ?? `admin-${index}`),
    slug: n.slug || String(n.id ?? `admin-${index}`),
    cidade: n.cidade || "Apucarana",
    cidade_slug: n.cidade_slug || (n.cidade ? cidadeSlug(n.cidade) : "apucarana"),
    cat: n.cat || "Cidade",
    titulo: n.titulo || "Nova notícia",
    sub: n.resumo || "Confira os principais detalhes desta notícia.",
    resumo: n.resumo || "Confira os principais detalhes desta notícia.",
    texto: n.texto || n.resumo || "Confira os principais detalhes desta notícia.",
    img: n.img || noticiasFixas[index % noticiasFixas.length].img,
    hora: n.hora || "Agora",
    autor: n.autor || "Redação Rede Apucarana",
    credit: n.credit || "Imagem ilustrativa",
  }));
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="news-badge">{children}</span>;
}

function NewsCard({ noticia, compact = false }: { noticia: Noticia; compact?: boolean }) {
  const href = `/noticias/${encodeURIComponent(noticia.slug || noticia.id)}`;
  return (
    <a className={`news-card ${compact ? "news-card--compact" : ""}`} href={href}>
      {noticia.img ? <img src={noticia.img} alt={`Imagem da notícia: ${noticia.titulo}`} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div className="news-card-placeholder" aria-label="Imagem não fornecida pela fonte"><span>RA</span><small>Imagem não fornecida pela fonte</small></div>}
      <span className="card-content">
        <span className="card-kicker"><Badge>{noticia.cat}</Badge><span>{noticia.cidade}</span></span>
        <strong>{noticia.titulo}</strong>
        {!compact && <span className="card-summary">{noticia.sub}</span>}
        <span className="card-meta">{noticia.hora || "Agora"} · {noticia.autor || "Redação Rede Apucarana"}</span>
      </span>
    </a>
  );
}

function VideoPlayer({ video }: { video: Video }) {
  if (video.tipo === "instagram" && video.instagramUrl) {
    return <div className="video-embed-wrap"><iframe src={instagramEmbedUrl(video.instagramUrl)} title={video.titulo} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen /><a href={video.instagramUrl} target="_blank" rel="noreferrer">Abrir publicação original no Instagram ↗</a></div>;
  }
  return <video className="video-native" controls playsInline preload="metadata" poster={video.thumbnailUrl || undefined}><source src={video.videoUrl} type="video/mp4" />Seu navegador não suporta vídeo HTML5.</video>;
}

const DEFAULT_SPONSORS: Sponsor[] = [
  {
    id: "demo-sponsor-1",
    titulo: "Sua Marca em Destaque Regional",
    imagem: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80",
    linkUrl: "/admin",
    ordem: 0,
  },
  {
    id: "demo-sponsor-2",
    titulo: "Rede Apucarana de Comunicação",
    imagem: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=80",
    linkUrl: "/admin",
    ordem: 1,
  },
  {
    id: "demo-sponsor-3",
    titulo: "Anuncie no Maior Portal da Região",
    imagem: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
    linkUrl: "/admin",
    ordem: 2,
  },
];

function LargeSponsorCarousel({ sponsors }: { sponsors: Sponsor[] }) {
  const slides = sponsors.length > 0 ? sponsors : DEFAULT_SPONSORS;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3600);
    return () => clearInterval(interval);
  }, [slides.length, paused]);

  const prevSlide = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  return (
    <div
      className="large-sponsor-carousel"
      onMouseEnter={() => setPaused(false)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Carrossel de Patrocinadores em Loop"
    >
      <div className="large-sponsor-header">
        <span>PATROCINADORES EM DESTAQUE</span>
        <div className="loop-badge">
          <i /> EM LOOP
        </div>
      </div>

      <div className="large-sponsor-viewport">
        {slides.map((slide, index) => {
          const isActive = index === current;
          return (
            <a
              key={slide.id || index}
              href={slide.linkUrl || "#"}
              target={slide.linkUrl && slide.linkUrl !== "#" ? "_blank" : undefined}
              rel="noreferrer"
              className={`large-sponsor-slide ${isActive ? "active" : ""}`}
              tabIndex={isActive ? 0 : -1}
            >
              <img src={slide.imagem} alt={slide.titulo} />
              <div className="large-sponsor-caption">
                <strong>{slide.titulo}</strong>
                <span>{slide.linkUrl ? "Conhecer parceiro ↗" : "Espaço comercial"}</span>
              </div>
            </a>
          );
        })}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              className="large-sponsor-nav large-sponsor-nav--prev"
              onClick={prevSlide}
              aria-label="Patrocinador anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="large-sponsor-nav large-sponsor-nav--next"
              onClick={nextSlide}
              aria-label="Próximo patrocinador"
            >
              ›
            </button>
            <div className="large-sponsor-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`large-sponsor-dot ${i === current ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrent(i);
                  }}
                  aria-label={`Ir para patrocinador ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PortalClient({ initialCity = "Geral" }: { initialCity?: string }) {
  const [cidade, setCidade] = useState(initialCity);
  const [aba, setAba] = useState("noticias");
  const [categoria, setCategoria] = useState("Todas");
  const [limiteNoticias, setLimiteNoticias] = useState(24);
  const [sel, setSel] = useState<Noticia | null>(null);
  const [busca, setBusca] = useState("");
  const [carregandoNoticias, setCarregandoNoticias] = useState(true);
  const [noticiasAdmin, setNoticiasAdmin] = useState<any[]>([]);
  const [locaisAdmin, setLocaisAdmin] = useState<any[]>([]);
  const [vagasAdmin, setVagasAdmin] = useState<any[]>([]);
  const [classifAdmin, setClassifAdmin] = useState<any[]>([]);
  const [promocoesAdmin, setPromocoesAdmin] = useState<any[]>([]);
  const [videosAdmin, setVideosAdmin] = useState<Video[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [settingsMap, setSettingsMap] = useState<Map<string, string>>(new Map());
  const [grupoWhatsApp, setGrupoWhatsApp] = useState("");
  const [classifForm, setClassifForm] = useState({ titulo: "", cidade: initialCity !== "Geral" ? initialCity : "Apucarana", categoria: "Outros", preco: "", contato: "", descricao: "", imagem: "" });
  const [enviandoClassif, setEnviandoClassif] = useState(false);
  const [classifEnviado, setClassifEnviado] = useState(false);
  const [jobForm, setJobForm] = useState({ vaga: "", empresa: "", cidade: initialCity !== "Geral" ? initialCity : "Apucarana", tipo: "Precisa-se", contato: "", descricao: "" });
  const [enviandoJob, setEnviandoJob] = useState(false);
  const [jobEnviado, setJobEnviado] = useState(false);
  const [radioTocando, setRadioTocando] = useState(false);
  const [signoAberto, setSignoAberto] = useState<SignoPrevisao | null>(null);
  const radioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setCidade(initialCity);
  }, [initialCity]);

  useEffect(() => {
    setLimiteNoticias(24);
  }, [cidade, categoria, busca]);

  useEffect(() => {
    try {
      const n = localStorage.getItem("rn_noticias"); if (n) setNoticiasAdmin(JSON.parse(n).filter(noticiaValida));
      const l = localStorage.getItem("rn_locais"); if (l) setLocaisAdmin(JSON.parse(l));
      const v = localStorage.getItem("rn_vagas"); if (v) setVagasAdmin(JSON.parse(v));
      const c = localStorage.getItem("rn_classif"); if (c) setClassifAdmin(JSON.parse(c));
      const p = localStorage.getItem("rn_promocoes"); if (p) setPromocoesAdmin(JSON.parse(p));
    } catch { /* mantém conteúdo inicial */ }

    const supabase = getSupabase();

    const carregarDados = async () => {
      let news: any[] = [];
      let cities: any[] = [];
      let services: any[] = [];
      let jobs: any[] = [];
      let ads: any[] = [];
      let promotions: any[] = [];
      let videos: any[] = [];
      let sponsorData: any[] = [];
      let settingsData: any[] = [];

      if (supabase) {
        const results = await Promise.all([
          supabase.from("news").select("id,slug,titulo,categoria,conteudo,resumo,imagem,cidade_slug,autor,published_at").eq("status", "published").order("published_at", { ascending: false }).limit(200),
          supabase.from("cities").select("slug,nome"),
          supabase.from("service_providers").select("id,nome,categoria,cidade_slug,endereco,whatsapp,imagem,descricao").eq("verificado", true),
          supabase.from("jobs").select("id,vaga,empresa,cidade_slug,contato,imagem,descricao").eq("status", "published"),
          supabase.from("classified_ads").select("id,titulo,categoria,cidade_slug,preco,contato,imagem,descricao").eq("status", "published"),
          supabase.from("promotions").select("id,titulo,categoria,cidade_slug,validade,contato,imagem,detalhes").eq("status", "published"),
          supabase.from("videos").select("id,titulo,descricao,video_url,thumbnail_url,instagram_url,cidade_slug,categoria,materia_url,tipo,published_at").eq("status", "published").order("published_at", { ascending: false }),
          supabase.from("site_sponsors").select("id,titulo,imagem,link_url,ordem").eq("ativo", true).order("ordem").limit(20),
          supabase.from("site_settings").select("key,value"),
        ]);
        news = results[0].data || [];
        cities = results[1].data || [];
        services = results[2].data || [];
        jobs = results[3].data || [];
        ads = results[4].data || [];
        promotions = results[5].data || [];
        videos = results[6].data || [];
        sponsorData = results[7].data || [];
        settingsData = results[8].data || [];
      }

      const cityMap = new Map((cities || []).map((city: any) => [city.slug, city.nome]));
      if (news.length) setNoticiasAdmin(news.filter((n: any) => noticiaValida(n)).map((n: any) => ({
        id: n.id,
        slug: n.slug || n.id,
        cidade: cityMap.get(n.cidade_slug) || n.cidade_slug || "Geral",
        cidade_slug: n.cidade_slug || "geral",
        cat: n.categoria || "Cidade",
        titulo: n.titulo,
        resumo: resumoSeguro(n.conteudo, n.resumo),
        texto: n.conteudo || n.resumo || "",
        img: n.imagem || "",
        hora: n.published_at ? new Date(n.published_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Agora",
        autor: n.autor || "Redação Rede Apucarana",
      })));
      if (services?.length) setLocaisAdmin(services.map((item: any) => ({ id: item.id, nome: item.nome, cidade: cityMap.get(item.cidade_slug) || "Apucarana", cat: item.categoria, end: item.endereco || "", zap: item.whatsapp || "", img: item.imagem || "", detalhes: item.descricao || "" })));
      if (jobs?.length) setVagasAdmin(jobs.map((item: any) => ({ id: item.id, cargo: item.vaga, empresa: item.empresa, cidade: cityMap.get(item.cidade_slug) || "Apucarana", zap: item.contato || "", img: item.imagem || "", detalhes: item.descricao || "" })));
      if (ads?.length) setClassifAdmin(ads.map((item: any) => ({ id: item.id, titulo: item.titulo, cidade: cityMap.get(item.cidade_slug) || "Apucarana", cat: item.categoria, preco: item.preco || "", zap: item.contato || "", img: item.imagem || "", detalhes: item.descricao || "" })));
      if (promotions?.length) setPromocoesAdmin(promotions.map((item: any) => ({ id: item.id, titulo: item.titulo, cidade: cityMap.get(item.cidade_slug) || "Apucarana", categoria: item.categoria, validade: item.validade || "", contato: item.contato || "", img: item.imagem || "", detalhes: item.detalhes || "" })));
      if (videos?.length) setVideosAdmin((videos || []).map((item: any) => ({ id: item.id, titulo: item.titulo, descricao: item.descricao || "Confira este corte da Rede Apucarana.", cidade: cityMap.get(item.cidade_slug) || "Geral", categoria: item.categoria || "Matéria", videoUrl: item.video_url || "", thumbnailUrl: item.thumbnail_url || "", instagramUrl: item.instagram_url || "", materiaUrl: item.materia_url || "", tipo: item.tipo === "instagram" ? "instagram" : "upload", publishedAt: item.published_at })));

      let listSponsors = (sponsorData || []).map((item: any) => ({ id: item.id, titulo: item.titulo, imagem: item.imagem, linkUrl: item.link_url || "", ordem: item.ordem || 0 }));
      if (typeof window !== "undefined") {
        const localSponsors = JSON.parse(localStorage.getItem("local_site_sponsors") || "[]");
        if (localSponsors.length) {
          const idSet = new Set(listSponsors.map((s) => s.id));
          localSponsors.forEach((ls: any) => {
            if (!idSet.has(ls.id)) listSponsors.push(ls);
            else {
              const idx = listSponsors.findIndex((s) => s.id === ls.id);
              if (idx >= 0) listSponsors[idx] = ls;
            }
          });
        }
      }
      listSponsors.sort((a, b) => a.ordem - b.ordem);
      setSponsors(listSponsors);

      const settings = new Map((settingsData || []).map((item: any) => [item.key, item.value || ""]));
      if (typeof window !== "undefined") {
        const localMap = JSON.parse(localStorage.getItem("local_site_settings") || "{}");
        Object.entries(localMap).forEach(([k, v]) => {
          if (v !== undefined && v !== null) settings.set(k, String(v));
        });
      }
      setSettingsMap(settings);
      setGrupoWhatsApp(String(settings.get("whatsapp_group_url") || ""));
      setCarregandoNoticias(false);
    };

    void carregarDados();
    const intervalo = window.setInterval(() => { void carregarDados(); }, 60_000);
    const aoVoltarParaPagina = () => { if (document.visibilityState === "visible") void carregarDados(); };
    document.addEventListener("visibilitychange", aoVoltarParaPagina);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltarParaPagina);
    };
  }, []);

  const todas = carregandoNoticias ? [] : (noticiasAdmin.length ? formatarNoticiasAdmin(noticiasAdmin.filter(noticiaValida)) : noticiasFixas);
  const noticiasPromovidasGeral = useMemo<Set<string>>(() => {
    const val = settingsMap.get("noticias_promovidas_geral");
    if (!val) return new Set();
    try {
      const parsed = JSON.parse(val);
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  }, [settingsMap]);

  const filtradas = useMemo(() => todas.filter((n) => {
    const passaCidade = cidade === "Geral"
      ? (n.cidade === "Geral" || n.cidade_slug === "geral" || noticiasPromovidasGeral.has(n.id) || n.cat.toLowerCase() === "destaque" || (!noticiasAdmin.length))
      : (n.cidade.toLowerCase() === cidade.toLowerCase() || n.cidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === cidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || n.cidade_slug === cidadeSlug(cidade));
    const passaCategoria = categoria === "Todas" || n.cat === categoria;
    const termo = busca.trim().toLowerCase();
    const passaBusca = !termo || `${n.titulo} ${n.resumo} ${n.cidade} ${n.cat}`.toLowerCase().includes(termo);
    return passaCidade && passaCategoria && passaBusca;
  }), [todas, cidade, categoria, busca, noticiasPromovidasGeral, noticiasAdmin.length]);

  const horoscopoSignos = useMemo<SignoPrevisao[]>(() => {
    const customStr = settingsMap.get("horoscopo_diario");
    if (customStr) {
      try {
        const parsed = JSON.parse(customStr);
        return getHoroscopoDoDia(parsed);
      } catch {}
    }
    return getHoroscopoDoDia();
  }, [settingsMap]);

  // Propagandas Principais inteligentes: busca primeiro da cidade atual; se vazio, usa a Geral
  const currentMainAds = useMemo<MainAd[]>(() => {
    const isGeral = cidade === "Geral";
    const slug = isGeral ? "" : cidadeSlug(cidade);

    return [1, 2, 3].map((position) => {
      const cityImg = slug ? settingsMap.get(`cidade_${slug}_main_ad_${position}_image`) : null;
      const cityLink = slug ? settingsMap.get(`cidade_${slug}_main_ad_${position}_link`) : null;
      const cityTitle = slug ? settingsMap.get(`cidade_${slug}_main_ad_${position}_title`) : null;

      const genImg = settingsMap.get(position === 1 ? "homepage_main_ad_image" : `homepage_main_ad_${position}_image`);
      const genLink = settingsMap.get(position === 1 ? "homepage_main_ad_link" : `homepage_main_ad_${position}_link`);
      const genTitle = settingsMap.get(position === 1 ? "homepage_main_ad_title" : `homepage_main_ad_${position}_title`);

      const imagem = (cityImg && cityImg.trim()) || (genImg && genImg.trim()) || "";
      const linkUrl = (cityLink && cityLink.trim()) || (genLink && genLink.trim()) || "";
      const titulo = (cityTitle && cityTitle.trim()) || (genTitle && genTitle.trim()) || `Publicidade Principal ${position}`;

      return { imagem: String(imagem), linkUrl: String(linkUrl), titulo: String(titulo) };
    });
  }, [cidade, settingsMap]);

  // TVs da Lateral inteligentes: busca primeiro o vídeo da cidade atual; se vazio, usa o vídeo Geral
  const currentTvAds = useMemo<TvAd[]>(() => {
    const isGeral = cidade === "Geral";
    const slug = isGeral ? "" : cidadeSlug(cidade);

    return [1, 2, 3].map((pos) => {
      const cityVideo = slug ? settingsMap.get(`cidade_${slug}_tv_${pos}_video_url`) : null;
      const cityLink = slug ? settingsMap.get(`cidade_${slug}_tv_${pos}_link_url`) : null;
      const cityTitle = slug ? settingsMap.get(`cidade_${slug}_tv_${pos}_title`) : null;

      const genVideo = settingsMap.get(`sidebar_tv_${pos}_video_url`);
      const genLink = settingsMap.get(`sidebar_tv_${pos}_link_url`);
      const genTitle = settingsMap.get(`sidebar_tv_${pos}_title`);

      const videoUrl = (cityVideo && cityVideo.trim()) || (genVideo && genVideo.trim()) || "";
      const linkUrl = (cityLink && cityLink.trim()) || (genLink && genLink.trim()) || "";
      const titulo = (cityTitle && cityTitle.trim()) || (genTitle && genTitle.trim()) || `TV ${pos}`;

      return { videoUrl: String(videoUrl), linkUrl: String(linkUrl), titulo: String(titulo) };
    });
  }, [cidade, settingsMap]);

  // Blocos Laterais (LG1, LM1, LG2 e LM2) inteligentes: busca primeiro da cidade atual; se vazio, usa o Geral
  const currentLateralAds = useMemo<Record<"lg1" | "lm1" | "lg2" | "lm2", { imagem: string; linkUrl: string; titulo: string }>>(() => {
    const isGeral = cidade === "Geral";
    const slug = isGeral ? "" : cidadeSlug(cidade);
    const slots: ("lg1" | "lm1" | "lg2" | "lm2")[] = ["lg1", "lm1", "lg2", "lm2"];
    const result: any = {};

    slots.forEach((s) => {
      const cityImg = slug ? settingsMap.get(`cidade_${slug}_lateral_ad_${s}_image`) : null;
      const cityLink = slug ? settingsMap.get(`cidade_${slug}_lateral_ad_${s}_link`) : null;
      const cityTitle = slug ? settingsMap.get(`cidade_${slug}_lateral_ad_${s}_title`) : null;

      const genImg = settingsMap.get(`lateral_ad_${s}_image`);
      const genLink = settingsMap.get(`lateral_ad_${s}_link`);
      const genTitle = settingsMap.get(`lateral_ad_${s}_title`);

      const imagem = (cityImg && cityImg.trim()) || (genImg && genImg.trim()) || "";
      const linkUrl = (cityLink && cityLink.trim()) || (genLink && genLink.trim()) || "";
      const defaultTitle =
        s === "lg1"
          ? "Publicidade Lateral Grande 1"
          : s === "lm1"
          ? "Publicidade Lateral Média 1"
          : s === "lg2"
          ? "Publicidade Lateral Grande 2"
          : "Publicidade Lateral Média 2";
      const titulo = (cityTitle && cityTitle.trim()) || (genTitle && genTitle.trim()) || defaultTitle;

      result[s] = { imagem: String(imagem), linkUrl: String(linkUrl), titulo: String(titulo) };
    });

    return result;
  }, [cidade, settingsMap]);

  const alternarRadio = async () => {
    const audio = radioRef.current;
    if (!audio) return;
    if (radioTocando) {
      audio.pause();
      setRadioTocando(false);
      return;
    }
    try {
      await audio.play();
      setRadioTocando(true);
    } catch {
      setRadioTocando(false);
    }
  };

  const enviarClassificado = async () => {
    if (!classifForm.titulo.trim() || !classifForm.descricao.trim() || !classifForm.contato.trim()) return alert("Preencha título, descrição e contato.");
    const supabase = getSupabase();
    if (!supabase) return alert("O envio está temporariamente indisponível.");
    setEnviandoClassif(true);
    const { error } = await supabase.from("classified_ads").insert({ titulo: classifForm.titulo.trim(), cidade_slug: classifForm.cidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), categoria: classifForm.categoria, preco: classifForm.preco.trim() || null, descricao: classifForm.descricao.trim(), contato: classifForm.contato.trim(), imagem: classifForm.imagem || null, status: "pending" });
    setEnviandoClassif(false);
    if (error) return alert("Não foi possível enviar o anúncio. Tente novamente.");
    setClassifForm({ titulo: "", cidade: cidade !== "Geral" ? cidade : "Apucarana", categoria: "Outros", preco: "", contato: "", descricao: "", imagem: "" });
    setClassifEnviado(true);
  };

  const enviarVaga = async () => {
    if (!jobForm.vaga.trim() || !jobForm.empresa.trim() || !jobForm.descricao.trim() || !jobForm.contato.trim()) return alert("Preencha cargo, empresa, descrição e contato.");
    const supabase = getSupabase();
    if (!supabase) return alert("O envio está temporariamente indisponível.");
    setEnviandoJob(true);
    const { error } = await supabase.from("jobs").insert({ vaga: jobForm.vaga.trim(), empresa: jobForm.empresa.trim(), cidade_slug: jobForm.cidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), tipo: jobForm.tipo, descricao: jobForm.descricao.trim(), contato: jobForm.contato.trim(), imagem: "https://www.redeapucarana.com.br/vagas-padrao.svg", status: "pending" });
    setEnviandoJob(false);
    if (error) return alert("Não foi possível enviar a vaga. Tente novamente.");
    setJobForm({ vaga: "", empresa: "", cidade: cidade !== "Geral" ? cidade : "Apucarana", tipo: "Precisa-se", contato: "", descricao: "" });
    setJobEnviado(true);
  };

  if (sel) {
    return (
      <main className="article-page">
        <header className="article-header">
          <button className="back-button" onClick={() => setSel(null)}>← Voltar às notícias</button>
          <a className="brand brand--small" href="/" onClick={(e) => { e.preventDefault(); setSel(null); }}>
            <img src="/logo-rede-apucarana.png?v=2" alt="Logo RA" className="brand-mark" style={{ objectFit: "cover", width: "34px", height: "34px" }} />
            <span>REDE APUCARANA</span>
          </a>
          <span className="article-header-status"><i /> Jornalismo regional</span>
        </header>
        <article className="article-shell">
          <div className="article-breadcrumb">Início / {sel.cat} / {sel.cidade}</div>
          <div className="article-category"><Badge>{sel.cat}</Badge><span>{sel.cidade}</span></div>
          <h1>{sel.titulo}</h1>
          <p className="article-dek">{sel.sub}</p>
          <div className="article-byline"><img src="/logo-rede-apucarana.png?v=2" alt="Logo" className="avatar" style={{ objectFit: "cover", width: "34px", height: "34px", borderRadius: "50%" }} /><span><strong>{sel.autor || "Redação Rede Apucarana"}</strong><small>Publicado hoje às {sel.hora || "09:10"} · leitura de 2 min</small></span></div>
          <figure className="article-figure"><img src={sel.img} alt={`Imagem ilustrativa da notícia: ${sel.titulo}`} /><figcaption>{sel.credit || "Imagem ilustrativa"}</figcaption></figure>
          <div className="article-body">{sel.texto.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>
          <div className="article-footer-note"><strong>Encontrou um erro?</strong><span> Fale com a redação para solicitar uma correção ou enviar informação.</span></div>
          <section className="related"><div className="section-heading"><span>Leia também</span><i /></div><div className="related-grid">{todas.filter((n) => n.id !== sel.id).slice(0, 3).map((n) => <NewsCard key={n.id} noticia={n} compact />)}</div></section>
        </article>
      </main>
    );
  }

  const destaque = filtradas[0];
  const menores = filtradas.slice(1, 3);
  const posteriores = filtradas.slice(3, limiteNoticias);
  const primeirasUltimas = posteriores.slice(0, 12);
  const restantesUltimas = posteriores.slice(12);
  const temMaisNoticias = filtradas.length > limiteNoticias;

  const renderTvLoop = (index: number) => {
    const tv = currentTvAds[index];
    const videoUrl = tv?.videoUrl || "";
    const linkUrl = tv?.linkUrl || "";
    const titulo = tv?.titulo || `TV ${index + 1}`;

    const content = videoUrl ? (
      <video
        className="ad-loop-video"
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={titulo}
      />
    ) : (
      <div className="ad-loop-empty" aria-label={titulo}>
        <span>ESPAÇO EM VÍDEO</span>
        <strong>{titulo}</strong>
        <small>{cidade !== "Geral" ? `Anuncie na página de ${cidade}` : "Anuncie para toda a região"}</small>
      </div>
    );

    return (
      <div className="ad-loop-card" key={`tv-loop-${index}`} aria-label={titulo}>
        {linkUrl ? (
          <a href={linkUrl} target="_blank" rel="noreferrer" title={`Abrir propaganda ${titulo}`}>
            {content}
          </a>
        ) : (
          content
        )}
      </div>
    );
  };

  const renderLateralBlock = (slot: "lg1" | "lm1" | "lg2" | "lm2") => {
    const ad = currentLateralAds[slot];
    const slotName = slot.toUpperCase();
    const isLarge = slot === "lg1" || slot === "lg2";
    const defaultTitle = isLarge ? "Publicidade Lateral Grande" : "Publicidade Lateral Média";

    if (ad.imagem) {
      return (
        <a
          href={ad.linkUrl || "#"}
          target={ad.linkUrl && ad.linkUrl !== "#" ? "_blank" : undefined}
          rel="noreferrer"
          className={`lateral-slot lateral-slot--${slot} lateral-slot--custom`}
          style={{ backgroundImage: `url(${ad.imagem})` }}
          title={ad.titulo}
        >
          <span className="lateral-slot-badge">{slotName} · PATROCINADOR</span>
          <div className="lateral-slot-overlay">
            <strong>{ad.titulo}</strong>
            {ad.linkUrl && <small>Conhecer parceiro ↗</small>}
          </div>
        </a>
      );
    }

    return (
      <div className={`lateral-slot lateral-slot--${slot}`} key={`lateral-block-${slot}`}>
        <span className="lateral-slot-badge">{slotName} · DISPONÍVEL</span>
        <strong>{ad.titulo || defaultTitle}</strong>
        <small>{cidade !== "Geral" ? `Anuncie com destaque em ${cidade}` : "Espaço configurável no painel"}</small>
        <a href="/admin" className="lateral-slot-link">Configurar no painel →</a>
      </div>
    );
  };

  return (
    <main className="site-shell">
      <div className="topline"><div className="container topline-inner"><WeatherTicker /><a href="/admin">Acesso da redação</a></div></div>
      <header className="site-header">
        <div className="container header-main">
          <a className="brand" href="/">
            <img src="/logo-rede-apucarana.png?v=2" alt="Logo Rede Apucarana" className="brand-mark" style={{ objectFit: "cover", width: "44px", height: "44px", padding: 0 }} />
            <span className="brand-name">REDE APUCARANA <em>DE COMUNICAÇÃO</em></span>
          </a>
          <div className="header-actions">
            <button className={`live-pill ${radioTocando ? "is-playing" : ""}`} onClick={alternarRadio} aria-pressed={radioTocando}><i /> {radioTocando ? "RÁDIO TOCANDO" : "OUVIR RÁDIO"}</button>
            <label className="search-box"><span>⌕</span><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar notícia" aria-label="Buscar notícia" /></label>
            <button className="menu-button" aria-label="Abrir menu">☰</button>
          </div>
        </div>
        <nav className="main-nav" aria-label="Navegação principal">
          <div className="container nav-inner">
            <button className={aba === "noticias" ? "active" : ""} onClick={() => setAba("noticias")}>Notícias</button>
            <a href="/tv-online" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} /> TV Online</a>
            <button className={aba === "videos" ? "active" : ""} onClick={() => setAba("videos")}>Vídeos</button>
            <button className={aba === "ondeir" ? "active" : ""} onClick={() => setAba("ondeir")}>Onde Ir</button>
            <button className={aba === "empregos" ? "active" : ""} onClick={() => setAba("empregos")}>Empregos</button>
            <button className={aba === "compras" ? "active" : ""} onClick={() => setAba("compras")}>Compras e vendas</button>
            <button className={aba === "promocoes" ? "active" : ""} onClick={() => setAba("promocoes")}>Promoções</button>
          </div>
        </nav>
        <div className="city-nav" aria-label="Cidades"><div className="container city-scroll"><button className={cidade === "Geral" ? "active" : ""} onClick={() => setCidade("Geral")}>Geral</button>{cidades.filter((c) => c !== "Geral").map((c) => <a key={c} className={cidade === c ? "active" : ""} href={`/cidades/${cidadeSlug(c)}`}>{c}</a>)}</div></div>
      </header>
      <audio ref={radioRef} src={RADIO_STREAM_URL} preload="none" />

      <section className="container top-banner" aria-label="Banner Rede Apucarana de Comunicação">
        <div className="top-banner-frame">
          <img src="/banner-rede-apucarana.png?v=2" alt="Rede Apucarana de Comunicação — Jornalismo, Podcast, Rádio, Web TV e Portal" />
        </div>
      </section>

      {aba === "noticias" && <>
        <div className="container category-scroll">{categorias.map((c) => <button key={c} className={categoria === c ? "active" : ""} onClick={() => setCategoria(c)}>{c}</button>)}</div>
        <section className="container content-grid">
          <div className="main-column">
            <div className="headline-layout">
              {destaque ? (
                <a className="hero-story" href={`/noticias/${encodeURIComponent(destaque.slug || destaque.id)}`}>
                  {destaque.img ? <img className="hero-image" src={destaque.img} alt={`Imagem da notícia: ${destaque.titulo}`} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div className="hero-image hero-image--empty" aria-label="Imagem não fornecida pela fonte"><span>Imagem não fornecida pela fonte</span></div>}
                  <span className="hero-copy">
                    <span className="hero-featured-label">{cidade !== "Geral" ? `DESTAQUE EM ${cidade.toUpperCase()}` : "DESTAQUE DA REDAÇÃO"}</span>
                    <span className="card-kicker"><Badge>{destaque.cat}</Badge><span>{destaque.cidade} · {destaque.hora}</span></span>
                    <strong>{destaque.titulo}</strong>
                    <span>{destaque.sub}</span>
                    <small>Leia a matéria completa <b>→</b></small>
                  </span>
                </a>
              ) : (
                <div className="empty-state">
                  {carregandoNoticias ? "Carregando notícias mais recentes…" : `Ainda não há notícias cadastradas para ${cidade}. O conteúdo publicado pela redação aparecerá aqui.`}
                </div>
              )}
              {menores.length > 0 && <div className="headline-side">{menores.map((n) => <NewsCard key={n.id} noticia={n} compact />)}</div>}
            </div>
            {(() => { const ad = currentMainAds[0]; return <div className="homepage-main-ad" aria-label="Publicidade Principal 1">{ad.imagem ? <a href={ad.linkUrl || "/admin"} target={ad.linkUrl ? "_blank" : undefined} rel="noreferrer"><img src={ad.imagem} alt={ad.titulo} /><span>PUBLICIDADE PRINCIPAL 1</span></a> : <div><span>PUBLICIDADE PRINCIPAL 1</span><strong>Seu anunciante pode ocupar este destaque.</strong><small>{cidade !== "Geral" ? `Anuncie com destaque em ${cidade}.` : "Configure o anúncio no painel da redação."}</small><a href="/admin">Configurar espaço →</a></div>}</div>; })()}
            {menores.length > 0 && <section className="news-section mobile-more-news"><div className="section-heading"><span>Mais notícias de {cidade}</span><i /></div><div className="news-grid">{menores.map((n) => <NewsCard key={n.id} noticia={n} />)}</div></section>}
            <WeatherShowcase />
            <section className="news-section latest-section">
              <div className="section-heading">
                <span>{cidade !== "Geral" ? `Últimas notícias de ${cidade}` : "Últimas notícias"}</span>
                <i />
                <a href="#ultimas">Ver todas →</a>
              </div>
              <div className="latest-visual-grid" id="ultimas">
                {primeirasUltimas.map((n) => <NewsCard key={n.id} noticia={n} />)}
              </div>
            </section>
            {(() => { const ad = currentMainAds[1]; return <div className="homepage-main-ad homepage-main-ad--middle" aria-label="Publicidade Principal 2">{ad.imagem ? <a href={ad.linkUrl || "/admin"} target={ad.linkUrl ? "_blank" : undefined} rel="noreferrer"><img src={ad.imagem} alt={ad.titulo} /><span>PUBLICIDADE PRINCIPAL 2</span></a> : <div><span>PUBLICIDADE PRINCIPAL 2</span><strong>Espaço comercial do meio da página.</strong><small>{cidade !== "Geral" ? `Anuncie no meio da página de ${cidade}.` : "Configure a imagem no painel da redação."}</small><a href="/admin">Configurar espaço →</a></div>}</div>; })()}
            {todas.filter((n) => n.cat.toLowerCase() === "esportes" && ((cidade === "Geral" || cidade === "Todas") || n.cidade.toLowerCase() === cidade.toLowerCase())).length > 0 && <section className="news-section sports-break"><div className="section-heading"><span>Esportes</span><i /><a href="#esportes">Ver todas →</a></div><div className="latest-visual-grid" id="esportes">{todas.filter((n) => n.cat.toLowerCase() === "esportes" && ((cidade === "Geral" || cidade === "Todas") || n.cidade.toLowerCase() === cidade.toLowerCase())).slice(0, 6).map((n) => <NewsCard key={`esporte-${n.id}`} noticia={n} />)}</div></section>}
            {restantesUltimas.length > 0 && (
              <section className="news-section visual-news-section">
                <div className="section-heading"><span>Mais notícias de {cidade}</span><i /></div>
                <div className="latest-visual-grid">{restantesUltimas.map((n) => <NewsCard key={n.id} noticia={n} />)}</div>
              </section>
            )}
            {filtradas.length > 3 && (
              <div className="load-more-container">
                {temMaisNoticias ? (
                  <button
                    type="button"
                    className="load-more-button"
                    onClick={() => setLimiteNoticias((prev) => prev + 12)}
                  >
                    <span>+</span> Carregar mais notícias ({filtradas.length - limiteNoticias} disponíveis)
                  </button>
                ) : (
                  <span className="load-more-end">
                    ✓ Você visualizou todas as notícias recentes de {cidade}
                  </span>
                )}
              </div>
            )}
            {(() => { const ad = currentMainAds[2]; return <div className="homepage-main-ad homepage-main-ad--bottom" aria-label="Publicidade Principal 3">{ad.imagem ? <a href={ad.linkUrl || "/admin"} target={ad.linkUrl ? "_blank" : undefined} rel="noreferrer"><img src={ad.imagem} alt={ad.titulo} /><span>PUBLICIDADE PRINCIPAL 3</span></a> : <div><span>PUBLICIDADE PRINCIPAL 3</span><strong>Espaço comercial no final da página.</strong><small>{cidade !== "Geral" ? `Anuncie no final da página de ${cidade}.` : "Configure a imagem no painel da redação."}</small><a href="/admin">Configurar espaço →</a></div>}</div>; })()}
          </div>
          <aside className="sidebar">
            <div className="lateral-heading"><span>CONTEÚDO LATERAL</span><a href="/admin">Configurar no painel →</a></div>
            {renderTvLoop(0)}
            <div className="lateral-slot-stack lateral-break">
              {renderLateralBlock("lg1")}
              {renderLateralBlock("lm1")}
            </div>
            {renderTvLoop(1)}
            <div className="lateral-slot-stack lateral-break">
              {renderLateralBlock("lg2")}
              {renderLateralBlock("lm2")}
            </div>
            <LargeSponsorCarousel sponsors={sponsors} />
            {renderTvLoop(2)}

            {/* HORÓSCOPO INTERATIVO */}
            <div className="horoscope-sidebar-card" id="horoscopo">
              <div className="horoscope-sidebar-head">
                <span className="eyebrow">PREVISÃO DO DIA</span>
                <strong>Horóscopo do Dia</strong>
                <p>Clique no seu signo para abrir a previsão de hoje:</p>
              </div>
              <div className="horoscope-signs-grid">
                {horoscopoSignos.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    className="horoscope-sign-btn"
                    onClick={() => setSignoAberto(s)}
                    title={`Ver previsão de ${s.nome}`}
                  >
                    <span className="horoscope-sign-glyph">{s.simbolo}</span>
                    <span className="horoscope-sign-name">{s.nome}</span>
                    <span className="horoscope-sign-date">{s.periodo.split(" a ")[0]}</span>
                  </button>
                ))}
              </div>
              <a href="/horoscopo" className="horoscope-sidebar-footer">
                Ver todos os 12 signos na íntegra →
              </a>
            </div>

            <div className="lateral-slot-stack lateral-break"><div className="lateral-slot lateral-slot--l3m"><span>IMAGEM L3 M</span><strong>Patrocínio regional</strong><small>Espaço próximo ao final da página</small></div></div>
            <div className="ad-slot"><span>ESPAÇO COMERCIAL</span><strong>Sua marca aparece aqui.</strong><p>Use este espaço para campanhas, ofertas e vídeos dos parceiros da Rede Apucarana.</p><a href="mailto:comercial@redeapucarana.com.br">Falar com a redação →</a></div>
            {grupoWhatsApp && <a className="whatsapp-card" href={grupoWhatsApp} target="_blank" rel="noreferrer"><span>COMUNIDADE REDE APUCARANA</span><strong>Entre no grupo do WhatsApp</strong><small>Receba avisos e notícias importantes da região.</small><b>Entrar no grupo →</b></a>}
            <div className="flash-card"><span className="flash-label">FLASH</span><strong>Informação regional em movimento.</strong><p>Notícias, serviços e oportunidades para acompanhar ao longo do dia.</p></div>
            <div className="newsletter-card"><span className="eyebrow">RECEBA AS NOTÍCIAS</span><strong>Informação local no seu e-mail.</strong><p>As principais notícias de Apucarana e região, sem excesso.</p><button>Quero receber</button></div>
          </aside>
        </section>
      </>}

      {aba === "videos" && <section className="container utility-page video-page"><span className="eyebrow">CORTES DA REDE APUCARANA</span><h2>Vídeos de {cidade}</h2><p className="video-page-intro">Assista aos cortes das matérias diretamente no portal. Vídeos enviados pela redação e publicações públicas do Instagram aparecem aqui sem você precisar sair da página.</p><div className="video-grid">{videosAdmin.filter((v) => v.categoria !== "Publicidade" && ((cidade === "Geral" || cidade === "Todas") || v.cidade.toLowerCase() === cidade.toLowerCase())).map((video) => <article className="video-card" key={video.id}><VideoPlayer video={video} /><div className="video-card-copy"><span className="card-kicker"><Badge>{video.categoria}</Badge><span>{video.cidade}</span></span><h3>{video.titulo}</h3><p>{video.descricao}</p><small>{video.publishedAt ? new Date(video.publishedAt).toLocaleDateString("pt-BR") : "Agora"}{video.materiaUrl && <> · <a href={video.materiaUrl}>Ler matéria</a></>}</small><a className="video-open-link" href={`/videos/${video.id}`}>Abrir página e compartilhar →</a></div></article>)}{!videosAdmin.filter((v) => v.categoria !== "Publicidade" && ((cidade === "Geral" || cidade === "Todas") || v.cidade.toLowerCase() === cidade.toLowerCase())).length && <div className="empty-state">Ainda não há vídeos publicados para {cidade}. A redação pode cadastrar cortes pelo painel administrativo.</div>}</div></section>}

      {aba === "ondeir" && <section className="container utility-page"><span className="eyebrow">GUIA REGIONAL</span><h2>Onde ir em {cidade}</h2><div className="public-list-grid">{locaisAdmin.filter((l: any) => (cidade === "Geral" || cidade === "Todas") || l.cidade.toLowerCase() === cidade.toLowerCase()).map((l: any) => <button className="public-list-card" key={l.id} onClick={() => setSel({ id: l.id, titulo: l.nome, cidade: l.cidade, cat: l.cat, sub: l.end, resumo: l.detalhes || "Confira os detalhes deste local.", texto: l.detalhes || "Confira os detalhes deste local.", img: l.img || noticiasFixas[1].img, hora: "", autor: "Guia Rede Apucarana", credit: "Imagem enviada pelo anunciante" })}><img src={l.img || noticiasFixas[1].img} alt={`Imagem de ${l.nome}`} /><span><b>{l.cat}</b><strong>{l.nome}</strong><small>{l.cidade} · {l.end}</small></span></button>)}{!locaisAdmin.filter((l: any) => (cidade === "Geral" || cidade === "Todas") || l.cidade.toLowerCase() === cidade.toLowerCase()).length && <div className="empty-state">Em breve, lugares, serviços e experiências em {cidade}.</div>}</div></section>}

      {aba === "empregos" && <section className="container utility-page jobs-page"><span className="eyebrow">OPORTUNIDADES</span><h2>Vagas em {cidade}</h2><p className="jobs-intro">Empresas podem publicar oportunidades e pedidos de contratação. Todo envio passa pela revisão da equipe Rede Apucarana antes de aparecer no portal.</p><div className="jobs-layout"><form className="jobs-form" onSubmit={(event) => { event.preventDefault(); void enviarVaga(); }}><h3>Publicar uma vaga</h3><input required placeholder="Cargo ou função" value={jobForm.vaga} onChange={(e) => setJobForm({ ...jobForm, vaga: e.target.value })} /><input required placeholder="Empresa ou contratante" value={jobForm.empresa} onChange={(e) => setJobForm({ ...jobForm, empresa: e.target.value })} /><div className="form-row"><select value={jobForm.cidade} onChange={(e) => setJobForm({ ...jobForm, cidade: e.target.value })}>{cidades.filter((item) => item !== "Todas").map((item) => <option key={item}>{item}</option>)}</select><select value={jobForm.tipo} onChange={(e) => setJobForm({ ...jobForm, tipo: e.target.value })}>{["Precisa-se", "Contratação", "Estágio / Jovem Aprendiz"].map((item) => <option key={item}>{item}</option>)}</select></div><input required placeholder="WhatsApp ou telefone para candidatura" value={jobForm.contato} onChange={(e) => setJobForm({ ...jobForm, contato: e.target.value })} /><textarea required placeholder="Descreva requisitos, salário, horário e como se candidatar" value={jobForm.descricao} onChange={(e) => setJobForm({ ...jobForm, descricao: e.target.value })} /><button className="classified-submit" type="submit" disabled={enviandoJob}>{enviandoJob ? "Enviando..." : "Enviar vaga para análise"}</button>{jobEnviado && <p className="classified-success">Recebemos a vaga. Ela ficará visível depois da revisão da equipe.</p>}</form><div className="jobs-side-note"><strong>Você é autônomo?</strong><p>Para oferecer seu próprio serviço, anuncie em Compras e vendas. Essa área é ideal para profissionais, prestadores e autônomos.</p><button type="button" onClick={() => setAba("compras")}>Oferecer serviço em Compras e vendas →</button></div></div><div className="public-list-grid">{vagasAdmin.filter((v: any) => (cidade === "Geral" || cidade === "Todas") || v.cidade.toLowerCase() === cidade.toLowerCase()).map((v: any) => <button className="public-list-card" key={v.id} onClick={() => setSel({ id: v.id, titulo: v.cargo, cidade: v.cidade, cat: "Emprego", sub: v.empresa, resumo: v.detalhes || "Confira os detalhes desta oportunidade.", texto: v.detalhes || "Confira os detalhes desta oportunidade.", img: v.img || "https://www.redeapucarana.com.br/vagas-padrao.svg", hora: "", autor: v.empresa || "Rede Apucarana", credit: "Capa padrão Rede Apucarana" })}><img src={v.img || "https://www.redeapucarana.com.br/vagas-padrao.svg"} alt={`Imagem da vaga: ${v.cargo}`} /><span><b>Emprego</b><strong>{v.cargo}</strong><small>{v.empresa} · {v.cidade}</small><small>{v.detalhes || "Clique para ver detalhes"}</small><a href={`https://wa.me/${(v.zap || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Chamar no WhatsApp</a></span></button>)}{!vagasAdmin.filter((v: any) => (cidade === "Geral" || cidade === "Todas") || v.cidade.toLowerCase() === cidade.toLowerCase()).length && <div className="empty-state">Em breve, oportunidades de trabalho em {cidade}.</div>}</div></section>}

      {aba === "compras" && <section className="container utility-page classifieds-page"><span className="eyebrow">CLASSIFICADOS REGIONAIS</span><h2>Compre, venda e anuncie em {cidade}.</h2><p className="classified-intro">Preencha os dados do seu anúncio. A equipe Rede Apucarana revisa o conteúdo antes de publicar no portal.</p><div className="classified-layout"><form className="classified-form" onSubmit={(event) => { event.preventDefault(); void enviarClassificado(); }}><h3>Enviar um anúncio</h3><input required placeholder="O que você está vendendo?" value={classifForm.titulo} onChange={(e) => setClassifForm({ ...classifForm, titulo: e.target.value })} /><div className="form-row"><select value={classifForm.cidade} onChange={(e) => setClassifForm({ ...classifForm, cidade: e.target.value })}>{cidades.filter((item) => item !== "Todas").map((item) => <option key={item}>{item}</option>)}</select><select value={classifForm.categoria} onChange={(e) => setClassifForm({ ...classifForm, categoria: e.target.value })}>{["Imóveis", "Veículos", "Eletrônicos", "Móveis", "Celulares", "Outros"].map((item) => <option key={item}>{item}</option>)}</select></div><div className="form-row"><input placeholder="Valor (ex.: R$ 1.500)" value={classifForm.preco} onChange={(e) => setClassifForm({ ...classifForm, preco: e.target.value })} /><input required placeholder="WhatsApp ou telefone" value={classifForm.contato} onChange={(e) => setClassifForm({ ...classifForm, contato: e.target.value })} /></div><textarea required placeholder="Descreva o produto, estado de conservação e detalhes" value={classifForm.descricao} onChange={(e) => setClassifForm({ ...classifForm, descricao: e.target.value })} /><label className="public-image-field"><span>Foto do anúncio (opcional, até 1,5 MB)</span><input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 1_500_000) return alert("Escolha uma imagem de até 1,5 MB."); const reader = new FileReader(); reader.onload = () => setClassifForm({ ...classifForm, imagem: String(reader.result) }); reader.readAsDataURL(file); }} />{classifForm.imagem && <img src={classifForm.imagem} alt="Prévia do anúncio" />}</label><button className="classified-submit" type="submit" disabled={enviandoClassif}>{enviandoClassif ? "Enviando..." : "Enviar para análise"}</button>{classifEnviado && <p className="classified-success">Recebemos seu anúncio. Ele ficará visível depois da revisão da equipe.</p>}</form><div className="classified-list"><div className="section-heading"><span>Anúncios publicados em {cidade}</span><i /></div><div className="public-list-grid">{classifAdmin.filter((c: any) => (cidade === "Geral" || cidade === "Todas") || c.cidade.toLowerCase() === cidade.toLowerCase()).map((c: any) => <button className="public-list-card" key={c.id} onClick={() => setSel({ id: c.id, titulo: c.titulo, cidade: c.cidade, cat: c.cat, sub: c.preco, resumo: c.detalhes || "Veja os detalhes deste anúncio.", texto: c.detalhes || "Veja os detalhes deste anúncio.", img: c.img || noticiasFixas[2].img, hora: "", autor: "Anunciante", credit: "Imagem enviada pelo anunciante" })}><img src={c.img || noticiasFixas[2].img} alt={`Imagem do anúncio: ${c.titulo}`} /><span><b>{c.cat}</b><strong>{c.titulo}</strong><small>{c.cidade} · {c.preco}</small></span></button>)}{!classifAdmin.filter((c: any) => (cidade === "Geral" || cidade === "Todas") || c.cidade.toLowerCase() === cidade.toLowerCase()).length && <div className="empty-state">Ainda não há anúncios publicados para {cidade}.</div>}</div></div></div></section>}

      {aba === "promocoes" && <section className="container utility-page"><span className="eyebrow">OFERTAS DA REGIÃO</span><h2>Promoções em {cidade}</h2><div className="public-list-grid">{promocoesAdmin.filter((p: any) => (cidade === "Geral" || cidade === "Todas") || p.cidade.toLowerCase() === cidade.toLowerCase()).map((p: any) => <button className="public-list-card" key={p.id} onClick={() => setSel({ id: p.id, titulo: p.titulo, cidade: p.cidade, cat: p.categoria, sub: p.validade, resumo: p.detalhes || "Confira os detalhes desta promoção.", texto: p.detalhes || "Confira os detalhes desta promoção.", img: p.img || noticiasFixas[3].img, hora: "", autor: "Rede Apucarana", credit: "Imagem enviada pelo anunciante" })}><img src={p.img || noticiasFixas[3].img} alt={`Imagem da promoção: ${p.titulo}`} /><span><b>{p.categoria}</b><strong>{p.titulo}</strong><small>{p.cidade} · {p.validade}</small></span></button>)}{!promocoesAdmin.filter((p: any) => (cidade === "Geral" || cidade === "Todas") || p.cidade.toLowerCase() === cidade.toLowerCase()).length && <div className="empty-state">Ainda não há promoções cadastradas para {cidade}.</div>}</div></section>}

      <footer className="site-footer"><div className="container footer-grid"><div><a className="brand brand--footer" href="/"><img src="/logo-rede-apucarana.png?v=2" alt="Logo Rede Apucarana" className="brand-mark" style={{ objectFit: "cover", width: "40px", height: "40px", padding: 0 }} /><span>REDE APUCARANA</span></a><p>Jornalismo regional para Apucarana e todo o Norte do Paraná.</p></div><div><strong>Redação</strong><a href="/admin">Acesso da redação</a><a href="#">Quem somos</a><a href="#">Contato</a></div><div><strong>Transparência</strong><a href="#">Política de correções</a><a href="#">Privacidade e LGPD</a><a href="#">Publicidade</a></div></div><div className="container footer-bottom"><span>© 2026 Rede Apucarana de Comunicação</span><span>Feito para informar a região.</span></div></footer>

      <HoroscopeModal
        signo={signoAberto}
        signos={horoscopoSignos}
        onClose={() => setSignoAberto(null)}
        onSelectSigno={(s) => setSignoAberto(s)}
      />
    </main>
  );
}
