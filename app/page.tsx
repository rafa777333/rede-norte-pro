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

  const noticiasFixas = [
    {id:"1", cidade:"Apucarana", cat:"Política", titulo:"Datafolha: Flávio tem 51% e Lula, 49% dos votos válidos, em empate técnico", sub:"Distância era de 4 pontos na semana passada", resumo:"Pesquisa Datafolha divulgada nesta quinta mostra cenário acirrado. José Roberto de Toledo analisa: Lula não ganha votos que saem de Flávio, mas pode ser beneficiado. Lula é rejeitado por 46%, e Flávio por 44%.", texto:"O Datafolha divulgou nesta quinta-feira (15) nova pesquisa mostrando Flávio Bolsonaro com 51% e Lula com 49% dos votos válidos, em empate técnico. A distância, que exclui brancos, nulos e indecisos, era de 4 pontos na semana passada.\n\nJosé Roberto de Toledo analisa que Lula não ganha votos que saem de Flávio, mas pode ser beneficiado pela rejeição. Segundo a pesquisa, Lula é rejeitado por 46% dos eleitores, e Flávio Bolsonaro por 44%.\n\nO governo Lula tem avaliação negativa de 41% e positiva de 35%, segundo o Datafolha. A pesquisa ouviu 2.000 eleitores em todo o país.", img:"https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200"},
    {id:"2", cidade:"Arapongas", cat:"Cidade", titulo:"Senado aprova maior limite de faturamento do MEI e perdão de dívidas", sub:"Metade do pacote de medidas foi aprovada", resumo:"Projeto amplia limite de faturamento para microempreendedores.", texto:"O Senado aprovou nesta quinta o aumento do limite de faturamento do MEI.", img:"https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800"},
    {id:"3", cidade:"Apucarana", cat:"Segurança", titulo:"Alcolumbre desiste de votar hoje a PEC da Segurança", sub:"Votação fica para próxima semana", resumo:"Presidente do Senado adiou votação após pedido de líderes.", texto:"O presidente do Senado, Davi Alcolumbre, desistiu de votar hoje a PEC da Segurança.", img:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800"},
    {id:"4", cidade:"Ivaiporã", cat:"Mídia", titulo:"Grupo Globo demite diretor-geral após vazamento de conversas com Vorcaro", sub:"Demissão foi comunicada nesta quinta", resumo:"Executivo foi desligado após áudios vazados.", texto:"O Grupo Globo demitiu o diretor-geral após vazamento de conversas.", img:"https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800"},
  ];

  const todas = noticiasAdmin.length>0 ? noticiasAdmin.map((n:any)=>({id:n.id,cidade:n.cidade,cat:n.cat,titulo:n.titulo,sub:n.resumo,resumo:n.resumo,texto:n.resumo,img:n.img||"https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800"})) : noticiasFixas;
  const filtradas = todas.filter((n:any)=> cidade==="Todas" || n.cidade===cidade);
  const destaque = filtradas[0];
  const menores = filtradas.slice(1,7);

  // SE CLICOU NA MATÉRIA - ABRE PÁGINA COM LETRAS MAIORES E NOTÍCIA NA ÍNTEGRA
  if(sel){
    return (
      <div style={{background:"white",minHeight:"100vh"}}>
        <div style={{background:"black",height:50,display:"flex",alignItems:"center",padding:"0 16px",color:"white",fontWeight:900}}>
          <button onClick={()=>setSel(null)} style={{background:"white",color:"black",border:"none",padding:"6px 12px",borderRadius:4,fontWeight:900,cursor:"pointer"}}>← Voltar</button>
          <span style={{marginLeft:16}}>REDE NORTE DO PARANÁ</span>
        </div>
        <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px"}}>
          <div style={{fontSize:12,fontWeight:900,color:"#c00"}}>{sel.cat?.toUpperCase()} • {sel.cidade}</div>
          <h1 style={{fontSize:36,fontWeight:900,lineHeight:1.1,marginTop:12,letterSpacing:-0.5}}>{sel.titulo}</h1>
          {sel.sub && <p style={{fontSize:18,color:"#444",marginTop:14,lineHeight:1.4}}>{sel.sub}</p>}
          <img src={sel.img} alt="" style={{width:"100%",height:420,objectFit:"cover",marginTop:20,borderRadius:6}}/>
          <div style={{marginTop:20,fontSize:19,lineHeight:1.7,color:"#222",whiteSpace:"pre-line"}}>
            {sel.texto || sel.resumo}
          </div>
          <div style={{marginTop:30,padding:16,background:"#f5f5f5",borderRadius:8,fontSize:14,color:"#666"}}>
            Matéria na íntegra. Letras maiores como você pediu.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{background:"white",minHeight:"100vh"}}>
      <div style={{background:"black",height:60,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",fontSize:42,fontWeight:900,color:"white",opacity:0.1,letterSpacing:8}}>REDE NORTE DO PARANÁ</div>
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

      <div style={{maxWidth:1250,margin:"0 auto",padding:20,display:"flex",gap:20,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 650px"}}>
          {aba==="noticias" && (
            <>
              {/* DESTAQUE MAIOR COM IMAGEM GRANDE */}
              {destaque && (
                <div style={{cursor:"pointer",border:"1px solid #ddd",borderRadius:8,overflow:"hidden"}} onClick={()=>setSel(destaque)}>
                  <img src={destaque.img} alt="" style={{width:"100%",height:380,objectFit:"cover"}}/>
                  <div style={{padding:16}}>
                    <div style={{fontSize:11,fontWeight:900,color:"#c00"}}>{destaque.cat?.toUpperCase()} • {destaque.cidade}</div>
                    <h1 style={{fontSize:26,fontWeight:900,lineHeight:1.15,marginTop:6}}>{destaque.titulo}</h1>
                    <p style={{fontSize:15,color:"#555",marginTop:8,lineHeight:1.4}}>{destaque.sub || destaque.resumo}</p>
                    <div style={{marginTop:10,fontSize:12,color:"#FF6B00",fontWeight:700}}>Clique para ler na íntegra →</div>
                  </div>
                </div>
              )}

              {/* QUADROS MENORES */}
              <div style={{marginTop:20}}>
                <h3 style={{fontWeight:900,fontSize:14,borderBottom:"2px solid black",paddingBottom:6}}>MAIS NOTÍCIAS</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginTop:12}}>
                  {menores.map((n:any)=>(
                    <div key={n.id} style={{border:"1px solid #e6e6e6",borderRadius:6,overflow:"hidden",cursor:"pointer"}} onClick={()=>setSel(n)}>
                      <img src={n.img} alt="" style={{width:"100%",height:110,objectFit:"cover"}}/>
                      <div style={{padding:10}}>
                        <div style={{fontSize:10,fontWeight:900,color:"#c00"}}>{n.cat?.toUpperCase()}</div>
                        <div style={{fontWeight:800,fontSize:13,lineHeight:1.25,marginTop:4}}>{n.titulo}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {menores.length===0 && (
                <div style={{marginTop:16,padding:20,background:"#f9f9f9",textAlign:"center",color:"#666"}}>
                  Nenhuma notícia em {cidade}. Cadastre no /admin → Notícias
                </div>
              )}
            </>
          )}

          {aba==="ondeir" && (
            <div>
              <h2 style={{fontWeight:900,fontSize:20,borderLeft:"4px solid #FF6B00",paddingLeft:10}}>Onde Ir em {cidade}</h2>
              <div style={{marginTop:12,display:"grid",gap:8}}>
                {locaisAdmin.filter((l:any)=> cidade==="Todas"||l.cidade===cidade).map((l:any)=>(
                  <div key={l.id} style={{border:"1px solid #ddd",padding:10,borderRadius:6}}><b>{l.nome}</b> - {l.cidade}</div>
                ))}
                {locaisAdmin.length===0 && <div style={{padding:20,background:"#f9f9f9",textAlign:"center"}}>Cadastre em /admin</div>}
              </div>
            </div>
          )}

          {aba==="empregos" && (
            <div>
              <h2 style={{fontWeight:900,fontSize:20,borderLeft:"4px solid #FF6B00",paddingLeft:10}}>Vagas em {cidade}</h2>
              <div style={{marginTop:12,display:"grid",gap:8}}>
                {vagasAdmin.filter((v:any)=> cidade==="Todas"||v.cidade===cidade).map((v:any)=>(
                  <div key={v.id} style={{border:"1px solid #ddd",padding:10,borderRadius:6,display:"flex",justifyContent:"space-between"}}>
                    <div><b>{v.cargo}</b><div style={{fontSize:12,color:"#666"}}>{v.empresa}</div></div>
                    <a href={`https://wa.me/${(v.zap||"").replace(/\D/g,"")}`} target="_blank" style={{background:"black",color:"white",padding:"6px 10px",borderRadius:4,fontSize:12,textDecoration:"none"}}>Chamar</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(aba==="compras" || aba==="promocoes") && <div style={{padding:30,textAlign:"center",border:"1px dashed #ccc"}}><b>{aba.toUpperCase()}</b><p>Em breve</p></div>}
        </div>

        <div style={{width:360,flexShrink:0}}>
          <div style={{background:"#c00",borderRadius:6,overflow:"hidden"}}>
            <div style={{color:"white",padding:"8px 12px",fontWeight:900,fontSize:13,display:"flex",justifyContent:"space-between"}}>
              <span>canal REDE NORTE</span><span style={{fontSize:11}}>● AO VIVO</span>
            </div>
            <iframe width="100%" height="200" src="https://www.youtube.com/embed/svDkmZ3KQ7s" title="Rede Apucarana" frameBorder="0" allowFullScreen></iframe>
            <div style={{background:"black",color:"white",padding:10,fontSize:12}}>
              <a href="https://www.youtube.com/@redeapucarana" target="_blank" style={{color:"white",textDecoration:"underline"}}>Assista @redeapucarana →</a>
            </div>
          </div>

          <div style={{marginTop:16,border:"1px solid #ddd",borderRadius:6,padding:12}}>
            <div style={{fontWeight:900,color:"#c00"}}>⚡ FLASH</div>
            <div style={{marginTop:8,fontWeight:900,fontSize:18}}>QUANDO COMEÇA A VALER A ESCALA 5X2?</div>
          </div>
        </div>
      </div>
    </div>
  )
}
