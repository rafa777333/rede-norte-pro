"use client";
import { useEffect, useState, useMemo } from "react";

const SENHA = "rede2025";
const CIDADES = ["Apucarana","Arapongas","Ivaiporã","Jandaia do Sul","Cambira","Faxinal","São João do Ivaí","Jardim Alegre"];
const CATS_NOTICIA = ["Política","Economia Local","Segurança","Saúde","Esporte","Educação","Cultura","Geral"];
const CATS_ONDEIR = ["Lanchonete","Pizzaria","Bar","Café","Restaurante","Sorveteria","Academia","Outro"];
const CATS_COMPRA = ["Eletrônicos","Móveis","Veículos","Imóveis","Roupas","Serviços","Outros"];
const TIPOS_VAGA = ["CLT","Temporário","Estágio","Freelance","Diarista"];

type Noticia = { id:string, titulo:string, categoria:string, cidade:string, resumo:string, conteudo:string, imagem:string, destaque:boolean, created_at:string };
type Vaga = { id:string, empresa:string, cargo:string, cidade:string, tipo:string, salario:string, descricao:string, requisitos:string, whatsapp:string, contato:string, status:"ativa"|"pausada", created_at:string };
type Lugar = { id:string, nome:string, categoria:string, cidade:string, endereco:string, telefone:string, whatsapp:string, instagram:string, horario:string, imagem:string, destaque:boolean, verificado:boolean, created_at:string };
type Produto = { id:string, titulo:string, descricao:string, preco:string, cidade:string, categoria:string, whatsapp:string, imagem:string, status:"ativo"|"vendido", created_at:string };
type PromoMercado = { id:string, mercado:string, produto:string, preco:string, preco_antigo:string, cidade:string, validade:string, imagem:string, created_at:string };
type PromoComb = { id:string, posto:string, cidade:string, gasolina:string, etanol:string, diesel:string, imagem:string, created_at:string };
type PromoCupom = { id:string, loja:string, codigo:string, desconto:string, descricao:string, cidade:string, validade:string, link:string, created_at:string };

function useLocal<T>(key:string, initial:T[]){
  const [data,setData] = useState<T[]>(initial);
  const [loaded,setLoaded] = useState(false);
  useEffect(()=>{
    try{
      const raw = localStorage.getItem(key);
      if(raw){ setData(JSON.parse(raw)); }
    }catch{}
    setLoaded(true);
  },[key]);
  useEffect(()=>{ if(loaded){ localStorage.setItem(key, JSON.stringify(data)); } },[key,data,loaded]);
  return [data,setData,loaded] as const;
}

export default function AdminPage(){
  const [auth,setAuth] = useState(false);
  const [senha,setSenha] = useState("");
  const [aba,setAba] = useState<"noticias"|"vagas"|"ondeir"|"compras"|"promos">("noticias");
  const [subPromo,setSubPromo] = useState<"mercados"|"combustivel"|"cupons">("mercados");
  const [busca,setBusca] = useState("");

  const [noticias,setNoticias] = useLocal<Noticia>("rn_admin_noticias", []);
  const [vagas,setVagas] = useLocal<Vaga>("rn_admin_vagas", []);
  const [lugares,setLugares] = useLocal<Lugar>("rn_admin_lugares", []);
  const [produtos,setProdutos] = useLocal<Produto>("rn_admin_produtos", []);
  const [promosMercado,setPromosMercado] = useLocal<PromoMercado>("rn_admin_promo_mercado", []);
  const [promosComb,setPromosComb] = useLocal<PromoComb>("rn_admin_promo_comb", []);
  const [promosCupom,setPromosCupom] = useLocal<PromoCupom>("rn_admin_promo_cupom", []);

  const [editNoticia,setEditNoticia] = useState<Partial<Noticia>|null>(null);
  const [editVaga,setEditVaga] = useState<Partial<Vaga>|null>(null);
  const [editLugar,setEditLugar] = useState<Partial<Lugar>|null>(null);
  const [editProduto,setEditProduto] = useState<Partial<Produto>|null>(null);
  const [editPM,setEditPM] = useState<Partial<PromoMercado>|null>(null);
  const [editPC,setEditPC] = useState<Partial<PromoComb>|null>(null);
  const [editCupom,setEditCupom] = useState<Partial<PromoCupom>|null>(null);

  useEffect(()=>{
    if(localStorage.getItem("rn_admin_auth")==="ok") setAuth(true);
  },[]);

  const login = ()=>{
    if(senha===SENHA){ setAuth(true); localStorage.setItem("rn_admin_auth","ok"); }
    else alert("Senha incorreta");
  };

  const genId = ()=> Math.random().toString(36).slice(2,9);

  if(!auth){
    return (
      <div style={{minHeight:"100vh", display:"grid", placeItems:"center", background:"#f8f6f1", fontFamily:"DM Sans, sans-serif"}}>
        <div style={{background:"#fff", padding:32, borderRadius:24, border:"1px solid #e5ddd1", width:360, boxShadow:"0 12px 40px rgba(0,0,0,0.08)"}}>
          <h1 style={{fontFamily:"Fraunces, serif", fontWeight:900, fontSize:22, color:"#0A2342"}}>REDE NORTE • ADMIN</h1>
          <p style={{fontSize:12, color:"#64748b", marginTop:6}}>Digite a senha pra entrar</p>
          <input value={senha} onChange={e=>setSenha(e.target.value)} type="password" placeholder="Senha" style={{marginTop:16, width:"100%", height:44, borderRadius:999, border:"1px solid #e5ddd1", padding:"0 16px"}} />
          <button onClick={login} style={{marginTop:12, width:"100%", height:44, borderRadius:999, background:"#0A2342", color:"#fff", fontWeight:800, fontSize:12, letterSpacing:"0.1em"}}>ENTRAR</button>
          <p style={{fontSize:10, color:"#94a3b8", marginTop:12}}>Dica: rede2025</p>
        </div>
      </div>
    );
  }

  const filteredNoticias = useMemo(()=> noticias.filter(n=> (n.titulo+n.categoria+n.cidade).toLowerCase().includes(busca.toLowerCase())), [noticias,busca]);
  const filteredVagas = useMemo(()=> vagas.filter(v=> (v.empresa+v.cargo+v.cidade).toLowerCase().includes(busca.toLowerCase())), [vagas,busca]);
  const filteredLugares = useMemo(()=> lugares.filter(l=> (l.nome+l.categoria+l.cidade).toLowerCase().includes(busca.toLowerCase())), [lugares,busca]);
  const filteredProdutos = useMemo(()=> produtos.filter(p=> (p.titulo+p.categoria+p.cidade).toLowerCase().includes(busca.toLowerCase())), [produtos,busca]);

  return (
    <div style={{minHeight:"100vh", background:"#f8f6f1", display:"flex", fontFamily:"DM Sans, sans-serif"}}>
      {/* SIDEBAR */}
      <aside style={{width:260, background:"#0A2342", color:"#fff", padding:"20px 14px", position:"sticky", top:0, height:"100vh", overflowY:"auto"}}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:20}}>
          <div style={{width:32, height:32, borderRadius:8, background:"#FF6B00", display:"grid", placeItems:"center", fontWeight:900}}>RN</div>
          <div><div style={{fontFamily:"Fraunces, serif", fontWeight:900, fontSize:16, lineHeight:1}}>REDE NORTE</div><div style={{fontSize:9, letterSpacing:"0.18em", opacity:0.7}}>ADMIN PRO</div></div>
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:6}}>
          {[
            {id:"noticias", label:"📰 Notícias", count:noticias.length},
            {id:"vagas", label:"💼 Empregos", count:vagas.length},
            {id:"ondeir", label:"📍 Onde Ir", count:lugares.length},
            {id:"compras", label:"🛒 Compras e Vendas", count:produtos.length},
            {id:"promos", label:"🏷️ Promoções", count:promosMercado.length+promosComb.length+promosCupom.length},
          ].map((item:any)=>(
            <button key={item.id} onClick={()=>setAba(item.id)} style={{textAlign:"left", padding:"10px 12px", borderRadius:12, background: aba===item.id ? "#fff" : "rgba(255,255,255,0.08)", color: aba===item.id ? "#0A2342" : "#fff", fontWeight:700, fontSize:12, display:"flex", justifyContent:"space-between"}}>
              <span>{item.label}</span><span style={{opacity:0.7}}>{item.count}</span>
            </button>
          ))}
        </div>
        <div style={{marginTop:24, paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.1)"}}>
          <button onClick={()=>{ localStorage.removeItem("rn_admin_auth"); location.reload(); }} style={{fontSize:11, opacity:0.6}}>Sair</button>
          <div style={{fontSize:10, opacity:0.5, marginTop:8}}>Manual: empresas mandam vaga no WhatsApp e você cadastra aqui. Utilidade pública.</div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1, padding:24, maxWidth:1100}}>
        <div style={{display:"flex", gap:12, alignItems:"center", marginBottom:18, flexWrap:"wrap"}}>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." style={{height:40, borderRadius:999, border:"1px solid #e5ddd1", padding:"0 16px", background:"#fff", minWidth:220}} />
          {aba==="noticias" && <button onClick={()=>setEditNoticia({titulo:"", categoria:"Geral", cidade:CIDADES[0], resumo:"", conteudo:"", imagem:"", destaque:false})} style={btnPrimary}>+ Nova Notícia</button>}
          {aba==="vagas" && <button onClick={()=>setEditVaga({empresa:"", cargo:"", cidade:CIDADES[0], tipo:"CLT", salario:"", descricao:"", requisitos:"", whatsapp:"5543", contato:"", status:"ativa"})} style={btnPrimary}>+ Nova Vaga</button>}
          {aba==="ondeir" && <button onClick={()=>setEditLugar({nome:"", categoria:"Lanchonete", cidade:CIDADES[0], endereco:"", telefone:"", whatsapp:"", instagram:"", horario:"", imagem:"", destaque:false, verificado:true})} style={btnPrimary}>+ Novo Lugar</button>}
          {aba==="compras" && <button onClick={()=>setEditProduto({titulo:"", descricao:"", preco:"", cidade:CIDADES[0], categoria:"Outros", whatsapp:"", imagem:"", status:"ativo"})} style={btnPrimary}>+ Novo Produto</button>}
          {aba==="promos" && (
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <select value={subPromo} onChange={e=>setSubPromo(e.target.value as any)} style={{height:40, borderRadius:999, border:"1px solid #e5ddd1", padding:"0 12px", background:"#fff"}}>
                <option value="mercados">Mercados</option><option value="combustivel">Combustível</option><option value="cupons">Cupons</option>
              </select>
              {subPromo==="mercados" && <button onClick={()=>setEditPM({mercado:"", produto:"", preco:"", preco_antigo:"", cidade:CIDADES[0], validade:"", imagem:""})} style={btnPrimary}>+ Oferta Mercado</button>}
              {subPromo==="combustivel" && <button onClick={()=>setEditPC({posto:"", cidade:CIDADES[0], gasolina:"", etanol:"", diesel:"", imagem:""})} style={btnPrimary}>+ Preço Combustível</button>}
              {subPromo==="cupons" && <button onClick={()=>setEditCupom({loja:"", codigo:"", desconto:"", descricao:"", cidade:CIDADES[0], validade:"", link:""})} style={btnPrimary}>+ Novo Cupom</button>}
            </div>
          )}
        </div>

        {aba==="noticias" && (
          <div style={{display:"grid", gap:10}}>
            {filteredNoticias.map(n=>(
              <div key={n.id} style={card}>
                <div style={{flex:1}}><b style={{fontFamily:"Fraunces, serif"}}>{n.titulo}</b><div style={{fontSize:11, color:"#64748b"}}>{n.categoria} • {n.cidade} • {n.destaque?"DESTAQUE":""} • {new Date(n.created_at).toLocaleDateString()}</div><div style={{fontSize:12, marginTop:4, color:"#334155"}}>{n.resumo}</div></div>
                <div style={{display:"flex", gap:6}}><button onClick={()=>setEditNoticia(n)} style={btnSmall}>Editar</button><button onClick={()=>{ if(confirm("Excluir?")) setNoticias(prev=>prev.filter(x=>x.id!==n.id)) }} style={btnDanger}>X</button></div>
              </div>
            ))}
            {filteredNoticias.length===0 && <div style={{padding:24, textAlign:"center", color:"#94a3b8"}}>Nenhuma notícia. Clique em + Nova Notícia.</div>}
          </div>
        )}

        {aba==="vagas" && (
          <div style={{display:"grid", gap:10}}>
            <div style={{background:"#fff", border:"1px solid #e5ddd1", borderRadius:12, padding:12, fontSize:11, color:"#475569"}}><b>Fluxo definido:</b> Empresa manda vaga no WhatsApp da redação → Você cadastra aqui manual → Candidatura vai direto pro WhatsApp da empresa (como já tá no site). Utilidade pública, sem monetização.</div>
            {filteredVagas.map(v=>(
              <div key={v.id} style={card}>
                <div style={{flex:1}}><b>{v.cargo}</b> - {v.empresa}<div style={{fontSize:11, color:"#64748b"}}>{v.cidade} • {v.tipo} • {v.salario} • {v.status} • WhatsApp {v.whatsapp}</div><div style={{fontSize:12, marginTop:4}}>{v.descricao}</div></div>
                <div style={{display:"flex", gap:6}}><button onClick={()=>setEditVaga(v)} style={btnSmall}>Editar</button><button onClick={()=>{ if(confirm("Excluir?")) setVagas(prev=>prev.filter(x=>x.id!==v.id)) }} style={btnDanger}>X</button></div>
              </div>
            ))}
            {filteredVagas.length===0 && <div style={{padding:24, textAlign:"center", color:"#94a3b8"}}>Nenhuma vaga. Cadastre a primeira manualmente.</div>}
          </div>
        )}

        {aba==="ondeir" && (
          <div style={{display:"grid", gap:10}}>
            {filteredLugares.map(l=>(
              <div key={l.id} style={card}>
                <div style={{flex:1}}><b>{l.nome}</b> <span style={{fontSize:10, background:"#FF6B00", color:"#fff", padding:"2px 6px", borderRadius:999}}>{l.categoria}</span><div style={{fontSize:11, color:"#64748b"}}>{l.cidade} • {l.endereco} • {l.telefone}</div></div>
                <div style={{display:"flex", gap:6}}><button onClick={()=>setEditLugar(l)} style={btnSmall}>Editar</button><button onClick={()=>{ if(confirm("Excluir?")) setLugares(prev=>prev.filter(x=>x.id!==l.id)) }} style={btnDanger}>X</button></div>
              </div>
            ))}
            {filteredLugares.length===0 && <div style={{padding:24, textAlign:"center", color:"#94a3b8"}}>Nenhum lugar cadastrado.</div>}
          </div>
        )}

        {aba==="compras" && (
          <div style={{display:"grid", gap:10}}>
            {filteredProdutos.map(p=>(
              <div key={p.id} style={card}>
                <div style={{flex:1}}><b>{p.titulo}</b> - R$ {p.preco}<div style={{fontSize:11, color:"#64748b"}}>{p.categoria} • {p.cidade} • {p.status}</div><div style={{fontSize:12}}>{p.descricao}</div></div>
                <div style={{display:"flex", gap:6}}><button onClick={()=>setEditProduto(p)} style={btnSmall}>Editar</button><button onClick={()=>{ if(confirm("Excluir?")) setProdutos(prev=>prev.filter(x=>x.id!==p.id)) }} style={btnDanger}>X</button></div>
              </div>
            ))}
            {filteredProdutos.length===0 && <div style={{padding:24, textAlign:"center", color:"#94a3b8"}}>Nenhum produto.</div>}
          </div>
        )}

        {aba==="promos" && (
          <div>
            {subPromo==="mercados" && (
              <div style={{display:"grid", gap:10}}>
                {promosMercado.map(p=>(
                  <div key={p.id} style={card}><div style={{flex:1}}><b>{p.mercado}</b> - {p.produto} - R$ {p.preco}<div style={{fontSize:11, color:"#64748b"}}>{p.cidade} • Validade {p.validade}</div></div><div style={{display:"flex", gap:6}}><button onClick={()=>setEditPM(p)} style={btnSmall}>Editar</button><button onClick={()=>{ if(confirm("Excluir?")) setPromosMercado(prev=>prev.filter(x=>x.id!==p.id)) }} style={btnDanger}>X</button></div></div>
                ))}
              </div>
            )}
            {subPromo==="combustivel" && (
              <div style={{display:"grid", gap:10}}>
                {promosComb.map(p=>(
                  <div key={p.id} style={card}><div style={{flex:1}}><b>{p.posto}</b> - {p.cidade}<div style={{fontSize:11, color:"#64748b"}}>Gasolina R$ {p.gasolina} • Etanol R$ {p.etanol} • Diesel R$ {p.diesel}</div></div><div style={{display:"flex", gap:6}}><button onClick={()=>setEditPC(p)} style={btnSmall}>Editar</button><button onClick={()=>{ if(confirm("Excluir?")) setPromosComb(prev=>prev.filter(x=>x.id!==p.id)) }} style={btnDanger}>X</button></div></div>
                ))}
              </div>
            )}
            {subPromo==="cupons" && (
              <div style={{display:"grid", gap:10}}>
                {promosCupom.map(p=>(
                  <div key={p.id} style={card}><div style={{flex:1}}><b>{p.loja}</b> - {p.codigo} - {p.desconto}<div style={{fontSize:11, color:"#64748b"}}>{p.cidade} • Validade {p.validade}</div><div style={{fontSize:12}}>{p.descricao}</div></div><div style={{display:"flex", gap:6}}><button onClick={()=>setEditCupom(p)} style={btnSmall}>Editar</button><button onClick={()=>{ if(confirm("Excluir?")) setPromosCupom(prev=>prev.filter(x=>x.id!==p.id)) }} style={btnDanger}>X</button></div></div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALS */}
      {editNoticia && (
        <Modal title={editNoticia.id?"Editar Notícia":"Nova Notícia"} onClose={()=>setEditNoticia(null)} onSave={()=>{
          if(!editNoticia.titulo?.trim()) return alert("Título obrigatório");
          if(editNoticia.id){ setNoticias(prev=>prev.map(x=> x.id===editNoticia.id ? {...x, ...editNoticia} as Noticia : x)); }
          else{ const n={id:genId(), titulo:editNoticia.titulo!, categoria:editNoticia.categoria||"Geral", cidade:editNoticia.cidade||CIDADES[0], resumo:editNoticia.resumo||"", conteudo:editNoticia.conteudo||"", imagem:editNoticia.imagem||"", destaque:!!editNoticia.destaque, created_at:new Date().toISOString()} as Noticia; setNoticias(prev=>[n,...prev]); }
          setEditNoticia(null);
        }}>
          <Field label="Título"><input value={editNoticia.titulo||""} onChange={e=>setEditNoticia({...editNoticia, titulo:e.target.value})} style={input} /></Field>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <Field label="Categoria"><select value={editNoticia.categoria||""} onChange={e=>setEditNoticia({...editNoticia, categoria:e.target.value})} style={input}>{CATS_NOTICIA.map(c=><option key={c}>{c}</option>)}</select></Field>
            <Field label="Cidade"><select value={editNoticia.cidade||""} onChange={e=>setEditNoticia({...editNoticia, cidade:e.target.value})} style={input}>{CIDADES.map(c=><option key={c}>{c}</option>)}</select></Field>
          </div>
          <Field label="Resumo"><input value={editNoticia.resumo||""} onChange={e=>setEditNoticia({...editNoticia, resumo:e.target.value})} style={input} /></Field>
          <Field label="Conteúdo"><textarea value={editNoticia.conteudo||""} onChange={e=>setEditNoticia({...editNoticia, conteudo:e.target.value})} style={{...input, height:100}} /></Field>
          <Field label="Imagem URL"><input value={editNoticia.imagem||""} onChange={e=>setEditNoticia({...editNoticia, imagem:e.target.value})} style={input} placeholder="https://..." /></Field>
          <label style={{display:"flex", gap:6, fontSize:12, alignItems:"center"}}><input type="checkbox" checked={!!editNoticia.destaque} onChange={e=>setEditNoticia({...editNoticia, destaque:e.target.checked})} /> Destaque na home</label>
        </Modal>
      )}

      {editVaga && (
        <Modal title={editVaga.id?"Editar Vaga":"Nova Vaga (Manual)"} onClose={()=>setEditVaga(null)} onSave={()=>{
          if(!editVaga.empresa||!editVaga.cargo) return alert("Empresa e cargo obrigatórios");
          if(editVaga.id){ setVagas(prev=>prev.map(x=> x.id===editVaga.id ? {...x, ...editVaga} as Vaga : x)); }
          else{ const v={id:genId(), empresa:editVaga.empresa!, cargo:editVaga.cargo!, cidade:editVaga.cidade||CIDADES[0], tipo:editVaga.tipo||"CLT", salario:editVaga.salario||"", descricao:editVaga.descricao||"", requisitos:editVaga.requisitos||"", whatsapp:editVaga.whatsapp||"", contato:editVaga.contato||"", status:"ativa", created_at:new Date().toISOString()} as Vaga; setVagas(prev=>[v,...prev]); }
          setEditVaga(null);
        }}>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <Field label="Empresa"><input value={editVaga.empresa||""} onChange={e=>setEditVaga({...editVaga, empresa:e.target.value})} style={input} /></Field>
            <Field label="Cargo/Vaga"><input value={editVaga.cargo||""} onChange={e=>setEditVaga({...editVaga, cargo:e.target.value})} style={input} /></Field>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
            <Field label="Cidade"><select value={editVaga.cidade||""} onChange={e=>setEditVaga({...editVaga, cidade:e.target.value})} style={input}>{CIDADES.map(c=><option key={c}>{c}</option>)}</select></Field>
            <Field label="Tipo"><select value={editVaga.tipo||""} onChange={e=>setEditVaga({...editVaga, tipo:e.target.value})} style={input}>{TIPOS_VAGA.map(t=><option key={t}>{t}</option>)}</select></Field>
            <Field label="Salário"><input value={editVaga.salario||""} onChange={e=>setEditVaga({...editVaga, salario:e.target.value})} style={input} placeholder="R$ 1.800" /></Field>
          </div>
          <Field label="Descrição"><textarea value={editVaga.descricao||""} onChange={e=>setEditVaga({...editVaga, descricao:e.target.value})} style={{...input, height:80}} /></Field>
          <Field label="Requisitos"><input value={editVaga.requisitos||""} onChange={e=>setEditVaga({...editVaga, requisitos:e.target.value})} style={input} /></Field>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <Field label="WhatsApp (só números)"><input value={editVaga.whatsapp||""} onChange={e=>setEditVaga({...editVaga, whatsapp:e.target.value})} style={input} placeholder="5543999999999" /></Field>
            <Field label="Contato Email"><input value={editVaga.contato||""} onChange={e=>setEditVaga({...editVaga, contato:e.target.value})} style={input} /></Field>
          </div>
        </Modal>
      )}

      {editLugar && (
        <Modal title={editLugar.id?"Editar Lugar":"Novo Lugar - Onde Ir"} onClose={()=>setEditLugar(null)} onSave={()=>{
          if(!editLugar.nome) return alert("Nome obrigatório");
          if(editLugar.id){ setLugares(prev=>prev.map(x=> x.id===editLugar.id ? {...x, ...editLugar} as Lugar : x)); }
          else{ const l={id:genId(), nome:editLugar.nome!, categoria:editLugar.categoria||"Lanchonete", cidade:editLugar.cidade||CIDADES[0], endereco:editLugar.endereco||"", telefone:editLugar.telefone||"", whatsapp:editLugar.whatsapp||"", instagram:editLugar.instagram||"", horario:editLugar.horario||"", imagem:editLugar.imagem||"", destaque:false, verificado:true, created_at:new Date().toISOString()} as Lugar; setLugares(prev=>[l,...prev]); }
          setEditLugar(null);
        }}>
          <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:10}}>
            <Field label="Nome"><input value={editLugar.nome||""} onChange={e=>setEditLugar({...editLugar, nome:e.target.value})} style={input} /></Field>
            <Field label="Categoria"><select value={editLugar.categoria||""} onChange={e=>setEditLugar({...editLugar, categoria:e.target.value})} style={input}>{CATS_ONDEIR.map(c=><option key={c}>{c}</option>)}</select></Field>
          </div>
          <Field label="Cidade"><select value={editLugar.cidade||""} onChange={e=>setEditLugar({...editLugar, cidade:e.target.value})} style={input}>{CIDADES.map(c=><option key={c}>{c}</option>)}</select></Field>
          <Field label="Endereço"><input value={editLugar.endereco||""} onChange={e=>setEditLugar({...editLugar, endereco:e.target.value})} style={input} /></Field>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <Field label="Telefone"><input value={editLugar.telefone||""} onChange={e=>setEditLugar({...editLugar, telefone:e.target.value})} style={input} /></Field>
            <Field label="WhatsApp"><input value={editLugar.whatsapp||""} onChange={e=>setEditLugar({...editLugar, whatsapp:e.target.value})} style={input} /></Field>
          </div>
          <Field label="Instagram"><input value={editLugar.instagram||""} onChange={e=>setEditLugar({...editLugar, instagram:e.target.value})} style={input} placeholder="@..." /></Field>
          <Field label="Imagem URL"><input value={editLugar.imagem||""} onChange={e=>setEditLugar({...editLugar, imagem:e.target.value})} style={input} /></Field>
        </Modal>
      )}

      {editProduto && (
        <Modal title={editProduto.id?"Editar Produto":"Novo Produto - Compras e Vendas"} onClose={()=>setEditProduto(null)} onSave={()=>{
          if(!editProduto.titulo) return alert("Título obrigatório");
          if(editProduto.id){ setProdutos(prev=>prev.map(x=> x.id===editProduto.id ? {...x, ...editProduto} as Produto : x)); }
          else{ const p={id:genId(), titulo:editProduto.titulo!, descricao:editProduto.descricao||"", preco:editProduto.preco||"", cidade:editProduto.cidade||CIDADES[0], categoria:editProduto.categoria||"Outros", whatsapp:editProduto.whatsapp||"", imagem:editProduto.imagem||"", status:"ativo", created_at:new Date().toISOString()} as Produto; setProdutos(prev=>[p,...prev]); }
          setEditProduto(null);
        }}>
          <Field label="Título"><input value={editProduto.titulo||""} onChange={e=>setEditProduto({...editProduto, titulo:e.target.value})} style={input} /></Field>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <Field label="Preço"><input value={editProduto.preco||""} onChange={e=>setEditProduto({...editProduto, preco:e.target.value})} style={input} placeholder="350" /></Field>
            <Field label="Categoria"><select value={editProduto.categoria||""} onChange={e=>setEditProduto({...editProduto, categoria:e.target.value})} style={input}>{CATS_COMPRA.map(c=><option key={c}>{c}</option>)}</select></Field>
          </div>
          <Field label="Descrição"><textarea value={editProduto.descricao||""} onChange={e=>setEditProduto({...editProduto, descricao:e.target.value})} style={{...input, height:80}} /></Field>
          <Field label="WhatsApp"><input value={editProduto.whatsapp||""} onChange={e=>setEditProduto({...editProduto, whatsapp:e.target.value})} style={input} /></Field>
        </Modal>
      )}

      {editPM && (
        <Modal title="Oferta Mercado" onClose={()=>setEditPM(null)} onSave={()=>{
          if(!editPM.mercado||!editPM.produto) return alert("Obrigatório");
          if(editPM.id){ setPromosMercado(prev=>prev.map(x=> x.id===editPM.id ? {...x, ...editPM} as PromoMercado : x)); }
          else{ const p={id:genId(), mercado:editPM.mercado!, produto:editPM.produto!, preco:editPM.preco||"", preco_antigo:editPM.preco_antigo||"", cidade:editPM.cidade||CIDADES[0], validade:editPM.validade||"", imagem:editPM.imagem||"", created_at:new Date().toISOString()} as PromoMercado; setPromosMercado(prev=>[p,...prev]); }
          setEditPM(null);
        }}>
          <Field label="Mercado"><input value={editPM.mercado||""} onChange={e=>setEditPM({...editPM, mercado:e.target.value})} style={input} /></Field>
          <Field label="Produto"><input value={editPM.produto||""} onChange={e=>setEditPM({...editPM, produto:e.target.value})} style={input} /></Field>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <Field label="Preço"><input value={editPM.preco||""} onChange={e=>setEditPM({...editPM, preco:e.target.value})} style={input} /></Field>
            <Field label="Preço Antigo"><input value={editPM.preco_antigo||""} onChange={e=>setEditPM({...editPM, preco_antigo:e.target.value})} style={input} /></Field>
          </div>
          <Field label="Validade"><input value={editPM.validade||""} onChange={e=>setEditPM({...editPM, validade:e.target.value})} style={input} placeholder="até 20/10" /></Field>
        </Modal>
      )}

      {editPC && (
        <Modal title="Preço Combustível" onClose={()=>setEditPC(null)} onSave={()=>{
          if(!editPC.posto) return alert("Posto obrigatório");
          if(editPC.id){ setPromosComb(prev=>prev.map(x=> x.id===editPC.id ? {...x, ...editPC} as PromoComb : x)); }
          else{ const p={id:genId(), posto:editPC.posto!, cidade:editPC.cidade||CIDADES[0], gasolina:editPC.gasolina||"", etanol:editPC.etanol||"", diesel:editPC.diesel||"", imagem:editPC.imagem||"", created_at:new Date().toISOString()} as PromoComb; setPromosComb(prev=>[p,...prev]); }
          setEditPC(null);
        }}>
          <Field label="Posto"><input value={editPC.posto||""} onChange={e=>setEditPC({...editPC, posto:e.target.value})} style={input} /></Field>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
            <Field label="Gasolina"><input value={editPC.gasolina||""} onChange={e=>setEditPC({...editPC, gasolina:e.target.value})} style={input} /></Field>
            <Field label="Etanol"><input value={editPC.etanol||""} onChange={e=>setEditPC({...editPC, etanol:e.target.value})} style={input} /></Field>
            <Field label="Diesel"><input value={editPC.diesel||""} onChange={e=>setEditPC({...editPC, diesel:e.target.value})} style={input} /></Field>
          </div>
        </Modal>
      )}

      {editCupom && (
        <Modal title="Cupom" onClose={()=>setEditCupom(null)} onSave={()=>{
          if(!editCupom.loja||!editCupom.codigo) return alert("Obrigatório");
          if(editCupom.id){ setPromosCupom(prev=>prev.map(x=> x.id===editCupom.id ? {...x, ...editCupom} as PromoCupom : x)); }
          else{ const p={id:genId(), loja:editCupom.loja!, codigo:editCupom.codigo!, desconto:editCupom.desconto||"", descricao:editCupom.descricao||"", cidade:editCupom.cidade||CIDADES[0], validade:editCupom.validade||"", link:editCupom.link||"", created_at:new Date().toISOString()} as PromoCupom; setPromosCupom(prev=>[p,...prev]); }
          setEditCupom(null);
        }}>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <Field label="Loja"><input value={editCupom.loja||""} onChange={e=>setEditCupom({...editCupom, loja:e.target.value})} style={input} /></Field>
            <Field label="Código"><input value={editCupom.codigo||""} onChange={e=>setEditCupom({...editCupom, codigo:e.target.value})} style={input} /></Field>
          </div>
          <Field label="Desconto"><input value={editCupom.desconto||""} onChange={e=>setEditCupom({...editCupom, desconto:e.target.value})} style={input} placeholder="20% OFF" /></Field>
          <Field label="Descrição"><input value={editCupom.descricao||""} onChange={e=>setEditCupom({...editCupom, descricao:e.target.value})} style={input} /></Field>
          <Field label="Link"><input value={editCupom.link||""} onChange={e=>setEditCupom({...editCupom, link:e.target.value})} style={input} placeholder="https://..." /></Field>
        </Modal>
      )}
    </div>
  );
}

const btnPrimary = {height:40, borderRadius:999, background:"#0A2342", color:"#fff", fontWeight:800, fontSize:11, padding:"0 18px", letterSpacing:"0.08em"} as any;
const btnSmall = {height:32, borderRadius:999, background:"#fff", border:"1px solid #0A2342", color:"#0A2342", fontWeight:700, fontSize:11, padding:"0 12px"} as any;
const btnDanger = {height:32, width:32, borderRadius:999, background:"#fff", border:"1px solid #e2e8f0", color:"#ef4444", fontWeight:700, fontSize:11} as any;
const card = {display:"flex", gap:12, alignItems:"flex-start", background:"#fff", border:"1px solid #e5ddd1", borderRadius:16, padding:12} as any;
const input = {width:"100%", height:40, borderRadius:999, border:"1px solid #e5ddd1", padding:"0 14px", background:"#fff", fontSize:13} as any;

function Field({label, children}:{label:string, children:any}){ return <div style={{display:"flex", flexDirection:"column", gap:4}}><span style={{fontSize:11, fontWeight:700, color:"#475569"}}>{label}</span>{children}</div> }
function Modal({title, children, onClose, onSave}:{title:string, children:any, onClose:()=>void, onSave:()=>void}){
  return (
    <div style={{position:"fixed", inset:0, zIndex:50, display:"grid", placeItems:"center", padding:16}}>
      <div onClick={onClose} style={{position:"absolute", inset:0, background:"rgba(10,35,66,0.6)", backdropFilter:"blur(4px)"}} />
      <div style={{position:"relative", background:"#f8f6f1", borderRadius:20, padding:18, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto", border:"1px solid #e5ddd1"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}><h3 style={{fontFamily:"Fraunces, serif", fontWeight:900}}>{title}</h3><button onClick={onClose} style={{width:32, height:32, borderRadius:999, background:"#fff", border:"1px solid #e5ddd1"}}>X</button></div>
        <div style={{display:"grid", gap:12}}>{children}</div>
        <div style={{display:"flex", gap:8, marginTop:16}}><button onClick={onClose} style={{flex:1, height:44, borderRadius:999, background:"#fff", border:"1px solid #e5ddd1", fontWeight:700, fontSize:12}}>Cancelar</button><button onClick={onSave} style={{flex:1, height:44, borderRadius:999, background:"#0A2342", color:"#fff", fontWeight:800, fontSize:12}}>Salvar</button></div>
      </div>
    </div>
  )
}
