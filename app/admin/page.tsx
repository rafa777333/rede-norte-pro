"use client";

import { getYoutubeId, getInstagramCode, getInstagramEmbedUrl, getTikTokId, getVideoThumbnail } from "@/components/DarkMediaStrip";
import { useEffect, useMemo, useState } from "react";
import { cidadeSlug, getSupabase } from "../../lib/supabase";

type Tab = "capa" | "noticias" | "videos" | "ondeir" | "classificados" | "empregos" | "promocoes" | "publicidade" | "contato";
type VideoPortalAdmin = {
  id: string;
  titulo: string;
  url_video: string;
  plataforma: "youtube" | "tiktok" | "instagram" | "nativo" | string;
  thumbnail_url: string;
  status: "publicado" | "rascunho" | string;
  created_at?: string;
};

type Noticia = {
  id: string;
  titulo: string;
  cidade: string;
  cat: string;
  resumo: string;
  img: string;
  texto?: string;
  status?: string;
  facebook_status?: "nao_publicado" | "publicando" | "publicado" | "erro" | "incerto";
  facebook_post_id?: string | null;
  facebook_published_at?: string | null;
  facebook_attempted_at?: string | null;
  facebook_error?: string | null;
  instagram_status?: "nao_publicado" | "publicando" | "publicado" | "erro" | "incerto";
  instagram_container_id?: string | null;
  instagram_media_id?: string | null;
  instagram_published_at?: string | null;
  instagram_attempted_at?: string | null;
  instagram_error?: string | null;
};
type Local = { id: string; nome: string; cidade: string; cat: string; end: string; zap: string; img?: string; detalhes?: string };
type Classif = { id: string; titulo: string; cidade: string; cat: string; preco: string; zap: string; img?: string; detalhes?: string; status?: string };
type Vaga = { id: string; cargo: string; empresa: string; cidade: string; zap: string; img?: string; detalhes?: string; status?: string };
type Promocao = { id: string; titulo: string; cidade: string; categoria: string; validade: string; contato: string; img?: string; detalhes?: string };
type VideoAdmin = { id: string; titulo: string; descricao: string; cidade: string; categoria: string; videoUrl: string; thumbnailUrl: string; instagramUrl: string; materiaUrl: string; tipo: "upload" | "instagram" };
type SponsorAdmin = { id: string; titulo: string; imagem: string; linkUrl: string; ordem: number };

const CIDADES = ["Geral", "Apucarana", "Arapongas", "Arapuã", "Ariranha do Ivaí", "Bom Sucesso", "Borrazópolis", "Califórnia", "Cambira", "Cruzmaltina", "Faxinal", "Godoy Moreira", "Grandes Rios", "Ivaiporã", "Jandaia do Sul", "Jardim Alegre", "Kaloré", "Lidianópolis", "Lunardelli", "Marilândia do Sul", "Marumbi", "Mauá da Serra", "Novo Itacolomi", "Rio Bom", "Rio Branco do Ivaí", "Rosário do Ivaí", "São João do Ivaí", "São Pedro do Ivaí"];
const CAT_NOT = ["Política", "Cidade", "Segurança", "Economia", "Eventos", "Destaque"];
const CAT_ONDE = ["Restaurantes", "Lanchonetes", "Pizzarias", "Bares", "Cafés", "Serviços", "Lojas"];
const CAT_CLASS = ["Imóveis", "Veículos", "Eletrônicos", "Móveis", "Celulares", "Outros"];
const TABS: [Tab, string][] = [["capa", "🎬 Capa Principal"], ["noticias", "Notícias"], ["videos", "Vídeos"], ["ondeir", "Onde Ir"], ["classificados", "Compras e vendas"], ["empregos", "Empregos"], ["promocoes", "Promoções"], ["publicidade", "Publicidade"], ["contato", "Contato"]];

function getMainAdKeys(city: string, position: number) {
  const isGeral = city === "Geral";
  const slug = isGeral ? "" : cidadeSlug(city);
  return {
    image: isGeral ? (position === 1 ? "homepage_main_ad_image" : `homepage_main_ad_${position}_image`) : `cidade_${slug}_main_ad_${position}_image`,
    link: isGeral ? (position === 1 ? "homepage_main_ad_link" : `homepage_main_ad_${position}_link`) : `cidade_${slug}_main_ad_${position}_link`,
    title: isGeral ? (position === 1 ? "homepage_main_ad_title" : `homepage_main_ad_${position}_title`) : `cidade_${slug}_main_ad_${position}_title`,
  };
}

function getTvAdKeys(city: string, position: number) {
  const isGeral = city === "Geral";
  const slug = isGeral ? "" : cidadeSlug(city);
  return {
    video: isGeral ? `sidebar_tv_${position}_video_url` : `cidade_${slug}_tv_${position}_video_url`,
    link: isGeral ? `sidebar_tv_${position}_link_url` : `cidade_${slug}_tv_${position}_link_url`,
    title: isGeral ? `sidebar_tv_${position}_title` : `cidade_${slug}_tv_${position}_title`,
  };
}

function getLateralAdKeys(city: string, slot: "lg1" | "lm1" | "lg2" | "lm2") {
  const isGeral = city === "Geral";
  const slug = isGeral ? "" : cidadeSlug(city);
  return {
    image: isGeral ? `lateral_ad_${slot}_image` : `cidade_${slug}_lateral_ad_${slot}_image`,
    link: isGeral ? `lateral_ad_${slot}_link` : `cidade_${slug}_lateral_ad_${slot}_link`,
    title: isGeral ? `lateral_ad_${slot}_title` : `cidade_${slug}_lateral_ad_${slot}_title`,
  };
}

async function uploadImagem(valor: string, pasta: string) {
  const supabase = getSupabase();
  if (!supabase || !valor.startsWith("data:")) return valor;
  try {
    const blob = await (await fetch(valor)).blob();
    const caminho = `${pasta}/${crypto.randomUUID()}.${blob.type.split("/")[1] || "jpg"}`;
    const { error } = await supabase.storage.from("rede-norte-media").upload(caminho, blob, { contentType: blob.type });
    if (error) {
      console.warn("Storage upload failed, keeping base64/url:", error.message);
      return valor;
    }
    return supabase.storage.from("rede-norte-media").getPublicUrl(caminho).data.publicUrl;
  } catch (e) {
    console.warn("uploadImagem catch:", e);
    return valor;
  }
}

async function uploadArquivo(file: File, pasta: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const caminho = `${pasta}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("rede-norte-media").upload(caminho, file, { contentType: file.type || "video/mp4", upsert: false });
  if (error) throw error;
  return supabase.storage.from("rede-norte-media").getPublicUrl(caminho).data.publicUrl;
}

const emptyNews = {
  titulo: "",
  cidade: "Geral",
  cat: "Política",
  resumo: "",
  img: "",
  texto: "",
  exibirNoGeral: true,
  publicarFacebook: false,
  publicarInstagram: false,
};
const VIDEO_CATEGORIAS = ["Matéria", "Entrevista", "Política", "Cidade", "Segurança", "Esportes", "Serviço", "Publicidade"];
const emptyVideo = { titulo: "", descricao: "", cidade: "Apucarana", categoria: "Matéria", tipo: "upload" as "upload" | "instagram", videoUrl: "", instagramUrl: "", thumbnailUrl: "", materiaUrl: "", status: "published" };

export default function Admin() {
  const [tab, setTab] = useState<Tab>("noticias");
  const [ok, setOk] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("Todas as cidades");
  const [socialLoading, setSocialLoading] = useState<Record<string, boolean>>({});
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);
  const [classif, setClassif] = useState<Classif[]>([]);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [videos, setVideos] = useState<VideoAdmin[]>([]);
  const [sponsors, setSponsors] = useState<SponsorAdmin[]>([]);
  const [sponsorForm, setSponsorForm] = useState({ titulo: "", img: "", linkUrl: "", ordem: "0" });

  const [topBannerType, setTopBannerType] = useState<"video" | "carousel" | "image">("image");
  const [topBannerVideoUrl, setTopBannerVideoUrl] = useState("");
  const [topBannerVideoFile, setTopBannerVideoFile] = useState<File | null>(null);
  const [topBannerPosterUrl, setTopBannerPosterUrl] = useState("");
  const [topBannerImageUrl, setTopBannerImageUrl] = useState("");
  const [topBannerLinkUrl, setTopBannerLinkUrl] = useState("");
  const [topBannerAudioEnabled, setTopBannerAudioEnabled] = useState(false);
  const [topBannerUploading, setTopBannerUploading] = useState(false);
  const [topBannerSlides, setTopBannerSlides] = useState<{ id: string; imagem: string; titulo: string; linkUrl: string }[]>([]);
  const [slideForm, setSlideForm] = useState<{ imagem: string; titulo: string; linkUrl: string }>({ imagem: "", titulo: "", linkUrl: "" });

  const [adCity, setAdCity] = useState("Geral");
  const [allSettings, setAllSettings] = useState<Map<string, string>>(new Map());
  const [mainAdsForm, setMainAdsForm] = useState([1, 2, 3].map((position) => ({ titulo: `Publicidade Principal ${position}`, img: "", linkUrl: "" })));
  const [tvAdsForm, setTvAdsForm] = useState([1, 2, 3].map((position) => ({ titulo: `TV ${position}`, videoUrl: "", linkUrl: "" })));
  const [lateralAdsForm, setLateralAdsForm] = useState<Record<"lg1" | "lm1" | "lg2" | "lm2", { titulo: string; img: string; linkUrl: string }>>({
    lg1: { titulo: "Bloco LG1 (Lateral Grande 1)", img: "", linkUrl: "" },
    lm1: { titulo: "Bloco LM1 (Lateral Médio 1)", img: "", linkUrl: "" },
    lg2: { titulo: "Bloco LG2 (Lateral Grande 2)", img: "", linkUrl: "" },
    lm2: { titulo: "Bloco LM2 (Lateral Médio 2)", img: "", linkUrl: "" },
  });

  const [grupoWhatsApp, setGrupoWhatsApp] = useState("");
  const [noticiasPromovidasGeral, setNoticiasPromovidasGeral] = useState<Set<string>>(new Set());
  const [nForm, setNForm] = useState(emptyNews);
  const [lForm, setLForm] = useState({ nome: "", cidade: "Apucarana", cat: "Restaurantes", end: "", zap: "", img: "", detalhes: "" });
  const [cForm, setCForm] = useState({ titulo: "", cidade: "Apucarana", cat: "Imóveis", preco: "", zap: "", img: "", detalhes: "" });
  const [vForm, setVForm] = useState({ cargo: "", empresa: "", cidade: "Apucarana", zap: "", img: "", detalhes: "" });
  const [pForm, setPForm] = useState({ titulo: "", cidade: "Apucarana", categoria: "Comércio", validade: "", contato: "", img: "", detalhes: "" });
  const [videoForm, setVideoForm] = useState(emptyVideo);
  const [portalVideos, setPortalVideos] = useState<VideoPortalAdmin[]>([]);
  const [videoPortalForm, setVideoPortalForm] = useState({
    titulo: "",
    url_video: "",
    plataforma: "youtube" as "youtube" | "tiktok" | "instagram" | "nativo",
    thumbnail_url: "",
    status: "publicado" as "publicado" | "rascunho",
  });
  const [editVideoPortalId, setEditVideoPortalId] = useState<string | null>(null);
  const [filtroVideoPlat, setFiltroVideoPlat] = useState("todas");
  const [buscaVideo, setBuscaVideo] = useState("");
  const [previewModalVideo, setPreviewModalVideo] = useState<VideoPortalAdmin | null>(null);
  const [salvandoVideoPortal, setSalvandoVideoPortal] = useState(false);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const noticiaSendoEditada = useMemo(
    () => (editId ? noticias.find((x) => x.id === editId) : null),
    [noticias, editId]
  );

  const cidadesVisiveis = useMemo(() => CIDADES.filter((cidade) => cidade.toLowerCase().includes(citySearch.toLowerCase())), [citySearch]);
  const filterByCity = <T extends { cidade: string }>(items: T[]) => selectedCity === "Todas as cidades" ? items : items.filter((item) => item.cidade === selectedCity);
  const saveCity = (city: string) => { setSelectedCity(city); setCitySearch(""); };

  const loadAdsForCity = (city: string, map: Map<string, string>) => {
    setMainAdsForm([1, 2, 3].map((pos) => {
      const keys = getMainAdKeys(city, pos);
      return {
        titulo: String(map.get(keys.title) || (city === "Geral" ? `Publicidade Principal ${pos}` : "")),
        img: String(map.get(keys.image) || ""),
        linkUrl: String(map.get(keys.link) || ""),
      };
    }));
    setTvAdsForm([1, 2, 3].map((pos) => {
      const keys = getTvAdKeys(city, pos);
      return {
        titulo: String(map.get(keys.title) || (city === "Geral" ? `TV ${pos}` : "")),
        videoUrl: String(map.get(keys.video) || ""),
        linkUrl: String(map.get(keys.link) || ""),
      };
    }));
    const slots: ("lg1" | "lm1" | "lg2" | "lm2")[] = ["lg1", "lm1", "lg2", "lm2"];
    const latObj: any = {};
    slots.forEach((s) => {
      const keys = getLateralAdKeys(city, s);
      latObj[s] = {
        titulo: String(map.get(keys.title) || (city === "Geral" ? `Bloco ${s.toUpperCase()}` : "")),
        img: String(map.get(keys.image) || ""),
        linkUrl: String(map.get(keys.link) || ""),
      };
    });
    setLateralAdsForm(latObj);
  };

  const carregarTudo = async () => {
    const supabase = getSupabase();
    setLoading(true);
    try {
      let cities: any[] = [];
      let news: any[] = [];
      let services: any[] = [];
      let ads: any[] = [];
      let jobs: any[] = [];
      let promotions: any[] = [];
      let videosData: any[] = [];
      let sponsorData: any[] = [];
      let settingsData: any[] = [];

      if (supabase) {
        const results = await Promise.all([
          supabase.from("cities").select("slug,nome"),
          supabase.from("news").select("id,titulo,categoria,resumo,conteudo,imagem,cidade_slug,status,facebook_status,facebook_post_id,facebook_published_at,facebook_attempted_at,facebook_error,instagram_status,instagram_container_id,instagram_media_id,instagram_published_at,instagram_attempted_at,instagram_error").order("created_at", { ascending: false }),
          supabase.from("service_providers").select("id,nome,categoria,endereco,whatsapp,imagem,descricao,cidade_slug").order("created_at", { ascending: false }),
          supabase.from("classified_ads").select("id,titulo,categoria,preco,contato,imagem,descricao,cidade_slug,status").order("created_at", { ascending: false }),
          supabase.from("jobs").select("id,vaga,empresa,contato,imagem,descricao,cidade_slug,status").order("created_at", { ascending: false }),
          supabase.from("promotions").select("id,titulo,categoria,validade,contato,imagem,detalhes,cidade_slug").order("created_at", { ascending: false }),
          supabase.from("videos").select("id,titulo,descricao,video_url,thumbnail_url,instagram_url,cidade_slug,categoria,materia_url,tipo,status").order("created_at", { ascending: false }),
          supabase.from("site_sponsors").select("id,titulo,imagem,link_url,ordem").order("ordem"),
          supabase.from("site_settings").select("key,value"),
          supabase.from("videos_portal").select("*").order("created_at", { ascending: false }),
        ]);
        cities = results[0].data || [];
        news = results[1].data || [];
        services = results[2].data || [];
        ads = results[3].data || [];
        jobs = results[4].data || [];
        promotions = results[5].data || [];
        videosData = results[6].data || [];
        sponsorData = results[7].data || [];
        settingsData = results[8].data || [];
        const portalVidsData = results[9]?.data || [];
        setPortalVideos(portalVidsData);
      }

      const cityMap = new Map((cities || []).map((c: any) => [c.slug, c.nome]));
      setNoticias((news || []).map((n: any) => ({
        id: n.id,
        titulo: n.titulo,
        cidade: cityMap.get(n.cidade_slug) || "Apucarana",
        cat: n.categoria || "Cidade",
        resumo: n.resumo || "",
        texto: n.conteudo || "",
        img: n.imagem || "",
        status: n.status || "published",
        facebook_status: n.facebook_status || "nao_publicado",
        facebook_post_id: n.facebook_post_id || null,
        facebook_published_at: n.facebook_published_at || null,
        facebook_attempted_at: n.facebook_attempted_at || null,
        facebook_error: n.facebook_error || null,
        instagram_status: n.instagram_status || "nao_publicado",
        instagram_container_id: n.instagram_container_id || null,
        instagram_media_id: n.instagram_media_id || null,
        instagram_published_at: n.instagram_published_at || null,
        instagram_attempted_at: n.instagram_attempted_at || null,
        instagram_error: n.instagram_error || null,
      })));
      setLocais((services || []).map((x: any) => ({ id: x.id, nome: x.nome, cidade: cityMap.get(x.cidade_slug) || "Apucarana", cat: x.categoria, end: x.endereco || "", zap: x.whatsapp || "", img: x.imagem || "", detalhes: x.descricao || "" })));
      setClassif((ads || []).map((x: any) => ({ id: x.id, titulo: x.titulo, cidade: cityMap.get(x.cidade_slug) || "Apucarana", cat: x.categoria, preco: x.preco || "", zap: x.contato || "", img: x.imagem || "", detalhes: x.descricao || "", status: x.status || "published" })));
      setVagas((jobs || []).map((x: any) => ({ id: x.id, cargo: x.vaga, empresa: x.empresa, cidade: cityMap.get(x.cidade_slug) || "Apucarana", zap: x.contato || "", img: x.imagem || "", detalhes: x.descricao || "", status: x.status || "published" })));
      setPromocoes((promotions || []).map((x: any) => ({ id: x.id, titulo: x.titulo, cidade: cityMap.get(x.cidade_slug) || "Apucarana", categoria: x.categoria, validade: x.validade || "", contato: x.contato || "", img: x.imagem || "", detalhes: x.detalhes || "" })));
      setVideos((videosData || []).map((x: any) => ({ id: x.id, titulo: x.titulo, descricao: x.descricao || "", cidade: cityMap.get(x.cidade_slug) || "Geral", categoria: x.categoria || "Matéria", videoUrl: x.video_url || "", thumbnailUrl: x.thumbnail_url || "", instagramUrl: x.instagram_url || "", materiaUrl: x.materia_url || "", tipo: x.tipo === "instagram" ? "instagram" : "upload", status: x.status || "published" })));

      let allSponsorsList = (sponsorData || []).map((x: any) => ({ id: x.id, titulo: x.titulo, imagem: x.imagem || "", linkUrl: x.link_url || "", ordem: x.ordem || 0 }));
      if (typeof window !== "undefined") {
        const localSponsors = JSON.parse(localStorage.getItem("local_site_sponsors") || "[]");
        if (localSponsors.length) {
          const idSet = new Set(allSponsorsList.map((s) => s.id));
          localSponsors.forEach((ls: any) => {
            if (!idSet.has(ls.id)) allSponsorsList.push(ls);
            else {
              const idx = allSponsorsList.findIndex((s) => s.id === ls.id);
              if (idx >= 0) allSponsorsList[idx] = ls;
            }
          });
        }
      }
      allSponsorsList.sort((a, b) => a.ordem - b.ordem);
      setSponsors(allSponsorsList);

      const settingsMap = new Map((settingsData || []).map((x: any) => [x.key, x.value || ""]));
      if (typeof window !== "undefined") {
        const localMap = JSON.parse(localStorage.getItem("local_site_settings") || "{}");
        Object.entries(localMap).forEach(([k, v]) => {
          if (v !== undefined && v !== null) settingsMap.set(k, String(v));
        });
      }
      setAllSettings(settingsMap);
      setGrupoWhatsApp(settingsMap.get("whatsapp_group_url") || "");
      const promData = settingsMap.get("noticias_promovidas_geral");
      if (promData) {
        try {
          const list = JSON.parse(promData);
          if (Array.isArray(list)) setNoticiasPromovidasGeral(new Set(list));
        } catch {}
      }
      const topBannerRaw = settingsMap.get("top_banner_config");
      if (topBannerRaw) {
        try {
          const parsed = JSON.parse(topBannerRaw);
          if (parsed.tipo) setTopBannerType(parsed.tipo);
          if (parsed.videoUrl) setTopBannerVideoUrl(parsed.videoUrl);
          if (parsed.posterUrl) setTopBannerPosterUrl(parsed.posterUrl);
          if (parsed.imageUrl) setTopBannerImageUrl(parsed.imageUrl);
          if (parsed.linkUrl) setTopBannerLinkUrl(parsed.linkUrl);
          if (typeof parsed.audioEnabled === "boolean") setTopBannerAudioEnabled(parsed.audioEnabled);
          if (Array.isArray(parsed.slides)) setTopBannerSlides(parsed.slides);
        } catch (e) {
          console.warn("Erro ao ler top_banner_config:", e);
        }
      }
      loadAdsForCity(adCity, settingsMap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { if (data.session) { setOk(true); void carregarTudo(); } });
  }, []);

  const entrar = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      if (!pass || pass === "norte123" || pass === "apucarana123") {
        setOk(true);
        void carregarTudo();
      } else {
        alert("Ambiente local sem Supabase configurado. Use a senha de testes 'apucarana123' ou clique no botão '⚡ Entrar no Painel Agora'.");
      }
      return;
    }
    if (!email.trim() || !pass) {
      alert("Informe seu e-mail e senha de acesso.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    if (error) alert(`Não foi possível entrar: ${error.message}`); else { setOk(true); await carregarTudo(); }
  };
  const sair = async () => { await getSupabase()?.auth.signOut(); setOk(false); };
  
  const alternarPromocaoGeral = async (noticiaId: string) => {
    const proximo = new Set(noticiasPromovidasGeral);
    if (proximo.has(noticiaId)) {
      proximo.delete(noticiaId);
    } else {
      proximo.add(noticiaId);
    }
    setNoticiasPromovidasGeral(proximo);
    const arr = Array.from(proximo);
    const jsonStr = JSON.stringify(arr);

    if (typeof window !== "undefined") {
      try {
        const local = JSON.parse(localStorage.getItem("local_site_settings") || "{}");
        local["noticias_promovidas_geral"] = jsonStr;
        localStorage.setItem("local_site_settings", JSON.stringify(local));
      } catch {}
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from("site_settings").upsert({ key: "noticias_promovidas_geral", value: jsonStr, updated_at: new Date().toISOString() }, { onConflict: "key" });
      } catch {}
    }
  };

    const executarAcaoSocial = async (
    newsId: string,
    network: "facebook" | "instagram",
    action: "publish" | "resolve_mark_published" | "resolve_retry" | "reconcile" = "publish"
  ) => {
    const supabase = getSupabase();
    if (!supabase) return alert("Supabase não configurado.");

    const key = `${newsId}_${network}`;
    setSocialLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        alert("Sua sessão expirou. Faça login novamente no painel.");
        return;
      }

      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newsId, network, action }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        alert(`Aviso ${network === "facebook" ? "Facebook" : "Instagram"}: ${json?.error || "Erro ao processar."}`);
      } else {
        if (action === "resolve_mark_published") {
          alert(`Status do ${network === "facebook" ? "Facebook" : "Instagram"} marcado como publicado com sucesso.`);
        } else if (action === "resolve_retry") {
          alert(`Status do ${network === "facebook" ? "Facebook" : "Instagram"} liberado para nova tentativa.`);
        } else if (action === "reconcile") {
          if (json.status === "publicado") {
            alert("Publicação confirmada e recuperada na Meta! Status atualizado para Publicado.");
          } else if (json.status === "incerto") {
            alert(`A verificação foi inconclusiva: ${json.error || "falha de rede"}.`);
          } else {
            alert("Verificado na Meta: publicação não encontrada.");
          }
        } else {
          alert(`Sucesso! Publicado no ${network === "facebook" ? "Facebook" : "Instagram"}.`);
        }
      }
    } catch (e: any) {
      alert(`Falha de conexão com a API de redes sociais: ${e?.message || "erro"}`);
    } finally {
      setSocialLoading((prev) => ({ ...prev, [key]: false }));
      void carregarTudo();
    }
  };

  const dispararPublicacoesParalelas = (newsId: string, postFb: boolean, postIg: boolean) => {
    if (!postFb && !postIg) return;
    if (postFb) {
      void executarAcaoSocial(newsId, "facebook", "publish");
    }
    if (postIg) {
      void executarAcaoSocial(newsId, "instagram", "publish");
    }
  };

const salvar = async (table: string, record: any, image: string, folder: string, onDone: (saved?: any) => void, id?: string | null) => {
    const supabase = getSupabase();
    if (!supabase) { alert("Supabase não configurado."); return; }
    setLoading(true);
    try {
      const imagem = await uploadImagem(image, folder);
      const query = id ? supabase.from(table).update({ ...record, imagem }).eq("id", id).select().single() : supabase.from(table).insert({ ...record, imagem }).select().single();
      const { data: savedRecord, error } = await query;
      if (error) throw error;
      onDone(savedRecord); setEditId(null); await carregarTudo();
      return savedRecord;
    } catch (e: any) { alert(`Não foi possível salvar: ${e.message || "erro de conexão"}`); return null; } finally { setLoading(false); }
  };

    const handleVideoUrlChange = (url: string) => {
    let plat = videoPortalForm.plataforma;
    let thumb = videoPortalForm.thumbnail_url;

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      plat = "youtube";
      const ytId = getYoutubeId(url);
      if (ytId && !thumb) {
        thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    } else if (url.includes("instagram.com")) {
      plat = "instagram";
    } else if (url.includes("tiktok.com")) {
      plat = "tiktok";
    } else if (url.endsWith(".mp4") || url.includes("/videos/")) {
      plat = "nativo";
    }

    setVideoPortalForm((prev) => ({
      ...prev,
      url_video: url,
      plataforma: plat,
      thumbnail_url: thumb,
    }));
  };

  const salvarVideoPortal = async () => {
    if (!videoPortalForm.titulo.trim()) return alert("Informe o título do vídeo.");
    if (!videoPortalForm.url_video.trim()) return alert("Informe o link do vídeo.");

    const supabase = getSupabase();
    if (!supabase) return alert("Supabase não configurado.");

    let finalThumb = videoPortalForm.thumbnail_url.trim();
    if (!finalThumb && videoPortalForm.plataforma === "youtube") {
      const ytId = getYoutubeId(videoPortalForm.url_video);
      if (ytId) finalThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }

    setSalvandoVideoPortal(true);
    try {
      const payload = {
        titulo: videoPortalForm.titulo.trim(),
        url_video: videoPortalForm.url_video.trim(),
        plataforma: videoPortalForm.plataforma,
        thumbnail_url: finalThumb || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80",
        status: videoPortalForm.status,
      };

      if (editVideoPortalId) {
        const { error } = await supabase.from("videos_portal").update(payload).eq("id", editVideoPortalId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("videos_portal").insert(payload);
        if (error) throw error;
      }

      setVideoPortalForm({
        titulo: "",
        url_video: "",
        plataforma: "youtube",
        thumbnail_url: "",
        status: "publicado",
      });
      setEditVideoPortalId(null);
      await carregarTudo();
      alert(editVideoPortalId ? "Vídeo atualizado com sucesso!" : "Vídeo publicado com sucesso na Faixa e na aba Vídeos!");
    } catch (e: any) {
      alert(`Erro ao salvar vídeo: ${e.message || e}`);
    } finally {
      setSalvandoVideoPortal(false);
    }
  };

  const excluirVideoPortal = async (id: string) => {
    if (!confirm("Deseja realmente excluir este vídeo da faixa multimídia e da aba Vídeos?")) return;
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { error } = await supabase.from("videos_portal").delete().eq("id", id);
      if (error) throw error;
      await carregarTudo();
    } catch (e: any) {
      alert(`Erro ao excluir vídeo: ${e.message || e}`);
    }
  };

  const alternarStatusVideoPortal = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "publicado" ? "rascunho" : "publicado";
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { error } = await supabase.from("videos_portal").update({ status: nextStatus }).eq("id", id);
      if (error) throw error;
      await carregarTudo();
    } catch (e: any) {
      alert(`Erro ao alterar status: ${e.message || e}`);
    }
  };

const salvarVideo = async () => {
    const supabase = getSupabase();
    if (!supabase) return alert("Supabase não configurado.");
    if (!videoForm.titulo.trim()) return alert("Título obrigatório.");
    if (videoForm.tipo === "instagram" && !videoForm.instagramUrl.trim()) return alert("Cole o link público do Instagram.");
    if (videoForm.tipo === "upload" && !videoFile && !videoForm.videoUrl.trim()) return alert("Selecione um vídeo ou informe uma URL MP4.");
    setLoading(true);
    try {
      let videoUrl = videoFile ? await uploadArquivo(videoFile, "videos") : videoForm.videoUrl.trim();
      let instagramUrl = videoForm.tipo === "instagram" ? videoForm.instagramUrl.trim() : null;
      let finalTipo = videoForm.tipo;

      // Auto-correção caso o usuário cole link do Instagram no campo de URL de vídeo/upload
      if (videoUrl && (videoUrl.includes("instagram.com/") || videoUrl.includes("instagr.am/"))) {
        finalTipo = "instagram";
        instagramUrl = videoUrl;
        videoUrl = "";
      }

      const thumbnailUrl = await uploadImagem(videoForm.thumbnailUrl, "video-thumbnails");
      const record = {
        titulo: videoForm.titulo.trim(),
        descricao: videoForm.descricao.trim(),
        video_url: finalTipo === "upload" ? videoUrl || null : null,
        thumbnail_url: thumbnailUrl || null,
        instagram_url: instagramUrl,
        cidade_slug: cidadeSlug(videoForm.cidade) || null,
        categoria: videoForm.categoria,
        materia_url: videoForm.materiaUrl.trim() || null,
        tipo: finalTipo,
        status: videoForm.status,
      };
      const query = editId ? supabase.from("videos").update(record).eq("id", editId) : supabase.from("videos").insert(record);
      const { error } = await query;
      if (error) throw error;
      setVideoForm(emptyVideo); setVideoFile(null); setEditId(null); await carregarTudo();
    } catch (e: any) { const message = String(e?.message || ""); alert(message.toLowerCase().includes("maximum allowed size") || message.toLowerCase().includes("file size") ? "Este projeto aceita arquivos de até 50 MB no Supabase. Escolha um vídeo menor que 50 MB, de preferência até 48 MB." : `Não foi possível salvar o vídeo: ${message || "erro de conexão"}`); } finally { setLoading(false); }
  };

  const salvarPatrocinador = async () => {
    if (!sponsorForm.titulo.trim() || !sponsorForm.img.trim()) {
      return alert("Informe o nome e a foto do patrocinador para o carrossel.");
    }
    const supabase = getSupabase();
    setLoading(true);
    try {
      let imgUrl = sponsorForm.img.trim();
      if (imgUrl.startsWith("data:") && supabase) {
        imgUrl = await uploadImagem(imgUrl, "sponsors");
      }
      const record = {
        titulo: sponsorForm.titulo.trim(),
        link_url: sponsorForm.linkUrl.trim() || null,
        ordem: Number(sponsorForm.ordem) || 0,
        ativo: true,
        imagem: imgUrl,
      };
      if (supabase) {
        const query = editId
          ? supabase.from("site_sponsors").update(record).eq("id", editId)
          : supabase.from("site_sponsors").insert(record);
        const { error } = await query;
        if (error) throw error;
      }
      if (typeof window !== "undefined") {
        const list = JSON.parse(localStorage.getItem("local_site_sponsors") || "[]");
        if (editId) {
          const idx = list.findIndex((x: any) => x.id === editId);
          if (idx >= 0) list[idx] = { ...record, id: editId };
          else list.push({ ...record, id: editId });
        } else {
          list.push({ ...record, id: "local-" + Date.now() });
        }
        localStorage.setItem("local_site_sponsors", JSON.stringify(list));
      }
      alert(editId ? "Patrocinador do carrossel atualizado com sucesso!" : "Foto do patrocinador adicionada ao carrossel com sucesso!");
      setSponsorForm({ titulo: "", img: "", linkUrl: "", ordem: "0" });
      setEditId(null);
      await carregarTudo();
    } catch (e: any) {
      alert(`Não foi possível salvar o patrocinador: ${e.message || "erro de conexão"}`);
    } finally {
      setLoading(false);
    }
  };

  const excluirPatrocinador = async (id: string) => {
    if (!confirm("Remover este patrocinador do carrossel?")) return;
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("site_sponsors").delete().eq("id", id);
    }
    if (typeof window !== "undefined") {
      const list = JSON.parse(localStorage.getItem("local_site_sponsors") || "[]");
      localStorage.setItem("local_site_sponsors", JSON.stringify(list.filter((x: any) => x.id !== id)));
    }
    await carregarTudo();
  };

  const adicionarSlide = () => {
    if (!slideForm.imagem.trim()) return alert("Selecione ou informe a imagem do slide.");
    const novo = {
      id: "slide-" + Date.now(),
      imagem: slideForm.imagem,
      titulo: slideForm.titulo.trim() || `Slide ${topBannerSlides.length + 1}`,
      linkUrl: slideForm.linkUrl.trim(),
    };
    setTopBannerSlides([...topBannerSlides, novo]);
    setSlideForm({ imagem: "", titulo: "", linkUrl: "" });
  };

  const removerSlide = (id: string) => {
    setTopBannerSlides(topBannerSlides.filter((s) => s.id !== id));
  };

  const salvarTopBanner = async () => {
    const supabase = getSupabase();
    if (!supabase) return alert("Erro de conexão com o Supabase.");

    try {
      setTopBannerUploading(true);
      let finalVideoUrl = topBannerVideoUrl.trim();

      if (topBannerVideoFile) {
        finalVideoUrl = await uploadArquivo(topBannerVideoFile, "top-banners");
        setTopBannerVideoUrl(finalVideoUrl);
        setTopBannerVideoFile(null);
      }

      let finalPosterUrl = topBannerPosterUrl.trim();
      if (finalPosterUrl.startsWith("data:")) {
        finalPosterUrl = await uploadImagem(finalPosterUrl, "top-banners");
        setTopBannerPosterUrl(finalPosterUrl);
      }

      let finalImageUrl = topBannerImageUrl.trim();
      if (finalImageUrl.startsWith("data:")) {
        finalImageUrl = await uploadImagem(finalImageUrl, "top-banners");
        setTopBannerImageUrl(finalImageUrl);
      }

      const processedSlides = await Promise.all(
        topBannerSlides.map(async (s) => {
          let img = s.imagem;
          if (img.startsWith("data:")) {
            img = await uploadImagem(img, "top-banners");
          }
          return { ...s, imagem: img };
        })
      );

      const config = {
        tipo: topBannerType,
        videoUrl: finalVideoUrl,
        posterUrl: finalPosterUrl,
        imageUrl: finalImageUrl,
        linkUrl: topBannerLinkUrl.trim(),
        audioEnabled: topBannerAudioEnabled,
        slides: processedSlides,
        updatedAt: new Date().toISOString(),
      };

      const jsonStr = JSON.stringify(config);
      const { error } = await supabase.from("site_settings").upsert(
        { key: "top_banner_config", value: jsonStr, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

      if (error) throw error;

      if (typeof window !== "undefined") {
        const local = JSON.parse(localStorage.getItem("local_site_settings") || "{}");
        local["top_banner_config"] = jsonStr;
        localStorage.setItem("local_site_settings", JSON.stringify(local));
      }

      setAllSettings((prev) => {
        const next = new Map(prev);
        next.set("top_banner_config", jsonStr);
        return next;
      });

      alert("Capa Principal atualizada com sucesso no portal!");
    } catch (err: any) {
      console.error("Erro ao salvar capa principal:", err);
      alert(`Erro ao salvar capa principal: ${err.message || "tente novamente"}`);
    } finally {
      setTopBannerUploading(false);
    }
  };

  const salvarWhatsApp = async () => {
    const supabase = getSupabase();
    setLoading(true);
    if (supabase) {
      const { error } = await supabase.from("site_settings").upsert({ key: "whatsapp_group_url", value: grupoWhatsApp.trim() || null, updated_at: new Date().toISOString() });
      if (error) { setLoading(false); return alert(`Não foi possível salvar: ${error.message}`); }
    }
    if (typeof window !== "undefined") {
      const localMap = JSON.parse(localStorage.getItem("local_site_settings") || "{}");
      localMap["whatsapp_group_url"] = grupoWhatsApp.trim();
      localStorage.setItem("local_site_settings", JSON.stringify(localMap));
    }
    setLoading(false);
    alert("Link do grupo de WhatsApp salvo com sucesso.");
  };

  const salvarAnunciosPrincipais = async () => {
    const supabase = getSupabase();
    setLoading(true);
    try {
      const rows: { key: string; value: string; updated_at: string }[] = [];
      for (let index = 0; index < mainAdsForm.length; index += 1) {
        const position = index + 1;
        const form = mainAdsForm[index];
        const keys = getMainAdKeys(adCity, position);
        let imagem = form.img.trim();
        if (imagem && imagem.startsWith("data:") && supabase) {
          imagem = await uploadImagem(imagem, "homepage-ads");
        }
        rows.push(
          { key: keys.image, value: imagem, updated_at: new Date().toISOString() },
          { key: keys.link, value: form.linkUrl.trim(), updated_at: new Date().toISOString() },
          { key: keys.title, value: form.titulo.trim() || `Publicidade Principal ${position}`, updated_at: new Date().toISOString() },
        );
      }
      if (supabase) {
        const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
        if (error) throw error;
      }
      if (typeof window !== "undefined") {
        const localMap = JSON.parse(localStorage.getItem("local_site_settings") || "{}");
        rows.forEach((r) => { localMap[r.key] = r.value; });
        localStorage.setItem("local_site_settings", JSON.stringify(localMap));
      }
      alert(`As três publicidades principais para ${adCity === "Geral" ? "Geral (todo o portal)" : adCity} foram atualizadas com sucesso!`);
      await carregarTudo();
    } catch (e: any) { alert(`Não foi possível salvar as publicidades: ${e.message || "erro de conexão"}`); } finally { setLoading(false); }
  };

  const salvarTvAds = async () => {
    const supabase = getSupabase();
    setLoading(true);
    try {
      const rows: { key: string; value: string; updated_at: string }[] = [];
      for (let index = 0; index < tvAdsForm.length; index += 1) {
        const position = index + 1;
        const form = tvAdsForm[index];
        const keys = getTvAdKeys(adCity, position);
        rows.push(
          { key: keys.video, value: form.videoUrl.trim(), updated_at: new Date().toISOString() },
          { key: keys.link, value: form.linkUrl.trim(), updated_at: new Date().toISOString() },
          { key: keys.title, value: form.titulo.trim() || `TV ${position}`, updated_at: new Date().toISOString() },
        );
      }
      if (supabase) {
        const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
        if (error) throw error;
      }
      if (typeof window !== "undefined") {
        const localMap = JSON.parse(localStorage.getItem("local_site_settings") || "{}");
        rows.forEach((r) => { localMap[r.key] = r.value; });
        localStorage.setItem("local_site_settings", JSON.stringify(localMap));
      }
      alert(`As propagandas em vídeo (TVs 1, 2 e 3) para ${adCity === "Geral" ? "Geral (todo o portal)" : adCity} foram salvas com sucesso!`);
      await carregarTudo();
    } catch (e: any) { alert(`Não foi possível salvar os vídeos das TVs: ${e.message || "erro de conexão"}`); } finally { setLoading(false); }
  };

  const salvarLateralAds = async () => {
    const supabase = getSupabase();
    setLoading(true);
    try {
      const rows: { key: string; value: string; updated_at: string }[] = [];
      const slots: ("lg1" | "lm1" | "lg2" | "lm2")[] = ["lg1", "lm1", "lg2", "lm2"];
      for (const slot of slots) {
        const form = lateralAdsForm[slot];
        const keys = getLateralAdKeys(adCity, slot);
        let imagem = form.img.trim();
        if (imagem && imagem.startsWith("data:") && supabase) {
          imagem = await uploadImagem(imagem, "lateral-ads");
        }
        rows.push(
          { key: keys.image, value: imagem, updated_at: new Date().toISOString() },
          { key: keys.link, value: form.linkUrl.trim(), updated_at: new Date().toISOString() },
          { key: keys.title, value: form.titulo.trim() || `Bloco ${slot.toUpperCase()}`, updated_at: new Date().toISOString() },
        );
      }
      if (supabase) {
        const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
        if (error) throw error;
      }
      if (typeof window !== "undefined") {
        const localMap = JSON.parse(localStorage.getItem("local_site_settings") || "{}");
        rows.forEach((r) => { localMap[r.key] = r.value; });
        localStorage.setItem("local_site_settings", JSON.stringify(localMap));
      }
      alert(`Os 4 blocos laterais (LG1, LM1, LG2 e LM2) para ${adCity === "Geral" ? "Geral (todo o portal)" : adCity} foram salvos com sucesso!`);
      await carregarTudo();
    } catch (e: any) {
      alert(`Não foi possível salvar os blocos laterais: ${e.message || "erro de conexão"}`);
    } finally {
      setLoading(false);
    }
  };

  const excluir = async (table: string, id: string) => {
    if (!confirm("Excluir este cadastro do banco?")) return;
    const supabase = getSupabase(); if (!supabase) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) alert(`Não foi possível excluir: ${error.message}`); else await carregarTudo();
  };

  if (!ok) {
    const hasSupabase = Boolean(getSupabase());
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <span className="admin-kicker">REDE APUCARANA DE COMUNICAÇÃO</span>
          <h1>Área da redação</h1>
          <p>Gerencie notícias, anúncios e oportunidades da região.</p>

          {!hasSupabase && (
            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "10px", padding: "14px", marginBottom: "16px", textAlign: "left" }}>
              <strong style={{ display: "block", color: "#92400e", fontSize: "14px", marginBottom: "4px" }}>
                🛠️ Modo Local de Testes Ativo
              </strong>
              <span style={{ fontSize: "12px", color: "#78350f", lineHeight: "1.4", display: "block" }}>
                O arquivo <code>.env.local</code> está sem as chaves do Supabase. Você pode entrar direto com o botão abaixo para editar e revisar tudo no seu computador:
              </span>
              <button
                type="button"
                onClick={() => { setOk(true); void carregarTudo(); }}
                style={{ width: "100%", marginTop: "10px", padding: "12px", background: "#d97706", color: "#fff", border: "0", borderRadius: "8px", fontWeight: "900", fontSize: "14px", cursor: "pointer" }}
              >
                ⚡ Entrar no Painel Agora (Sem Senha)
              </button>
            </div>
          )}

          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail administrativo" />
          <input value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void entrar()} type="password" placeholder="Senha de acesso" />
          <button onClick={() => void entrar()}>Entrar no painel</button>
          <small>{hasSupabase ? "Login protegido pelo Supabase Auth." : "Dica: Em modo local, clique no botão amarelo acima ou use a senha 'apucarana123'."}</small>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <span className="admin-kicker">REDE APUCARANA DE COMUNICAÇÃO</span>
          <h1>Painel da redação</h1>
        </div>
        <div className="admin-header-actions">
          <button onClick={() => void carregarTudo()}>{loading ? "Atualizando..." : "Atualizar dados"}</button>
          <button onClick={() => void sair()}>Sair</button>
        </div>
      </header>
      <nav className="admin-tabs">
        {TABS.map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}
        <a href="/admin/videos" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#b51f2c", color: "#fff", padding: "8px 16px", borderRadius: "99px", textDecoration: "none", fontSize: "12px", fontWeight: "900", marginLeft: "auto", whiteSpace: "nowrap" }}>
          🎬 Gerenciar Vídeos do Portal (Shorts) →
        </a>
      </nav>
      {tab !== "capa" && (
        <div className="admin-city-filter">
          <div><span className="admin-kicker">FILTRAR CADASTROS</span><strong>{selectedCity}</strong></div>
          <label><span>⌕</span><input value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Procurar cidade para filtrar" /></label>
          <div className="city-results">
            <button className={selectedCity === "Todas as cidades" ? "selected" : ""} onClick={() => saveCity("Todas as cidades")}>Todas</button>
            {cidadesVisiveis.map((cidade) => <button key={cidade} className={selectedCity === cidade ? "selected" : ""} onClick={() => saveCity(cidade)}>{cidade}</button>)}
          </div>
        </div>
      )}
      <main className="admin-main">
        {tab === "capa" && (
          <AdminSection
            title="Capa Principal do Portal (Banner do Topo)"
            description="Personalize o espaço nobre de abertura do portal (abaixo do menu de cidades e antes das notícias). Escolha entre um Vídeo Animado em looping contínuo, um Carrossel de Banners ou uma Imagem Fixa."
          >
            {/* Seletor de Tipo */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "900", color: "#1e293b", marginBottom: "10px" }}>
                🎯 Escolha o Formato da Capa Principal:
              </label>
              <div className="admin-media-type-selector">
                <button
                  type="button"
                  className={`admin-media-type-btn ${topBannerType === "video" ? "active" : ""}`}
                  onClick={() => setTopBannerType("video")}
                >
                  <span style={{ fontSize: "24px" }}>🎥</span>
                  <strong>Vídeo / Animação MP4</strong>
                  <span>Vinheta animada em loop, leve e contínua com suporte a autoplay</span>
                </button>

                <button
                  type="button"
                  className={`admin-media-type-btn ${topBannerType === "carousel" ? "active" : ""}`}
                  onClick={() => setTopBannerType("carousel")}
                >
                  <span style={{ fontSize: "24px" }}>🎠</span>
                  <strong>Carrossel de Slides</strong>
                  <span>Múltiplos banners e artes girando automaticamente</span>
                </button>

                <button
                  type="button"
                  className={`admin-media-type-btn ${topBannerType === "image" ? "active" : ""}`}
                  onClick={() => setTopBannerType("image")}
                >
                  <span style={{ fontSize: "24px" }}>🖼️</span>
                  <strong>Imagem Fixa</strong>
                  <span>Banner padrão estático da Rede Apucarana ou arte institucional</span>
                </button>
              </div>
            </div>

            {/* CASO VÍDEO */}
            {topBannerType === "video" && (
              <div style={{ display: "grid", gap: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
                <div style={{ borderLeft: "4px solid #b51f2c", paddingLeft: "12px" }}>
                  <strong style={{ fontSize: "15px", color: "#0f172a", display: "block" }}>
                    Configurações do Vídeo / Animação (Padrão: 2360 x 480 px)
                  </strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Envie um arquivo .mp4 do seu computador ou cole o link direto. O vídeo rodará automaticamente em loop contínuo no formato padronizado <strong>2360 x 480 px</strong>.
                  </span>
                </div>

                <div className="video-file-field">
                  <label>Arquivo de Vídeo (.mp4 ou .webm):</label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setTopBannerVideoFile(file);
                      if (file) {
                        const localUrl = URL.createObjectURL(file);
                        setTopBannerVideoUrl(localUrl);
                      }
                    }}
                  />
                  <small>
                    {topBannerVideoFile
                      ? `Arquivo selecionado: ${topBannerVideoFile.name} (${(topBannerVideoFile.size / 1024 / 1024).toFixed(1)} MB)`
                      : topBannerVideoUrl
                      ? "Vídeo atual configurado."
                      : "Nenhum arquivo local selecionado. Você também pode colar um link abaixo."}
                  </small>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                    Ou link direto da URL do Vídeo (MP4):
                  </label>
                  <FormInput
                    placeholder="https://.../video.mp4"
                    value={topBannerVideoUrl.startsWith("blob:") ? "(Arquivo local selecionado acima)" : topBannerVideoUrl}
                    onChange={(v) => {
                      setTopBannerVideoUrl(v);
                      setTopBannerVideoFile(null);
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                    Link de destino ao clicar na capa (opcional):
                  </label>
                  <FormInput
                    placeholder="https://chat.whatsapp.com/... ou https://seusite.com ou /noticias/..."
                    value={topBannerLinkUrl}
                    onChange={setTopBannerLinkUrl}
                  />
                </div>

                <ImageField
                  label="Thumbnail / Imagem de fundo (enquanto o vídeo carrega - opcional):"
                  value={topBannerPosterUrl}
                  onChange={setTopBannerPosterUrl}
                />

                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", color: "#1e293b", cursor: "pointer", marginTop: "4px" }}>
                  <input
                    type="checkbox"
                    checked={topBannerAudioEnabled}
                    onChange={(e) => setTopBannerAudioEnabled(e.target.checked)}
                  />
                  <span>Permitir botão de som para o visitante (por padrão o vídeo roda silencioso para não bloquear autoplay)</span>
                </label>

                {/* Prévia ao vivo */}
                {topBannerVideoUrl && (
                  <div style={{ marginTop: "10px" }}>
                    <strong style={{ display: "block", fontSize: "13px", color: "#334155", marginBottom: "6px" }}>
                      👁️ Pré-visualização do Vídeo (Formato Oficial 2360 x 480 px):
                    </strong>
                    <div style={{ width: "100%", aspectRatio: "2360/480", background: "#000", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
                      <video
                        src={topBannerVideoUrl}
                        poster={topBannerPosterUrl || "/banner-rede-apucarana.png?v=2"}
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CASO CARROSSEL */}
            {topBannerType === "carousel" && (
              <div style={{ display: "grid", gap: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
                <div style={{ borderLeft: "4px solid #b51f2c", paddingLeft: "12px" }}>
                  <strong style={{ fontSize: "15px", color: "#0f172a", display: "block" }}>
                    Slides do Carrossel de Capa (Padrão: 2360 x 480 px)
                  </strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Adicione os banners no formato padronizado <strong>2360 x 480 px</strong> para alternarem automaticamente no topo do portal a cada 4,5 segundos.
                  </span>
                </div>

                {/* Formulário para novo slide */}
                <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px", display: "grid", gap: "10px" }}>
                  <strong style={{ fontSize: "13px", color: "#1e293b" }}>+ Adicionar Novo Slide</strong>
                  <ImageField
                    label="Imagem do Slide (Formato Oficial: 2360 x 480 px):"
                    value={slideForm.imagem}
                    onChange={(v) => setSlideForm({ ...slideForm, imagem: v })}
                  />
                  <FormInput
                    placeholder="Título do Slide (ex: Anuncie na Rede Apucarana)"
                    value={slideForm.titulo}
                    onChange={(v) => setSlideForm({ ...slideForm, titulo: v })}
                  />
                  <FormInput
                    placeholder="Link de Destino (opcional: https://wa.me/... ou /admin)"
                    value={slideForm.linkUrl}
                    onChange={(v) => setSlideForm({ ...slideForm, linkUrl: v })}
                  />
                  <button
                    type="button"
                    onClick={adicionarSlide}
                    style={{ padding: "10px 16px", background: "#0f172a", color: "#fff", border: 0, borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}
                  >
                    Adicionar Slide à Lista
                  </button>
                </div>

                {/* Lista de slides */}
                <div>
                  <strong style={{ display: "block", fontSize: "13px", color: "#334155", marginBottom: "8px" }}>
                    Slides Cadastrados ({topBannerSlides.length}):
                  </strong>
                  {topBannerSlides.length === 0 ? (
                    <p style={{ fontSize: "12px", color: "#64748b" }}>Nenhum slide adicionado ainda. Use o formulário acima para adicionar banners ao carrossel.</p>
                  ) : (
                    <div style={{ display: "grid", gap: "10px" }}>
                      {topBannerSlides.map((slide, idx) => (
                        <div key={slide.id || idx} style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px" }}>
                          <img src={slide.imagem} alt={slide.titulo} style={{ width: "130px", aspectRatio: "2360/480", objectFit: "cover", borderRadius: "4px" }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ display: "block", fontSize: "13px", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{slide.titulo}</strong>
                            <small style={{ color: "#64748b", fontSize: "11px" }}>{slide.linkUrl || "Sem link de clique"}</small>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerSlide(slide.id)}
                            style={{ padding: "6px 12px", background: "#fee2e2", color: "#991b1b", border: 0, borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "11px" }}
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CASO IMAGEM FIXA */}
            {topBannerType === "image" && (
              <div style={{ display: "grid", gap: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
                <div style={{ borderLeft: "4px solid #b51f2c", paddingLeft: "12px" }}>
                  <strong style={{ fontSize: "15px", color: "#0f172a", display: "block" }}>
                    Banner de Imagem Fixa (Padrão: 2360 x 480 px)
                  </strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Formato padronizado: <strong>2360 x 480 px</strong>. Deixe em branco para usar a arte padrão da Rede Apucarana, ou envie uma imagem personalizada.
                  </span>
                </div>

                <ImageField
                  label="Imagem do Banner (Formato Oficial: 2360 x 480 px):"
                  value={topBannerImageUrl}
                  onChange={setTopBannerImageUrl}
                />

                <FormInput
                  placeholder="Link de destino ao clicar no banner (opcional)"
                  value={topBannerLinkUrl}
                  onChange={setTopBannerLinkUrl}
                />

                {/* Prévia */}
                <div style={{ marginTop: "10px" }}>
                  <strong style={{ display: "block", fontSize: "13px", color: "#334155", marginBottom: "6px" }}>
                    👁️ Pré-visualização do Banner (Formato Oficial 2360 x 480 px):
                  </strong>
                  <div style={{ width: "100%", aspectRatio: "2360/480", background: "#fff", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    <img
                      src={topBannerImageUrl || "/banner-rede-apucarana.png?v=2"}
                      alt="Banner Capa"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <SaveButton
              label={topBannerUploading ? "Enviando arquivo e salvando..." : "Salvar Capa Principal"}
              onClick={() => void salvarTopBanner()}
            />
          </AdminSection>
        )}

        {tab === "noticias" && (
          <AdminSection title="Cadastrar notícia" description="Notícias municipais ficam na aba da cidade. Use a opção 'Exibir também no Geral' para destacar uma matéria da cidade na Capa Principal.">
            <FormInput placeholder="Título da notícia" value={nForm.titulo} onChange={(v) => setNForm({ ...nForm, titulo: v })} />
            <div className="form-row">
              <Select value={nForm.cidade} onChange={(v) => setNForm({ ...nForm, cidade: v, exibirNoGeral: v === "Geral" ? true : nForm.exibirNoGeral })} options={CIDADES} />
              <Select value={nForm.cat} onChange={(v) => setNForm({ ...nForm, cat: v })} options={CAT_NOT} />
            </div>
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={nForm.cidade === "Geral" || nForm.exibirNoGeral}
                disabled={nForm.cidade === "Geral"}
                onChange={(e) => setNForm({ ...nForm, exibirNoGeral: e.target.checked })}
              />
              <span>Exibir também na Capa Principal (Geral do Portal)</span>
              {nForm.cidade === "Geral" && <small style={{ color: "#68707c", fontWeight: 400 }}>(Notícia criada para o Geral já vai direto para a Capa)</small>}
            </label>
            <FormInput placeholder="Resumo / linha fina" value={nForm.resumo} onChange={(v) => setNForm({ ...nForm, resumo: v })} multiline />
            <ImageField value={nForm.img} onChange={(v) => setNForm({ ...nForm, img: v })} />
            <FormInput placeholder="Texto completo da notícia" value={nForm.texto} onChange={(v) => setNForm({ ...nForm, texto: v })} multiline />

            {/* Checkboxes de Publicação Oficial nas Redes Sociais */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 16px", marginTop: "4px", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  📢 Publicação Oficial nas Redes Sociais (Opcional)
                </span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  Enviado em segundo plano após salvar
                </span>
              </div>
              
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center" }}>
                {/* Checkbox Facebook */}
                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", cursor: (editId && noticiaSendoEditada?.facebook_status === "publicado") ? "not-allowed" : "pointer", opacity: (editId && noticiaSendoEditada?.facebook_status === "publicado") ? 0.6 : 1 }}>
                  <input
                    type="checkbox"
                    checked={nForm.publicarFacebook}
                    disabled={Boolean(editId && noticiaSendoEditada?.facebook_status === "publicado")}
                    onChange={(e) => setNForm({ ...nForm, publicarFacebook: e.target.checked })}
                  />
                  <span style={{ color: "#1877f2", fontWeight: 700 }}>Facebook</span>
                  {(editId && noticiaSendoEditada?.facebook_status === "publicado") && (
                    <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600", background: "#dcfce7", padding: "2px 6px", borderRadius: "4px" }}>
                      ✔ Já publicado
                    </span>
                  )}
                </label>

                {/* Checkbox Instagram */}
                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", cursor: (editId && noticiaSendoEditada?.instagram_status === "publicado") ? "not-allowed" : "pointer", opacity: (editId && noticiaSendoEditada?.instagram_status === "publicado") ? 0.6 : 1 }}>
                  <input
                    type="checkbox"
                    checked={nForm.publicarInstagram}
                    disabled={Boolean(editId && noticiaSendoEditada?.instagram_status === "publicado")}
                    onChange={(e) => setNForm({ ...nForm, publicarInstagram: e.target.checked })}
                  />
                  <span style={{ color: "#c13584", fontWeight: 700 }}>Instagram</span>
                  {(editId && noticiaSendoEditada?.instagram_status === "publicado") && (
                    <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600", background: "#dcfce7", padding: "2px 6px", borderRadius: "4px" }}>
                      ✔ Já publicado
                    </span>
                  )}
                </label>
              </div>
              <small style={{ color: "#64748b", fontSize: "11px", lineHeight: "1.4" }}>
                Para publicar nas redes sociais, é necessário ter uma imagem de capa e o portal salva a notícia antes de disparar o envio.
              </small>
            </div>

            <SaveButton
              label={editId ? "Atualizar notícia" : "Salvar notícia no banco"}
              onClick={async () => {
                if (!nForm.titulo) return alert("Título obrigatório");
                const isGeral = nForm.cidade === "Geral" || nForm.exibirNoGeral;
                const postFb = nForm.publicarFacebook;
                const postIg = nForm.publicarInstagram;

                await salvar(
                  "news",
                  {
                    titulo: nForm.titulo,
                    categoria: nForm.cat,
                    resumo: nForm.resumo,
                    conteudo: nForm.texto || nForm.resumo,
                    cidade_slug: cidadeSlug(nForm.cidade),
                    status: "published",
                  },
                  nForm.img,
                  "news",
                  (savedRecord) => {
                    const newsId = savedRecord?.id || editId;
                    if (editId) {
                      if (isGeral && !noticiasPromovidasGeral.has(editId)) {
                        void alternarPromocaoGeral(editId);
                      } else if (!isGeral && noticiasPromovidasGeral.has(editId)) {
                        void alternarPromocaoGeral(editId);
                      }
                    }
                    setNForm(emptyNews);

                    if (newsId && (postFb || postIg)) {
                      void dispararPublicacoesParalelas(newsId, postFb, postIg);
                    }
                  },
                  editId
                );
              }}
            />
            {filterByCity(noticias).map((n) => {
              const noGeral = n.cidade === "Geral" || noticiasPromovidasGeral.has(n.id);
              const fbLoading = Boolean(socialLoading[`${n.id}_facebook`]);
              const igLoading = Boolean(socialLoading[`${n.id}_instagram`]);

              return (
                <AdminItem
                  key={n.id}
                  title={n.titulo}
                  meta={`${n.cidade} • ${n.cat} • ${noGeral ? "✔ Exibindo no Geral e na Cidade" : "Apenas na Cidade"}`}
                  image={n.img}
                  extraAction={
                    <button
                      type="button"
                      className={`admin-badge-btn ${noGeral ? "is-geral" : ""}`}
                      onClick={() => void alternarPromocaoGeral(n.id)}
                      title={noGeral ? "Exibindo na Capa Geral e na cidade. Clique para remover da Capa Geral." : "Exibindo apenas na pasta da cidade. Clique para exibir também na Capa Geral."}
                    >
                      {noGeral ? "✔ No Geral" : "+ Levar pro Geral"}
                    </button>
                  }
                  footer={
                    <div style={{ borderTop: "1px solid #edf2f7", paddingTop: "8px", marginTop: "2px", display: "grid", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                        
                        {/* CONTROLE FACEBOOK */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#1877f2", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            FB:
                          </span>
                          {n.facebook_status === "publicado" ? (
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#15803d", background: "#dcfce7", padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              ✔ Publicado {n.facebook_post_id && <small style={{ opacity: 0.8 }}>(ID: {n.facebook_post_id.slice(-6)})</small>}
                            </span>
                          ) : n.facebook_status === "publicando" ? (
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#1d4ed8", background: "#dbeafe", padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              ⏳ Enviando...
                              <button
                                type="button"
                                disabled={fbLoading}
                                onClick={() => void executarAcaoSocial(n.id, "facebook", "reconcile")}
                                style={{ marginLeft: "6px", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", border: "1px solid #93c5fd", background: "#fff", cursor: "pointer" }}
                                title="Verifica se a postagem já foi criada na Meta"
                              >
                                Verificar
                              </button>
                            </span>
                          ) : n.facebook_status === "erro" ? (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: "#b91c1c", background: "#fee2e2", padding: "3px 8px", borderRadius: "6px" }}>
                                ✖ Erro no envio
                              </span>
                              <button
                                type="button"
                                disabled={fbLoading}
                                onClick={() => void executarAcaoSocial(n.id, "facebook", "publish")}
                                style={{ fontSize: "11px", fontWeight: "700", background: "#1877f2", color: "#fff", border: 0, padding: "3px 8px", borderRadius: "6px", cursor: fbLoading ? "not-allowed" : "pointer" }}
                              >
                                {fbLoading ? "Processando..." : "Tentar Novamente"}
                              </button>
                            </div>
                          ) : n.facebook_status === "incerto" ? (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: "#b45309", background: "#fef3c7", padding: "3px 8px", borderRadius: "6px" }}>
                                ⚠ Status Incerto
                              </span>
                              <button
                                type="button"
                                disabled={fbLoading}
                                onClick={() => void executarAcaoSocial(n.id, "facebook", "reconcile")}
                                style={{ fontSize: "10px", fontWeight: "700", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "2px 6px", borderRadius: "4px", cursor: "pointer" }}
                                title="Consulta na Meta se a publicação foi criada"
                              >
                                Verificar na Meta
                              </button>
                              <button
                                type="button"
                                disabled={fbLoading}
                                onClick={() => void executarAcaoSocial(n.id, "facebook", "resolve_mark_published")}
                                style={{ fontSize: "10px", fontWeight: "700", background: "#dcfce7", color: "#166534", border: "1px solid #86efac", padding: "2px 6px", borderRadius: "4px", cursor: "pointer" }}
                                title="Marcar como publicado se você viu o post no Facebook"
                              >
                                Já saiu
                              </button>
                              <button
                                type="button"
                                disabled={fbLoading}
                                onClick={() => void executarAcaoSocial(n.id, "facebook", "resolve_retry")}
                                style={{ fontSize: "10px", fontWeight: "700", background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "2px 6px", borderRadius: "4px", cursor: "pointer" }}
                                title="Liberar para nova tentativa se não saiu"
                              >
                                Não saiu (Liberar)
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={fbLoading}
                              onClick={() => void executarAcaoSocial(n.id, "facebook", "publish")}
                              style={{ fontSize: "11px", fontWeight: "700", background: "#e8f0fe", color: "#1877f2", border: "1px solid #bad3fb", padding: "3px 10px", borderRadius: "6px", cursor: fbLoading ? "not-allowed" : "pointer" }}
                            >
                              {fbLoading ? "Enviando..." : "Publicar no Facebook"}
                            </button>
                          )}
                        </div>

                        {/* CONTROLE INSTAGRAM */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#c13584", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            IG:
                          </span>
                          {n.instagram_status === "publicado" ? (
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#15803d", background: "#dcfce7", padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              ✔ Publicado {n.instagram_media_id && <small style={{ opacity: 0.8 }}>(ID: {n.instagram_media_id.slice(-6)})</small>}
                            </span>
                          ) : n.instagram_status === "publicando" ? (
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#9333ea", background: "#f3e8ff", padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              ⏳ Enviando...
                              <button
                                type="button"
                                disabled={igLoading}
                                onClick={() => void executarAcaoSocial(n.id, "instagram", "reconcile")}
                                style={{ marginLeft: "6px", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", border: "1px solid #d8b4fe", background: "#fff", cursor: "pointer" }}
                                title="Verifica se a mídia já foi criada no Instagram"
                              >
                                Verificar
                              </button>
                            </span>
                          ) : n.instagram_status === "erro" ? (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: "#b91c1c", background: "#fee2e2", padding: "3px 8px", borderRadius: "6px" }}>
                                ✖ Erro no envio
                              </span>
                              <button
                                type="button"
                                disabled={igLoading}
                                onClick={() => void executarAcaoSocial(n.id, "instagram", "publish")}
                                style={{ fontSize: "11px", fontWeight: "700", background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)", color: "#fff", border: 0, padding: "3px 8px", borderRadius: "6px", cursor: igLoading ? "not-allowed" : "pointer" }}
                              >
                                {igLoading ? "Processando..." : "Tentar Novamente"}
                              </button>
                            </div>
                          ) : n.instagram_status === "incerto" ? (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: "#b45309", background: "#fef3c7", padding: "3px 8px", borderRadius: "6px" }}>
                                ⚠ Status Incerto
                              </span>
                              <button
                                type="button"
                                disabled={igLoading}
                                onClick={() => void executarAcaoSocial(n.id, "instagram", "reconcile")}
                                style={{ fontSize: "10px", fontWeight: "700", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "2px 6px", borderRadius: "4px", cursor: "pointer" }}
                                title="Consulta no Instagram se a publicação foi criada"
                              >
                                Verificar na Meta
                              </button>
                              <button
                                type="button"
                                disabled={igLoading}
                                onClick={() => void executarAcaoSocial(n.id, "instagram", "resolve_mark_published")}
                                style={{ fontSize: "10px", fontWeight: "700", background: "#dcfce7", color: "#166534", border: "1px solid #86efac", padding: "2px 6px", borderRadius: "4px", cursor: "pointer" }}
                                title="Marcar como publicado se você viu o post no feed"
                              >
                                Já saiu
                              </button>
                              <button
                                type="button"
                                disabled={igLoading}
                                onClick={() => void executarAcaoSocial(n.id, "instagram", "resolve_retry")}
                                style={{ fontSize: "10px", fontWeight: "700", background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "2px 6px", borderRadius: "4px", cursor: "pointer" }}
                                title="Liberar para nova tentativa se não saiu"
                              >
                                Não saiu (Liberar)
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={igLoading}
                              onClick={() => void executarAcaoSocial(n.id, "instagram", "publish")}
                              style={{ fontSize: "11px", fontWeight: "700", background: "#fdf2f8", color: "#db2777", border: "1px solid #fbcfe8", padding: "3px 10px", borderRadius: "6px", cursor: igLoading ? "not-allowed" : "pointer" }}
                            >
                              {igLoading ? "Enviando..." : "Publicar no Instagram"}
                            </button>
                          )}
                        </div>

                      </div>

                      {/* Exibição clara e legível do erro se houver */}
                      {n.facebook_error && (n.facebook_status === "erro" || n.facebook_status === "incerto") && (
                        <div style={{ fontSize: "11px", color: "#b91c1c", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "6px", padding: "4px 8px" }}>
                          <strong>Erro FB:</strong> {n.facebook_error}
                        </div>
                      )}
                      {n.instagram_error && (n.instagram_status === "erro" || n.instagram_status === "incerto") && (
                        <div style={{ fontSize: "11px", color: "#9f1239", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "6px", padding: "4px 8px" }}>
                          <strong>Erro IG:</strong> {n.instagram_error}
                        </div>
                      )}
                    </div>
                  }
                  onEdit={() => {
                    setEditId(n.id);
                    setNForm({
                      titulo: n.titulo,
                      cidade: n.cidade,
                      cat: n.cat,
                      resumo: n.resumo,
                      img: n.img || "",
                      texto: n.texto || "",
                      exibirNoGeral: noGeral,
                      publicarFacebook: false,
                      publicarInstagram: false,
                    });
                    window.scrollTo({ top: 300, behavior: "smooth" });
                  }}
                  onDelete={() => void excluir("news", n.id)}
                />
              );
            })}
          </AdminSection>
        )}

        {tab === "videos" && (
          <AdminSection
            title="Central de Vídeos Verticais (Shorts, Reels, TikTok)"
            description="Cadastre e gerencie os vídeos da Faixa Multimídia da Home e da aba Vídeos do portal. Suporta YouTube Shorts, Instagram Reels, TikTok e vídeos em MP4 (proporção 9:16)."
          >
            {/* Bloco 2 Colunas: Formulário + Live Preview */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, 1fr)", gap: "24px", alignItems: "start", marginBottom: "20px" }}>
              
              {/* Formulário */}
              <div style={{ display: "grid", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                    Título do Vídeo
                  </label>
                  <FormInput
                    placeholder="Ex: Entrevista com Prefeito de Apucarana sobre Novas Obras"
                    value={videoPortalForm.titulo}
                    onChange={(v) => setVideoPortalForm({ ...videoPortalForm, titulo: v })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                    Link / URL do Vídeo (Shorts, Reel, TikTok ou MP4)
                  </label>
                  <FormInput
                    placeholder="Cole aqui o link do YouTube Shorts, Reel do Instagram, TikTok ou MP4"
                    value={videoPortalForm.url_video}
                    onChange={(v) => handleVideoUrlChange(v)}
                  />
                  <small style={{ color: "#64748b", fontSize: "11px", marginTop: "4px", display: "block" }}>
                    Dica: Ao colar um link do YouTube Shorts, a plataforma e a capa são detectadas automaticamente!
                  </small>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                    Plataforma do Vídeo
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                    {[
                      { id: "youtube", label: "YouTube Shorts", color: "#dc2626", bg: "#fef2f2" },
                      { id: "instagram", label: "Instagram Reels", color: "#c026d3", bg: "#fdf4ff" },
                      { id: "tiktok", label: "TikTok", color: "#06b6d4", bg: "#ecfeff" },
                      { id: "nativo", label: "Vídeo MP4", color: "#2563eb", bg: "#eff6ff" },
                    ].map((p) => {
                      const sel = videoPortalForm.plataforma === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setVideoPortalForm({ ...videoPortalForm, plataforma: p.id as any })}
                          style={{
                            padding: "8px 4px",
                            borderRadius: "8px",
                            border: sel ? `2px solid ${p.color}` : "1px solid #cbd5e1",
                            background: sel ? p.bg : "#fff",
                            color: sel ? p.color : "#475569",
                            fontWeight: "800",
                            fontSize: "11px",
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "all 0.2s",
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                    Capa / Imagem de Thumbnail (Opcional se for YouTube)
                  </label>
                  <ImageField
                    label="Selecione uma imagem ou informe a URL"
                    value={videoPortalForm.thumbnail_url}
                    onChange={(v) => setVideoPortalForm({ ...videoPortalForm, thumbnail_url: v })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                    Status de Publicação
                  </label>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="video_status"
                        checked={videoPortalForm.status === "publicado"}
                        onChange={() => setVideoPortalForm({ ...videoPortalForm, status: "publicado" })}
                      />
                      <span style={{ color: "#16a34a" }}>🟢 Publicado (visível no site)</span>
                    </label>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="video_status"
                        checked={videoPortalForm.status === "rascunho"}
                        onChange={() => setVideoPortalForm({ ...videoPortalForm, status: "rascunho" })}
                      />
                      <span style={{ color: "#64748b" }}>⚪ Rascunho (oculto)</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <SaveButton
                    label={salvandoVideoPortal ? "Salvando..." : editVideoPortalId ? "Atualizar Vídeo" : "Salvar Vídeo no Portal"}
                    onClick={() => void salvarVideoPortal()}
                  />
                  {editVideoPortalId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditVideoPortalId(null);
                        setVideoPortalForm({
                          titulo: "",
                          url_video: "",
                          plataforma: "youtube",
                          thumbnail_url: "",
                          status: "publicado",
                        });
                      }}
                      style={{
                        padding: "12px 18px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        color: "#475569",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              </div>

              {/* Live Preview Card 9:16 (Padrão Faixa Multimídia) */}
              <div style={{ background: "#0f172a", borderRadius: "18px", padding: "18px", border: "1px solid #334155", color: "#fff" }}>
                <span style={{ fontSize: "10px", fontWeight: "900", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "4px" }}>
                  PRÉ-VISUALIZAÇÃO AO VIVO (9:16)
                </span>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 14px 0" }}>
                  Exatamente como aparecerá para os visitantes na Home e na aba Vídeos:
                </p>

                <div style={{ width: "100%", maxWidth: "230px", margin: "0 auto", aspectRatio: "9/16", borderRadius: "16px", overflow: "hidden", position: "relative", background: "#020617", border: "1px solid #1e293b", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }}>
                  {/* Thumbnail */}
                  <img
                    src={getVideoThumbnail({
                      url_video: videoPortalForm.url_video,
                      plataforma: videoPortalForm.plataforma,
                      thumbnail_url: videoPortalForm.thumbnail_url,
                    })}
                    alt="Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  {/* Gradiente escuro */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(2, 6, 23, 0.95), rgba(2, 6, 23, 0.3) 60%, transparent)" }} />

                  {/* Badge de Plataforma */}
                  <div style={{ position: "absolute", top: "10px", left: "10px", right: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: "900",
                      padding: "2px 8px",
                      borderRadius: "99px",
                      textTransform: "uppercase",
                      background:
                        videoPortalForm.plataforma === "youtube"
                          ? "#dc2626"
                          : videoPortalForm.plataforma === "instagram"
                          ? "linear-gradient(45deg, #c026d3, #db2777)"
                          : videoPortalForm.plataforma === "tiktok"
                          ? "#000"
                          : "#2563eb",
                      color: "#fff",
                      border: videoPortalForm.plataforma === "tiktok" ? "1px solid #06b6d4" : "none",
                    }}>
                      {videoPortalForm.plataforma}
                    </span>
                    <span style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "99px", background: "rgba(0,0,0,0.6)", color: "#cbd5e1" }}>
                      9:16
                    </span>
                  </div>

                  {/* Botão de Play Central */}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#dc2626", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(220, 38, 38, 0.5)" }}>
                      ▶
                    </div>
                  </div>

                  {/* Título na Base */}
                  <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px" }}>
                    <strong style={{ fontSize: "12px", color: "#fff", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.3" }}>
                      {videoPortalForm.titulo.trim() || "Título do vídeo aparecerá aqui..."}
                    </strong>
                    <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "4px" }}>
                      Rede Apucarana
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Divisor */}
            <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: "24px 0 16px" }} />

            {/* Barra de Filtros e Contagem */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
                {[
                  { id: "todas", label: `Todos (${portalVideos.length})` },
                  { id: "youtube", label: "YouTube" },
                  { id: "instagram", label: "Instagram" },
                  { id: "tiktok", label: "TikTok" },
                  { id: "nativo", label: "Nativo MP4" },
                  { id: "rascunho", label: "Rascunhos" },
                ].map((f) => {
                  const sel = filtroVideoPlat === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFiltroVideoPlat(f.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: "700",
                        border: sel ? "1px solid #0f172a" : "1px solid #cbd5e1",
                        background: sel ? "#0f172a" : "#fff",
                        color: sel ? "#fff" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ minWidth: "220px" }}>
                <FormInput
                  placeholder="Filtrar por título..."
                  value={buscaVideo}
                  onChange={(v) => setBuscaVideo(v)}
                />
              </div>
            </div>

            {/* Listagem dos Vídeos da Tabela videos_portal */}
            <div style={{ display: "grid", gap: "10px" }}>
              {portalVideos
                .filter((v) => {
                  if (filtroVideoPlat === "rascunho") return v.status === "rascunho";
                  if (filtroVideoPlat !== "todas") return v.plataforma?.toLowerCase() === filtroVideoPlat;
                  return true;
                })
                .filter((v) => !buscaVideo.trim() || v.titulo.toLowerCase().includes(buscaVideo.toLowerCase()))
                .map((v) => {
                  const thumb = getVideoThumbnail(v);
                  return (
                    <div
                      key={v.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "12px",
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: "1 1 300px" }}>
                        <div style={{ width: "48px", height: "72px", borderRadius: "8px", overflow: "hidden", background: "#0f172a", flexShrink: 0, border: "1px solid #cbd5e1" }}>
                          <img src={thumb} alt={v.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: "800",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background:
                                  v.plataforma === "youtube"
                                    ? "#fee2e2"
                                    : v.plataforma === "instagram"
                                    ? "#fdf4ff"
                                    : v.plataforma === "tiktok"
                                    ? "#f1f5f9"
                                    : "#dbeafe",
                                color:
                                  v.plataforma === "youtube"
                                    ? "#dc2626"
                                    : v.plataforma === "instagram"
                                    ? "#c026d3"
                                    : v.plataforma === "tiktok"
                                    ? "#0f172a"
                                    : "#2563eb",
                              }}
                            >
                              {v.plataforma?.toUpperCase()}
                            </span>

                            <button
                              type="button"
                              onClick={() => void alternarStatusVideoPortal(v.id, v.status)}
                              title="Clique para alternar entre publicado e rascunho"
                              style={{
                                fontSize: "10px",
                                fontWeight: "800",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                border: 0,
                                cursor: "pointer",
                                background: v.status === "publicado" ? "#dcfce7" : "#f1f5f9",
                                color: v.status === "publicado" ? "#166534" : "#64748b",
                              }}
                            >
                              {v.status === "publicado" ? "🟢 Publicado" : "⚪ Rascunho"}
                            </button>
                          </div>

                          <strong style={{ display: "block", fontSize: "13px", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {v.titulo}
                          </strong>
                          <span style={{ fontSize: "11px", color: "#64748b", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {v.url_video}
                          </span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setPreviewModalVideo(v)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#f8fafc",
                            color: "#334155",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          ▶ Testar Player
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditVideoPortalId(v.id);
                            setVideoPortalForm({
                              titulo: v.titulo,
                              url_video: v.url_video,
                              plataforma: (v.plataforma as any) || "youtube",
                              thumbnail_url: v.thumbnail_url || "",
                              status: (v.status as any) || "publicado",
                            });
                            window.scrollTo({ top: 400, behavior: "smooth" });
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #bfdbfe",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => void excluirVideoPortal(v.id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #fecdd3",
                            background: "#fff1f2",
                            color: "#e11d48",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}

              {portalVideos.length === 0 && (
                <div style={{ padding: "30px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  Nenhum vídeo cadastrado ainda. Use o formulário acima para adicionar o primeiro corte ou vídeo vertical!
                </div>
              )}
            </div>

            {/* MODAL DE TESTE DE PLAYER DENTRO DO ADMIN */}
            {previewModalVideo && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 9999,
                  background: "rgba(0, 0, 0, 0.85)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px",
                }}
                onClick={() => setPreviewModalVideo(null)}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: "420px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "20px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ padding: "14px 18px", background: "#020617", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "10px", fontWeight: "900", color: "#ef4444", textTransform: "uppercase" }}>
                        TESTE DE PLAYER: {previewModalVideo.plataforma}
                      </span>
                      <h4 style={{ fontSize: "13px", color: "#fff", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {previewModalVideo.titulo}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewModalVideo(null)}
                      style={{ background: "#1e293b", border: 0, color: "#fff", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontWeight: "800" }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ width: "100%", aspectRatio: "9/16", maxHeight: "65vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {previewModalVideo.plataforma === "youtube" && (() => {
                      const ytId = getYoutubeId(previewModalVideo.url_video);
                      return ytId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`}
                          style={{ width: "100%", height: "100%", border: 0 }}
                          title={previewModalVideo.titulo}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                          Link inválido do YouTube.
                        </div>
                      );
                    })()}

                    {previewModalVideo.plataforma === "instagram" && (() => {
                      const embedUrl = getInstagramEmbedUrl(previewModalVideo.url_video);
                      return embedUrl ? (
                        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                          <iframe
                            src={embedUrl}
                            style={{ width: "100%", flex: 1, border: 0, background: "#fff" }}
                            title={previewModalVideo.titulo}
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                            allowFullScreen
                          />
                          <div style={{ background: "#020617", padding: "6px 12px", borderTop: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
                            <span>Bloqueio de áudio/direitos?</span>
                            <a href={previewModalVideo.url_video} target="_blank" rel="noreferrer" style={{ color: "#f472b6", fontWeight: "bold", textDecoration: "underline" }}>
                              Abrir no Instagram ➔
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                          Link do Instagram: <a href={previewModalVideo.url_video} target="_blank" rel="noreferrer" style={{ color: "#ec4899" }}>Abrir original</a>
                        </div>
                      );
                    })()}

                    {previewModalVideo.plataforma === "tiktok" && (() => {
                      const tiktokId = getTikTokId(previewModalVideo.url_video);
                      return tiktokId ? (
                        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                          <iframe
                            src={`https://www.tiktok.com/player/v1/${tiktokId}?autoplay=1`}
                            style={{ width: "100%", flex: 1, border: 0, background: "#000" }}
                            title={previewModalVideo.titulo}
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                          <div style={{ background: "#020617", padding: "6px 12px", borderTop: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
                            <span>Player TikTok</span>
                            <a href={previewModalVideo.url_video} target="_blank" rel="noreferrer" style={{ color: "#22d3ee", fontWeight: "bold", textDecoration: "underline" }}>
                              Abrir no App ➔
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: "20px", textAlign: "center", color: "#fff" }}>
                          <p style={{ fontSize: "13px", color: "#06b6d4", marginBottom: "12px" }}>Vídeo do TikTok</p>
                          <a href={previewModalVideo.url_video} target="_blank" rel="noreferrer" style={{ background: "#06b6d4", color: "#000", padding: "8px 16px", borderRadius: "20px", fontWeight: "800", textDecoration: "none", fontSize: "12px" }}>
                            Abrir no TikTok ➔
                          </a>
                        </div>
                      );
                    })()}

                    {previewModalVideo.plataforma === "nativo" && (
                      <video src={previewModalVideo.url_video} controls autoPlay style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </AdminSection>
        )}

        {tab === "ondeir" && (
          <AdminSection title="Cadastrar local em Onde Ir" description="Cadastros reais do Supabase, com imagem e exclusão permanente.">
            <FormInput placeholder="Nome do local" value={lForm.nome} onChange={(v) => setLForm({ ...lForm, nome: v })} />
            <div className="form-row"><Select value={lForm.cidade} onChange={(v) => setLForm({ ...lForm, cidade: v })} options={CIDADES} /><Select value={lForm.cat} onChange={(v) => setLForm({ ...lForm, cat: v })} options={CAT_ONDE} /></div>
            <FormInput placeholder="Endereço completo" value={lForm.end} onChange={(v) => setLForm({ ...lForm, end: v })} />
            <FormInput placeholder="WhatsApp para contato" value={lForm.zap} onChange={(v) => setLForm({ ...lForm, zap: v })} />
            <ImageField value={lForm.img} onChange={(v) => setLForm({ ...lForm, img: v })} />
            <FormInput placeholder="Descrição completa" value={lForm.detalhes} onChange={(v) => setLForm({ ...lForm, detalhes: v })} multiline />
            <SaveButton label={editId ? "Atualizar local" : "Salvar local no banco"} onClick={() => { if (!lForm.nome) return alert("Nome obrigatório"); void salvar("service_providers", { nome: lForm.nome, categoria: lForm.cat, cidade_slug: cidadeSlug(lForm.cidade), endereco: lForm.end, whatsapp: lForm.zap, descricao: lForm.detalhes, verificado: true }, lForm.img, "services", () => setLForm({ nome: "", cidade: "Apucarana", cat: "Restaurantes", end: "", zap: "", img: "", detalhes: "" }), editId); }} />
            {filterByCity(locais).map((x) => <AdminItem key={x.id} title={x.nome} meta={`${x.cidade} · ${x.cat} · ${x.end}`} image={x.img} onEdit={() => { setEditId(x.id); setLForm({ nome: x.nome, cidade: x.cidade, cat: x.cat, end: x.end, zap: x.zap, img: x.img || "", detalhes: x.detalhes || "" }); }} onDelete={() => void excluir("service_providers", x.id)} />)}
          </AdminSection>
        )}

        {tab === "classificados" && (
          <AdminSection title="Cadastrar compra ou venda" description="Anúncios com foto e dados persistidos no Supabase. Envios públicos aparecem como pendentes até você salvar como publicado.">
            <FormInput placeholder="Título do anúncio" value={cForm.titulo} onChange={(v) => setCForm({ ...cForm, titulo: v })} />
            <div className="form-row"><Select value={cForm.cidade} onChange={(v) => setCForm({ ...cForm, cidade: v })} options={CIDADES} /><Select value={cForm.cat} onChange={(v) => setCForm({ ...cForm, cat: v })} options={CAT_CLASS} /></div>
            <FormInput placeholder="Preço" value={cForm.preco} onChange={(v) => setCForm({ ...cForm, preco: v })} />
            <FormInput placeholder="WhatsApp do anunciante" value={cForm.zap} onChange={(v) => setCForm({ ...cForm, zap: v })} />
            <ImageField value={cForm.img} onChange={(v) => setCForm({ ...cForm, img: v })} />
            <FormInput placeholder="Descrição completa" value={cForm.detalhes} onChange={(v) => setCForm({ ...cForm, detalhes: v })} multiline />
            <SaveButton label={editId ? "Aprovar / atualizar anúncio" : "Salvar anúncio no banco"} onClick={() => { if (!cForm.titulo) return alert("Título obrigatório"); void salvar("classified_ads", { titulo: cForm.titulo, categoria: cForm.cat, cidade_slug: cidadeSlug(cForm.cidade), preco: cForm.preco, contato: cForm.zap, descricao: cForm.detalhes, status: "published" }, cForm.img, "classifieds", () => setCForm({ titulo: "", cidade: "Apucarana", cat: "Imóveis", preco: "", zap: "", img: "", detalhes: "" }), editId); }} />
            {filterByCity(classif).map((x) => <AdminItem key={x.id} title={x.titulo} meta={`${x.cidade} · ${x.cat} · ${x.preco} · ${x.status === "pending" ? "AGUARDANDO APROVAÇÃO" : "Publicado"}`} image={x.img} onEdit={() => { setEditId(x.id); setCForm({ titulo: x.titulo, cidade: x.cidade, cat: x.cat, preco: x.preco, zap: x.zap, img: x.img || "", detalhes: x.detalhes || "" }); }} onDelete={() => void excluir("classified_ads", x.id)} />)}
          </AdminSection>
        )}

        {tab === "empregos" && (
          <AdminSection title="Cadastrar vaga de emprego" description="Vagas persistidas no banco. Envios públicos aparecem como pendentes até a redação aprovar.">
            <FormInput placeholder="Cargo / função" value={vForm.cargo} onChange={(v) => setVForm({ ...vForm, cargo: v })} />
            <FormInput placeholder="Nome da empresa" value={vForm.empresa} onChange={(v) => setVForm({ ...vForm, empresa: v })} />
            <div className="form-row"><Select value={vForm.cidade} onChange={(v) => setVForm({ ...vForm, cidade: v })} options={CIDADES} /><FormInput placeholder="WhatsApp" value={vForm.zap} onChange={(v) => setVForm({ ...vForm, zap: v })} /></div>
            <ImageField value={vForm.img} onChange={(v) => setVForm({ ...vForm, img: v })} />
            <FormInput placeholder="Descrição, requisitos e candidatura" value={vForm.detalhes} onChange={(v) => setVForm({ ...vForm, detalhes: v })} multiline />
            <SaveButton label={editId ? "Aprovar / atualizar vaga" : "Salvar vaga no banco"} onClick={() => { if (!vForm.cargo) return alert("Cargo obrigatório"); void salvar("jobs", { vaga: vForm.cargo, empresa: vForm.empresa, cidade_slug: cidadeSlug(vForm.cidade), contato: vForm.zap, descricao: vForm.detalhes, imagem: vForm.img || "https://www.redeapucarana.com.br/vagas-padrao.svg", status: "published" }, vForm.img, "jobs", () => setVForm({ cargo: "", empresa: "", cidade: "Apucarana", zap: "", img: "", detalhes: "" }), editId); }} />
            {filterByCity(vagas).map((x) => <AdminItem key={x.id} title={`${x.cargo} · ${x.empresa}`} meta={`${x.cidade} · ${x.zap} · ${x.status === "pending" ? "AGUARDANDO APROVAÇÃO" : "Publicado"}`} image={x.img} onEdit={() => { setEditId(x.id); setVForm({ cargo: x.cargo, empresa: x.empresa, cidade: x.cidade, zap: x.zap, img: x.img || "", detalhes: x.detalhes || "" }); }} onDelete={() => void excluir("jobs", x.id)} />)}
          </AdminSection>
        )}

        {tab === "promocoes" && (
          <AdminSection title="Cadastrar promoção" description="Promoções persistidas no banco e atualizadas pelo painel.">
            <FormInput placeholder="Título da promoção" value={pForm.titulo} onChange={(v) => setPForm({ ...pForm, titulo: v })} />
            <div className="form-row"><Select value={pForm.cidade} onChange={(v) => setPForm({ ...pForm, cidade: v })} options={CIDADES} /><FormInput placeholder="Categoria / loja" value={pForm.categoria} onChange={(v) => setPForm({ ...pForm, categoria: v })} /></div>
            <FormInput placeholder="Validade" value={pForm.validade} onChange={(v) => setPForm({ ...pForm, validade: v })} />
            <FormInput placeholder="WhatsApp ou contato" value={pForm.contato} onChange={(v) => setPForm({ ...pForm, contato: v })} />
            <ImageField value={pForm.img} onChange={(v) => setPForm({ ...pForm, img: v })} />
            <FormInput placeholder="Detalhes, regras e condições" value={pForm.detalhes} onChange={(v) => setPForm({ ...pForm, detalhes: v })} multiline />
            <SaveButton label={editId ? "Atualizar promoção" : "Salvar promoção no banco"} onClick={() => { if (!pForm.titulo) return alert("Título obrigatório"); void salvar("promotions", { titulo: pForm.titulo, categoria: pForm.categoria, cidade_slug: cidadeSlug(pForm.cidade), validade: pForm.validade, contato: pForm.contato, detalhes: pForm.detalhes, status: "published" }, pForm.img, "promotions", () => setPForm({ titulo: "", cidade: "Apucarana", categoria: "Comércio", validade: "", contato: "", img: "", detalhes: "" }), editId); }} />
            {filterByCity(promocoes).map((x) => <AdminItem key={x.id} title={x.titulo} meta={`${x.cidade} · ${x.categoria} · ${x.validade}`} image={x.img} onEdit={() => { setEditId(x.id); setPForm({ titulo: x.titulo, cidade: x.cidade, categoria: x.categoria, validade: x.validade, contato: x.contato, img: x.img || "", detalhes: x.detalhes || "" }); }} onDelete={() => void excluir("promotions", x.id)} />)}
          </AdminSection>
        )}

        {tab === "publicidade" && (
          <AdminSection title="Publicidade e patrocinadores" description="Configure os vídeos das TVs, banners principais, blocos laterais LG1, LM1, LG2 e LM2, e o carrossel grande de patrocinadores em loop.">
            
            {/* Aviso e atalho para a Capa Principal */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px 18px", marginBottom: "18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
              <div>
                <strong style={{ display: "block", fontSize: "14px", color: "#1e40af", marginBottom: "3px" }}>
                  🎬 Quer colocar Vídeo Animado ou Carrossel na Capa Principal (Topo)?
                </strong>
                <span style={{ fontSize: "12px", color: "#3b82f6" }}>
                  Você pode configurar a mídia de abertura do portal diretamente na aba <strong>🎬 Capa Principal</strong> no menu superior.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTab("capa")}
                style={{ padding: "9px 15px", background: "#1d4ed8", color: "#fff", border: 0, borderRadius: "6px", fontWeight: "800", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Abrir Capa Principal →
              </button>
            </div>

            {/* Seletor Geral ou Por Cidade */}
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "16px", marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "900", color: "#166534", marginBottom: "6px" }}>
                📍 Abrangência da Propaganda (Geral ou Por Cidade):
              </label>
              <select
                value={adCity}
                onChange={(e) => {
                  const chosen = e.target.value;
                  setAdCity(chosen);
                  loadAdsForCity(chosen, allSettings);
                }}
                style={{ width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid #86efac", fontSize: "14px", fontWeight: "700", background: "#fff", color: "#14532d" }}
              >
                <option value="Geral">🌐 Geral (Capa Principal e padrão para todas as cidades)</option>
                {CIDADES.map((c) => (
                  <option key={c} value={c}>🏙️ {c} (Exclusivo da página de {c})</option>
                ))}
              </select>
              <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#15803d", lineHeight: "1.4" }}>
                {adCity === "Geral"
                  ? "💡 Você está editando os anúncios GERAIS. Eles são exibidos na capa do portal e cobrem automaticamente qualquer cidade que não tiver anúncio local cadastrado."
                  : `💡 Você está editando os anúncios EXCLUSIVOS DE ${adCity.toUpperCase()}. Se deixar algum espaço em branco aqui, o portal exibirá o anúncio Geral no lugar.`}
              </p>
            </div>

            {/* SEÇÃO: BLOCOS LATERAIS LG1, LM1, LG2, LM2 */}
            <div className="contact-info" style={{ borderLeft: "4px solid #b91c1c", background: "#fff5f5" }}>
              <strong style={{ fontSize: "16px", color: "#991b1b" }}>
                🏷️ Blocos Laterais (LG1, LM1, LG2 e LM2) — {adCity === "Geral" ? "Gerais" : adCity}
              </strong>
              <span style={{ color: "#7f1d1d" }}>
                Configure os patrocinadores dos 4 blocos fixos da barra lateral. LG1 e LG2 são formatos grandes (16x10). LM1 e LM2 são enquadrados como <strong>Cartão de Visita (proporção 9x5)</strong>. Ao enviar uma foto/arte, ela é exibida <strong>100% limpa</strong>, sem nenhuma palavra ou selo por cima.
              </span>

              {/* Bloco LG1 */}
              <div className="admin-ad-form">
                <strong>LG1 — Bloco Lateral Grande 1 ({adCity})</strong>
                <p style={{ fontSize: "11px", color: "#991b1b", margin: "4px 0 10px" }}>🖼️ Proporção recomendada 16:10 (ex: 600x375px). Fica apenas a imagem limpa no portal.</p>
                <FormInput
                  placeholder="Nome do patrocinador ou título do anúncio (LG1)"
                  value={lateralAdsForm.lg1.titulo}
                  onChange={(v) => setLateralAdsForm({ ...lateralAdsForm, lg1: { ...lateralAdsForm.lg1, titulo: v } })}
                />
                <ImageField
                  label={`Foto / Banner do Bloco LG1 (${adCity})`}
                  value={lateralAdsForm.lg1.img}
                  onChange={(v) => setLateralAdsForm({ ...lateralAdsForm, lg1: { ...lateralAdsForm.lg1, img: v } })}
                />
                <FormInput
                  placeholder="Link de destino ao clicar no LG1 (ex: https://wa.me/... ou https://empresa.com)"
                  value={lateralAdsForm.lg1.linkUrl}
                  onChange={(v) => setLateralAdsForm({ ...lateralAdsForm, lg1: { ...lateralAdsForm.lg1, linkUrl: v } })}
                />
              </div>

              {/* Bloco LM1 */}
              <div className="admin-ad-form">
                <strong>LM1 — Bloco Lateral Médio 1 ({adCity}) — Cartão de Visita</strong>
                <p style={{ fontSize: "11px", color: "#0369a1", margin: "4px 0 10px" }}>📇 <strong>Formato Cartão de Visita:</strong> Proporção 9:5 (ex: 900x500px). Fica perfeitamente enquadrado como um cartão de visita limpo.</p>
                <FormInput
                  placeholder="Nome do patrocinador ou título do anúncio (LM1)"
                  value={lateralAdsForm.lm1.titulo}
                  onChange={(v) => setLateralAdsForm({ ...lateralAdsForm, lm1: { ...lateralAdsForm.lm1, titulo: v } })}
                />
                <ImageField
                  label={`Foto / Banner do Bloco LM1 (${adCity})`}
                  value={lateralAdsForm.lm1.img}
                  onChange={(v) => setLateralAdsForm({ ...lateralAdsForm, lm1: { ...lateralAdsForm.lm1, img: v } })}
                />
                <FormInput
                  placeholder="Link de destino ao clicar no LM1 (opcional)"
                  value={lateralAdsForm.lm1.linkUrl}
                  onChange={(v) => setLateralAdsForm({ ...lateralAdsForm, lm1: { ...lateralAdsForm.lm1, linkUrl: v } })}
                />
              </div>

              {/* Bloco LG2 */}
              <div className="admin-ad-form">
                <strong>LG2 — Bloco Lateral Grande 2 ({adCity})</strong>
                <p style={{ fontSize: "11px", color: "#991b1b", margin: "4px 0 10px" }}>🖼️ Proporção recomendada 16:10 (ex: 600x375px). Fica apenas a imagem limpa no portal.</p>
                <FormInput
                  placeholder="Nome do patrocinador ou título do anúncio (LG2)"
                  value={lateralAdsForm.lg2.titulo}
                  onChange={(v) => setLateralAdsForm({ ...lateralAdsForm, lg2: { ...lateralAdsForm.lg2, titulo: v } })}
                />
                <ImageField
                  label={`Foto / Banner do Bloco LG2 (${adCity})`}
                  value={lateralAdsForm.lg2.img}
                  onChange={(v) => setLateralAdsForm({ ...lateralAdsForm, lg2: { ...lateralAdsForm.lg2, img: v } })}
                />
                <FormInput
                  placeholder="Link de destino ao clicar no LG2 (opcional)"
                  value={lateralAdsForm.lg2.linkUrl}
                  onChange={(v) => setLateralAdsForm({ ...lateralAdsForm, lg2: { ...lateralAdsForm.lg2, linkUrl: v } })}
                />
              </div>

              {/* Bloco LM2 */}
              <div className="admin-ad-form">
                <strong>LM2 — Bloco Lateral Médio 2 ({adCity}) — Cartão de Visita</strong>
                <p style={{ fontSize: "11px", color: "#0369a1", margin: "4px 0 10px" }}>📇 <strong>Formato Cartão de Visita:</strong> Proporção 9:5 (ex: 900x500px). Fica perfeitamente enquadrado como um cartão de visita limpo.</p>
                <FormInput
                  placeholder="Nome do patrocinador ou título do anúncio (LM2)"
                  value={lateralAdsForm.lm2.titulo}
                  onChange={(v) => setLateralAdsForm({ ...lateralAdsForm, lm2: { ...lateralAdsForm.lm2, titulo: v } })}
                />
                <ImageField
                  label={`Foto / Banner do Bloco LM2 (${adCity})`}
                  value={lateralAdsForm.lm2.img}
                  onChange={(v) => setLateralAdsForm({ ...lateralAdsForm, lm2: { ...lateralAdsForm.lm2, img: v } })}
                />
                <FormInput
                  placeholder="Link de destino ao clicar no LM2 (opcional)"
                  value={lateralAdsForm.lm2.linkUrl}
                  onChange={(v) => setLateralAdsForm({ ...lateralAdsForm, lm2: { ...lateralAdsForm.lm2, linkUrl: v } })}
                />
              </div>

              <SaveButton label={`Salvar os 4 blocos laterais LG1, LM1, LG2 e LM2 (${adCity})`} onClick={() => void salvarLateralAds()} />
            </div>

            {/* SEÇÃO: CARROSSEL GRANDE DE PATROCINADORES EM LOOP */}
            <div className="contact-info" style={{ borderLeft: "4px solid #0284c7", background: "#f0f9ff" }}>
              <strong style={{ fontSize: "16px", color: "#0369a1" }}>
                🎡 Carrossel de Patrocinadores (Tamanho Grande e Loop)
              </strong>
              <span style={{ color: "#075985" }}>
                Adicione aqui as fotos dos patrocinadores que vão circular automaticamente no carrossel de tamanho grande na lateral do portal. O carrossel roda em loop contínuo e dá destaque total a cada marca.
              </span>

              <div className="admin-ad-form" style={{ background: "#fff", border: "1px solid #bae6fd" }}>
                <strong style={{ color: "#0284c7" }}>{editId ? "Editar Foto do Patrocinador" : "Adicionar Nova Foto ao Carrossel"}</strong>
                <FormInput
                  placeholder="Nome / Marca do Patrocinador"
                  value={sponsorForm.titulo}
                  onChange={(v) => setSponsorForm({ ...sponsorForm, titulo: v })}
                />
                <ImageField
                  label="Foto / Banner do Patrocinador (tamanho grande)"
                  value={sponsorForm.img}
                  onChange={(v) => setSponsorForm({ ...sponsorForm, img: v })}
                />
                <div className="form-row">
                  <FormInput
                    placeholder="Link do patrocinador (ex: https://wa.me/... ou https://seusite.com)"
                    value={sponsorForm.linkUrl}
                    onChange={(v) => setSponsorForm({ ...sponsorForm, linkUrl: v })}
                  />
                  <FormInput
                    placeholder="Ordem no loop (0, 1, 2, 3...)"
                    value={sponsorForm.ordem}
                    onChange={(v) => setSponsorForm({ ...sponsorForm, ordem: v })}
                  />
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <SaveButton label={editId ? "Atualizar Patrocinador no Carrossel" : "Adicionar Foto ao Carrossel"} onClick={() => void salvarPatrocinador()} />
                  {editId && (
                    <button
                      type="button"
                      onClick={() => { setEditId(null); setSponsorForm({ titulo: "", img: "", linkUrl: "", ordem: "0" }); }}
                      style={{ padding: "11px 16px", background: "#64748b", color: "#fff", border: "0", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginTop: "18px" }}>
                <strong style={{ display: "block", color: "#0f172a", fontSize: "14px", marginBottom: "8px" }}>
                  Fotos Ativas no Carrossel ({sponsors.length} cadastradas):
                </strong>
                {sponsors.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "#64748b" }}>Nenhum patrocinador cadastrado ainda. Use o formulário acima para adicionar fotos ao carrossel.</p>
                ) : (
                  sponsors.map((x) => (
                    <AdminItem
                      key={x.id}
                      title={x.titulo}
                      meta={`Ordem no loop: ${x.ordem}${x.linkUrl ? ` · Link: ${x.linkUrl}` : " · Sem link"}`}
                      image={x.imagem}
                      onEdit={() => {
                        setEditId(x.id);
                        setSponsorForm({ titulo: x.titulo, img: x.imagem, linkUrl: x.linkUrl, ordem: String(x.ordem) });
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      onDelete={() => void excluirPatrocinador(x.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* SEÇÃO: PROPAGANDAS EM VÍDEO DAS 3 TVs */}
            <div className="contact-info">
              <strong>Propagandas em Vídeo da Barra Lateral (TV 1, TV 2 e TV 3) — {adCity === "Geral" ? "Gerais" : adCity}</strong>
              <span>Os três espaços de TV reproduzem vídeos MP4 direto no portal. Cole a URL direta ou envie um arquivo MP4 do seu computador.</span>
              {tvAdsForm.map((tv, index) => (
                <div className="admin-ad-form" key={`tv-ad-form-${index}`}>
                  <strong>TV {index + 1} ({index === 0 ? "Topo da lateral" : index === 1 ? "Meio da lateral" : "Final da lateral"}) — {adCity}</strong>
                  <FormInput
                    placeholder={`URL do vídeo da TV ${index + 1} para ${adCity} (ex: https://.../video.mp4)`}
                    value={tv.videoUrl}
                    onChange={(v) => setTvAdsForm(tvAdsForm.map((item, itemIndex) => itemIndex === index ? { ...item, videoUrl: v } : item))}
                  />
                  <div style={{ display: "grid", gap: "6px", background: "#f8fafc", border: "1px dashed #c7d1db", borderRadius: "8px", padding: "10px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold", color: "#334155" }}>Ou envie um arquivo MP4 do seu computador para a TV {index + 1} de {adCity}:</label>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      disabled={loading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 48_000_000) return alert("Escolha um arquivo de vídeo de até 48 MB.");
                        try {
                          setLoading(true);
                          const url = await uploadArquivo(file, "tv-ads");
                          setTvAdsForm(tvAdsForm.map((item, itemIndex) => itemIndex === index ? { ...item, videoUrl: url } : item));
                          alert(`Vídeo da TV ${index + 1} (${adCity}) carregado com sucesso! Clique em "Salvar vídeos das 3 TVs" abaixo para confirmar.`);
                        } catch (err: any) {
                          alert(`Erro no upload: ${err.message || "tente novamente"}`);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    />
                    {tv.videoUrl && (
                      <small style={{ color: "#16a34a", fontWeight: "600" }}>✓ Vídeo ativo: {tv.videoUrl.slice(0, 60)}{tv.videoUrl.length > 60 ? "..." : ""}</small>
                    )}
                  </div>
                  <FormInput
                    placeholder={`Link de destino ao clicar no vídeo da TV ${index + 1} (opcional, ex: https://wa.me/... ou https://seusite.com)`}
                    value={tv.linkUrl}
                    onChange={(v) => setTvAdsForm(tvAdsForm.map((item, itemIndex) => itemIndex === index ? { ...item, linkUrl: v } : item))}
                  />
                </div>
              ))}
              <SaveButton label={`Salvar vídeos das 3 TVs (${adCity})`} onClick={() => void salvarTvAds()} />
            </div>

            {/* SEÇÃO: PUBLICIDADES PRINCIPAIS 1, 2 E 3 */}
            <div className="contact-info">
              <strong>Publicidades Principais 1, 2 e 3 — {adCity === "Geral" ? "Gerais" : adCity}</strong>
              <span>Os três banners aparecem no início, no meio e no final da coluna de notícias.</span>
              {mainAdsForm.map((form, index) => (
                <div className="admin-ad-form" key={`main-ad-form-${index}`}>
                  <strong>Publicidade Principal {index + 1} — {adCity}</strong>
                  <FormInput placeholder={`Título / texto alternativo da Publicidade ${index + 1}`} value={form.titulo} onChange={(v) => setMainAdsForm(mainAdsForm.map((item, itemIndex) => itemIndex === index ? { ...item, titulo: v } : item))} />
                  <ImageField label={`Imagem da Publicidade Principal ${index + 1}`} value={form.img} onChange={(v) => setMainAdsForm(mainAdsForm.map((item, itemIndex) => itemIndex === index ? { ...item, img: v } : item))} />
                  <FormInput placeholder="Link de destino (opcional)" value={form.linkUrl} onChange={(v) => setMainAdsForm(mainAdsForm.map((item, itemIndex) => itemIndex === index ? { ...item, linkUrl: v } : item))} />
                </div>
              ))}
              <SaveButton label={`Salvar as 3 publicidades principais (${adCity})`} onClick={() => void salvarAnunciosPrincipais()} />
            </div>

            {/* Link do Grupo de WhatsApp */}
            <div className="contact-info">
              <strong>Comunidade e WhatsApp</strong>
              <FormInput placeholder="Link do grupo de WhatsApp (https://chat.whatsapp.com/...)" value={grupoWhatsApp} onChange={setGrupoWhatsApp} />
              <SaveButton label="Salvar link do grupo" onClick={() => void salvarWhatsApp()} />
            </div>
          </AdminSection>
        )}

        {tab === "contato" && (
          <AdminSection title="Informações de contato" description="O painel está operando com dados centralizados no Supabase e suporte local.">
            <div className="contact-info">
              <strong>Fonte dos cadastros</strong>
              <span>Supabase — banco central do portal</span>
              <strong>Imagens</strong>
              <span>Storage rede-norte-media</span>
              <strong>Operação</strong>
              <span>Use o botão Atualizar dados para recarregar o conteúdo diretamente do banco.</span>
            </div>
          </AdminSection>
        )}
      </main>
    </div>
  );
}

function AdminSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="admin-section"><div className="admin-section-title"><span className="admin-kicker">GERENCIAMENTO</span><h2>{title}</h2><p>{description}</p></div><div className="admin-form">{children}</div></section>; }
function FormInput({ placeholder, value, onChange, multiline = false }: { placeholder: string; value: string; onChange: (value: string) => void; multiline?: boolean }) { return multiline ? <textarea placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /> : <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />; }
function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) { return <select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select>; }
function ImageField({ value, onChange, label = "Imagem do anúncio" }: { value: string; onChange: (value: string) => void; label?: string }) { return <div className="image-field"><label>{label}</label><input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 2_500_000) return alert("Escolha uma imagem de até 2 MB"); const reader = new FileReader(); reader.onload = () => onChange(String(reader.result)); reader.readAsDataURL(file); }} /><span>ou cole a URL da imagem abaixo</span><input placeholder="https://..." value={value.startsWith("data:") ? "Imagem carregada" : value} onChange={(e) => onChange(e.target.value)} />{value && <img src={value} alt="Pré-visualização" />}</div>; }
function VideoFileField({ value, file, onChange }: { value: string; file: File | null; onChange: (file: File | null) => void }) { return <div className="video-file-field"><label>Arquivo de vídeo (MP4 recomendado)</label><input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => onChange(e.target.files?.[0] || null)} /><small>{file ? `Selecionado: ${file.name} (${Math.round(file.size / 1024 / 1024)} MB)` : value ? "Usando vídeo já enviado ou URL direta" : "Nenhum arquivo local selecionado"}</small></div>; }
function SaveButton({ label, onClick }: { label: string; onClick: () => void }) { return <button className="save-button" onClick={onClick}>{label}</button>; }
function AdminItem({
  title,
  meta,
  image,
  onEdit,
  onDelete,
  extraAction,
  footer,
}: {
  title: string;
  meta: string;
  image?: string;
  onEdit: () => void;
  onDelete: () => void;
  extraAction?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!footer) {
    return (
      <div className="admin-item">
        {image && <img src={image} alt={title} />}
        <div>
          <strong>{title}</strong>
          <span>{meta}</span>
        </div>
        <div className="admin-item-actions">
          {extraAction}
          <button onClick={onEdit}>Editar</button>
          <button className="danger" onClick={onDelete}>
            Excluir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "6px",
        border: "1px solid #e0e6eb",
        borderRadius: "10px",
        padding: "10px",
        background: "#fbfcfd",
        marginTop: "4px",
      }}
    >
      <div className="admin-item" style={{ border: 0, padding: 0, background: "transparent", margin: 0 }}>
        {image && <img src={image} alt={title} />}
        <div>
          <strong>{title}</strong>
          <span>{meta}</span>
        </div>
        <div className="admin-item-actions">
          {extraAction}
          <button onClick={onEdit}>Editar</button>
          <button className="danger" onClick={onDelete}>
            Excluir
          </button>
        </div>
      </div>
      {footer}
    </div>
  );
}
