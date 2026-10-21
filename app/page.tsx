"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabase } from "../lib/supabase";

type Noticia = {
  id: string;
  cidade: string;
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

const cidades = ["Todas", "Apucarana", "Arapongas", "Arapuã", "Ariranha do Ivaí", "Bom Sucesso", "Borrazópolis", "Califórnia", "Cambira", "Cruzmaltina", "Faxinal", "Godoy Moreira", "Grandes Rios", "Ivaiporã", "Jandaia do Sul", "Jardim Alegre", "Kaloré", "Lidianópolis", "Lunardelli", "Marilândia do Sul", "Marumbi", "Mauá da Serra", "Novo Itacolomi", "Rio Bom", "Rio Branco do Ivaí", "Rosário do Ivaí", "São João do Ivaí", "São Pedro do Ivaí"];
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

  return <div className="weather-ticker"><span className="ticker-brand">REDE NORTE DO PARANÁ <b>·</b> CONECTANDO TODO O VALE DO IVAÍ</span><span className="ticker-date">{dataCapitalizada} · {hora}</span><span className="ticker-weather"><span className="ticker-live">AGORA</span><i>{icon}</i><strong>{atual?.cidade || "Vale do Ivaí"}</strong>{atual?.temperatura !== null && atual?.temperatura !== undefined ? <b>{atual.temperatura}°C</b> : <small>{condition}</small>}<em>{condition}</em></span></div>;
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
    autor: "Redação Rede Norte",
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
    autor: "Redação Rede Norte",
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
    autor: "Redação Rede Norte",
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
    autor: "Redação Rede Norte",
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
    cidade: n.cidade || "Apucarana",
    cat: n.cat || "Cidade",
    titulo: n.titulo || "Nova notícia",
    sub: n.resumo || "Confira os principais detalhes desta notícia.",
    resumo: n.resumo || "Confira os principais detalhes desta notícia.",
    texto: n.texto || n.resumo || "Confira os principais detalhes desta notícia.",
    img: n.img || noticiasFixas[index % noticiasFixas.length].img,
    hora: n.hora || "Agora",
    autor: n.autor || "Redação Rede Norte",
    credit: n.credit || "Imagem ilustrativa",
  }));
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="news-badge">{children}</span>;
}

function NewsCard({ noticia, onOpen, compact = false }: { noticia: Noticia; onOpen: (n: Noticia) => void; compact?: boolean }) {
  return (
    <button className={`news-card ${compact ? "news-card--compact" : ""}`} onClick={() => onOpen(noticia)}>
      <img src={noticia.img || noticiasFixas[0].img} alt={`Imagem ilustrativa da notícia: ${noticia.titulo}`} loading="lazy" />
      <span className="card-content">
        <span className="card-kicker"><Badge>{noticia.cat}</Badge><span>{noticia.cidade}</span></span>
        <strong>{noticia.titulo}</strong>
        {!compact && <span className="card-summary">{noticia.sub}</span>}
        <span className="card-meta">{noticia.hora || "Agora"} · {noticia.autor || "Redação Rede Norte"}</span>
      </span>
    </button>
  );
}

function VideoPlayer({ video }: { video: Video }) {
  if (video.tipo === "instagram" && video.instagramUrl) {
    return <div className="video-embed-wrap"><iframe src={instagramEmbedUrl(video.instagramUrl)} title={video.titulo} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen /><a href={video.instagramUrl} target="_blank" rel="noreferrer">Abrir publicação original no Instagram ↗</a></div>;
  }
  return <video className="video-native" controls playsInline preload="metadata" poster={video.thumbnailUrl || undefined}><source src={video.videoUrl} type="video/mp4" />Seu navegador não suporta vídeo HTML5.</video>;
}

export default function Page() {
  const [cidade, setCidade] = useState("Todas");
  const [aba, setAba] = useState("noticias");
  const [categoria, setCategoria] = useState("Todas");
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
  const [grupoWhatsApp, setGrupoWhatsApp] = useState("");
  const [classifForm, setClassifForm] = useState({ titulo: "", cidade: "Apucarana", categoria: "Outros", preco: "", contato: "", descricao: "", imagem: "" });
  const [enviandoClassif, setEnviandoClassif] = useState(false);
  const [classifEnviado, setClassifEnviado] = useState(false);
  const [jobForm, setJobForm] = useState({ vaga: "", empresa: "", cidade: "Apucarana", tipo: "Precisa-se", contato: "", descricao: "" });
  const [enviandoJob, setEnviandoJob] = useState(false);
  const [jobEnviado, setJobEnviado] = useState(false);
  const [radioTocando, setRadioTocando] = useState(false);
  const radioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    try {
      const n = localStorage.getItem("rn_noticias"); if (n) setNoticiasAdmin(JSON.parse(n).filter(noticiaValida));
      const l = localStorage.getItem("rn_locais"); if (l) setLocaisAdmin(JSON.parse(l));
      const v = localStorage.getItem("rn_vagas"); if (v) setVagasAdmin(JSON.parse(v));
      const c = localStorage.getItem("rn_classif"); if (c) setClassifAdmin(JSON.parse(c));
      const p = localStorage.getItem("rn_promocoes"); if (p) setPromocoesAdmin(JSON.parse(p));
    } catch { /* mantém conteúdo inicial */ }

    const supabase = getSupabase();
    if (!supabase) {
      setCarregandoNoticias(false);
      return;
    }

    const carregarDados = async () => {
      const [{ data: news }, { data: cities }, { data: services }, { data: jobs }, { data: ads }, { data: promotions }, { data: videos }, { data: sponsorData }, { data: settingData }] = await Promise.all([
        supabase.from("news").select("id,titulo,categoria,conteudo,resumo,imagem,cidade_slug,autor,published_at").eq("status", "published").order("published_at", { ascending: false }),
        supabase.from("cities").select("slug,nome"),
        supabase.from("service_providers").select("id,nome,categoria,cidade_slug,endereco,whatsapp,imagem,descricao").eq("verificado", true),
        supabase.from("jobs").select("id,vaga,empresa,cidade_slug,contato,imagem,descricao").eq("status", "published"),
        supabase.from("classified_ads").select("id,titulo,categoria,cidade_slug,preco,contato,imagem,descricao").eq("status", "published"),
        supabase.from("promotions").select("id,titulo,categoria,cidade_slug,validade,contato,imagem,detalhes").eq("status", "published"),
        supabase.from("videos").select("id,titulo,descricao,video_url,thumbnail_url,instagram_url,cidade_slug,categoria,materia_url,tipo,published_at").eq("status", "published").order("published_at", { ascending: false }),
        supabase.from("site_sponsors").select("id,titulo,imagem,link_url,ordem").eq("ativo", true).order("ordem").limit(12),
        supabase.from("site_settings").select("key,value").eq("key", "whatsapp_group_url").maybeSingle(),
      ]);
      const cityMap = new Map((cities || []).map((city: any) => [city.slug, city.nome]));
      if (news) setNoticiasAdmin(news.filter(noticiaValida).map((n: any) => ({
        id: n.id,
        cidade: cityMap.get(n.cidade_slug) || n.cidade_slug || "Geral",
        cat: n.categoria || "Cidade",
        titulo: n.titulo,
        resumo: resumoSeguro(n.conteudo, n.resumo),
        texto: n.conteudo || n.resumo || "",
        img: n.imagem || "",
        hora: n.published_at ? new Date(n.published_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Agora",
        autor: n.autor || "Redação Rede Norte",
      })));
      if (services?.length) setLocaisAdmin(services.map((item: any) => ({ id: item.id, nome: item.nome, cidade: cityMap.get(item.cidade_slug) || "Apucarana", cat: item.categoria, end: item.endereco || "", zap: item.whatsapp || "", img: item.imagem || "", detalhes: item.descricao || "" })));
      if (jobs?.length) setVagasAdmin(jobs.map((item: any) => ({ id: item.id, cargo: item.vaga, empresa: item.empresa, cidade: cityMap.get(item.cidade_slug) || "Apucarana", zap: item.contato || "", img: item.imagem || "", detalhes: item.descricao || "" })));
      if (ads?.length) setClassifAdmin(ads.map((item: any) => ({ id: item.id, titulo: item.titulo, cidade: cityMap.get(item.cidade_slug) || "Apucarana", cat: item.categoria, preco: item.preco || "", zap: item.contato || "", img: item.imagem || "", detalhes: item.descricao || "" })));
      if (promotions?.length) setPromocoesAdmin(promotions.map((item: any) => ({ id: item.id, titulo: item.titulo, cidade: cityMap.get(item.cidade_slug) || "Apucarana", categoria: item.categoria, validade: item.validade || "", contato: item.contato || "", img: item.imagem || "", detalhes: item.detalhes || "" })));
      setVideosAdmin((videos || []).map((item: any) => ({ id: item.id, titulo: item.titulo, descricao: item.descricao || "Confira este corte da Rede Norte.", cidade: cityMap.get(item.cidade_slug) || "Geral", categoria: item.categoria || "Matéria", videoUrl: item.video_url || "", thumbnailUrl: item.thumbnail_url || "", instagramUrl: item.instagram_url || "", materiaUrl: item.materia_url || "", tipo: item.tipo === "instagram" ? "instagram" : "upload", publishedAt: item.published_at })));
      setSponsors((sponsorData || []).map((item: any) => ({ id: item.id, titulo: item.titulo, imagem: item.imagem, linkUrl: item.link_url || "", ordem: item.ordem || 0 })));
      setGrupoWhatsApp(settingData?.value || "");
      setCarregandoNoticias(false);
    };

    carregarDados().catch(() => setCarregandoNoticias(false));
    const intervalo = window.setInterval(() => { void carregarDados(); }, 60_000);
    const aoVoltarParaPagina = () => { if (document.visibilityState === "visible") void carregarDados(); };
    document.addEventListener("visibilitychange", aoVoltarParaPagina);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltarParaPagina);
    };
  }, []);

  const todas = carregandoNoticias ? [] : (noticiasAdmin.length ? formatarNoticiasAdmin(noticiasAdmin.filter(noticiaValida)) : noticiasFixas);
  const filtradas = useMemo(() => todas.filter((n) => {
    const passaCidade = cidade === "Todas" || n.cidade === cidade;
    const passaCategoria = categoria === "Todas" || n.cat === categoria;
    const termo = busca.trim().toLowerCase();
    const passaBusca = !termo || `${n.titulo} ${n.resumo} ${n.cidade} ${n.cat}`.toLowerCase().includes(termo);
    return passaCidade && passaCategoria && passaBusca;
  }), [todas, cidade, categoria, busca]);

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
    setClassifForm({ titulo: "", cidade: "Apucarana", categoria: "Outros", preco: "", contato: "", descricao: "", imagem: "" });
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
    setJobForm({ vaga: "", empresa: "", cidade: "Apucarana", tipo: "Precisa-se", contato: "", descricao: "" });
    setJobEnviado(true);
  };

  if (sel) {
    return (
      <main className="article-page">
        <header className="article-header">
          <button className="back-button" onClick={() => setSel(null)}>← Voltar às notícias</button>
          <a className="brand brand--small" href="/" onClick={(e) => { e.preventDefault(); setSel(null); }}><span className="brand-mark">RN</span><span>REDE NORTE</span></a>
          <span className="article-header-status"><i /> Jornalismo regional</span>
        </header>
        <article className="article-shell">
          <div className="article-breadcrumb">Início / {sel.cat} / {sel.cidade}</div>
          <div className="article-category"><Badge>{sel.cat}</Badge><span>{sel.cidade}</span></div>
          <h1>{sel.titulo}</h1>
          <p className="article-dek">{sel.sub}</p>
          <div className="article-byline"><span className="avatar">RN</span><span><strong>{sel.autor || "Redação Rede Norte"}</strong><small>Publicado hoje às {sel.hora || "09:10"} · leitura de 2 min</small></span></div>
          <figure className="article-figure"><img src={sel.img} alt={`Imagem ilustrativa da notícia: ${sel.titulo}`} /><figcaption>{sel.credit || "Imagem ilustrativa"}</figcaption></figure>
          <div className="article-body">{sel.texto.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>
          <div className="article-footer-note"><strong>Encontrou um erro?</strong><span> Fale com a redação para solicitar uma correção ou enviar informação.</span></div>
          <section className="related"><div className="section-heading"><span>Leia também</span><i /></div><div className="related-grid">{todas.filter((n) => n.id !== sel.id).slice(0, 3).map((n) => <NewsCard key={n.id} noticia={n} onOpen={setSel} compact />)}</div></section>
        </article>
      </main>
    );
  }

  const destaque = filtradas[0];
  const menores = filtradas.slice(1, 4);
  const ultimas = filtradas.slice(1, 8);
  const anuncioLoop = videosAdmin.find((video) => video.tipo === "upload" && video.categoria === "Publicidade" && video.videoUrl);

  return (
    <main className="site-shell">
      <div className="topline"><div className="container topline-inner"><WeatherTicker /><a href="/admin">Acesso da redação</a></div></div>
      <header className="site-header">
        <div className="container header-main"><a className="brand" href="/"><span className="brand-mark">RN</span><span className="brand-name">REDE NORTE <em>DO PARANÁ</em></span></a><div className="header-actions"><button className={`live-pill ${radioTocando ? "is-playing" : ""}`} onClick={alternarRadio} aria-pressed={radioTocando}><i /> {radioTocando ? "RÁDIO TOCANDO" : "OUVIR RÁDIO"}</button><label className="search-box"><span>⌕</span><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar notícia" aria-label="Buscar notícia" /></label><button className="menu-button" aria-label="Abrir menu">☰</button></div></div>
        <nav className="main-nav"><div className="container nav-inner">{[["noticias", "Notícias"], ["videos", "Vídeos"], ["ondeir", "Onde ir"], ["empregos", "Empregos"], ["compras", "Compras e vendas"], ["promocoes", "Promoções"]].map(([id, label]) => <button className={aba === id ? "active" : ""} key={id} onClick={() => setAba(id as typeof aba)}>{label}</button>)}<a className="nav-link" href="/tv-online">TV online</a></div></nav>
      </header>
      <audio ref={radioRef} preload="none" src={RADIO_STREAM_URL} onPause={() => setRadioTocando(false)} onEnded={() => setRadioTocando(false)} aria-label="Rádio Apucarana ao vivo" />

      <div className="city-nav"><div className="container city-scroll">{cidades.map((c) => <button key={c} className={cidade === c ? "active" : ""} onClick={() => setCidade(c)}>{c}</button>)}</div></div>

      <section className="container editorial-intro"><div><span className="eyebrow">REDE NORTE · JORNALISMO REGIONAL</span><h1>O que acontece perto de você.</h1></div><p>Informação local, serviço e notícias do Paraná com apuração e contexto.</p></section>

      {aba === "noticias" && <>
        <div className="container category-scroll">{categorias.map((c) => <button key={c} className={categoria === c ? "active" : ""} onClick={() => setCategoria(c)}>{c}</button>)}</div>
        <section className="container content-grid">
          <div className="main-column">
            <div className="headline-layout">
              {destaque ? <button className="hero-story" onClick={() => setSel(destaque)}><img className="hero-image" src={destaque.img || noticiasFixas[0].img} alt={`Imagem ilustrativa: ${destaque.titulo}`} /><span className="hero-copy"><span className="hero-featured-label">DESTAQUE DA REDAÇÃO</span><span className="card-kicker"><Badge>{destaque.cat}</Badge><span>{destaque.cidade} · {destaque.hora}</span></span><strong>{destaque.titulo}</strong><span>{destaque.sub}</span><small>Leia a matéria completa <b>→</b></small></span></button> : <div className="empty-state">{carregandoNoticias ? "Carregando notícias mais recentes…" : "Nenhuma notícia encontrada para os filtros selecionados."}</div>}
              {menores.length > 0 && <div className="headline-side">{menores.map((n) => <NewsCard key={n.id} noticia={n} onOpen={setSel} compact />)}</div>}
            </div>
            {menores.length > 0 && <section className="news-section mobile-more-news"><div className="section-heading"><span>Mais notícias</span><i /></div><div className="news-grid">{menores.map((n) => <NewsCard key={n.id} noticia={n} onOpen={setSel} />)}</div></section>}
            <WeatherShowcase />
            <section className="news-section latest-section"><div className="section-heading"><span>Últimas notícias</span><i /><a href="#ultimas">Ver todas →</a></div><div className="latest-visual-grid" id="ultimas">{ultimas.map((n) => <NewsCard key={n.id} noticia={n} onOpen={setSel} />)}</div></section>
          </div>
          <aside className="sidebar"><div className="ad-loop-card"><div className="live-card-head"><span><i /> Espaço Rede Norte</span><b>PUBLICIDADE</b></div>{anuncioLoop ? <video className="ad-loop-video" src={anuncioLoop.videoUrl} autoPlay muted loop playsInline preload="metadata" aria-label="Publicidade em vídeo" /> : <div className="ad-loop-empty"><span>VÍDEO EM LOOP</span><strong>Seu anúncio em destaque.</strong><small>Cadastre um vídeo com a categoria “Publicidade” no painel da redação.</small></div>}<div className="tv-mini-copy"><strong>Publicidade sem som e sem interrupção.</strong><small>O vídeo roda automaticamente em loop, de forma discreta.</small></div><a href="/admin">Carregar vídeo no painel →</a></div><div className="ad-slot"><span>ESPAÇO COMERCIAL</span><strong>Sua marca aparece aqui.</strong><p>Use este espaço para campanhas, ofertas e vídeos dos parceiros da Rede Norte.</p><a href="mailto:comercial@redenorte.com.br">Falar com a redação →</a></div><div className="sponsor-rail"><div className="section-heading"><span>Patrocinadores</span><i /></div><div className="sponsor-slider">{sponsors.map((sponsor) => <a href={sponsor.linkUrl || "#"} target={sponsor.linkUrl ? "_blank" : undefined} rel="noreferrer" key={sponsor.id}><img src={sponsor.imagem} alt={sponsor.titulo} /></a>)}</div></div>{grupoWhatsApp && <a className="whatsapp-card" href={grupoWhatsApp} target="_blank" rel="noreferrer"><span>COMUNIDADE REDE NORTE</span><strong>Entre no grupo do WhatsApp</strong><small>Receba avisos e notícias importantes da região.</small><b>Entrar no grupo →</b></a>}<div className="flash-card"><span className="flash-label">FLASH</span><strong>Informação regional em movimento.</strong><p>Notícias, serviços e oportunidades para acompanhar ao longo do dia.</p></div><div className="newsletter-card"><span className="eyebrow">RECEBA AS NOTÍCIAS</span><strong>Informação local no seu e-mail.</strong><p>As principais notícias de Apucarana e região, sem excesso.</p><button>Quero receber</button></div></aside>
        </section>
      </>}

      {aba === "videos" && <section className="container utility-page video-page"><span className="eyebrow">CORTES DA REDE NORTE</span><h2>Vídeos que contam o que acontece.</h2><p className="video-page-intro">Assista aos cortes das matérias diretamente no portal. Vídeos enviados pela redação e publicações públicas do Instagram aparecem aqui sem você precisar sair da página.</p><div className="video-grid">{videosAdmin.filter((v) => v.categoria !== "Publicidade" && (cidade === "Todas" || v.cidade === cidade)).map((video) => <article className="video-card" key={video.id}><VideoPlayer video={video} /><div className="video-card-copy"><span className="card-kicker"><Badge>{video.categoria}</Badge><span>{video.cidade}</span></span><h3>{video.titulo}</h3><p>{video.descricao}</p><small>{video.publishedAt ? new Date(video.publishedAt).toLocaleDateString("pt-BR") : "Agora"}{video.materiaUrl && <> · <a href={video.materiaUrl}>Ler matéria</a></>}</small><a className="video-open-link" href={`/videos/${video.id}`}>Abrir página e compartilhar →</a></div></article>)}{!videosAdmin.filter((v) => v.categoria !== "Publicidade").length && <div className="empty-state">Ainda não há vídeos publicados. A redação pode cadastrar cortes pelo painel administrativo.</div>}</div></section>}

      {aba === "ondeir" && <section className="container utility-page"><span className="eyebrow">GUIA REGIONAL</span><h2>Onde ir em {cidade}</h2><div className="public-list-grid">{locaisAdmin.filter((l: any) => cidade === "Todas" || l.cidade === cidade).map((l: any) => <button className="public-list-card" key={l.id} onClick={() => setSel({ id: l.id, titulo: l.nome, cidade: l.cidade, cat: l.cat, sub: l.end, resumo: l.detalhes || "Confira os detalhes deste local.", texto: l.detalhes || "Confira os detalhes deste local.", img: l.img || noticiasFixas[1].img, hora: "", autor: "Guia Rede Norte", credit: "Imagem enviada pelo anunciante" })}><img src={l.img || noticiasFixas[1].img} alt={`Imagem de ${l.nome}`} /><span><b>{l.cat}</b><strong>{l.nome}</strong><small>{l.cidade} · {l.end}</small></span></button>)}{!locaisAdmin.length && <div className="empty-state">Em breve, lugares, serviços e experiências da região.</div>}</div></section>}
      {aba === "empregos" && <section className="container utility-page jobs-page"><span className="eyebrow">OPORTUNIDADES</span><h2>Vagas em {cidade}</h2><p className="jobs-intro">Empresas podem publicar oportunidades e pedidos de contratação. Todo envio passa pela revisão da equipe Rede Norte antes de aparecer no portal.</p><div className="jobs-layout"><form className="jobs-form" onSubmit={(event) => { event.preventDefault(); void enviarVaga(); }}><h3>Publicar uma vaga</h3><input required placeholder="Cargo ou função" value={jobForm.vaga} onChange={(e) => setJobForm({ ...jobForm, vaga: e.target.value })} /><input required placeholder="Empresa ou contratante" value={jobForm.empresa} onChange={(e) => setJobForm({ ...jobForm, empresa: e.target.value })} /><div className="form-row"><select value={jobForm.cidade} onChange={(e) => setJobForm({ ...jobForm, cidade: e.target.value })}>{cidades.filter((item) => item !== "Todas").map((item) => <option key={item}>{item}</option>)}</select><select value={jobForm.tipo} onChange={(e) => setJobForm({ ...jobForm, tipo: e.target.value })}>{["Precisa-se", "Contratação", "Estágio / Jovem Aprendiz"].map((item) => <option key={item}>{item}</option>)}</select></div><input required placeholder="WhatsApp ou telefone para candidatura" value={jobForm.contato} onChange={(e) => setJobForm({ ...jobForm, contato: e.target.value })} /><textarea required placeholder="Descreva requisitos, salário, horário e como se candidatar" value={jobForm.descricao} onChange={(e) => setJobForm({ ...jobForm, descricao: e.target.value })} /><button className="classified-submit" type="submit" disabled={enviandoJob}>{enviandoJob ? "Enviando..." : "Enviar vaga para análise"}</button>{jobEnviado && <p className="classified-success">Recebemos a vaga. Ela ficará visível depois da revisão da equipe.</p>}</form><div className="jobs-side-note"><strong>Você é autônomo?</strong><p>Para oferecer seu próprio serviço, anuncie em Compras e vendas. Essa área é ideal para profissionais, prestadores e autônomos.</p><button type="button" onClick={() => setAba("compras")}>Oferecer serviço em Compras e vendas →</button></div></div><div className="public-list-grid">{vagasAdmin.filter((v: any) => cidade === "Todas" || v.cidade === cidade).map((v: any) => <button className="public-list-card" key={v.id} onClick={() => setSel({ id: v.id, titulo: v.cargo, cidade: v.cidade, cat: "Emprego", sub: v.empresa, resumo: v.detalhes || "Confira os detalhes desta oportunidade.", texto: v.detalhes || "Confira os detalhes desta oportunidade.", img: v.img || "https://www.redeapucarana.com.br/vagas-padrao.svg", hora: "", autor: v.empresa || "Rede Norte", credit: "Capa padrão Rede Norte" })}><img src={v.img || "https://www.redeapucarana.com.br/vagas-padrao.svg"} alt={`Imagem da vaga: ${v.cargo}`} /><span><b>Emprego</b><strong>{v.cargo}</strong><small>{v.empresa} · {v.cidade}</small><small>{v.detalhes || "Clique para ver detalhes"}</small><a href={`https://wa.me/${(v.zap || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Chamar no WhatsApp</a></span></button>)}{!vagasAdmin.length && <div className="empty-state">Em breve, oportunidades de trabalho da região.</div>}</div></section>}
      {aba === "compras" && <section className="container utility-page classifieds-page"><span className="eyebrow">CLASSIFICADOS REGIONAIS</span><h2>Compre, venda e anuncie.</h2><p className="classified-intro">Preencha os dados do seu anúncio. A equipe Rede Norte revisa o conteúdo antes de publicar no portal.</p><div className="classified-layout"><form className="classified-form" onSubmit={(event) => { event.preventDefault(); void enviarClassificado(); }}><h3>Enviar um anúncio</h3><input required placeholder="O que você está vendendo?" value={classifForm.titulo} onChange={(e) => setClassifForm({ ...classifForm, titulo: e.target.value })} /><div className="form-row"><select value={classifForm.cidade} onChange={(e) => setClassifForm({ ...classifForm, cidade: e.target.value })}>{cidades.filter((item) => item !== "Todas").map((item) => <option key={item}>{item}</option>)}</select><select value={classifForm.categoria} onChange={(e) => setClassifForm({ ...classifForm, categoria: e.target.value })}>{["Imóveis", "Veículos", "Eletrônicos", "Móveis", "Celulares", "Outros"].map((item) => <option key={item}>{item}</option>)}</select></div><div className="form-row"><input placeholder="Valor (ex.: R$ 1.500)" value={classifForm.preco} onChange={(e) => setClassifForm({ ...classifForm, preco: e.target.value })} /><input required placeholder="WhatsApp ou telefone" value={classifForm.contato} onChange={(e) => setClassifForm({ ...classifForm, contato: e.target.value })} /></div><textarea required placeholder="Descreva o produto, estado de conservação e detalhes" value={classifForm.descricao} onChange={(e) => setClassifForm({ ...classifForm, descricao: e.target.value })} /><label className="public-image-field"><span>Foto do anúncio (opcional, até 1,5 MB)</span><input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 1_500_000) return alert("Escolha uma imagem de até 1,5 MB."); const reader = new FileReader(); reader.onload = () => setClassifForm({ ...classifForm, imagem: String(reader.result) }); reader.readAsDataURL(file); }} />{classifForm.imagem && <img src={classifForm.imagem} alt="Prévia do anúncio" />}</label><button className="classified-submit" type="submit" disabled={enviandoClassif}>{enviandoClassif ? "Enviando..." : "Enviar para análise"}</button>{classifEnviado && <p className="classified-success">Recebemos seu anúncio. Ele ficará visível depois da revisão da equipe.</p>}</form><div className="classified-list"><div className="section-heading"><span>Anúncios publicados</span><i /></div><div className="public-list-grid">{classifAdmin.filter((c: any) => cidade === "Todas" || c.cidade === cidade).map((c: any) => <button className="public-list-card" key={c.id} onClick={() => setSel({ id: c.id, titulo: c.titulo, cidade: c.cidade, cat: c.cat, sub: c.preco, resumo: c.detalhes || "Veja os detalhes deste anúncio.", texto: c.detalhes || "Veja os detalhes deste anúncio.", img: c.img || noticiasFixas[2].img, hora: "", autor: "Anunciante", credit: "Imagem enviada pelo anunciante" })}><img src={c.img || noticiasFixas[2].img} alt={`Imagem do anúncio: ${c.titulo}`} /><span><b>{c.cat}</b><strong>{c.titulo}</strong><small>{c.cidade} · {c.preco}</small></span></button>)}{!classifAdmin.length && <div className="empty-state">Ainda não há anúncios publicados.</div>}</div></div></div></section>}
      {aba === "promocoes" && <section className="container utility-page"><span className="eyebrow">OFERTAS DA REGIÃO</span><h2>Promoções em {cidade}</h2><div className="public-list-grid">{promocoesAdmin.filter((p: any) => cidade === "Todas" || p.cidade === cidade).map((p: any) => <button className="public-list-card" key={p.id} onClick={() => setSel({ id: p.id, titulo: p.titulo, cidade: p.cidade, cat: p.categoria, sub: p.validade, resumo: p.detalhes || "Confira os detalhes desta promoção.", texto: p.detalhes || "Confira os detalhes desta promoção.", img: p.img || noticiasFixas[3].img, hora: "", autor: "Rede Norte", credit: "Imagem enviada pelo anunciante" })}><img src={p.img || noticiasFixas[3].img} alt={`Imagem da promoção: ${p.titulo}`} /><span><b>{p.categoria}</b><strong>{p.titulo}</strong><small>{p.cidade} · {p.validade}</small></span></button>)}{!promocoesAdmin.length && <div className="empty-state">Ainda não há promoções cadastradas.</div>}</div></section>}

      <footer className="site-footer"><div className="container footer-grid"><div><a className="brand brand--footer" href="/"><span className="brand-mark">RN</span><span>REDE NORTE</span></a><p>Jornalismo regional para Apucarana e todo o Norte do Paraná.</p></div><div><strong>Redação</strong><a href="/admin">Acesso da redação</a><a href="#">Quem somos</a><a href="#">Contato</a></div><div><strong>Transparência</strong><a href="#">Política de correções</a><a href="#">Privacidade e LGPD</a><a href="#">Publicidade</a></div></div><div className="container footer-bottom"><span>© 2026 Rede Norte do Paraná</span><span>Feito para informar a região.</span></div></footer>
    </main>
  );
}
