"use client";
import { useState, useEffect, useMemo } from 'react'

const CIDADES = ["Todas","Apucarana","Arapongas","Ivaiporã","Jandaia do Sul","Faxinal","Jardim Alegre"]
type Noticia = {id:string, cidade:string, cat:string, tempo:string, titulo:string, resumo:string, img:string, destaque?:boolean}

const NOTICIAS_FIXAS: Noticia[] = [
  {id:"1", cidade:"Apucarana", cat:"Política", tempo:"há 12 min", titulo:"Câmara aprova novo plano de mobilidade e obras devem começar em 2026", resumo:"Projeto prevê ciclovias, novo terminal urbano e integração com bairros.", img:"https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800", destaque:true},
  {id:"2", cidade:"Arapongas", cat:"Cidade", tempo:"há 34 min", titulo:"Feira do produtor movimenta centro e atrai famílias", resumo:"Mais de 40 expositores e shows locais.", img:"https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800"},
  {id:"3", cidade:"Apucarana", cat:"Segurança", tempo:"há 1h", titulo:"Polícia recupera carga roubada na BR-369", resumo:"Operação conjunta com PRF resultou em prisão.", img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"},
  {id:"4", cidade:"Ivaiporã", cat:"Eventos", tempo:"há 2h", titulo:"Festival cultural reúne 15 mil pessoas no Parque Botânico", resumo:"Evento gratuito com artistas de todo Paraná.", img:"https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800"},
]

export default function Page(){
  const [cidade,setCidade]=useState("Todas");
  const [aba,setAba]=useState("home");
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
    const admin = noticiasAdmin.map((n:any)=>({id:n.id,cidade:n.cidade,cat:n.cat,tempo:"agora",titulo:n.titulo,resumo:n.resumo,img:n.img||"https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",destaque:false}));
    const todas = [...admin,...NOTICIAS_FIXAS];
    let f = todas.filter(x=> cidade==="Todas" || x.cidade===cidade);
    if(aba==="noticias") f = f.filter(x=> true);
    if(aba==="ondeir") f = [];
    if(aba==="empregos") f = [];
    return f;
  },[cidade,noticiasAdmin,aba]);

  const destaque = noticias.find(n=>n.destaque) || noticias[0];
  const secundarias = noticias.filter(n=>n.id!==destaque?.id).slice(0,6);

  return (
    <div style={{minHeight:"100vh",background:"#f8f6f1"}}>
      {/* TOPO AZUL */}
      <div style={{background:"#0A2342",color:"white",fontSize:12}}>
        <div style={{maxWidth:1240,margin:"0 auto",padding:"8px 16px",display:"flex",justifyContent:"space-between"}}>
          <span>REDE APUCARANA • Portal do Norte do Paraná • {new Date().toLocaleDateString("pt-BR")}</span>
          <span>📻 Rádio ao vivo</span>
        </div>
      </div>

      {/* HEADER BRANCO */}
      <header style={{background:"white",borderBottom:"1px solid #e5ddd1",position:"sticky",top:0,zIndex:30}}>
        <div style={{maxWidth:1240,margin:"0 auto",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:48,height:48,background:"#0A2342",color:"white",display:"grid",placeItems:"center",fontWeight:900,fontSize:18,borderRadius:10}}>RN</div>
            <div>
              <div style={{fontWeight:900,fontSize:22,letterSpacing:-0.5,color:"#0A2342",lineHeight:1}}>REDE NORTE</div>
              <div style={{fontSize:11,letterSpacing:1.5,color:"#FF6B00",fontWeight:700}}>APUCARANA E REGIÃO</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <a href="/admin" style={{background:"#0A2342",color:"white",padding:"8px 14px",borderRadius:8,fontWeight:700,fontSize:13,textDecoration:"none"}}>ADMIN</a>
            <a href="https://wa.me/5543999999999" style={{background:"#25D366",color:"white",padding:"8px 14px",borderRadius:8,fontWeight:700,fontSize:13,textDecoration:"none"}}>WhatsApp</a>
          </div>
        </div>

        {/* ABAS FUNCIONANDO - CLICÁVEIS */}
        <div style={{borderTop:"1px solid #f1e9dc",background:"white"}}>
          <div style={{maxWidth:1240,margin:"0 auto",padding:"0 16px",display:"flex",gap:2,overflowX:"auto"}}>
            {[
              {id:"home",label:"HOME"},
              {id:"noticias",label:"NOTÍCIAS"},
              {id:"ondeir",label:"ONDE IR"},
              {id:"empregos",label:"EMPREGOS"},
              {id:"compras",label:"COMPRAS & VENDAS"},
              {id:"promocoes",label:"PROMOÇÕES"},
            ].map(t=>(
              <button key={t.id} onClick={()=>setAba(t.id)} style={{padding:"12px 16px",fontWeight:900,fontSize:13,letterSpacing:0.3,border:0,borderBottom:aba===t.id?"3px solid #FF6B00":"3px solid transparent",background:aba===t.id?"#fff7ed":"transparent",color:aba===t.id?"#0A2342":"#334155",cursor:"pointer",whiteSpace:"nowrap"}}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* CIDADES */}
        <div style={{background:"#fdf2e9",borderTop:"1px solid #f1e9dc",padding:"8px 16px"}}>
          <div style={{maxWidth:1240,margin:"0 auto",display:"flex",gap:8,overflowX:"auto"}}>
            {CIDADES.map(c=>(
              <button key={c} onClick={()=>setCidade(c)} style={{padding:"6px 14px",borderRadius:20,border:cidade===c?"1px solid #0A2342":"1px solid #e5ddd1",background:cidade===c?"#0A2342":"white",color:cidade===c?"white":"#0A2342",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{c}</button>
            ))}
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main style={{maxWidth:1240,margin:"0 auto",padding:"20px 16px"}}>
        {aba==="home" || aba==="noticias" ? (
          <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:20}}>
            {/* DESTAQUE PRINCIPAL */}
            <div>
              {destaque && (
                <div style={{background:"white",border:"1px solid #e5ddd1",borderRadius:16,overflow:"hidden"}}>
                  <div style={{position:"relative"}}>
                    <img src={destaque.img} alt="" style={{width:"100%",height:360,objectFit:"cover"}}/>
                    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:20,background:"linear-gradient(transparent, rgba(0,0,0,.8))",color:"white"}}>
                      <div style={{background:"#FF6B00",display:"inline-block",padding:"4px 8px",borderRadius:6,fontSize:11,fontWeight:900}}>{destaque.cidade} • {destaque.cat} • {destaque.tempo}</div>
                      <h1 style={{fontSize:26,fontWeight:900,lineHeight:1.15,marginTop:10}}>{destaque.titulo}</h1>
                      <p style={{marginTop:8,fontSize:14,opacity:.9}}>{destaque.resumo}</p>
                    </div>
                  </div>
                </div>
              )}

              <div style={{marginTop:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {secundarias.map(n=>(
                  <div key={n.id} style={{background:"white",border:"1px solid #e5ddd1",borderRadius:12,overflow:"hidden",display:"flex"}}>
                    <img src={n.img} alt="" style={{width:110,height:90,objectFit:"cover"}}/>
                    <div style={{padding:10,flex:1}}>
                      <div style={{fontSize:10,color:"#FF6B00",fontWeight:800}}>{n.cidade} • {n.tempo}</div>
                      <div style={{fontWeight:800,fontSize:13,lineHeight:1.25,marginTop:4}}>{n.titulo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LATERAL */}
            <div style={{display:"grid",gap:16,alignContent:"start"}}>
              <div style={{background:"#0A2342",color:"white",borderRadius:12,padding:16}}>
                <h3 style={{fontWeight:900}}>Mais lidas em {cidade}</h3>
                <div style={{marginTop:12,display:"grid",gap:10}}>
                  {noticias.slice(0,4).map((n,i)=>(
                    <div key={n.id} style={{display:"flex",gap:10}}>
                      <div style={{fontWeight:900,fontSize:20,opacity:.4}}>{i+1}</div>
                      <div style={{fontSize:13,fontWeight:700,lineHeight:1.3}}>{n.titulo}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:"white",border:"1px solid #e5ddd1",borderRadius:12,padding:16}}>
                <h3 style={{fontWeight:900}}>Onde Ir - {cidade} {locaisAdmin.length>0 && <span style={{fontSize:11,color:"#FF6B00"}}>• {locaisAdmin.filter((l:any)=> cidade==="Todas"||l.cidade===cidade).length} locais</span>}</h3>
                <div style={{marginTop:12,display:"grid",gap:8}}>
                  {locaisAdmin.filter((l:any)=> cidade==="Todas"||l.cidade===cidade).length===0 ? (
                    <div style={{fontSize:13,color:"#64748b",background:"#f8f6f1",padding:12,borderRadius:8}}>Nenhum local em {cidade} ainda. Cadastre no /admin → Onde Ir</div>
                  ) : locaisAdmin.filter((l:any)=> cidade==="Todas"||l.cidade===cidade).slice(0,4).map((l:any)=>(
                    <div key={l.id} style={{border:"1px solid #e5ddd1",borderRadius:8,padding:10}}>
                      <div style={{fontWeight:800,fontSize:13}}>{l.nome}</div>
                      <div style={{fontSize:11,color:"#FF6B00"}}>{l.cat} • {l.cidade}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:4}}>{l.end}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:"white",border:"1px solid #e5ddd1",borderRadius:12,padding:16}}>
                <h3 style={{fontWeight:900}}>Vagas - {cidade}</h3>
                <div style={{marginTop:12,display:"grid",gap:8}}>
                  {vagasAdmin.filter((v:any)=> cidade==="Todas"||v.cidade===cidade).length===0 ? (
                    <div style={{fontSize:13,color:"#64748b",background:"#f8f6f1",padding:12,borderRadius:8}}>Sem vagas em {cidade}. Cadastre em /admin</div>
                  ) : vagasAdmin.filter((v:any)=> cidade==="Todas"||v.cidade===cidade).slice(0,3).map((v:any)=>(
                    <div key={v.id} style={{border:"1px solid #e5ddd1",borderRadius:8,padding:10}}>
                      <div style={{fontWeight:800,fontSize:13}}>{v.cargo}</div>
                      <div style={{fontSize:11,color:"#64748b"}}>{v.empresa} • {v.cidade}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : aba==="ondeir" ? (
          <div>
            <h2 style={{fontWeight:900,fontSize:22}}>Onde Ir em {cidade}</h2>
            <div style={{marginTop:16,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
              {locaisAdmin.filter((l:any)=> cidade==="Todas"||l.cidade===cidade).map((l:any)=>(
                <div key={l.id} style={{background:"white",border:"1px solid #e5ddd1",borderRadius:12,padding:14}}>
                  <div style={{fontWeight:900}}>{l.nome}</div>
                  <div style={{fontSize:12,color:"#FF6B00",fontWeight:700,marginTop:2}}>{l.cat} • {l.cidade}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:6}}>{l.end}</div>
                  <div style={{marginTop:10,display:"flex",gap:6}}>
                    <a href={`https://wa.me/${(l.zap||"").replace(/\D/g,"")}`} target="_blank" style={{background:"#25D366",color:"white",padding:"6px 10px",borderRadius:6,fontSize:12,fontWeight:700,textDecoration:"none"}}>WhatsApp</a>
                  </div>
                </div>
              ))}
              {locaisAdmin.filter((l:any)=> cidade==="Todas"||l.cidade===cidade).length===0 && <div style={{gridColumn:"1/-1",background:"white",border:"1px dashed #e5ddd1",borderRadius:12,padding:24,textAlign:"center",color:"#64748b"}}>Nenhum local cadastrado. Vá em /admin → Onde Ir</div>}
            </div>
          </div>
        ) : aba==="empregos" ? (
          <div>
            <h2 style={{fontWeight:900,fontSize:22}}>Vagas em {cidade}</h2>
            <div style={{marginTop:16,display:"grid",gap:10}}>
              {vagasAdmin.filter((v:any)=> cidade==="Todas"||v.cidade===cidade).map((v:any)=>(
                <div key={v.id} style={{background:"white",border:"1px solid #e5ddd1",borderRadius:12,padding:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontWeight:900}}>{v.cargo}</div><div style={{fontSize:13,color:"#64748b"}}>{v.empresa} • {v.cidade}</div></div>
                  <a href={`https://wa.me/${(v.zap||"").replace(/\D/g,"")}`} target="_blank" style={{background:"#0A2342",color:"white",padding:"8px 12px",borderRadius:8,fontSize:13,fontWeight:700,textDecoration:"none"}}>Candidatar</a>
                </div>
              ))}
              {vagasAdmin.filter((v:any)=> cidade==="Todas"||v.cidade===cidade).length===0 && <div style={{background:"white",border:"1px dashed #e5ddd1",borderRadius:12,padding:24,textAlign:"center",color:"#64748b"}}>Nenhuma vaga. Cadastre em /admin → Empregos</div>}
            </div>
          </div>
        ) : (
          <div style={{background:"white",border:"1px solid #e5ddd1",borderRadius:12,padding:40,textAlign:"center"}}>
            <h2 style={{fontWeight:900,fontSize:20}}>{aba.toUpperCase()}</h2>
            <p style={{color:"#64748b",marginTop:8}}>Conteúdo de {aba} em breve.</p>
          </div>
        )}
      </main>
    </div>
  )
}
