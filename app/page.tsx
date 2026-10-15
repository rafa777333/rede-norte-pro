"use client";
import { useState, useEffect } from "react";

export default function Page(){
  const [cidade,setCidade]=useState("Todas");
  const [aba,setAba]=useState("noticias");
  const [sel,setSel]=useState<any>(null);
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

  const cidades = ["Todas","Apucarana","Arapongas","Ivaiporã","Jandaia do Sul","Faxinal"];

  const fixa = {
    titulo:"Datafolha: Flávio tem 51% e Lula, 49% dos votos válidos, em empate técnico",
    sub:"Distância, que exclui brancos, nulos e indecisos, era de 4 pontos na semana passada",
    bullets:[
      "José Roberto de Toledo: Lula não ganha votos que saem de Flávio, mas pode ser beneficiado",
      "Lula é rejeitado por 46%, e Flávio Bolsonaro, por 44%, mostra pesquisa",
      "Governo Lula tem avaliação negativa de 41% e positiva de 35%, diz Datafolha",
      "Datafolha: 17% dos eleitores de Flávio dizem votar nele para derrotar Lula"
    ],
    img:"https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800"
  };

  const todasNoticias = noticiasAdmin.length>0 ? noticiasAdmin : [fixa];

  return (
    <div style={{background:"white",minHeight:"100vh"}}>
      <div style={{background:"black",height:60,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",fontSize:40,fontWeight:900,color:"white",opacity:0.1,letterSpacing:8}}>REDE NORTE DO PARANÁ</div>
        <div style={{position:"relative",color:"white",fontWeight:900,display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:32,height:32,background:"white",color:"black",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,borderRadius:4}}>RN</div>
          REDE NORTE DO PARANÁ
          <a href="/admin" style={{background:"#FF6B00",color:"white",padding:"4px 8px",borderRadius:4,fontSize:11,textDecoration:"none",marginLeft:12}}>ADMIN</a>
        </div>
      </div>

      <div style={{background:"#eee",borderBottom:"3px solid #FF6B00",display:"flex",gap:0,padding:"0 16px",overflowX:"auto"}}>
        {[
          ["noticias","NOTÍCIAS"],
          ["ondeir","ONDE IR"],
          ["empregos","EMPREGOS"],
          ["compras","COMPRAS E VENDAS"],
          ["promocoes","PROMOÇÕES"],
        ].map(([id,label])=>(
          <button key={id} onClick={()=>setAba(id)} style={{padding:"12px 16px",fontWeight:900,fontSize:13,border:"none",borderBottom:aba===id?"4px solid #FF6B00":"4px solid transparent",background:aba===id?"white":"transparent",cursor:"pointer",whiteSpace:"nowrap"}}>{label}</button>
        ))}
      </div>

      <div style={{padding:"8px 16px",display:"flex",gap:8,borderBottom:"1px solid #ddd",overflowX:"auto"}}>
        {cidades.map(c=>(
          <button key={c} onClick={()=>setCidade(c)} style={{padding:"5px 10px",borderRadius:4,border:cidade===c?"1px solid black":"1px solid #ccc",background:cidade===c?"black":"white",color:cidade===c?"white":"black",fontSize:12,fontWeight:700}}>{c}</button>
        ))}
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:20,display:"flex",gap:20,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 600px"}}>
          {aba==="noticias" && (
            <>
              <div style={{borderBottom:"1px solid #ddd",paddingBottom:16}}>
                <h1 style={{fontSize:28,fontWeight:900,lineHeight:1.1}}>{fixa.titulo}</h1>
                <p style={{color:"#666",marginTop:8}}>{fixa.sub}</p>
                <div style={{marginTop:12}}>
                  {fixa.bullets.map((b,i)=>(
                    <div key={i} style={{display:"flex",gap:6,marginTop:6,fontSize:13}}>
                      <span style={{color:"red",fontWeight:900}}>■</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
                {noticiasAdmin.length>0 && <div style={{marginTop:12,background:"#fff7ed",padding:8,borderRadius:6,fontSize:12}}>{noticiasAdmin.length} notícias cadastradas no admin aparecendo aqui</div>}
              </div>

              <div style={{marginTop:20,display:"flex",gap:12,flexWrap:"wrap"}}>
                {[
                  {t:"Senado aprova maior limite de faturamento do MEI",img:"https://images.unsplash.com/photo-1560869713-7d0a29430803?w=200"},
                  {t:"Alcolumbre desiste de votar hoje a PEC da Segurança",img:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=200"},
                  {t:"Grupo Globo demite diretor-geral após vazamento",img:"https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200"},
                ].map((n,i)=>(
                  <div key={i} style={{width:180,cursor:"pointer"}} onClick={()=>setSel({titulo:n.t,img:n.img,resumo:n.t})}>
                    <img src={n.img} alt="" style={{width:"100%",height:90,objectFit:"cover",borderRadius:4}}/>
                    <div style={{fontWeight:800,fontSize:13,marginTop:6,lineHeight:1.2}}>{n.t}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {aba==="ondeir" && (
            <div>
              <h2 style={{fontWeight:900,fontSize:20,borderLeft:"4px solid #FF6B00",paddingLeft:10}}>Onde Ir em {cidade}</h2>
              <div style={{marginTop:12,display:"grid",gap:8}}>
                {locaisAdmin.filter((l:any)=> cidade==="Todas"||l.cidade===cidade).map((l:any)=>(
                  <div key={l.id} style={{border:"1px solid #ddd",padding:10,borderRadius:6}}><b>{l.nome}</b> - {l.cidade} - {l.cat}</div>
                ))}
                {locaisAdmin.length===0 && <div style={{padding:20,background:"#f9f9f9",textAlign:"center"}}>Nenhum local. Cadastre em /admin → Onde Ir</div>}
              </div>
            </div>
          )}

          {aba==="empregos" && (
            <div>
              <h2 style={{fontWeight:900,fontSize:20,borderLeft:"4px solid #FF6B00",paddingLeft:10}}>Vagas em {cidade}</h2>
              <div style={{marginTop:12,display:"grid",gap:8}}>
                {vagasAdmin.filter((v:any)=> cidade==="Todas"||v.cidade===cidade).map((v:any)=>(
                  <div key={v.id} style={{border:"1px solid #ddd",padding:10,borderRadius:6,display:"flex",justifyContent:"space-between"}}>
                    <div><b>{v.cargo}</b><div style={{fontSize:12,color:"#666"}}>{v.empresa} • {v.cidade}</div></div>
                    <a href={`https://wa.me/${(v.zap||"").replace(/\D/g,"")}`} target="_blank" style={{background:"black",color:"white",padding:"6px 10px",borderRadius:4,fontSize:12,textDecoration:"none"}}>Chamar</a>
                  </div>
                ))}
                {vagasAdmin.length===0 && <div style={{padding:20,background:"#f9f9f9",textAlign:"center"}}>Sem vagas. Cadastre em /admin</div>}
              </div>
            </div>
          )}

          {aba==="compras" && <div style={{padding:30,textAlign:"center",border:"1px dashed #ccc"}}><b>COMPRAS E VENDAS</b><p>Em breve</p></div>}
          {aba==="promocoes" && <div style={{padding:30,textAlign:"center",border:"1px dashed #ccc"}}><b>PROMOÇÕES</b><p>Em breve</p></div>}
        </div>

        <div style={{width:340,flexShrink:0}}>
          <div style={{background:"#c00",borderRadius:6,overflow:"hidden"}}>
            <div style={{color:"white",padding:"8px 12px",fontWeight:900,fontSize:13,display:"flex",justifyContent:"space-between"}}>
              <span>canal REDE NORTE</span><span style={{fontSize:11}}>● AO VIVO</span>
            </div>
            <div style={{background:"black"}}>
              <iframe width="100%" height="190" src="https://www.youtube.com/embed/svDkmZ3KQ7s" title="Rede Apucarana" frameBorder="0" allowFullScreen></iframe>
            </div>
            <div style={{background:"black",color:"white",padding:10,fontSize:12}}>
              BETO RICHA ABRE O JOGO no RedeCast
              <div style={{marginTop:6}}><a href="https://www.youtube.com/@redeapucarana" target="_blank" style={{color:"white",textDecoration:"underline"}}>@redeapucarana →</a></div>
            </div>
          </div>

          <div style={{marginTop:16,border:"1px solid #ddd",borderRadius:6,padding:12}}>
            <div style={{fontWeight:900,color:"#c00"}}>⚡ FLASH</div>
            <div style={{marginTop:8,fontWeight:900,fontSize:18}}>QUANDO COMEÇA A VALER A ESCALA 5X2?</div>
            <div style={{fontSize:12,color:"#666",marginTop:4}}>Entenda os prazos da proposta</div>
          </div>
        </div>
      </div>

      {sel && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:99,padding:20,overflowY:"auto"}} onClick={()=>setSel(null)}>
          <div style={{maxWidth:700,margin:"20px auto",background:"white",borderRadius:8,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            <img src={sel.img} alt="" style={{width:"100%",maxHeight:400,objectFit:"cover"}}/>
            <div style={{padding:20}}>
              <h2 style={{fontWeight:900,fontSize:24}}>{sel.titulo}</h2>
              <p style={{marginTop:10,color:"#333"}}>{sel.resumo}</p>
              <button onClick={()=>setSel(null)} style={{marginTop:16,padding:"8px 14px",background:"black",color:"white",border:"none",borderRadius:4}}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
