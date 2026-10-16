"use client";

import { useMemo, useState } from "react";
import { cidadeSlug, getSupabase } from "../../lib/supabase";

type Tab = "noticias" | "ondeir" | "classificados" | "empregos" | "promocoes" | "contato";
type Noticia = { id: string; titulo: string; cidade: string; cat: string; resumo: string; img: string; texto?: string; destaque?: boolean };
type Local = { id: string; nome: string; cidade: string; cat: string; end: string; zap: string; img?: string; detalhes?: string };
type Classif = { id: string; titulo: string; cidade: string; cat: string; preco: string; zap: string; img?: string; detalhes?: string };
type Vaga = { id: string; cargo: string; empresa: string; cidade: string; zap: string; img?: string; detalhes?: string };
type Promocao = { id: string; titulo: string; cidade: string; categoria: string; validade: string; contato: string; img?: string; detalhes?: string };

const CIDADES = ["Apucarana", "Arapongas", "Arapuã", "Ariranha do Ivaí", "Bom Sucesso", "Borrazópolis", "Califórnia", "Cambira", "Cruzmaltina", "Faxinal", "Godoy Moreira", "Grandes Rios", "Ivaiporã", "Jandaia do Sul", "Jardim Alegre", "Kaloré", "Lidianópolis", "Lunardelli", "Marilândia do Sul", "Marumbi", "Mauá da Serra", "Novo Itacolomi", "Rio Bom", "Rio Branco do Ivaí", "Rosário do Ivaí", "São João do Ivaí", "São Pedro do Ivaí"];
const CAT_NOT = ["Política", "Cidade", "Segurança", "Economia", "Eventos"];
const CAT_ONDE = ["Restaurantes", "Lanchonetes", "Pizzarias", "Bares", "Cafés", "Serviços", "Lojas"];
const CAT_CLASS = ["Imóveis", "Veículos", "Eletrônicos", "Móveis", "Celulares", "Outros"];
const TABS: [Tab, string][] = [["noticias", "Notícias"], ["ondeir", "Onde Ir"], ["classificados", "Compras e vendas"], ["empregos", "Empregos"], ["promocoes", "Promoções"], ["contato", "Contato"]];

async function uploadImagem(valor: string, pasta: string) {
  const supabase = getSupabase();
  if (!supabase || !valor.startsWith("data:")) return valor;
  const resposta = await fetch(valor);
  const blob = await resposta.blob();
  const extensao = blob.type.split("/")[1] || "jpg";
  const caminho = `${pasta}/${crypto.randomUUID()}.${extensao}`;
  const { error } = await supabase.storage.from("rede-norte-media").upload(caminho, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from("rede-norte-media").getPublicUrl(caminho).data.publicUrl;
}

function useLocal<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : initial; } catch { return initial; }
  });
  const update = (next: T | ((current: T) => T)) => setV((current) => {
    const value = typeof next === "function" ? (next as (current: T) => T)(current) : next;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* armazenamento opcional */ }
    return value;
  });
  return [v, update] as const;
}

const empty = { titulo: "", cidade: "Apucarana", cat: "Política", resumo: "", img: "", texto: "" };

export default function Admin() {
  const [tab, setTab] = useState<Tab>("noticias");
  const [ok, setOk] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("Todas as cidades");
  const [noticias, setNoticias] = useLocal<Noticia[]>("rn_noticias", []);
  const [locais, setLocais] = useLocal<Local[]>("rn_locais", []);
  const [classif, setClassif] = useLocal<Classif[]>("rn_classif", []);
  const [vagas, setVagas] = useLocal<Vaga[]>("rn_vagas", []);
  const [promocoes, setPromocoes] = useLocal<Promocao[]>("rn_promocoes", []);
  const [nForm, setNForm] = useState(empty);
  const [lForm, setLForm] = useState({ nome: "", cidade: "Apucarana", cat: "Restaurantes", end: "", zap: "", img: "", detalhes: "" });
  const [cForm, setCForm] = useState({ titulo: "", cidade: "Apucarana", cat: "Imóveis", preco: "", zap: "", img: "", detalhes: "" });
  const [vForm, setVForm] = useState({ cargo: "", empresa: "", cidade: "Apucarana", zap: "", img: "", detalhes: "" });
  const [pForm, setPForm] = useState({ titulo: "", cidade: "Apucarana", categoria: "Comércio", validade: "", contato: "", img: "", detalhes: "" });

  const cidadesVisiveis = useMemo(() => CIDADES.filter((cidade) => cidade.toLowerCase().includes(citySearch.toLowerCase())), [citySearch]);
  const filterByCity = <T extends { cidade: string }>(items: T[]) => selectedCity === "Todas as cidades" ? items : items.filter((item) => item.cidade === selectedCity);
  const gen = () => Math.random().toString(36).slice(2, 9);
  const save = (key: string) => { setSelectedCity(key); setCitySearch(""); };
  const salvarNoBanco = async (tabela: string, registro: any, imagem: string, pasta: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const imagemPublica = await uploadImagem(imagem, pasta);
      const { error } = await supabase.from(tabela).insert({ ...registro, imagem: imagemPublica });
      if (error) throw error;
    } catch (error: any) {
      alert(`Não foi possível salvar no banco: ${error.message || "verifique o acesso"}`);
    }
  };
  const entrarSupabase = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) alert(error.message); else setOk(true);
  };

  if (!ok) return <div className="admin-login"><div className="admin-login-card"><span className="admin-kicker">REDE NORTE PRO</span><h1>Área da redação</h1><p>Gerencie notícias, anúncios e oportunidades da região.</p><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail administrativo" /><input value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (getSupabase() ? entrarSupabase() : pass === "norte123" ? setOk(true) : alert("Senha errada"))} type="password" placeholder="Senha de acesso" /><button onClick={() => getSupabase() ? entrarSupabase() : pass === "norte123" ? setOk(true) : alert("Senha errada")}>Entrar no painel</button><small>{getSupabase() ? "Use um usuário criado em Supabase Auth." : "Ambiente local · senha: norte123"}</small></div></div>;

  return <div className="admin-shell">
    <header className="admin-header"><div><span className="admin-kicker">REDE NORTE PRO</span><h1>Painel da redação</h1></div><button onClick={() => setOk(false)}>Sair</button></header>
    <nav className="admin-tabs">{TABS.map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</nav>
    <div className="admin-city-filter"><div><span className="admin-kicker">FILTRAR CADASTROS</span><strong>{selectedCity}</strong></div><label><span>⌕</span><input value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Procurar cidade para filtrar" /></label><div className="city-results"><button className={selectedCity === "Todas as cidades" ? "selected" : ""} onClick={() => save("Todas as cidades")}>Todas</button>{cidadesVisiveis.map((cidade) => <button key={cidade} className={selectedCity === cidade ? "selected" : ""} onClick={() => save(cidade)}>{cidade}</button>)}</div></div>

    <main className="admin-main">
      {tab === "noticias" && <AdminSection title="Cadastrar notícia" description="Publique informação local com imagem, resumo e texto completo."><FormInput placeholder="Título da notícia" value={nForm.titulo} onChange={(v) => setNForm({ ...nForm, titulo: v })} /><div className="form-row"><Select value={nForm.cidade} onChange={(v) => setNForm({ ...nForm, cidade: v })} options={CIDADES} /><Select value={nForm.cat} onChange={(v) => setNForm({ ...nForm, cat: v })} options={CAT_NOT} /></div><FormInput placeholder="Resumo / linha fina" value={nForm.resumo} onChange={(v) => setNForm({ ...nForm, resumo: v })} multiline /><ImageField value={nForm.img} onChange={(v) => setNForm({ ...nForm, img: v })} /><FormInput placeholder="Texto completo da notícia" value={nForm.texto} onChange={(v) => setNForm({ ...nForm, texto: v })} multiline /><SaveButton label="Salvar notícia" onClick={() => { if (!nForm.titulo) return alert("Título obrigatório"); setNoticias((items) => [{ id: gen(), ...nForm }, ...items]); void salvarNoBanco("news", { titulo: nForm.titulo, categoria: nForm.cat, resumo: nForm.resumo, conteudo: nForm.texto || nForm.resumo, cidade_slug: cidadeSlug(nForm.cidade), status: "published" }, nForm.img, "news"); setNForm(empty); }} />{filterByCity(noticias).map((n) => <AdminItem key={n.id} title={n.titulo} meta={`${n.cidade} · ${n.cat}`} image={n.img} onDelete={() => setNoticias((items) => items.filter((x) => x.id !== n.id))} />)}</AdminSection>}

      {tab === "ondeir" && <AdminSection title="Cadastrar local em Onde Ir" description="Cadastre estabelecimentos e serviços. A imagem e os detalhes aparecerão em uma página própria para o visitante."><FormInput placeholder="Nome do local (ex.: Panela de Ferro)" value={lForm.nome} onChange={(v) => setLForm({ ...lForm, nome: v })} /><div className="form-row"><Select value={lForm.cidade} onChange={(v) => setLForm({ ...lForm, cidade: v })} options={CIDADES} /><Select value={lForm.cat} onChange={(v) => setLForm({ ...lForm, cat: v })} options={CAT_ONDE} /></div><FormInput placeholder="Endereço completo" value={lForm.end} onChange={(v) => setLForm({ ...lForm, end: v })} /><FormInput placeholder="WhatsApp para contato" value={lForm.zap} onChange={(v) => setLForm({ ...lForm, zap: v })} /><ImageField value={lForm.img} onChange={(v) => setLForm({ ...lForm, img: v })} /><FormInput placeholder="Descrição completa: horários, serviços, diferenciais..." value={lForm.detalhes} onChange={(v) => setLForm({ ...lForm, detalhes: v })} multiline /><SaveButton label="Salvar local" onClick={() => { if (!lForm.nome) return alert("Nome obrigatório"); setLocais((items) => [{ id: gen(), ...lForm }, ...items]); void salvarNoBanco("service_providers", { nome: lForm.nome, categoria: lForm.cat, cidade_slug: cidadeSlug(lForm.cidade), endereco: lForm.end, whatsapp: lForm.zap, descricao: lForm.detalhes, verificado: true }, lForm.img, "services"); setLForm({ nome: "", cidade: "Apucarana", cat: "Restaurantes", end: "", zap: "", img: "", detalhes: "" }); }} />{filterByCity(locais).map((l) => <AdminItem key={l.id} title={l.nome} meta={`${l.cidade} · ${l.cat} · ${l.end}`} image={l.img} onDelete={() => setLocais((items) => items.filter((x) => x.id !== l.id))} />)}</AdminSection>}

      {tab === "classificados" && <AdminSection title="Cadastrar compra ou venda" description="Anúncios com foto, preço, descrição e contato. Cada anúncio poderá abrir uma página detalhada."><FormInput placeholder="Título do anúncio" value={cForm.titulo} onChange={(v) => setCForm({ ...cForm, titulo: v })} /><div className="form-row"><Select value={cForm.cidade} onChange={(v) => setCForm({ ...cForm, cidade: v })} options={CIDADES} /><Select value={cForm.cat} onChange={(v) => setCForm({ ...cForm, cat: v })} options={CAT_CLASS} /></div><FormInput placeholder="Preço" value={cForm.preco} onChange={(v) => setCForm({ ...cForm, preco: v })} /><FormInput placeholder="WhatsApp do anunciante" value={cForm.zap} onChange={(v) => setCForm({ ...cForm, zap: v })} /><ImageField value={cForm.img} onChange={(v) => setCForm({ ...cForm, img: v })} /><FormInput placeholder="Descrição completa do produto ou serviço" value={cForm.detalhes} onChange={(v) => setCForm({ ...cForm, detalhes: v })} multiline /><SaveButton label="Salvar anúncio" onClick={() => { if (!cForm.titulo) return alert("Título obrigatório"); setClassif((items) => [{ id: gen(), ...cForm }, ...items]); void salvarNoBanco("classified_ads", { titulo: cForm.titulo, categoria: cForm.cat, cidade_slug: cidadeSlug(cForm.cidade), preco: cForm.preco, contato: cForm.zap, descricao: cForm.detalhes, status: "published" }, cForm.img, "classifieds"); setCForm({ titulo: "", cidade: "Apucarana", cat: "Imóveis", preco: "", zap: "", img: "", detalhes: "" }); }} />{filterByCity(classif).map((c) => <AdminItem key={c.id} title={c.titulo} meta={`${c.cidade} · ${c.cat} · ${c.preco}`} image={c.img} onDelete={() => setClassif((items) => items.filter((x) => x.id !== c.id))} />)}</AdminSection>}

      {tab === "empregos" && <AdminSection title="Cadastrar vaga de emprego" description="Publique oportunidades com empresa, cidade, contato, imagem e descrição da vaga."><FormInput placeholder="Cargo / função" value={vForm.cargo} onChange={(v) => setVForm({ ...vForm, cargo: v })} /><FormInput placeholder="Nome da empresa" value={vForm.empresa} onChange={(v) => setVForm({ ...vForm, empresa: v })} /><div className="form-row"><Select value={vForm.cidade} onChange={(v) => setVForm({ ...vForm, cidade: v })} options={CIDADES} /><FormInput placeholder="WhatsApp" value={vForm.zap} onChange={(v) => setVForm({ ...vForm, zap: v })} /></div><ImageField value={vForm.img} onChange={(v) => setVForm({ ...vForm, img: v })} /><FormInput placeholder="Descrição, requisitos e como se candidatar" value={vForm.detalhes} onChange={(v) => setVForm({ ...vForm, detalhes: v })} multiline /><SaveButton label="Salvar vaga" onClick={() => { if (!vForm.cargo) return alert("Cargo obrigatório"); setVagas((items) => [{ id: gen(), ...vForm }, ...items]); void salvarNoBanco("jobs", { vaga: vForm.cargo, empresa: vForm.empresa, cidade_slug: cidadeSlug(vForm.cidade), contato: vForm.zap, descricao: vForm.detalhes, status: "published" }, vForm.img, "jobs"); setVForm({ cargo: "", empresa: "", cidade: "Apucarana", zap: "", img: "", detalhes: "" }); }} />{filterByCity(vagas).map((v) => <AdminItem key={v.id} title={`${v.cargo} · ${v.empresa}`} meta={`${v.cidade} · ${v.zap}`} image={v.img} onDelete={() => setVagas((items) => items.filter((x) => x.id !== v.id))} />)}</AdminSection>}

      {tab === "promocoes" && <AdminSection title="Cadastrar promoção" description="Divulgue ofertas e campanhas com imagem, validade, contato e página detalhada."><FormInput placeholder="Título da promoção" value={pForm.titulo} onChange={(v) => setPForm({ ...pForm, titulo: v })} /><div className="form-row"><Select value={pForm.cidade} onChange={(v) => setPForm({ ...pForm, cidade: v })} options={CIDADES} /><FormInput placeholder="Categoria / loja" value={pForm.categoria} onChange={(v) => setPForm({ ...pForm, categoria: v })} /></div><FormInput placeholder="Validade da promoção" value={pForm.validade} onChange={(v) => setPForm({ ...pForm, validade: v })} /><FormInput placeholder="WhatsApp ou contato" value={pForm.contato} onChange={(v) => setPForm({ ...pForm, contato: v })} /><ImageField value={pForm.img} onChange={(v) => setPForm({ ...pForm, img: v })} /><FormInput placeholder="Detalhes, regras e condições" value={pForm.detalhes} onChange={(v) => setPForm({ ...pForm, detalhes: v })} multiline /><SaveButton label="Salvar promoção" onClick={() => { if (!pForm.titulo) return alert("Título obrigatório"); setPromocoes((items) => [{ id: gen(), ...pForm }, ...items]); void salvarNoBanco("promotions", { titulo: pForm.titulo, categoria: pForm.categoria, cidade_slug: cidadeSlug(pForm.cidade), validade: pForm.validade, contato: pForm.contato, detalhes: pForm.detalhes, status: "published" }, pForm.img, "promotions"); setPForm({ titulo: "", cidade: "Apucarana", categoria: "Comércio", validade: "", contato: "", img: "", detalhes: "" }); }} />{filterByCity(promocoes).map((p) => <AdminItem key={p.id} title={p.titulo} meta={`${p.cidade} · ${p.categoria} · ${p.validade}`} image={p.img} onDelete={() => setPromocoes((items) => items.filter((x) => x.id !== p.id))} />)}</AdminSection>}

      {tab === "contato" && <AdminSection title="Informações de contato" description="Dados que podem ser exibidos no rodapé e na página de contato."><div className="contact-info"><strong>WhatsApp da redação</strong><span>(43) 99999-9999</span><strong>E-mail</strong><span>contato@redenorte.com</span><strong>Sobre o armazenamento</strong><span>Os cadastros desta versão ficam salvos no navegador por meio do localStorage. Para vários administradores e publicação permanente, o próximo passo é conectar um banco de dados.</span></div></AdminSection>}
    </main>
  </div>;
}

function AdminSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="admin-section"><div className="admin-section-title"><span className="admin-kicker">GERENCIAMENTO</span><h2>{title}</h2><p>{description}</p></div><div className="admin-form">{children}</div></section>; }
function FormInput({ placeholder, value, onChange, multiline = false }: { placeholder: string; value: string; onChange: (value: string) => void; multiline?: boolean }) { return multiline ? <textarea placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /> : <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />; }
function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) { return <select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select>; }
function ImageField({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <div className="image-field"><label>Imagem do anúncio</label><input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 2_500_000) return alert("Escolha uma imagem de até 2 MB"); const reader = new FileReader(); reader.onload = () => onChange(String(reader.result)); reader.readAsDataURL(file); }} /><span>ou cole a URL da imagem abaixo</span><input placeholder="https://..." value={value.startsWith("data:") ? "Imagem carregada" : value} onChange={(e) => onChange(e.target.value)} />{value && <img src={value} alt="Pré-visualização" />}</div>; }
function SaveButton({ label, onClick }: { label: string; onClick: () => void }) { return <button className="save-button" onClick={onClick}>{label}</button>; }
function AdminItem({ title, meta, image, onDelete }: { title: string; meta: string; image?: string; onDelete: () => void }) { return <div className="admin-item">{image ? <img src={image} alt="" /> : <div className="admin-item-placeholder">RN</div>}<div className="admin-item-copy"><strong>{title}</strong><span>{meta}</span></div><button className="delete-button" onClick={onDelete}>Excluir</button></div>; }
