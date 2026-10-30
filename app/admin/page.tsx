"use client";

import { useEffect, useMemo, useState } from "react";
import { cidadeSlug, getSupabase } from "../../lib/supabase";

type Tab = "capa" | "noticias" | "videos" | "ondeir" | "classificados" | "empregos" | "promocoes" | "publicidade" | "contato";
type Noticia = { id: string; titulo: string; cidade: string; cat: string; resumo: string; img: string; texto?: string };
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

const emptyNews = { titulo: "", cidade: "Geral", cat: "Política", resumo: "", img: "", texto: "", exibirNoGeral: true };
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

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
          supabase.from("news").select("id,titulo,categoria,resumo,conteudo,imagem,cidade_slug").order("created_at", { ascending: false }),
          supabase.from("service_providers").select("id,nome,categoria,endereco,whatsapp,imagem,descricao,cidade_slug").order("created_at", { ascending: false }),
          supabase.from("classified_ads").select("id,titulo,categoria,preco,contato,imagem,descricao,cidade_slug,status").order("created_at", { ascending: false }),
          supabase.from("jobs").select("id,vaga,empresa,contato,imagem,descricao,cidade_slug,status").order("created_at", { ascending: false }),
          supabase.from("promotions").select("id,titulo,categoria,validade,contato,imagem,detalhes,cidade_slug").order("created_at", { ascending: false }),
          supabase.from("videos").select("id,titulo,descricao,video_url,thumbnail_url,instagram_url,cidade_slug,categoria,materia_url,tipo,status").order("created_at", { ascending: false }),
          supabase.from("site_sponsors").select("id,titulo,imagem,link_url,ordem").order("ordem"),
          supabase.from("site_settings").select("key,value"),
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
      }

      const cityMap = new Map((cities || []).map((c: any) => [c.slug, c.nome]));
      setNoticias((news || []).map((n: any) => ({ id: n.id, titulo: n.titulo, cidade: cityMap.get(n.cidade_slug) || "Apucarana", cat: n.categoria || "Cidade", resumo: n.resumo || "", texto: n.conteudo || "", img: n.imagem || "" })));
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

  const salvar = async (table: string, record: any, image: string, folder: string, onDone: () => void, id?: string | null) => {
    const supabase = getSupabase();
    if (!supabase) { alert("Supabase não configurado."); return; }
    setLoading(true);
    try {
      const imagem = await uploadImagem(image, folder);
      const query = id ? supabase.from(table).update({ ...record, imagem }).eq("id", id) : supabase.from(table).insert({ ...record, imagem });
      const { error } = await query;
      if (error) throw error;
      onDone(); setEditId(null); await carregarTudo();
    } catch (e: any) { alert(`Não foi possível salvar: ${e.message || "erro de conexão"}`); } finally { setLoading(false); }
  };

  const salvarVideo = async () => {
    const supabase = getSupabase();
    if (!supabase) return alert("Supabase não configurado.");
    if (!videoForm.titulo.trim()) return alert("Título obrigatório.");
    if (videoForm.tipo === "instagram" && !videoForm.instagramUrl.trim()) return alert("Cole o link público do Instagram.");
    if (videoForm.tipo === "upload" && !videoFile && !videoForm.videoUrl.trim()) return alert("Selecione um vídeo ou informe uma URL MP4.");
    setLoading(true);
    try {
      const videoUrl = videoFile ? await uploadArquivo(videoFile, "videos") : videoForm.videoUrl.trim();
      const thumbnailUrl = await uploadImagem(videoForm.thumbnailUrl, "video-thumbnails");
      const record = { titulo: videoForm.titulo.trim(), descricao: videoForm.descricao.trim(), video_url: videoForm.tipo === "upload" ? videoUrl || null : null, thumbnail_url: thumbnailUrl || null, instagram_url: videoForm.tipo === "instagram" ? videoForm.instagramUrl.trim() : null, cidade_slug: cidadeSlug(videoForm.cidade) || null, categoria: videoForm.categoria, materia_url: videoForm.materiaUrl.trim() || null, tipo: videoForm.tipo, status: videoForm.status };
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
            <SaveButton
              label={editId ? "Atualizar notícia" : "Salvar notícia no banco"}
              onClick={() => {
                if (!nForm.titulo) return alert("Título obrigatório");
                const isGeral = nForm.cidade === "Geral" || nForm.exibirNoGeral;
                void salvar(
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
                  () => {
                    if (editId) {
                      if (isGeral && !noticiasPromovidasGeral.has(editId)) {
                        void alternarPromocaoGeral(editId);
                      } else if (!isGeral && noticiasPromovidasGeral.has(editId)) {
                        void alternarPromocaoGeral(editId);
                      }
                    }
                    setNForm(emptyNews);
                  },
                  editId
                );
              }}
            />
            {filterByCity(noticias).map((n) => {
              const noGeral = n.cidade === "Geral" || noticiasPromovidasGeral.has(n.id);
              return (
                <AdminItem
                  key={n.id}
                  title={n.titulo}
                  meta={`${n.cidade} · ${n.cat} · ${noGeral ? "✓ Exibindo no Geral e na Cidade" : "Apenas na Cidade"}`}
                  image={n.img}
                  extraAction={
                    <button
                      type="button"
                      className={`admin-badge-btn ${noGeral ? "is-geral" : ""}`}
                      onClick={() => void alternarPromocaoGeral(n.id)}
                      title={noGeral ? "Exibindo na Capa Geral e na cidade. Clique para remover da Capa Geral." : "Exibindo apenas na pasta da cidade. Clique para exibir também na Capa Geral."}
                    >
                      {noGeral ? "✓ No Geral" : "+ Levar pro Geral"}
                    </button>
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
                    });
                  }}
                  onDelete={() => void excluir("news", n.id)}
                />
              );
            })}
          </AdminSection>
        )}

        {tab === "videos" && (
          <AdminSection title="Cadastrar vídeo" description="Publique cortes próprios com upload direto ou cole um link público do Instagram para assistir sem sair do portal.">
            <div style={{ background: "#0f172a", color: "#fff", padding: "16px 20px", borderRadius: "16px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", border: "1px solid #334155" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "900", color: "#ef4444", letterSpacing: "0.1em", textTransform: "uppercase" }}>✨ Nova Central de Vídeos Curtos</span>
                <h3 style={{ fontSize: "17px", margin: "4px 0", color: "#fff", fontWeight: "800" }}>Faixa Multimídia da Home (YouTube Shorts, Reels, TikTok)</h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Gerencie a nova faixa multimídia escura da página principal com formulário completo e integração com a tabela <code>public.videos_portal</code>.</p>
              </div>
              <a href="/admin/videos" style={{ background: "#dc2626", color: "#fff", padding: "10px 18px", borderRadius: "10px", textDecoration: "none", fontWeight: "900", fontSize: "13px", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                Abrir Gerenciador de Vídeos →
              </a>
            </div>
            <FormInput placeholder="Título do vídeo" value={videoForm.titulo} onChange={(v) => setVideoForm({ ...videoForm, titulo: v })} />
            <div className="form-row"><Select value={videoForm.cidade} onChange={(v) => setVideoForm({ ...videoForm, cidade: v })} options={CIDADES} /><Select value={videoForm.categoria} onChange={(v) => setVideoForm({ ...videoForm, categoria: v })} options={VIDEO_CATEGORIAS} /></div>
            <Select value={videoForm.tipo} onChange={(v) => setVideoForm({ ...videoForm, tipo: v as "upload" | "instagram" })} options={["upload", "instagram"]} />
            {videoForm.tipo === "upload" ? (
              <>
                <VideoFileField value={videoForm.videoUrl} file={videoFile} onChange={(file) => { setVideoFile(file); if (file) setVideoForm({ ...videoForm, videoUrl: "" }); }} />
                <FormInput placeholder="Ou informe uma URL direta de vídeo MP4" value={videoForm.videoUrl} onChange={(v) => setVideoForm({ ...videoForm, videoUrl: v })} />
              </>
            ) : (
              <FormInput placeholder="Link público do Reel ou post do Instagram" value={videoForm.instagramUrl} onChange={(v) => setVideoForm({ ...videoForm, instagramUrl: v })} />
            )}
            <ImageField label="Thumbnail / capa do vídeo" value={videoForm.thumbnailUrl} onChange={(v) => setVideoForm({ ...videoForm, thumbnailUrl: v })} />
            <FormInput placeholder="Descrição curta do vídeo" value={videoForm.descricao} onChange={(v) => setVideoForm({ ...videoForm, descricao: v })} multiline />
            <FormInput placeholder="Link da matéria relacionada (opcional)" value={videoForm.materiaUrl} onChange={(v) => setVideoForm({ ...videoForm, materiaUrl: v })} />
            <SaveButton label={editId ? "Atualizar vídeo" : "Publicar vídeo"} onClick={() => void salvarVideo()} />
            {filterByCity(videos).map((x) => <AdminItem key={x.id} title={x.titulo} meta={`${x.cidade} · ${x.categoria} · ${x.tipo === "instagram" ? "Instagram" : "Vídeo próprio"}`} image={x.thumbnailUrl} onEdit={() => { setEditId(x.id); setVideoFile(null); setVideoForm({ titulo: x.titulo, descricao: x.descricao, cidade: x.cidade, categoria: x.categoria, tipo: x.tipo, videoUrl: x.videoUrl, instagramUrl: x.instagramUrl, thumbnailUrl: x.thumbnailUrl, materiaUrl: x.materiaUrl, status: "published" }); }} onDelete={() => void excluir("videos", x.id)} />)}
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
function AdminItem({ title, meta, image, onEdit, onDelete, extraAction }: { title: string; meta: string; image?: string; onEdit: () => void; onDelete: () => void; extraAction?: React.ReactNode }) { return <div className="admin-item">{image && <img src={image} alt={title} />}<div><strong>{title}</strong><span>{meta}</span></div><div className="admin-item-actions">{extraAction}<button onClick={onEdit}>Editar</button><button className="danger" onClick={onDelete}>Excluir</button></div></div>; }
