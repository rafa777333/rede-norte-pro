"use client";
import { useState, useEffect } from "react";

type Tab = "noticias"|"ondeir"|"classificados"|"empregos"|"contato";
type Noticia = {id:string, titulo:string, cidade:string, cat:string, resumo:string, img:string, destaque?:boolean};
type Local = {id:string, nome:string, cidade:string, cat:string, end:string, zap:string};
type Classif = {id:string, titulo:string, cidade:string, cat:string, preco:string, zap:string};
type Vaga = {id:string, cargo:string, empresa:string, cidade:string, zap:string};

const CIDADES = ["Apucarana","Arapongas","Ivaiporã","Jandaia do Sul","Faxinal","Jardim Alegre"];
const CAT_NOT = ["Política","Cidade","Segurança","Economia","Eventos"];
const CAT_ONDE = ["Lanchonetes","Pizzarias","Restaurantes","Bares","Cafés"];
const CAT_CLASS = ["Imóveis","Veículos","Eletrônicos","Móveis"];

function useLocal<T>(key:string, initial:T){
  const [v,setV]=useState<T>(initial);
  useEffect(()=>{ try{ const s=localStorage.getItem(key); if(s) setV(JSON.parse(s)); }catch{} },[key]);
  useEffect(()=>{ try{ localStorage.setItem(key, JSON.stringify(v)); }catch{} },[key,v]);
  return [v,setV] as const;
}

export default function Admin(){
  const [tab,setTab]=useState<Tab>("noticias");
  const [ok,setOk]=useState(false);
  const [pass,setPass]=useState("");
  const [noticias,setNoticias]=useLocal<Noticia[]>("rn_noticias",[]);
  const [locais,setLocais]=useLocal<Local[]>("rn_locais",[]);
  const [classif,setClassif]=useLocal<Classif[]>("rn_classif",[]);
  const [vagas,setVagas]=useLocal<Vaga[]>("rn_vagas",[]);

  const [nForm,setNForm]=useState({titulo:"",cidade:"Apucarana",cat:"Política",resumo:"",img:""});
  const [lForm,setLForm]=useState({nome:"",cidade:"Apucarana",cat:"Restaurantes",end:"",zap:""});
  const [cForm,setCForm]=useState({titulo:"",cidade:"Apucarana",cat:"Imóveis",preco:"",zap:""});
  const [vForm,setVForm]=useState({cargo:"",empresa:"",cidade:"Apucarana",zap:""});

  if(!ok){
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8f6f1"}}>
        <div style={{background:"white",padding:32,borderRadius:16,border:"1px solid #e5ddd1",width:360}}>
          <h1 style={{fontWeight:900,marginBottom:12}}>REDE NORTE - ADMIN</h1>
          <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="Senha" style={{width:"100%",padding:"10px 12px",border:"1px solid #e5ddd1",borderRadius:8,marginBottom:12}}/>
          <button onClick={()=>{if(pass==="norte123") setOk(true); else alert("Senha errada")}} style={{width:"100%",padding:"10px",background:"#0A2342",color:"white",borderRadius:8,fontWeight:700,border:0}}>Entrar</button>
          <p style={{fontSize:12,color:"#64748b",marginTop:8}}>Senha: norte123</p>
        </div>
      </div>
    )
  }

  const gen=()=>Math.random().toString(36).slice(2,9);

  return (
    <div style={{minHeight:"100vh",background:"#f8f6f1",fontFamily:"sans-serif"}}>
      <header style={{background:"#0A2342",color:"white",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <b>REDE NORTE PRO - ADMIN</b>
        <button onClick={()=>setOk(false)} style={{background:"#FF6B00",color:"white",padding:"6px 12px",borderRadius:6,border:0}}>Sair</button>
      </header>

      <div style={{display:"flex",gap:8,padding:16,flexWrap:"wrap",background:"white",borderBottom:"1px solid #e5ddd1"}}>
        {[
          ["noticias","Notícias"],
          ["ondeir","Onde Ir"],
          ["classificados","Classificados"],
          ["empregos","Empregos"],
          ["contato","Contato"],
        ].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id as Tab)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #e5ddd1",background:tab===id?"#0A2342":"white",color:tab===id?"white":"#0A2342",fontWeight:700}}>{label as string}</button>
        ))}
      </div>

      <main style={{padding:20,maxWidth:1100,margin:"0 auto"}}>
        {tab==="noticias" && (
          <div>
            <Box title="Cadastrar Notícia">
              <div style={{display:"grid",gap:10}}>
                <input placeholder="Título" value={nForm.titulo} onChange={e=>setNForm({...nForm,titulo:e.target.value})} style={inp}/>
                <div style={{display:"flex",gap:8}}>
                  <select value={nForm.cidade} onChange={e=>setNForm({...nForm,cidade:e.target.value})} style={inp}>{CIDADES.map(c=><option key={c}>{c}</option>)}</select>
                  <select value={nForm.cat} onChange={e=>setNForm({...nForm,cat:e.target.value})} style={inp}>{CAT_NOT.map(c=><option key={c}>{c}</option>)}</select>
                </div>
                <textarea placeholder="Resumo" value={nForm.resumo} onChange={e=>setNForm({...nForm,resumo:e.target.value})} style={inp}/>
                <input placeholder="URL da imagem" value={nForm.img} onChange={e=>setNForm({...nForm,img:e.target.value})} style={inp}/>
                <button onClick={()=>{if(!nForm.titulo) return alert("Título obrigatório"); setNoticias([{id:gen(),...nForm},...noticias]); setNForm({titulo:"",cidade:"Apucarana",cat:"Política",resumo:"",img:""});}} style={btn}>Salvar Notícia</button>
              </div>
            </Box>
            <div style={{marginTop:16,display:"grid",gap:8}}>{noticias.map(n=><div key={n.id} style={card}><b>{n.titulo}</b><div style={{fontSize:12,color:"#64748b"}}>{n.cidade} - {n.cat}</div><button onClick={()=>setNoticias(noticias.filter(x=>x.id!==n.id))} style={del}>Excluir</button></div>)}</div>
          </div>
        )}

        {tab==="ondeir" && (
          <div>
            <Box title="Cadastrar Local - Onde Ir">
              <div style={{display:"grid",gap:10}}>
                <input placeholder="Nome do local" value={lForm.nome} onChange={e=>setLForm({...lForm,nome:e.target.value})} style={inp}/>
                <div style={{display:"flex",gap:8}}>
                  <select value={lForm.cidade} onChange={e=>setLForm({...lForm,cidade:e.target.value})} style={inp}>{CIDADES.map(c=><option key={c}>{c}</option>)}</select>
                  <select value={lForm.cat} onChange={e=>setLForm({...lForm,cat:e.target.value})} style={inp}>{CAT_ONDE.map(c=><option key={c}>{c}</option>)}</select>
                </div>
                <input placeholder="Endereço" value={lForm.end} onChange={e=>setLForm({...lForm,end:e.target.value})} style={inp}/>
                <input placeholder="WhatsApp" value={lForm.zap} onChange={e=>setLForm({...lForm,zap:e.target.value})} style={inp}/>
                <button onClick={()=>{if(!lForm.nome) return alert("Nome obrigatório"); setLocais([{id:gen(),...lForm},...locais]); setLForm({nome:"",cidade:"Apucarana",cat:"Restaurantes",end:"",zap:""});}} style={btn}>Salvar Local</button>
              </div>
            </Box>
            <div style={{marginTop:16,display:"grid",gap:8}}>{locais.map(l=><div key={l.id} style={card}><b>{l.nome}</b><div style={{fontSize:12,color:"#64748b"}}>{l.cidade} - {l.cat} - {l.end}</div><button onClick={()=>setLocais(locais.filter(x=>x.id!==l.id))} style={del}>Excluir</button></div>)}</div>
          </div>
        )}

        {tab==="classificados" && (
          <div>
            <Box title="Cadastrar Classificado">
              <div style={{display:"grid",gap:10}}>
                <input placeholder="Título" value={cForm.titulo} onChange={e=>setCForm({...cForm,titulo:e.target.value})} style={inp}/>
                <div style={{display:"flex",gap:8}}>
                  <select value={cForm.cidade} onChange={e=>setCForm({...cForm,cidade:e.target.value})} style={inp}>{CIDADES.map(c=><option key={c}>{c}</option>)}</select>
                  <select value={cForm.cat} onChange={e=>setCForm({...cForm,cat:e.target.value})} style={inp}>{CAT_CLASS.map(c=><option key={c}>{c}</option>)}</select>
                </div>
                <input placeholder="Preço" value={cForm.preco} onChange={e=>setCForm({...cForm,preco:e.target.value})} style={inp}/>
                <input placeholder="WhatsApp" value={cForm.zap} onChange={e=>setCForm({...cForm,zap:e.target.value})} style={inp}/>
                <button onClick={()=>{if(!cForm.titulo) return alert("Título obrigatório"); setClassif([{id:gen(),...cForm},...classif]); setCForm({titulo:"",cidade:"Apucarana",cat:"Imóveis",preco:"",zap:""});}} style={btn}>Salvar Classificado</button>
              </div>
            </Box>
            <div style={{marginTop:16,display:"grid",gap:8}}>{classif.map(c=><div key={c.id} style={card}><b>{c.titulo}</b><div style={{fontSize:12,color:"#64748b"}}>{c.cidade} - {c.cat} - {c.preco}</div><button onClick={()=>setClassif(classif.filter(x=>x.id!==c.id))} style={del}>Excluir</button></div>)}</div>
          </div>
        )}

        {tab==="empregos" && (
          <div>
            <Box title="Cadastrar Vaga">
              <div style={{display:"grid",gap:10}}>
                <input placeholder="Cargo" value={vForm.cargo} onChange={e=>setVForm({...vForm,cargo:e.target.value})} style={inp}/>
                <input placeholder="Empresa" value={vForm.empresa} onChange={e=>setVForm({...vForm,empresa:e.target.value})} style={inp}/>
                <div style={{display:"flex",gap:8}}>
                  <select value={vForm.cidade} onChange={e=>setVForm({...vForm,cidade:e.target.value})} style={inp}>{CIDADES.map(c=><option key={c}>{c}</option>)}</select>
                  <input placeholder="WhatsApp" value={vForm.zap} onChange={e=>setVForm({...vForm,zap:e.target.value})} style={inp}/>
                </div>
                <button onClick={()=>{if(!vForm.cargo) return alert("Cargo obrigatório"); setVagas([{id:gen(),...vForm},...vagas]); setVForm({cargo:"",empresa:"",cidade:"Apucarana",zap:""});}} style={btn}>Salvar Vaga</button>
              </div>
            </Box>
            <div style={{marginTop:16,display:"grid",gap:8}}>{vagas.map(v=><div key={v.id} style={card}><b>{v.cargo} - {v.empresa}</b><div style={{fontSize:12,color:"#64748b"}}>{v.cidade} - {v.zap}</div><button onClick={()=>setVagas(vagas.filter(x=>x.id!==v.id))} style={del}>Excluir</button></div>)}</div>
          </div>
        )}

        {tab==="contato" && (
          <Box title="Contato">
            <p>WhatsApp do site: (43) 99999-9999</p>
            <p>Email: contato@redenorte.com</p>
            <p style={{marginTop:12,fontSize:13,color:"#64748b"}}>As mensagens do formulário do site vão aparecer aqui quando conectar o banco. Por enquanto fica salvo no navegador.</p>
          </Box>
        )}
      </main>
    </div>
  )
}

const inp = {padding:"10px 12px",border:"1px solid #e5ddd1",borderRadius:8} as any;
const btn = {padding:"10px",background:"#0A2342",color:"white",borderRadius:8,fontWeight:700,border:0} as any;
const card = {background:"white",border:"1px solid #e5ddd1",borderRadius:10,padding:12,display:"flex",justifyContent:"space-between",alignItems:"center"} as any;
const del = {background:"#fee2e2",color:"#b91c1c",border:0,padding:"6px 10px",borderRadius:6,fontWeight:700} as any;
function Box({title,children}:{title:string,children:any}){ return <div style={{background:"white",border:"1px solid #e5ddd1",borderRadius:12,padding:20}}><h2 style={{fontWeight:900,marginBottom:12}}>{title}</h2>{children}</div> }
