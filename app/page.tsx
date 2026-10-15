"use client";
import { useState, useEffect, useMemo } from 'react'

const CIDADES = ["Todas","Apucarana","Arapongas","Ivaiporã","Jandaia do Sul","Faxinal"]

type Noticia = {id:string, cidade:string, cat:string, tempo:string, titulo:string, subtitulo?:string, resumo:string, img:string, bullets?:string[], chapeu?:string}

const NOTICIAS_PRINCIPAL: Noticia[] = [
  {
    id:"1",
    cidade:"Apucarana",
    cat:"Política",
    tempo:"agora",
    titulo:"Datafolha: Flávio tem 51% e Lula, 49% dos votos válidos, em empate técnico",
    subtitulo:"Distância, que exclui brancos, nulos e indecisos, era de 4 pontos na semana passada",
    resumo:"Pesquisa mostra cenário acirrado no Norte do Paraná",
    img:"https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800",
    bullets:[
      "José Roberto de Toledo: Lula não ganha votos que saem de Flávio, mas pode ser beneficiado",
      "Lula é rejeitado por 46%, e Flávio Bolsonaro, por 44%, mostra pesquisa",
      "Governo Lula tem avaliação negativa de 41% e positiva de 35%, diz Datafolha",
      "Datafolha: 17% dos eleitores de Flávio dizem votar nele para derrotar Lula"
    ]
  },
]

const NOTICIAS_SEC = [
  {id:"2", cidade:"Apucarana", titulo:"Senado aprova maior limite de faturamento do MEI e perdão de dívidas", img:"https://images.unsplash.com/photo-1560869713-7d0a29430803?w=300", cat:"Economia"},
  {id:"3", cidade:"Arapongas", titulo:"Alcolumbre desiste de votar hoje a PEC da Segurança", img:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=300", cat:"Política"},
  {id:"4", cidade:"Apucarana", titulo:"Grupo Globo demite diretor-geral após vazamento de conversas com Vorcaro", img:"https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300", cat:"Mídia"},
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
    const admin = noticiasAdmin.map((n:any)=>({id:n.id,cidade:n.cidade,cat:n.cat,titulo:n.titulo,subtitulo:n.resumo,resumo:n.resumo,img:n.img||"https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",bullets:[n.resumo]}));
    return [...admin,...NOTICIAS_PRINCIPAL].filter(x=> cidade==="Todas" || x.cidade===cidade);
  },[cidade,noticiasAdmin]);

  const principal = noticias[0];

  return (
    <div style={{minHeight:"100vh",background:"white",fontFamily:"Arial, Helvetica, sans-serif"}}>
      {/* BARRA PRETA COM TEXTO TRANSPARENTE GIGANTE */}
      <div style={{background:"black",position:"relative",height:62,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{position:"absolute",fontSize:56,fontWeight:900,letterSpacing:10,color:"white",opacity:0.10,whiteSpace:"nowrap",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontFamily:"Arial Black"}}>REDE NORTE DO PARANÁ</div>
        <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,background:"white",color:"black",display:"grid",placeItems:"center",fontWeight:900,borderRadius:4,fontSize:14}}>RN</div>
          <div style={{color:"white",fontWeight:900,fontSize:15,letterSpacing:1}}>REDE NORTE DO PARANÁ</div>
          <a href="/admin" style={{marginLeft:16,background:"#FF6B00",color:"white",padding:"5px 10px",borderRadius:4,fontWeight:800,fontSize:11,textDecoration:"none"}}>ADMIN</a>
        </div>
      </div>

      {/* MENU */}
      <div style={{background:"#f2f2f2",borderBottom:"3px solid #FF6B00"}}>
        <div style={{maxWidth:1280,margin:"0 auto",padding:"0 16px",display:"flex",gap:0}}>
          {[
            {id:"noticias",label:"NOTÍCIAS"},
            {id:"ondeir",label:"ONDE IR"},
            {id:"empregos",label:"EMPREGOS"},
            {id:"compras",label:"COMPRAS E VENDAS"},
            {id:"promocoes",label:"PROMOÇÕES"},
          ].map(t=>(
            <button key={t.id} onClick={()=>setAba(t.id)} style={{padding:"12px 18px",fontWeight:900,fontSize:13,border:0,borderBottom:aba===t.id?"4px solid #FF6B00":"4px solid transparent",background:aba===t.id?"white":"transparent",color:aba===t.id?"black":"#333",cursor:"pointer",whiteSpace:"nowrap",marginBottom:-3,letterSpacing:0.3}}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* CIDADES */}
      <div style={{background:"white",borderBottom:"1px solid #e6e6e6",padding:"8px 16px"}}>
        <div style={{maxWidth:1280,margin:"0 auto",display:"flex",gap:8,overflowX:"auto"}}>
          {CIDADES.map(c=>(
            <button key={c} onClick={()=>setCidade(c)} style={{padding:"5px 12px",borderRadius:4,border:cidade===c?"1px solid black":"1px solid #ddd",background:cidade===c?"black":"white",color:cidade===c?"white":"#333",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{c}</button>
          ))}
        </div>
      </div>

      <main style={{maxWidth:1280,margin:"0 auto",padding:"20px 16px"}}>
        {aba==="noticias" ? (
          <div style={{display:"grid",gridTemplateColumns:"1.7fr 420px",gap:28}}>
            {/* ESQUERDA - ESTILO UOL PRIMEIRA IMAGEM */}
            <div>
              {principal && (
                <div style={{borderBottom:"1px solid #ddd",paddingBottom:20}}>
                  <h1 style={{fontSize:34,fontWeight:900,lineHeight:1.1,letterSpacing:-0.5,color:"#000"}}>{principal.titulo}</h1>
                  {principal.subtitulo && <p style={{fontSize:16,color:"#666",marginTop:10,lineHeight:1.35}}>{principal.subtitulo}</p>}
                  <div style={{marginTop:16,display:"grid",gap:8}}>
                    {principal.bullets?.map((b,i)=>(
                      <div key={i} style={{display:"flex",gap:8,fontSize:13,lineHeight:1.4}}>
                        <span style={{color:"#c00",fontWeight:900,flexShrink:0}}>■</span>
                        <span style={{color:"#333"}}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginTop:20}}>
                {NOTICIAS_SEC.map(n=>(
                  <div key={n.id} style={{cursor:"pointer"}} onClick={()=>setSel({id:n.id,cidade:n.cidade,cat:n.cat,tempo:"agora",titulo:n.titulo,resumo:n.titulo,img:n.img,subtitulo:"",bullets:[]})}>
                    <img src={n.img} alt="" style={{width:"100%",height:120,objectFit:"cover",borderRadius:4}}/>
                    <div style={{fontWeight:800,fontSize:14,lineHeight:1.25,marginTop:8}}>{n.titulo}</div>
                  </div>
                ))}
              </div>

              <div style={{marginTop:24,display:"grid",gap:16}}>
                {noticias.slice(1).map(n=>(
                  <div key={n.id} style={{display:"flex",gap:14,borderBottom:"1px solid #f0f0f0",paddingBottom:14,cursor:"pointer"}} onClick={()=>setSel(n)}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:900,color:"#c00"}}>{n.cat?.toUpperCase()}</div>
                      <div style={{fontSize:18,fontWeight:800,lineHeight:1.25,marginTop:4}}>{n.titulo}</div>
                    </div>
                    <img src={n.img} alt="" style={{width:160,height:100,objectFit:"cover",borderRadius:4}}/>
                  </div>
                ))}
              </div>
            </div>

            {/* DIREITA - VIDEO AO VIVO + FLASH */}
            <div>
              {/* CANAL AO VIVO - YOUTUBE @redeapucarana */}
              <div style={{background:"#c00",color:"white",borderRadius:6,overflow:"hidden"}}>
                <div style={{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",fontWeight:900,fontSize:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span>canal</span><span style={{background:"white",color:"#c00",padding:"2px 6px",borderRadius:4,fontSize:12}}>REDE NORTE</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}><div style={{width:8,height:8,background:"white",borderRadius:10,animation:"pulse 1s infinite"}}></div> AO VIVO</div>
                </div>
                <div style={{background:"black",position:"relative",paddingTop:"56.25%"}}>
                  <iframe style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:0}} src="https://www.youtube.com/embed/svDkmZ3KQ7s?rel=0" title="Rede Apucarana" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                </div>
                <div style={{background:"black",padding:"10px 12px",fontSize:12,lineHeight:1.3}}>
                  <div style={{background:"#ff0",color:"black",display:"inline-block",padding:"2px 6px",fontSize:10,fontWeight:900,borderRadius:3,marginRight:6}}>RedeCast</div>
                  BETO RICHA ABRE O JOGO | Ex-Governador do Paraná no RedeCast
                  <div style={{marginTop:8}}><a href="https://www.youtube.com/@redeapucarana" target="_blank" style={{color:"white",fontWeight:700,textDecoration:"underline",fontSize:11}}>Assista no canal @redeapucarana →</a></div>
                </div>
              </div>

              {/* FLASH */}
              <div style={{marginTop:20}}>
                <div style={{display:"flex",alignItems:"center",gap:6,color:"#c00",fontWeight:900,fontSize:18,marginBottom:10}}>
                  <div style={{background:"#c00",color:"white",padding:"2px 6px",borderRadius:4,fontSize:14}}>⚡</div> FLASH
                </div>
                <div style={{border:"1px solid #e6e6e6",borderRadius:8,overflow:"hidden",cursor:"pointer"}}>
                  <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600" alt="" style={{width:"100%",height:200,objectFit:"cover"}}/>
                  <div style={{padding:14,background:"white"}}>
                    <div style={{fontSize:22,fontWeight:900,lineHeight:1.15}}>QUANDO COMEÇA A VALER A ESCALA 5X2?</div>
                    <div style={{fontSize:13,color:"#666",marginTop:6}}>Entenda os prazos da proposta</div>
                  </div>
                </div>
              </div>

              <div style={{marginTop:20,border:"1px solid #e6e6e6",borderRadius:6,padding:12}}>
                <h3 style={{fontWeight:900,fontSize:13,borderBottom:"2px solid #c00",paddingBottom:6}}>VAGAS EM {cidade.toUpperCase()}</h3>
                <div style={{marginTop:10,display:"grid",gap:8}}>
                  {vagasAdmin.slice(0,3).map((v:any)=>(
                    <div key={v.id} style={{fontSize:13}}><b>{v.cargo}</b><div style={{fontSize:11,color:"#666"}}>{v.empresa} • {v.cidade}</div></div>
                  ))}
                  {vagasAdmin.length===0 && <div style={{fontSize:12,color:"#666"}}>Sem vagas hoje. Cadastre em /admin</div>}
                </div>
              </div>
            </div>
          </div>
        ) : aba==="ondeir" ? (
          <div>
            <h2 style={{fontSize:24,fontWeight:900,borderLeft:"5px solid #c00",paddingLeft:12}}>Onde Ir em {cidade}</h2>
            <div style={{marginTop:16,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
              {locaisAdmin.filter((l:any)=> cidade==="Todas"||l.cidade===cidade).map((l:any)=>(
                <div key={l.id} style={{border:"1px solid #e6e6e6",padding:12,borderRadius:4}}>
                  <div style={{fontWeight:900}}>{l.nome}</div>
                  <div style={{fontSize:12,color:"#c00",fontWeight:700}}>{l.cat}</div>
                  <div style={{fontSize:12,color:"#666",marginTop:4}}>{l.end}</div>
                </div>
              ))}
              {locaisAdmin.filter((l:any)=> cidade==="Todas"||l.cidade===cidade).length===0 && <div style={{gridColumn:"1/-1",padding:20,background:"#f9f9f9",textAlign:"center"}}>Nenhum local. Cadastre em /admin</div>}
            </div>
          </div>
        ) : aba==="empregos" ? (
          <div>
            <h2 style={{fontSize:24,fontWeight:900,borderLeft:"5px solid #c00",paddingLeft:12}}>Vagas em {cidade}</h2>
            <div style={{marginTop:16,display:"grid",gap:10}}>
              {vagasAdmin.filter((v:any)=> cidade==="Todas"||v.cidade===cidade).map((v:any)=>(
                <div key={v.id} style={{border:"1px solid #e6e6e6",padding:14,borderRadius:4,display:"flex",justifyContent:"space-between"}}>
                  <div><div style={{fontWeight:900}}>{v.cargo}</div><div style={{fontSize:13,color:"#666"}}>{v.empresa} • {v.cidade}</div></div>
                  <a href={`https://wa.me/${(v.zap||"").replace(/\D/g,"")}`} target="_blank" style={{background:"black",color:"white",padding:"8px 12px",borderRadius:4,fontSize:12,fontWeight:700,textDecoration:"none"}}>Candidatar</a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{padding:40,textAlign:"center",border:"1px dashed #ddd"}}><h2 style={{fontWeight:900}}>{aba.toUpperCase()}</h2></div>
        )}
      </main>

      {sel && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:100,overflowY:"auto",padding:20}} onClick={()=>setSel(null)}>
          <div style={{maxWidth:800,margin:"20px auto",background:"white",borderRadius:8,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            <img src={sel.img} alt="" style={{width:"100%",maxHeight:500,objectFit:"cover"}}/>
            <div style={{padding:24}}>
              <div style={{fontSize:12,fontWeight:900,color:"#c00"}}>{sel.chapeu} • {sel.cidade}</div>
              <h1 style={{fontSize:30,fontWeight:900,marginTop:8,lineHeight:1.15}}>{sel.titulo}</h1>
              <p style={{marginTop:16,lineHeight:1.6,color:"#333"}}>{sel.subtitulo || sel.resumo}</p>
              <button onClick={()=>setSel(null)} style={{marginTop:20,padding:"10px 16px",background:"black",color:"white",border:0,borderRadius:4,fontWeight:700}}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
