"use client";
import { useState, useEffect } from "react"

const SENHA = "rede2025";

export default function AdminPage(){
  const [auth, setAuth] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [noticias, setNoticias] = useState<any[]>([]);

  useEffect(()=>{
    try{
      const a = localStorage.getItem("rn_admin_auth");
      if(a){
        const d = JSON.parse(a);
        if(d.ok && d.exp > Date.now()) setAuth(true);
      }
      const n = localStorage.getItem("rn_noticias");
      if(n) setNoticias(JSON.parse(n));
    }catch{}
  },[]);

  const login = () => {
    if(senha === SENHA){
      localStorage.setItem("rn_admin_auth", JSON.stringify({ok:true, exp: Date.now()+86400000}));
      setAuth(true);
      setErro("");
    }else{
      setErro("Senha incorreta. Use rede2025");
    }
  };

  const logout = () => {
    localStorage.removeItem("rn_admin_auth");
    setAuth(false);
  };

  const salvarDemo = () => {
    const demo = [
      {id:"1", cidade:"Apucarana", categoria:"Cidade", titulo:"Apucarana 360º: feira noturna reúne 8 mil pessoas", status:"Publicado", data:"14/10/2026"},
      {id:"2", cidade:"Arapongas", categoria:"Segurança", titulo:"Operação na BR-369 apreende carga milionária", status:"Publicado", data:"14/10/2026"},
    ];
    localStorage.setItem("rn_noticias", JSON.stringify(demo));
    setNoticias(demo);
    alert("2 notícias demo salvas no localStorage rn_noticias. Agora volte para a home e dê F5.");
  };

  const limpar = () => {
    if(confirm("Apagar todas notícias do localStorage?")){
      localStorage.removeItem("rn_noticias");
      setNoticias([]);
    }
  };

  if(!auth){
    return (
      <div style={{minHeight:"100vh", background:"#f8fafc", display:"grid", placeItems:"center", padding:16, fontFamily:"DM Sans, sans-serif"}}>
        <div style={{width:"100%", maxWidth:380, background:"#fff", borderRadius:24, border:"1px solid #e2e8f0", padding:28}}>
          <div style={{width:48, height:40, background:"#FF6B00", borderRadius:12, display:"grid", placeItems:"center", fontWeight:900, color:"#0A2342"}}>RN</div>
          <h1 style={{fontWeight:900, fontSize:22, marginTop:12, color:"#0A2342"}}>Acesso Restrito</h1>
          <p style={{fontSize:13, color:"#64748b", marginTop:4}}>Redação Rede Norte</p>
          <label style={{fontSize:11, fontWeight:700, marginTop:20, display:"block"}}>SENHA</label>
          <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="rede2025" style={{width:"100%", height:44, borderRadius:999, border:"1px solid #e2e8f0", padding:"0 16px", marginTop:6, background:"#f8fafc"}} />
          {erro && <p style={{color:"red", fontSize:12, marginTop:8, fontWeight:700}}>{erro}</p>}
          <button onClick={login} style={{width:"100%", height:44, borderRadius:999, background:"#0A2342", color:"#fff", fontWeight:700, fontSize:12, marginTop:12}}>ENTRAR</button>
          <a href="/" style={{display:"block", textAlign:"center", fontSize:11, fontWeight:700, color:"#0A2342", marginTop:12}}>← Voltar ao site</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{fontFamily:"DM Sans, sans-serif", background:"#f8fafc", minHeight:"100vh"}}>
      <div style={{background:"#0A2342", color:"#fff", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px"}}>
        <div style={{display:"flex", gap:8, alignItems:"center", fontWeight:900}}>RN ADMIN</div>
        <div style={{display:"flex", gap:8}}><a href="/" style={{height:32, padding:"0 12px", borderRadius:999, background:"#fff", color:"#0A2342", display:"grid", placeItems:"center", fontSize:11, fontWeight:700, textDecoration:"none"}}>VER SITE</a><button onClick={logout} style={{height:32, padding:"0 12px", borderRadius:999, border:"1px solid rgba(255,255,255,0.2)", color:"#fff", background:"transparent", fontSize:11, fontWeight:700}}>SAIR</button></div>
      </div>
      <div style={{padding:20, maxWidth:900, margin:"0 auto"}}>
        <h1 style={{fontSize:20, fontWeight:900, color:"#0A2342"}}>Painel Administrativo</h1>
        <p style={{fontSize:13, color:"#64748b", marginTop:4}}>Este admin salva em localStorage (rn_noticias). Para o site público ler, depois a gente pluga no Supabase. Por enquanto serve para testar sem quebrar o site público.</p>
        <div style={{display:"flex", gap:8, marginTop:16, flexWrap:"wrap"}}>
          <button onClick={salvarDemo} style={{height:36, padding:"0 16px", borderRadius:999, background:"#FF6B00", color:"#fff", fontWeight:700, fontSize:12, border:"none"}}>+ Salvar 2 notícias demo</button>
          <button onClick={limpar} style={{height:36, padding:"0 16px", borderRadius:999, background:"#fff", border:"1px solid #e2e8f0", fontWeight:700, fontSize:12}}>Limpar localStorage</button>
          <span style={{fontSize:12, color:"#64748b", alignSelf:"center"}}>{noticias.length} notícias no rn_noticias</span>
        </div>
        <div style={{marginTop:20, background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", overflow:"hidden"}}>
          {noticias.length===0 ? <div style={{padding:24, color:"#64748b", fontSize:13}}>Nenhuma notícia no localStorage. Clique em Salvar demo.</div> : noticias.map((n:any)=>(
            <div key={n.id} style={{padding:12, borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between"}}>
              <div><div style={{fontWeight:700, fontSize:13}}>{n.titulo}</div><div style={{fontSize:11, color:"#64748b"}}>{n.cidade} • {n.categoria} • {n.status}</div></div>
              <div style={{fontSize:11, color:"#64748b"}}>{n.data}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:20, padding:16, background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", fontSize:12, color:"#64748b"}}>
          <strong>Como voltar o site público:</strong> O arquivo app/page.tsx que você tem no GitHub agora deve ser o público completo (com Onde Ir, Empregos). Se você colar o arquivo PUBLICO-ESTAVEL abaixo, o site volta ao normal e a Vercel compila.
        </div>
      </div>
    </div>
  )
}
