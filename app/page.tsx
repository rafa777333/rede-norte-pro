"use client";
import { useRef, useState, useEffect, useMemo } from 'react'

const MENU = [
  {id:"home", label:"HOME", groups:[{title:"Atalhos", items:["Últimas notícias","Mais lidas da semana","Ao vivo agora","Previsão do tempo"]}]},
  {id:"noticias", label:"NOTÍCIAS", groups:[{title:"Cobertura Local", items:["Cidade","Política","Segurança","Economia Local","Eventos","Opinião / Artigos"]},{title:"Formato", items:["Reportagens Especiais","Colunas","Plantão Policial","Apucarana 360º"]}]},
  {id:"tv", label:"TV & VÍDEOS", groups:[{title:"Assista", items:["Programas da TV Web","Entrevistas","Cortes & Destaques","Vídeos Especiais","Transmissões Ao Vivo"]},{title:"Canais", items:["YouTube Oficial","Cortes TikTok","Arquivo"]}]},
  {id:"radio", label:"RÁDIO", isRadio:true, groups:[{title:"Rádio Web Apucarana", items:["Ouvir Ao Vivo","Programação","Podcasts","Entrevistas em Áudio"]}]},
  {id:"empregos", label:"EMPREGOS & SERVIÇOS", groups:[{title:"Oportunidades", items:["Vagas","Currículos","Cadastrar Vaga"]},{title:"Serviços", items:["Prestadores de Serviço","Assistência Técnica","Profissionais"]}]},
  {id:"ondeir", label:"ONDE IR", groups:[{title:"Gastronomia & Lazer", items:["Lanchonetes","Pizzarias","Restaurantes","Bares","Cafés & Sorveterias","Recomendados pela Rede"]},{title:"Guia", items:["Happy Hour hoje","Música ao vivo","Aberto agora"]}]},
  {id:"compras", label:"COMPRAS & VENDAS", groups:[{title:"Anúncios", items:["Imóveis","Veículos","Eletrônicos","Móveis"]}]},
  {id:"promocoes", label:"PROMOÇÕES", groups:[{title:"Ofertas", items:["Supermercados","Combustíveis","Cupons"]}]},
]

const CIDADES = ["Todas","Apucarana","Arapongas","Ivaiporã","Jandaia do Sul","Faxinal","Jardim Alegre"]

type Noticia = {id:string, cidade:string, cat:string, tempo:string, titulo:string, resumo:string, img:string, destaque?:boolean}
const NOTICIAS_FIXAS: Noticia[] = [
  {id:"1", cidade:"Apucarana", cat:"Política", tempo:"há 12 min", titulo:"Câmara aprova novo plano de mobilidade e obras devem começar em 2026", resumo:"Projeto prevê ciclovias e novo terminal urbano.", img:"https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800", destaque:true},
  {id:"2", cidade:"Arapongas", cat:"Cidade", tempo:"há 34 min", titulo:"Feira do produtor movimenta centro e atrai famílias no fim de semana", resumo:"Mais de 40 expositores participaram.", img:"https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800"},
  {id:"3", cidade:"Apucarana", cat:"Segurança", tempo:"há 1h", titulo:"Polícia recupera carga roubada na BR-369", resumo:"Operação conjunta com PRF.", img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"},
]

export default function Page(){
  const [cidadeAtiva,setCidadeAtiva]=useState("Todas");
  const [menuOpen,setMenuOpen]=useState<string|null>(null);
  const [noticiasAdmin,setNoticiasAdmin]=useState<any[]>([]);
  const [locaisAdmin,setLocaisAdmin]=useState<any[]>([]);
  const [vagasAdmin,setVagasAdmin]=useState<any[]>([]);
  const [classifAdmin,setClassifAdmin]=useState<any[]>([]);

  // INTEGRAÇÃO COM ADMIN - lê o que foi cadastrado no /admin
  useEffect(()=>{
    try{
      const n = localStorage.getItem("rn_noticias"); if(n) setNoticiasAdmin(JSON.parse(n));
      const l = localStorage.getItem("rn_locais"); if(l) setLocaisAdmin(JSON.parse(l));
      const v = localStorage.getItem("rn_vagas"); if(v) setVagasAdmin(JSON.parse(v));
      const c = localStorage.getItem("rn_classif"); if(c) setClassifAdmin(JSON.parse(c));
    }catch{}
  },[]);

  const noticias = useMemo(()=>{
    const adminFormat = noticiasAdmin.map((n:any)=>({
      id:n.id, cidade:n.cidade, cat:n.cat, tempo:"agora", titulo:n.titulo, resumo:n.resumo, img:n.img || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800", destaque:false
    }));
    return [...adminFormat, ...NOTICIAS_FIXAS].filter(n=> cidadeAtiva==="Todas" || n.cidade===cidadeAtiva);
  },[cidadeAtiva,noticiasAdmin]);

  const locaisFiltrados = useMemo(()=> locaisAdmin.filter((l:any)=> cidadeAtiva==="Todas" || l.cidade===cidadeAtiva),[locaisAdmin,cidadeAtiva]);
  const vagasFiltradas = useMemo(()=> vagasAdmin.filter((v:any)=> cidadeAtiva==="Todas" || v.cidade===cidadeAtiva),[vagasAdmin,cidadeAtiva]);

  return (
    <div style={{minHeight:"100vh",background:"#f8f6f1",fontFamily:"Inter, system-ui, sans-serif"}}>
      {/* TOPO */}
      <div style={{background:"#0A2342",color:"white",padding:"6px 0",fontSize:12}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 16px",display:"flex",justifyContent:"space-between"}}>
          <span>REDE APUCARANA - Portal de Notícias do Norte do Paraná</span>
          <span>Apucarana {new Date().toLocaleDateString("pt-BR")}</span>
        </div>
      </div>

      {/* HEADER */}
      <header style={{background:"white",borderBottom:"1px solid #e5ddd1",position:"sticky",top:0,zIndex:40}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,background:"#0A2342",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,borderRadius:8}}>RN</div>
            <div><div style={{fontWeight:900,fontSize:20,lineHeight:1,color:"#0A2342"}}>REDE NORTE</div><div style={{fontSize:11,color:"#64748b",letterSpacing:1}}>APUCARANA E REGIÃO</div></div>
          </div>
          <a href="/admin" style={{background:"#FF6B00",color:"white",padding:"8px 14px",borderRadius:8,fontWeight:700,fontSize:13,textDecoration:"none"}}>ADMIN</a>
        </div>

        {/* MENU */}
        <div style={{borderTop:"1px solid #f1e9dc",background:"white"}}>
          <div style={{maxWidth:1200,margin:"0 auto",padding:"0 16px",display:"flex",gap:18,overflowX:"auto",fontSize:13,fontWeight:700}}>
            {MENU.map(m=>(
              <div key={m.id} style={{padding:"10px 0",whiteSpace:"nowrap",cursor:"pointer",color:m.id==="ondeir"?"#FF6B00":"#0A2342"}} onMouseEnter={()=>setMenuOpen(m.id)} onMouseLeave={()=>setMenuOpen(null)}>
                {m.label}
                {menuOpen===m.id && (
                  <div style={{position:"absolute",background:"white",border:"1px solid #e5ddd1",borderRadius:12,padding:16,marginTop:10,boxShadow:"0 10px 30px rgba(0,0,0,.1)",display:"flex",gap:24,zIndex:50}}>
                    {m.groups.map((g:any)=><div key={g.title}><div style={{fontWeight:900,marginBottom:8}}>{g.title}</div><div style={{display:"grid",gap:6,fontWeight:400}}>{g.items.map((it:string)=><span key={it} style={{fontSize:13,color:"#334155"}}>{it}</span>)}</div></div>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CIDADES */}
        <div style={{background:"#f1e9dc",padding:"8px 16px",display:"flex",gap:8,overflowX:"auto"}}>
          <div style={{maxWidth:1200,margin:"0 auto",display:"flex",gap:8}}>
            {CIDADES.map(c=>(
              <button key={c} onClick={()=>setCidadeAtiva(c)} style={{padding:"6px 12px",borderRadius:20,border:"1px solid #e5ddd1",background:cidadeAtiva===c?"#0A2342":"white",color:cidadeAtiva===c?"white":"#0A2342",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{c}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{maxWidth:1200,margin:"0 auto",padding:"16px",display:"grid",gridTemplateColumns:"1fr 340px",gap:16}}>
        {/* NOTICIAS */}
        <div>
          <h2 style={{fontWeight:900,fontSize:18,marginBottom:12}}>Últimas em {cidadeAtiva} {noticiasAdmin.length>0 && <span style={{background:"#FF6B00",color:"white",fontSize:10,padding:"2px 6px",borderRadius:10,marginLeft:8}}>{noticiasAdmin.length} novas do admin</span>}</h2>
          <div style={{display:"grid",gap:12}}>
            {noticias.map(n=>(
              <div key={n.id} style={{background:"white",border:"1px solid #e5ddd1",borderRadius:12,overflow:"hidden",display:"flex"}}>
                <img src={n.img} alt="" style={{width:160,height:110,objectFit:"cover"}}/>
                <div style={{padding:12,flex:1}}>
                  <div style={{fontSize:11,color:"#FF6B00",fontWeight:700}}>{n.cidade} • {n.cat} • {n.tempo}</div>
                  <div style={{fontWeight:800,marginTop:4,lineHeight:1.2}}>{n.titulo}</div>
                  <div style={{fontSize:13,color:"#64748b",marginTop:4}}>{n.resumo}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ONDE IR - INTEGRADO */}
          <div style={{marginTop:28}}>
            <h2 style={{fontWeight:900,fontSize:18,marginBottom:12}}>Onde Ir em {cidadeAtiva} {locaisFiltrados.length>0 && <span style={{fontSize:12,color:"#FF6B00"}}>• {locaisFiltrados.length} locais cadastrados</span>}</h2>
            {locaisFiltrados.length===0 ? (
              <div style={{background:"white",border:"1px dashed #e5ddd1",borderRadius:12,padding:20,textAlign:"center",color:"#64748b"}}>Nenhum local cadastrado ainda. Vá em /admin → Onde Ir e cadastre o primeiro!</div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
                {locaisFiltrados.map((l:any)=>(
                  <div key={l.id} style={{background:"white",border:"1px solid #e5ddd1",borderRadius:12,padding:14}}>
                    <div style={{fontWeight:800}}>{l.nome}</div>
                    <div style={{fontSize:12,color:"#FF6B00",fontWeight:700,marginTop:2}}>{l.cat} • {l.cidade}</div>
                    <div style={{fontSize:12,color:"#64748b",marginTop:6}}>{l.end}</div>
                    <a href={`https://wa.me/${l.zap.replace(/\D/g,"")}`} target="_blank" style={{display:"inline-block",marginTop:8,background:"#25D366",color:"white",padding:"6px 10px",borderRadius:6,fontSize:12,fontWeight:700,textDecoration:"none"}}>WhatsApp</a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CLASSIFICADOS */}
          {classifAdmin.length>0 && (
            <div style={{marginTop:28}}>
              <h2 style={{fontWeight:900,fontSize:18,marginBottom:12}}>Classificados</h2>
              <div style={{display:"grid",gap:8}}>
                {classifAdmin.filter((c:any)=> cidadeAtiva==="Todas" || c.cidade===cidadeAtiva).map((c:any)=>(
                  <div key={c.id} style={{background:"white",border:"1px solid #e5ddd1",borderRadius:10,padding:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><b>{c.titulo}</b><div style={{fontSize:12,color:"#64748b"}}>{c.cidade} • {c.cat} • {c.preco}</div></div>
                    <a href={`https://wa.me/${c.zap.replace(/\D/g,"")}`} target="_blank" style={{background:"#0A2342",color:"white",padding:"6px 10px",borderRadius:6,fontSize:12,textDecoration:"none"}}>Chamar</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LATERAL EMPREGOS */}
        <div>
          <div style={{background:"white",border:"1px solid #e5ddd1",borderRadius:12,padding:16,position:"sticky",top:160}}>
            <h3 style={{fontWeight:900}}>Vagas - {cidadeAtiva}</h3>
            {vagasFiltradas.length===0 ? (
              <div style={{marginTop:12,padding:12,background:"#f8f6f1",borderRadius:8,fontSize:13,color:"#64748b"}}>Nenhuma vaga cadastrada. Cadastre em /admin → Empregos</div>
            ) : (
              <div style={{display:"grid",gap:10,marginTop:12}}>
                {vagasFiltradas.map((v:any)=>(
                  <div key={v.id} style={{border:"1px solid #e5ddd1",borderRadius:8,padding:10}}>
                    <div style={{fontWeight:800,fontSize:14}}>{v.cargo}</div>
                    <div style={{fontSize:12,color:"#64748b"}}>{v.empresa} • {v.cidade}</div>
                    <a href={`https://wa.me/${v.zap.replace(/\D/g,"")}`} target="_blank" style={{display:"inline-block",marginTop:6,background:"#0A2342",color:"white",padding:"5px 8px",borderRadius:5,fontSize:11,textDecoration:"none"}}>Candidatar</a>
                  </div>
                ))}
              </div>
            )}
            <a href="/admin" style={{display:"block",marginTop:16,textAlign:"center",background:"#FF6B00",color:"white",padding:"8px",borderRadius:8,fontWeight:700,fontSize:13,textDecoration:"none"}}>+ Cadastrar Vaga</a>
          </div>
        </div>
      </main>
    </div>
  )
}
