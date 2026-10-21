"use client";

import { useEffect, useMemo, useState } from "react";
import { cidadeSlug, getSupabase } from "../../lib/supabase";

type Tab = "noticias" | "videos" | "ondeir" | "classificados" | "empregos" | "promocoes" | "contato";
type Noticia = { id: string; titulo: string; cidade: string; cat: string; resumo: string; img: string; texto?: string };
type Local = { id: string; nome: string; cidade: string; cat: string; end: string; zap: string; img?: string; detalhes?: string };
type Classif = { id: string; titulo: string; cidade: string; cat: string; preco: string; zap: string; img?: string; detalhes?: string; status?: string };
type Vaga = { id: string; cargo: string; empresa: string; cidade: string; zap: string; img?: string; detalhes?: string; status?: string };
type Promocao = { id: string; titulo: string; cidade: string; categoria: string; validade: string; contato: string; img?: string; detalhes?: string };
type VideoAdmin = { id: string; titulo: string; descricao: string; cidade: string; categoria: string; videoUrl: string; thumbnailUrl: string; instagramUrl: string; materiaUrl: string; tipo: "upload" | "instagram" };

const CIDADES = ["Apucarana", "Arapongas", "Arapuã", "Ariranha do Ivaí", "Bom Sucesso", "Borrazópolis", "Califórnia", "Cambira", "Cruzmaltina", "Faxinal", "Godoy Moreira", "Grandes Rios", "Ivaiporã", "Jandaia do Sul", "Jardim Alegre", "Kaloré", "Lidianópolis", "Lunardelli", "Marilândia do Sul", "Marumbi", "Mauá da Serra", "Novo Itacolomi", "Rio Bom", "Rio Branco do Ivaí", "Rosário do Ivaí", "São João do Ivaí", "São Pedro do Ivaí"];
const CAT_NOT = ["Política", "Cidade", "Segurança", "Economia", "Eventos"];
const CAT_ONDE = ["Restaurantes", "Lanchonetes", "Pizzarias", "Bares", "Cafés", "Serviços", "Lojas"];
const CAT_CLASS = ["Imóveis", "Veículos", "Eletrônicos", "Móveis", "Celulares", "Outros"];
const TABS: [Tab, string][] = [["noticias", "Notícias"], ["videos", "Vídeos"], ["ondeir", "Onde Ir"], ["classificados", "Compras e vendas"], ["empregos", "Empregos"], ["promocoes", "Promoções"], ["contato", "Contato"]];

async function uploadImagem(valor: string, pasta: string) {
  const supabase = getSupabase();
  if (!supabase || !valor.startsWith("data:")) return valor;
  const blob = await (await fetch(valor)).blob();
  const caminho = `${pasta}/${crypto.randomUUID()}.${blob.type.split("/")[1] || "jpg"}`;
  const { error } = await supabase.storage.from("rede-norte-media").upload(caminho, blob, { contentType: blob.type });
  if (error) throw error;
  return supabase.storage.from("rede-norte-media").getPublicUrl(caminho).data.publicUrl;
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

const emptyNews = { titulo: "", cidade: "Apucarana", cat: "Política", resumo: "", img: "", texto: "" };
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

  const carregarTudo = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    const [{ data: cities }, { data: news }, { data: services }, { data: ads }, { data: jobs }, { data: promotions }, { data: videosData }] = await Promise.all([
      supabase.from("cities").select("slug,nome"),
      supabase.from("news").select("id,titulo,categoria,resumo,conteudo,imagem,cidade_slug").order("created_at", { ascending: false }),
      supabase.from("service_providers").select("id,nome,categoria,endereco,whatsapp,imagem,descricao,cidade_slug").order("created_at", { ascending: false }),
      supabase.from("classified_ads").select("id,titulo,categoria,preco,contato,imagem,descricao,cidade_slug,status").order("created_at", { ascending: false }),
      supabase.from("jobs").select("id,vaga,empresa,contato,imagem,descricao,cidade_slug,status").order("created_at", { ascending: false }),
      supabase.from("promotions").select("id,titulo,categoria,validade,contato,imagem,detalhes,cidade_slug").order("created_at", { ascending: false }),
      supabase.from("videos").select("id,titulo,descricao,video_url,thumbnail_url,instagram_url,cidade_slug,categoria,materia_url,tipo,status").order("created_at", { ascending: false }),
    ]);
    const cityMap = new Map((cities || []).map((c: any) => [c.slug, c.nome]));
    setNoticias((news || []).map((n: any) => ({ id: n.id, titulo: n.titulo, cidade: cityMap.get(n.cidade_slug) || "Apucarana", cat: n.categoria || "Cidade", resumo: n.resumo || "", texto: n.conteudo || "", img: n.imagem || "" })));
    setLocais((services || []).map((x: any) => ({ id: x.id, nome: x.nome, cidade: cityMap.get(x.cidade_slug) || "Apucarana", cat: x.categoria, end: x.endereco || "", zap: x.whatsapp || "", img: x.imagem || "", detalhes: x.descricao || "" })));
    setClassif((ads || []).map((x: any) => ({ id: x.id, titulo: x.titulo, cidade: cityMap.get(x.cidade_slug) || "Apucarana", cat: x.categoria, preco: x.preco || "", zap: x.contato || "", img: x.imagem || "", detalhes: x.descricao || "", status: x.status || "published" })));
    setVagas((jobs || []).map((x: any) => ({ id: x.id, cargo: x.vaga, empresa: x.empresa, cidade: cityMap.get(x.cidade_slug) || "Apucarana", zap: x.contato || "", img: x.imagem || "", detalhes: x.descricao || "", status: x.status || "published" })));
    setPromocoes((promotions || []).map((x: any) => ({ id: x.id, titulo: x.titulo, cidade: cityMap.get(x.cidade_slug) || "Apucarana", categoria: x.categoria, validade: x.validade || "", contato: x.contato || "", img: x.imagem || "", detalhes: x.detalhes || "" })));
    setVideos((videosData || []).map((x: any) => ({ id: x.id, titulo: x.titulo, descricao: x.descricao || "", cidade: cityMap.get(x.cidade_slug) || "Geral", categoria: x.categoria || "Matéria", videoUrl: x.video_url || "", thumbnailUrl: x.thumbnail_url || "", instagramUrl: x.instagram_url || "", materiaUrl: x.materia_url || "", tipo: x.tipo === "instagram" ? "instagram" : "upload" })));
    setLoading(false);
  };

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { if (data.session) { setOk(true); void carregarTudo(); } });
  }, []);

  const entrar = async () => {
    const supabase = getSupabase();
    if (!supabase) { setOk(pass === "norte123"); return; }
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) alert(error.message); else { setOk(true); await carregarTudo(); }
  };
  const sair = async () => { await getSupabase()?.auth.signOut(); setOk(false); };
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
  const excluir = async (table: string, id: string) => {
    if (!confirm("Excluir este cadastro do banco?")) return;
    const supabase = getSupabase(); if (!supabase) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) alert(`Não foi possível excluir: ${error.message}`); else await carregarTudo();
  };

  if (!ok) return <div className="admin-login"><div className="admin-login-card"><span className="admin-kicker">REDE NORTE PRO</span><h1>Área da redação</h1><p>Gerencie notícias, anúncios e oportunidades da região.</p><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail administrativo" /><input value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void entrar()} type="password" placeholder="Senha de acesso" /><button onClick={() => void entrar()}>Entrar no painel</button><small>Login protegido pelo Supabase Auth.</small></div></div>;

  return <div className="admin-shell">
    <header className="admin-header"><div><span className="admin-kicker">REDE NORTE PRO</span><h1>Painel da redação</h1></div><div className="admin-header-actions"><button onClick={() => void carregarTudo()}>{loading ? "Atualizando..." : "Atualizar dados"}</button><button onClick={() => void sair()}>Sair</button></div></header>
    <nav className="admin-tabs">{TABS.map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</nav>
    <div className="admin-city-filter"><div><span className="admin-kicker">FILTRAR CADASTROS</span><strong>{selectedCity}</strong></div><label><span>⌕</span><input value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Procurar cidade para filtrar" /></label><div className="city-results"><button className={selectedCity === "Todas as cidades" ? "selected" : ""} onClick={() => saveCity("Todas as cidades")}>Todas</button>{cidadesVisiveis.map((cidade) => <button key={cidade} className={selectedCity === cidade ? "selected" : ""} onClick={() => saveCity(cidade)}>{cidade}</button>)}</div></div>
    <main className="admin-main">
      {tab === "noticias" && <AdminSection title="Cadastrar notícia" description="Os dados são carregados e salvos diretamente no Supabase."><FormInput placeholder="Título da notícia" value={nForm.titulo} onChange={(v) => setNForm({ ...nForm, titulo: v })} /><div className="form-row"><Select value={nForm.cidade} onChange={(v) => setNForm({ ...nForm, cidade: v })} options={CIDADES} /><Select value={nForm.cat} onChange={(v) => setNForm({ ...nForm, cat: v })} options={CAT_NOT} /></div><FormInput placeholder="Resumo / linha fina" value={nForm.resumo} onChange={(v) => setNForm({ ...nForm, resumo: v })} multiline /><ImageField value={nForm.img} onChange={(v) => setNForm({ ...nForm, img: v })} /><FormInput placeholder="Texto completo da notícia" value={nForm.texto} onChange={(v) => setNForm({ ...nForm, texto: v })} multiline /><SaveButton label={editId ? "Atualizar notícia" : "Salvar notícia no banco"} onClick={() => { if (!nForm.titulo) return alert("Título obrigatório"); void salvar("news", { titulo: nForm.titulo, categoria: nForm.cat, resumo: nForm.resumo, conteudo: nForm.texto || nForm.resumo, cidade_slug: cidadeSlug(nForm.cidade), status: "published" }, nForm.img, "news", () => setNForm(emptyNews), editId); }} />{filterByCity(noticias).map((n) => <AdminItem key={n.id} title={n.titulo} meta={`${n.cidade} · ${n.cat}`} image={n.img} onEdit={() => { setEditId(n.id); setNForm({ titulo: n.titulo, cidade: n.cidade, cat: n.cat, resumo: n.resumo, img: n.img || "", texto: n.texto || "" }); }} onDelete={() => void excluir("news", n.id)} />)}</AdminSection>}
      {tab === "videos" && <AdminSection title="Cadastrar vídeo" description="Publique cortes próprios com upload direto ou cole um link público do Instagram para assistir sem sair do portal."><FormInput placeholder="Título do vídeo" value={videoForm.titulo} onChange={(v) => setVideoForm({ ...videoForm, titulo: v })} /><div className="form-row"><Select value={videoForm.cidade} onChange={(v) => setVideoForm({ ...videoForm, cidade: v })} options={CIDADES} /><Select value={videoForm.categoria} onChange={(v) => setVideoForm({ ...videoForm, categoria: v })} options={VIDEO_CATEGORIAS} /></div><Select value={videoForm.tipo} onChange={(v) => setVideoForm({ ...videoForm, tipo: v as "upload" | "instagram" })} options={["upload", "instagram"]} />{videoForm.tipo === "upload" ? <><VideoFileField value={videoForm.videoUrl} file={videoFile} onChange={(file) => { setVideoFile(file); if (file) setVideoForm({ ...videoForm, videoUrl: "" }); }} /><FormInput placeholder="Ou informe uma URL direta de vídeo MP4" value={videoForm.videoUrl} onChange={(v) => setVideoForm({ ...videoForm, videoUrl: v })} /></> : <FormInput placeholder="Link público do Reel ou post do Instagram" value={videoForm.instagramUrl} onChange={(v) => setVideoForm({ ...videoForm, instagramUrl: v })} />}<ImageField label="Thumbnail / capa do vídeo" value={videoForm.thumbnailUrl} onChange={(v) => setVideoForm({ ...videoForm, thumbnailUrl: v })} /><FormInput placeholder="Descrição curta do vídeo" value={videoForm.descricao} onChange={(v) => setVideoForm({ ...videoForm, descricao: v })} multiline /><FormInput placeholder="Link da matéria relacionada (opcional)" value={videoForm.materiaUrl} onChange={(v) => setVideoForm({ ...videoForm, materiaUrl: v })} /><SaveButton label={editId ? "Atualizar vídeo" : "Publicar vídeo"} onClick={() => void salvarVideo()} />{filterByCity(videos).map((x) => <AdminItem key={x.id} title={x.titulo} meta={`${x.cidade} · ${x.categoria} · ${x.tipo === "instagram" ? "Instagram" : "Vídeo próprio"}`} image={x.thumbnailUrl} onEdit={() => { setEditId(x.id); setVideoFile(null); setVideoForm({ titulo: x.titulo, descricao: x.descricao, cidade: x.cidade, categoria: x.categoria, tipo: x.tipo, videoUrl: x.videoUrl, instagramUrl: x.instagramUrl, thumbnailUrl: x.thumbnailUrl, materiaUrl: x.materiaUrl, status: "published" }); }} onDelete={() => void excluir("videos", x.id)} />)}</AdminSection>}

      {tab === "ondeir" && <AdminSection title="Cadastrar local em Onde Ir" description="Cadastros reais do Supabase, com imagem e exclusão permanente."><FormInput placeholder="Nome do local" value={lForm.nome} onChange={(v) => setLForm({ ...lForm, nome: v })} /><div className="form-row"><Select value={lForm.cidade} onChange={(v) => setLForm({ ...lForm, cidade: v })} options={CIDADES} /><Select value={lForm.cat} onChange={(v) => setLForm({ ...lForm, cat: v })} options={CAT_ONDE} /></div><FormInput placeholder="Endereço completo" value={lForm.end} onChange={(v) => setLForm({ ...lForm, end: v })} /><FormInput placeholder="WhatsApp para contato" value={lForm.zap} onChange={(v) => setLForm({ ...lForm, zap: v })} /><ImageField value={lForm.img} onChange={(v) => setLForm({ ...lForm, img: v })} /><FormInput placeholder="Descrição completa" value={lForm.detalhes} onChange={(v) => setLForm({ ...lForm, detalhes: v })} multiline /><SaveButton label={editId ? "Atualizar local" : "Salvar local no banco"} onClick={() => { if (!lForm.nome) return alert("Nome obrigatório"); void salvar("service_providers", { nome: lForm.nome, categoria: lForm.cat, cidade_slug: cidadeSlug(lForm.cidade), endereco: lForm.end, whatsapp: lForm.zap, descricao: lForm.detalhes, verificado: true }, lForm.img, "services", () => setLForm({ nome: "", cidade: "Apucarana", cat: "Restaurantes", end: "", zap: "", img: "", detalhes: "" }), editId); }} />{filterByCity(locais).map((x) => <AdminItem key={x.id} title={x.nome} meta={`${x.cidade} · ${x.cat} · ${x.end}`} image={x.img} onEdit={() => { setEditId(x.id); setLForm({ nome: x.nome, cidade: x.cidade, cat: x.cat, end: x.end, zap: x.zap, img: x.img || "", detalhes: x.detalhes || "" }); }} onDelete={() => void excluir("service_providers", x.id)} />)}</AdminSection>}
      {tab === "classificados" && <AdminSection title="Cadastrar compra ou venda" description="Anúncios com foto e dados persistidos no Supabase. Envios públicos aparecem como pendentes até você salvar como publicado."><FormInput placeholder="Título do anúncio" value={cForm.titulo} onChange={(v) => setCForm({ ...cForm, titulo: v })} /><div className="form-row"><Select value={cForm.cidade} onChange={(v) => setCForm({ ...cForm, cidade: v })} options={CIDADES} /><Select value={cForm.cat} onChange={(v) => setCForm({ ...cForm, cat: v })} options={CAT_CLASS} /></div><FormInput placeholder="Preço" value={cForm.preco} onChange={(v) => setCForm({ ...cForm, preco: v })} /><FormInput placeholder="WhatsApp do anunciante" value={cForm.zap} onChange={(v) => setCForm({ ...cForm, zap: v })} /><ImageField value={cForm.img} onChange={(v) => setCForm({ ...cForm, img: v })} /><FormInput placeholder="Descrição completa" value={cForm.detalhes} onChange={(v) => setCForm({ ...cForm, detalhes: v })} multiline /><SaveButton label={editId ? "Aprovar / atualizar anúncio" : "Salvar anúncio no banco"} onClick={() => { if (!cForm.titulo) return alert("Título obrigatório"); void salvar("classified_ads", { titulo: cForm.titulo, categoria: cForm.cat, cidade_slug: cidadeSlug(cForm.cidade), preco: cForm.preco, contato: cForm.zap, descricao: cForm.detalhes, status: "published" }, cForm.img, "classifieds", () => setCForm({ titulo: "", cidade: "Apucarana", cat: "Imóveis", preco: "", zap: "", img: "", detalhes: "" }), editId); }} />{filterByCity(classif).map((x) => <AdminItem key={x.id} title={x.titulo} meta={`${x.cidade} · ${x.cat} · ${x.preco} · ${x.status === "pending" ? "AGUARDANDO APROVAÇÃO" : "Publicado"}`} image={x.img} onEdit={() => { setEditId(x.id); setCForm({ titulo: x.titulo, cidade: x.cidade, cat: x.cat, preco: x.preco, zap: x.zap, img: x.img || "", detalhes: x.detalhes || "" }); }} onDelete={() => void excluir("classified_ads", x.id)} />)}</AdminSection>}
      {tab === "empregos" && <AdminSection title="Cadastrar vaga de emprego" description="Vagas persistidas no banco. Envios públicos aparecem como pendentes até a redação aprovar."><FormInput placeholder="Cargo / função" value={vForm.cargo} onChange={(v) => setVForm({ ...vForm, cargo: v })} /><FormInput placeholder="Nome da empresa" value={vForm.empresa} onChange={(v) => setVForm({ ...vForm, empresa: v })} /><div className="form-row"><Select value={vForm.cidade} onChange={(v) => setVForm({ ...vForm, cidade: v })} options={CIDADES} /><FormInput placeholder="WhatsApp" value={vForm.zap} onChange={(v) => setVForm({ ...vForm, zap: v })} /></div><ImageField value={vForm.img} onChange={(v) => setVForm({ ...vForm, img: v })} /><FormInput placeholder="Descrição, requisitos e candidatura" value={vForm.detalhes} onChange={(v) => setVForm({ ...vForm, detalhes: v })} multiline /><SaveButton label={editId ? "Aprovar / atualizar vaga" : "Salvar vaga no banco"} onClick={() => { if (!vForm.cargo) return alert("Cargo obrigatório"); void salvar("jobs", { vaga: vForm.cargo, empresa: vForm.empresa, cidade_slug: cidadeSlug(vForm.cidade), contato: vForm.zap, descricao: vForm.detalhes, imagem: vForm.img || "https://www.redeapucarana.com.br/vagas-padrao.svg", status: "published" }, vForm.img, "jobs", () => setVForm({ cargo: "", empresa: "", cidade: "Apucarana", zap: "", img: "", detalhes: "" }), editId); }} />{filterByCity(vagas).map((x) => <AdminItem key={x.id} title={`${x.cargo} · ${x.empresa}`} meta={`${x.cidade} · ${x.zap} · ${x.status === "pending" ? "AGUARDANDO APROVAÇÃO" : "Publicado"}`} image={x.img} onEdit={() => { setEditId(x.id); setVForm({ cargo: x.cargo, empresa: x.empresa, cidade: x.cidade, zap: x.zap, img: x.img || "", detalhes: x.detalhes || "" }); }} onDelete={() => void excluir("jobs", x.id)} />)}</AdminSection>}
      {tab === "promocoes" && <AdminSection title="Cadastrar promoção" description="Promoções persistidas no banco e atualizadas pelo painel."><FormInput placeholder="Título da promoção" value={pForm.titulo} onChange={(v) => setPForm({ ...pForm, titulo: v })} /><div className="form-row"><Select value={pForm.cidade} onChange={(v) => setPForm({ ...pForm, cidade: v })} options={CIDADES} /><FormInput placeholder="Categoria / loja" value={pForm.categoria} onChange={(v) => setPForm({ ...pForm, categoria: v })} /></div><FormInput placeholder="Validade" value={pForm.validade} onChange={(v) => setPForm({ ...pForm, validade: v })} /><FormInput placeholder="WhatsApp ou contato" value={pForm.contato} onChange={(v) => setPForm({ ...pForm, contato: v })} /><ImageField value={pForm.img} onChange={(v) => setPForm({ ...pForm, img: v })} /><FormInput placeholder="Detalhes, regras e condições" value={pForm.detalhes} onChange={(v) => setPForm({ ...pForm, detalhes: v })} multiline /><SaveButton label={editId ? "Atualizar promoção" : "Salvar promoção no banco"} onClick={() => { if (!pForm.titulo) return alert("Título obrigatório"); void salvar("promotions", { titulo: pForm.titulo, categoria: pForm.categoria, cidade_slug: cidadeSlug(pForm.cidade), validade: pForm.validade, contato: pForm.contato, detalhes: pForm.detalhes, status: "published" }, pForm.img, "promotions", () => setPForm({ titulo: "", cidade: "Apucarana", categoria: "Comércio", validade: "", contato: "", img: "", detalhes: "" }), editId); }} />{filterByCity(promocoes).map((x) => <AdminItem key={x.id} title={x.titulo} meta={`${x.cidade} · ${x.categoria} · ${x.validade}`} image={x.img} onEdit={() => { setEditId(x.id); setPForm({ titulo: x.titulo, cidade: x.cidade, categoria: x.categoria, validade: x.validade, contato: x.contato, img: x.img || "", detalhes: x.detalhes || "" }); }} onDelete={() => void excluir("promotions", x.id)} />)}</AdminSection>}
      {tab === "contato" && <AdminSection title="Informações de contato" description="O painel está operando com dados centralizados no Supabase."><div className="contact-info"><strong>Fonte dos cadastros</strong><span>Supabase · banco central do portal</span><strong>Imagens</strong><span>Storage rede-norte-media</span><strong>Operação</strong><span>Use o botão Atualizar dados para recarregar o conteúdo diretamente do banco.</span></div></AdminSection>}
    </main>
  </div>;
}

function AdminSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="admin-section"><div className="admin-section-title"><span className="admin-kicker">GERENCIAMENTO</span><h2>{title}</h2><p>{description}</p></div><div className="admin-form">{children}</div></section>; }
function FormInput({ placeholder, value, onChange, multiline = false }: { placeholder: string; value: string; onChange: (value: string) => void; multiline?: boolean }) { return multiline ? <textarea placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /> : <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />; }
function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) { return <select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select>; }
function ImageField({ value, onChange, label = "Imagem do anúncio" }: { value: string; onChange: (value: string) => void; label?: string }) { return <div className="image-field"><label>{label}</label><input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 2_500_000) return alert("Escolha uma imagem de até 2 MB"); const reader = new FileReader(); reader.onload = () => onChange(String(reader.result)); reader.readAsDataURL(file); }} /><span>ou cole a URL da imagem abaixo</span><input placeholder="https://..." value={value.startsWith("data:") ? "Imagem carregada" : value} onChange={(e) => onChange(e.target.value)} />{value && <img src={value} alt="Pré-visualização" />}</div>; }
function VideoFileField({ value, file, onChange }: { value: string; file: File | null; onChange: (file: File | null) => void }) { return <div className="video-file-field"><label>Arquivo do corte</label><input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => { const chosen = e.target.files?.[0]; if (!chosen) return; if (chosen.size > 48_000_000) return alert("Este projeto aceita vídeos de até 50 MB. Escolha um arquivo de até 48 MB para garantir o envio."); onChange(chosen); }} /><span>{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : value ? "Vídeo já publicado; selecione outro apenas se quiser substituir." : "MP4, WebM ou MOV · até 48 MB (limite real do projeto: 50 MB)"}</span></div>; }
function SaveButton({ label, onClick }: { label: string; onClick: () => void }) { return <button className="save-button" onClick={onClick}>{label}</button>; }
function AdminItem({ title, meta, image, onEdit, onDelete }: { title: string; meta: string; image?: string; onEdit: () => void; onDelete: () => void }) { return <div className="admin-item">{image ? <img src={image} alt="" /> : <div className="admin-item-placeholder">RN</div>}<div className="admin-item-copy"><strong>{title}</strong><span>{meta}</span></div><div className="admin-item-actions"><button className="edit-button" onClick={onEdit}>Editar post</button><button className="delete-button" onClick={onDelete}>Remover post</button></div></div>; }
