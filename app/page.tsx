"use client";
import { useState, useEffect, useMemo } from 'react'

const CIDADES = ["Todas","Apucarana","Arapongas","Ivaiporã","Jandaia do Sul","Faxinal","Jardim Alegre"]
type Noticia = {id:string, cidade:string, cat:string, tempo:string, titulo:string, resumo:string, img:string, destaque?:boolean, chapeu?:string}

const NOTICIAS_UOL: Noticia[] = [
  {id:"1", cidade:"Apucarana", cat:"Política", chapeu:"CÂMARA DE APUCARANA", tempo:"há 12 min", titulo:"Câmara aprova novo plano de mobilidade e obras devem começar ainda em 2026", resumo:"Projeto prevê ciclovias, novo terminal urbano e integração com bairros da zona leste. Investimento é de R$ 18 milhões.", img:"https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800", destaque:true},
  {id:"2", cidade:"Arapongas", cat:"Cidade", chapeu:"FEIRA DO PRODUTOR", tempo:"há 34 min", titulo:"Feira do produtor movimenta centro e atrai mais de 5 mil famílias no fim de semana", resumo:"Evento teve 40 expositores e shows locais.", img:"https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800"},
  {id:"3", cidade:"Apucarana", cat:"Segurança", chapeu:"OPERAÇÃO NA BR-369", tempo:"há 1h", titulo:"Polícia recupera carga roubada avaliada em R$ 500 mil na BR-369", resumo:"Motorista foi rendido próximo a Jandaia. Carga de eletrônicos foi recuperada.", img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"},
  {id:"4", cidade:"Ivaiporã", cat:"Cultura", chapeu:"FESTIVAL", tempo:"há 2h", titulo:"Ivaiporã se prepara para festival cultural com artistas de todo Paraná", resumo:"Evento gratuito deve reunir 15 mil pessoas.", img:"https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800"},
  {id:"5", cidade:"Jandaia do Sul", cat:"Economia", chapeu:"NOVO INVESTIMENTO", tempo:"há 3h", titulo:"Jandaia do Sul anuncia novo distrito industrial e projeta 800 empregos diretos", resumo:"Prefeitura já iniciou terraplanagem.", img:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800"},
  {id:"6", cidade:"Faxinal", cat:"Cidade", chapeu:"SAÚDE", tempo:"há 4h", titulo:"Faxinal inaugura nova UBS e amplia atendimento para zona rural", resumo:"Unidade vai atender 3 mil famílias.", img:"https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800"},
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
    const admin = noticiasAdmin.map((n:any)=>({id:n.id,cidade:n.cidade,cat:n.cat,chapeu:(n.cat||"NOTÍCIA").toUpperCase(),tempo:"agora",titulo:n.titulo,resumo:n.resumo,img:n.img||"https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800"}));
    return [...admin,...NOTICIAS_UOL].filter(x=> cidade==="Todas" || x.cidade===cidade);
  },[cidade,noticiasAdmin]);

  const destaque = noticias[0];
  const lista = noticias.slice(1,7);

  return (
    <div style={{minHeight:"100vh",background:"white",fontFamily:"UOLText, Arial, sans-serif"}}>
      {/* BARRA PRETA UOL */}
      <div style={{background:"black",color:"white"}}>
        <div style={{maxWidth:1250,margin:"0 auto",padding:"10px 16px",display:"flex",alignItems:"center",gap:20}}>
          <div style={{fontWeight:900,fontSize:28,letterSpacing:-1}}>UOL<span style={{color:"#FF6B00"}}>•</span> <span style={{fontSize:18,fontWeight:800}}>REDE NORTE</span></div>
          <div style={{display:"flex",gap:16,fontSize:13,fontWeight:600,marginLeft:20}}>
            <span style={{color:"#FF6B00"}}>INGRESSO</span>
            <span>BATE-PAPO</span>
            <span>EMAIL</span>
            <span style={{background:"white",color:"black",padding:"2px 8px",borderRadius:4}}>ASSINE</span>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <a href="/admin" style={{background:"#FF6B00",color:"white",padding:"6px 12px",borderRadius:4,fontWeight:800,fontSize:12,textDecoration:"none"}}>ADMIN</a>
          </div>
        </div>
      </div>

      {/* MENU UOL - ABAS FUNCIONANDO */}
      <div style={{background:"#e6e6e6",borderBottom:"2px solid #FF6B00"}}>
        <div style={{maxWidth:1250,margin:"0 auto",padding:"0 16px",display:"flex",gap:24,overflowX:"auto"}}>
          {[
            {id:"home",label:"HOME"},
            {id:"noticias",label:"NOTÍCIAS"},
            {id:"ondeir",label:"ONDE IR"},
            {id:"empregos",label:"VAGAS"},
            {id:"esporte",label:"ESPORTE"},
            {id:"entrete",label:"ENTRETÊ"},
          ].map(t=>(
            <button key={t.id} onClick={()=>setAba(t.id)} style={{padding:"12px 0",fontWeight:aba===t.id?900:600,fontSize:14,border:0,borderBottom:aba===t.id?"4px solid #FF6B00":"4px solid transparent",background:"transparent",color:aba===t.id?"black":"#333",cursor:"pointer",whiteSpace:"nowrap",marginBottom:-2}}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* CIDADES */}
      <div style={{background:"#f5f5f5",borderBottom:"1px solid #e6e6e6",padding:"8px 16px"}}>
        <div style={{maxWidth:1250,margin:"0 auto",display:"flex",gap:8,overflowX:"auto"}}>
          {CIDADES.map(c=>(
            <button key={c} onClick={()=>setCidade(c)} style={{padding:"5px 12px",borderRadius:4,border:cidade===c?"1px solid black":"1px solid #ddd",background:cidade===c?"black":"white",color:cidade===c?"white":"#333",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{c}</button>
          ))}
        </div>
      </div>

      {/* CONTEÚDO ESTILO UOL */}
      <main style={{maxWidth:1250,margin:"0 auto",padding:"24px 16px",display:"grid",gridTemplateColumns:"1.8fr 1fr 300px",gap:24}}>
        {/* COLUNA PRINCIPAL - DESTAQUE UOL */}
        <div>
          {aba==="home" || aba==="noticias" ? (
            <>
              {destaque && (
                <div style={{borderBottom:"1px solid #e6e6e6",paddingBottom:20,marginBottom:20}}>
                  <div style={{fontSize:12,fontWeight:900,color:"#FF6B00",letterSpacing:1}}>{destaque.chapeu} • {destaque.cidade} • {destaque.tempo}</div>
                  <h1 style={{fontSize:36,fontWeight:900,lineHeight:1.1,letterSpacing:-0.5,marginTop:8,color:"#000"}}>{destaque.titulo}</h1>
                  <p style={{fontSize:16,color:"#333",marginTop:12,lineHeight:1.4}}>{destaque.resumo}</p>
                  <img src={destaque.img} alt="" style={{width:"100%",height:360,objectFit:"cover",marginTop:16,borderRadius:4}}/>
                </div>
              )}

              <div style={{display:"grid",gap:18}}>
                {lista.map(n=>(
                  <div key={n.id} style={{display:"flex",gap:14,borderBottom:"1px solid #f0f0f0",paddingBottom:16}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:900,color:"#FF6B00"}}>{n.chapeu}</div>
                      <div style={{fontSize:18,fontWeight:800,lineHeight:1.25,marginTop:4}}>{n.titulo}</div>
                      <div style={{fontSize:13,color:"#666",marginTop:6}}>{n.resumo}</div>
                      <div style={{fontSize:11,color:"#999",marginTop:6}}>{n.cidade} • {n.tempo}</div>
                    </div>
                    <img src={n.img} alt="" style={{width:140,height:90,objectFit:"cover",borderRadius:4}}/>
                  </div>
                ))}
              </div>
            </>
          ) : aba==="ondeir" ? (
            <div>
              <h2 style={{fontSize:24,fontWeight:900,borderLeft:"5px solid #FF6B00",paddingLeft:12}}>Onde Ir em {cidade}</h2>
              <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {locaisAdmin.filter((l:any)=> cidade==="Todas"||l.cidade===cidade).map((l:any)=>(
                  <div key={l.id} style={{border:"1px solid #e6e6e6",padding:12,borderRadius:4}}>
                    <div style={{fontWeight:900}}>{l.nome}</div>
                    <div style={{fontSize:12,color:"#FF6B00",fontWeight:700}}>{l.cat}</div>
                    <div style={{fontSize:12,color:"#666",marginTop:4}}>{l.end}</div>
                    <a href={`https://wa.me/${(l.zap||"").replace(/\D/g,"")}`} target="_blank" style={{display:"inline-block",marginTop:8,fontSize:12,fontWeight:700,color:"#25D366",textDecoration:"none"}}>WhatsApp →</a>
                  </div>
                ))}
                {locaisAdmin.filter((l:any)=> cidade==="Todas"||l.cidade===cidade).length===0 && <div style={{gridColumn:"1/-1",padding:20,background:"#f9f9f9",textAlign:"center",color:"#666"}}>Nenhum local em {cidade}. Cadastre em /admin → Onde Ir</div>}
              </div>
            </div>
          ) : aba==="empregos" ? (
            <div>
              <h2 style={{fontSize:24,fontWeight:900,borderLeft:"5px solid #FF6B00",paddingLeft:12}}>Vagas em {cidade}</h2>
              <div style={{marginTop:16,display:"grid",gap:12}}>
                {vagasAdmin.filter((v:any)=> cidade==="Todas"||v.cidade===cidade).map((v:any)=>(
                  <div key={v.id} style={{border:"1px solid #e6e6e6",padding:14,borderRadius:4,display:"flex",justifyContent:"space-between"}}>
                    <div><div style={{fontWeight:900}}>{v.cargo}</div><div style={{fontSize:13,color:"#666"}}>{v.empresa} • {v.cidade}</div></div>
                    <a href={`https://wa.me/${(v.zap||"").replace(/\D/g,"")}`} target="_blank" style={{background:"black",color:"white",padding:"8px 12px",borderRadius:4,fontSize:12,fontWeight:700,textDecoration:"none"}}>Candidatar</a>
                  </div>
                ))}
                {vagasAdmin.filter((v:any)=> cidade==="Todas"||v.cidade===cidade).length===0 && <div style={{padding:20,background:"#f9f9f9",textAlign:"center",color:"#666"}}>Sem vagas. Cadastre em /admin → Empregos</div>}
              </div>
            </div>
          ) : (
            <div style={{padding:40,textAlign:"center",border:"1px solid #e6e6e6"}}><h2 style={{fontWeight:900}}>{aba.toUpperCase()}</h2><p style={{color:"#666"}}>Em breve</p></div>
          )}
        </div>

        {/* COLUNA MEIO - MAIS NOTÍCIAS ESTILO UOL */}
        <div style={{borderLeft:"1px solid #e6e6e6",paddingLeft:20}}>
          <h3 style={{fontWeight:900,fontSize:14,letterSpacing:1,borderBottom:"2px solid black",paddingBottom:8}}>MAIS LIDAS EM {cidade.toUpperCase()}</h3>
          <div style={{marginTop:12,display:"grid",gap:14}}>
            {noticias.slice(0,6).map((n,i)=>(
              <div key={n.id} style={{display:"flex",gap:10,borderBottom:"1px solid #f0f0f0",paddingBottom:12}}>
                <div style={{fontWeight:900,fontSize:28,color:"#e6e6e6",lineHeight:1}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:800,color:"#FF6B00"}}>{n.cat}</div>
                  <div style={{fontSize:14,fontWeight:700,lineHeight:1.3,marginTop:2}}>{n.titulo}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{marginTop:24,background:"#f9f9f9",padding:12,border:"1px solid #e6e6e6"}}>
            <h4 style={{fontWeight:900,fontSize:13}}>PUBLICIDADE</h4>
            <div style={{marginTop:8,height:200,background:"#e6e6e6",display:"grid",placeItems:"center",color:"#999",fontSize:12}}>Anuncie aqui</div>
          </div>
        </div>

        {/* COLUNA DIREITA - UOL ESTILO */}
        <div>
          <div style={{background:"black",color:"white",padding:12,borderRadius:4}}>
            <h3 style={{fontWeight:900,fontSize:14}}>REDE NORTE TV</h3>
            <div style={{marginTop:8,height:160,background:"#333",display:"grid",placeItems:"center",fontSize:12}}>Vídeo ao vivo</div>
          </div>

          <div style={{marginTop:16,border:"1px solid #e6e6e6",borderRadius:4,padding:12}}>
            <h3 style={{fontWeight:900,fontSize:13,borderBottom:"2px solid #FF6B00",paddingBottom:6}}>ONDE IR - DESTAQUES</h3>
            <div style={{marginTop:10,display:"grid",gap:8}}>
              {locaisAdmin.slice(0,3).map((l:any)=>(
                <div key={l.id} style={{fontSize:13}}><b>{l.nome}</b><div style={{fontSize:11,color:"#666"}}>{l.cidade} • {l.cat}</div></div>
              ))}
              {locaisAdmin.length===0 && <div style={{fontSize:12,color:"#666"}}>Cadastre locais em /admin</div>}
            </div>
            <button onClick={()=>setAba("ondeir")} style={{marginTop:10,width:"100%",padding:"8px",background:"black",color:"white",border:0,borderRadius:4,fontWeight:700,fontSize:12}}>Ver todos</button>
          </div>

          <div style={{marginTop:16,border:"1px solid #e6e6e6",borderRadius:4,padding:12}}>
            <h3 style={{fontWeight:900,fontSize:13,borderBottom:"2px solid #FF6B00",paddingBottom:6}}>VAGAS ABERTAS</h3>
            <div style={{marginTop:10,display:"grid",gap:8}}>
              {vagasAdmin.slice(0,3).map((v:any)=>(
                <div key={v.id} style={{fontSize:13}}><b>{v.cargo}</b><div style={{fontSize:11,color:"#666"}}>{v.empresa} • {v.cidade}</div></div>
              ))}
              {vagasAdmin.length===0 && <div style={{fontSize:12,color:"#666"}}>Sem vagas hoje</div>}
            </div>
            <button onClick={()=>setAba("empregos")} style={{marginTop:10,width:"100%",padding:"8px",background:"#FF6B00",color:"white",border:0,borderRadius:4,fontWeight:700,fontSize:12}}>+ Cadastrar Vaga</button>
          </div>
        </div>
      </main>

      <footer style={{background:"#f5f5f5",borderTop:"1px solid #e6e6e6",marginTop:40,padding:"20px 16px",textAlign:"center",fontSize:12,color:"#666"}}>
        © 2026 REDE NORTE • Apucarana e Região • Portal de Notícias
      </footer>
    </div>
  )
}
