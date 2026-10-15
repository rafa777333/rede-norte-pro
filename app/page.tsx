"use client";
import { useState, useEffect, useMemo } from 'react'

const CIDADES = ["Todas","Apucarana","Arapongas","Ivaiporã","Jandaia do Sul","Faxinal","Jardim Alegre"]
type Noticia = {id:string, cidade:string, cat:string, tempo:string, titulo:string, resumo:string, img:string, texto?:string, chapeu?:string}

const NOTICIAS: Noticia[] = [
  {id:"1", cidade:"Apucarana", cat:"Política", chapeu:"POLÍTICA", tempo:"há 12 min", titulo:"Homem morre em confronto com a Choque da PM em Arapongas", resumo:"Um homem morreu em um confronto com policiais militares da Choque de Londrina no fim da tarde desta quinta-feira (15), no Jardim Casa Branca, em Arapongas. A ocorrência segue em andamento.", texto:"Um homem morreu em um confronto com policiais militares da Choque de Londrina no fim da tarde desta quinta-feira (15), no Jardim Casa Branca, em Arapongas. A ocorrência segue em andamento. LEIA MAIS: Mãe presa é suspeita de exploração sexual da filha em Apucarana. Conforme as primeiras informações, o homem teria resistido a uma abordagem policial. Há também a informação preliminar de que ele seria foragido da Justiça e teria passagens pela polícia. Esses dados dependem de confirmação oficial. A identidade do homem e os detalhes sobre a dinâmica do confronto não haviam sido informados até a publicação.", img:"https://images.unsplash.com/photo-1542395975-d6d3f2761a7d?w=1200"},
  {id:"2", cidade:"Arapongas", cat:"Cidade", chapeu:"CIDADE", tempo:"há 34 min", titulo:"Apucarana inaugura novo centro de distribuição para fortalecer comércio local", resumo:"Investimento de R$ 12 milhões promete gerar 300 empregos diretos na região do Vale do Ivaí.", texto:"A prefeitura de Apucarana inaugurou nesta manhã o novo centro de distribuição que promete fortalecer o comércio local e gerar empregos.", img:"https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200"},
  {id:"3", cidade:"Apucarana", cat:"Segurança", chapeu:"SEGURANÇA", tempo:"há 1h", titulo:"Polícia recupera carga roubada avaliada em R$ 500 mil na BR-369", resumo:"Motorista foi rendido próximo a Jandaia. Carga de eletrônicos foi recuperada.", texto:"Operação conjunta entre PM e PRF recuperou carga roubada.", img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200"},
  {id:"4", cidade:"Ivaiporã", cat:"Cultura", chapeu:"CULTURA", tempo:"há 2h", titulo:"Ivaiporã se prepara para festival cultural com artistas de todo Paraná", resumo:"Evento gratuito deve reunir 15 mil pessoas no Parque Jardim Botânico.", texto:"Festival cultural acontece neste fim de semana.", img:"https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200"},
]

export default function Page(){
  const [cidade,setCidade]=useState("Todas");
  const [aba,setAba]=useState("noticias");
  const [sel,setSel]=useState<Noticia|null>(null);
  const [noticiasAdmin,setNoticiasAdmin]=useState<any[]>([]);
  const [locaisAdmin,setLocaisAdmin]=useState<any[]>([]);
  const [vagasAdmin,setVagasAdmin]=useState<any[]>([]);

  useEffect(()=>{
    try{
      const n=localStorage.getItem("rn_noticias"); if(n) setNoticiasAdmin(JSON.parse(n));
      const l=localStorage.getItem("rn_locais"); if(l) setLocaisAdmin(JSON.parse(l));
      const v=localStorage.getItem("rn_vagas"); if(v) setVagasAdmin(JSON.parse(v));
    }catch{}
  },[]);

  const noticias = useMemo(()=>{
    const admin = noticiasAdmin.map((n:any)=>({id:n.id,cidade:n.cidade,cat:n.cat,chapeu:(n.cat||"NOTÍCIA").toUpperCase(),tempo:"agora",titulo:n.titulo,resumo:n.resumo,texto:n.resumo,img:n.img||"https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800"}));
    return [...admin,...NOTICIAS].filter(x=> cidade==="Todas" || x.cidade===cidade);
  },[cidade,noticiasAdmin]);

  return (
    <div style={{minHeight:"100vh",background:"white",fontFamily:"Arial, sans-serif"}}>
      {/* BARRA PRETA COM TEXTO GIGANTE TRANSPARENTE */}
      <div style={{background:"black",position:"relative",height:56,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {/* TEXTO GIGANTE COM TRANSPARÊNCIA */}
        <div style={{position:"absolute",fontSize:52,fontWeight:900,letterSpacing:8,color:"white",opacity:0.12,whiteSpace:"nowrap",userSelect:"none",top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}>REDE NORTE DO PARANÁ</div>
        {/* LOGO PEQUENO NA FRENTE */}
        <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,background:"white",color:"black",display:"grid",placeItems:"center",fontWeight:900,borderRadius:4}}>RN</div>
          <div style={{color:"white",fontWeight:900,letterSpacing:1}}>REDE NORTE DO PARANÁ</div>
          <a href="/admin" style={{marginLeft:20,background:"#FF6B00",color:"white",padding:"5px 10px",borderRadius:4,fontWeight:800,fontSize:11,textDecoration:"none"}}>ADMIN</a>
        </div>
      </div>

      {/* MENU COMO ERA ANTES */}
      <div style={{background:"#f5f5f5",borderBottom:"3px solid #FF6B00"}}>
        <div style={{maxWidth:1250,margin:"0 auto",padding:"0 16px",display:"flex",gap:0,overflowX:"auto"}}>
          {[
            {id:"noticias",label:"NOTÍCIAS"},
            {id:"ondeir",label:"ONDE IR"},
            {id:"empregos",label:"EMPREGOS"},
            {id:"compras",label:"COMPRAS E VENDAS"},
            {id:"promocoes",label:"PROMOÇÕES"},
          ].map(t=>(
            <button key={t.id} onClick={()=>setAba(t.id)} style={{padding:"12px 18px",fontWeight:900,fontSize:14,border:0,borderBottom:aba===t.id?"4px solid #FF6B00":"4px solid transparent",background:aba===t.id?"white":"transparent",color:aba===t.id?"black":"#333",cursor:"pointer",whiteSpace:"nowrap",marginBottom:-3}}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* CIDADES */}
      <div style={{background:"white",borderBottom:"1px solid #e6e6e6",padding:"8px 16px"}}>
        <div style={{maxWidth:1250,margin:"0 auto",display:"flex",gap:8,overflowX:"auto"}}>
          {CIDADES.map(c=>(
            <button key={c} onClick={()=>setCidade(c)} style={{padding:"5px 12px",borderRadius:4,border:cidade===c?"1px solid black":"1px solid #ddd",background:cidade===c?"black":"white",color:cidade===c?"white":"#333",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{c}</button>
          ))}
        </div>
      </div>

      {/* CONTEÚDO */}
      <main style={{maxWidth:1250,margin:"0 auto",padding:"20px 16px"}}>
        {aba==="noticias" ? (
          <div style={{display:"grid",gridTemplateColumns:"1.7fr 320px",gap:24}}>
            <div style={{display:"grid",gap:20}}>
              {noticias.map(n=>(
                <div key={n.id} style={{display:"flex",gap:16,borderBottom:"1px solid #eee",paddingBottom:18,cursor:"pointer"}} onClick={()=>setSel(n)}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:900,color:"#FF6B00"}}>{n.chapeu}</div>
                    <h2 style={{fontSize:22,fontWeight:900,lineHeight:1.2,marginTop:4,color:"#000"}}>{n.titulo}</h2>
                    <p style={{fontSize:14,color:"#444",marginTop:8,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{n.resumo}</p>
                    <div style={{fontSize:11,color:"#999",marginTop:8}}>{n.cidade} • {n.tempo}</div>
                  </div>
                  {/* IMAGEM CLICÁVEL */}
                  <img src={n.img} alt="" onClick={(e)=>{e.stopPropagation(); setSel(n);}} style={{width:220,height:140,objectFit:"cover",borderRadius:4,cursor:"pointer",flexShrink:0}}/>
                </div>
              ))}
            </div>

            <div>
              <div style={{background:"black",color:"white",padding:12,borderRadius:4}}>
                <h3 style={{fontWeight:900,fontSize:14}}>MAIS LIDAS</h3>
                <div style={{marginTop:10,display:"grid",gap:10}}>
                  {noticias.slice(0,5).map((n,i)=>(
                    <div key={n.id} style={{display:"flex",gap:8,cursor:"pointer"}} onClick={()=>setSel(n)}>
                      <span style={{fontWeight:900,fontSize:20,opacity:.3}}>{i+1}</span>
                      <span style={{fontSize:13,fontWeight:700,lineHeight:1.3}}>{n.titulo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : aba==="ondeir" ? (
          <div>
            <h2 style={{fontSize:24,fontWeight:900,borderLeft:"5px solid #FF6B00",paddingLeft:12}}>Onde Ir em {cidade}</h2>
            <div style={{marginTop:16,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
              {locaisAdmin.filter((l:any)=> cidade==="Todas"||l.cidade===cidade).map((l:any)=>(
                <div key={l.id} style={{border:"1px solid #e6e6e6",padding:12,borderRadius:4}}>
                  <div style={{fontWeight:900}}>{l.nome}</div>
                  <div style={{fontSize:12,color:"#FF6B00",fontWeight:700}}>{l.cat}</div>
                  <div style={{fontSize:12,color:"#666",marginTop:4}}>{l.end}</div>
                </div>
              ))}
              {locaisAdmin.filter((l:any)=> cidade==="Todas"||l.cidade===cidade).length===0 && <div style={{gridColumn:"1/-1",padding:20,background:"#f9f9f9",textAlign:"center"}}>Nenhum local. Cadastre em /admin</div>}
            </div>
          </div>
        ) : aba==="empregos" ? (
          <div>
            <h2 style={{fontSize:24,fontWeight:900,borderLeft:"5px solid #FF6B00",paddingLeft:12}}>Vagas em {cidade}</h2>
            <div style={{marginTop:16,display:"grid",gap:10}}>
              {vagasAdmin.filter((v:any)=> cidade==="Todas"||v.cidade===cidade).map((v:any)=>(
                <div key={v.id} style={{border:"1px solid #e6e6e6",padding:14,borderRadius:4,display:"flex",justifyContent:"space-between"}}>
                  <div><div style={{fontWeight:900}}>{v.cargo}</div><div style={{fontSize:13,color:"#666"}}>{v.empresa} • {v.cidade}</div></div>
                  <a href={`https://wa.me/${(v.zap||"").replace(/\D/g,"")}`} target="_blank" style={{background:"black",color:"white",padding:"8px 12px",borderRadius:4,fontSize:12,fontWeight:700,textDecoration:"none"}}>Candidatar</a>
                </div>
              ))}
            </div>
          </div>
        ) : aba==="compras" ? (
          <div style={{padding:40,textAlign:"center",border:"1px dashed #ddd"}}><h2 style={{fontWeight:900}}>COMPRAS E VENDAS</h2><p style={{color:"#666"}}>Classificados em breve</p></div>
        ) : (
          <div style={{padding:40,textAlign:"center",border:"1px dashed #ddd"}}><h2 style={{fontWeight:900}}>PROMOÇÕES</h2><p style={{color:"#666"}}>Ofertas em breve</p></div>
        )}
      </main>

      {/* MODAL MATÉRIA COM IMAGEM GRANDE AO CLICAR */}
      {sel && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:100,overflowY:"auto",padding:20}} onClick={()=>setSel(null)}>
          <div style={{maxWidth:800,margin:"20px auto",background:"white",borderRadius:8,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            <div style={{position:"relative"}}>
              <img src={sel.img} alt="" style={{width:"100%",height:"auto",maxHeight:500,objectFit:"cover"}}/>
              <button onClick={()=>setSel(null)} style={{position:"absolute",top:12,right:12,background:"black",color:"white",border:0,borderRadius:20,width:32,height:32,fontWeight:900,cursor:"pointer"}}>X</button>
            </div>
            <div style={{padding:24}}>
              <div style={{fontSize:12,fontWeight:900,color:"#FF6B00"}}>{sel.chapeu} • {sel.cidade} • {sel.tempo}</div>
              <h1 style={{fontSize:32,fontWeight:900,lineHeight:1.15,marginTop:8}}>{sel.titulo}</h1>
              <p style={{fontSize:17,color:"#333",marginTop:16,lineHeight:1.6}}>{sel.texto || sel.resumo}</p>
              <div style={{marginTop:24,padding:16,background:"#f5f5f5",borderRadius:8,fontSize:13,color:"#666"}}>
                Matéria completa. Ao clicar na imagem da home, abre com imagem grande assim.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
