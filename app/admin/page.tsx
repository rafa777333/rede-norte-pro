"use client";
import { useState, useEffect } from "react";

type Tab = "noticias"|"ondeir"|"classificados"|"empregos"|"contato";

export default function Admin(){
  const [tab,setTab] = useState<Tab>("noticias");
  const [ok,setOk] = useState(false);
  const [pass,setPass] = useState("");
  const SENHA = "norte123";

  // simple local storage test
  useEffect(()=>{},[]);

  if(!ok){
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8f6f1"}}>
        <div style={{background:"white",padding:32,borderRadius:16,border:"1px solid #e5ddd1",width:360}}>
          <h1 style={{fontWeight:900,marginBottom:12}}>REDE NORTE - ADMIN</h1>
          <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="Senha" style={{width:"100%",padding:"10px 12px",border:"1px solid #e5ddd1",borderRadius:8,marginBottom:12}}/>
          <button onClick={()=>{if(pass===SENHA) setOk(true); else alert("Senha errada - use norte123")}} style={{width:"100%",padding:"10px",background:"#0A2342",color:"white",borderRadius:8,fontWeight:700}}>Entrar</button>
          <p style={{fontSize:12,color:"#64748b",marginTop:8}}>Senha padrão: norte123</p>
        </div>
      </div>
    )
  }

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
          <button key={id} onClick={()=>setTab(id as Tab)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #e5ddd1",background:tab===id?"#0A2342":"white",color:tab===id?"white":"#0A2342",fontWeight:700}}>{label}</button>
        ))}
      </div>

      <main style={{padding:20}}>
        {tab==="noticias" && <Box title="Notícias"><p>Em breve: cadastro de notícias com título, foto, cidade e link. Isso já vai aparecer na home.</p></Box>}
        {tab==="ondeir" && <Box title="Onde Ir"><p>Em breve: bares, restaurantes, eventos por cidade.</p></Box>}
        {tab==="classificados" && <Box title="Classificados"><p>Em breve: casas, carros, etc.</p></Box>}
        {tab==="empregos" && <Box title="Empregos"><p>Em breve: vagas por cidade e WhatsApp.</p></Box>}
        {tab==="contato" && <Box title="Contato"><p>Mensagens recebidas pelo site.</p><p style={{marginTop:8,fontSize:13,color:"#64748b"}}>WhatsApp: (43) 99999-9999<br/>Email: contato@redenorte.com</p></Box>}
      </main>
    </div>
  )
}

function Box({title,children}:{title:string,children:any}){
  return <div style={{background:"white",border:"1px solid #e5ddd1",borderRadius:12,padding:20}}><h2 style={{fontWeight:900,marginBottom:12}}>{title}</h2>{children}</div>
}
