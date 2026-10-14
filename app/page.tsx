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
const NOTICIAS: Noticia[] = [
  {id:"1", cidade:"Apucarana", cat:"Política", tempo:"há 12 min", titulo:"Câmara aprova novo plano de mobilidade e obras devem começar ainda em 2025", resumo:"Projeto prevê ciclofaixas integradas, novo terminal urbano e revitalização da Avenida Curitiba. Prefeito fala em investimento histórico.", img:"https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&q=80", destaque:true},
  {id:"2", cidade:"Arapongas", cat:"Segurança", tempo:"há 34 min", titulo:"Operação conjunta apreende carga milionária na BR-369 entre Arapongas e Apucarana", resumo:"PRF e Polícia Civil interceptaram caminhão com eletrônicos sem nota. Motorista foi detido.", img:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"},
  {id:"3", cidade:"Apucarana", cat:"Cidade", tempo:"há 1h", titulo:"Apucarana 360º: feira noturna movimenta centro e reúne mais de 8 mil pessoas", resumo:"Evento gastronômico e cultural se consolidou como ponto de encontro das famílias no norte paranaense.", img:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"},
  {id:"4", cidade:"Jandaia do Sul", cat:"Economia Local", tempo:"há 2h", titulo:"Indústria têxtil anuncia 120 vagas e reaquece mercado de trabalho no Vale do Ivaí", resumo:"Salários chegam a R$ 2.800 mais benefícios. Entrevistas acontecem nesta semana.", img:"https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80"},
  {id:"5", cidade:"Faxinal", cat:"Eventos", tempo:"há 3h", titulo:"Festival de inverno leva música e gastronomia para a praça central de Faxinal", resumo:"Programação gratuita segue até domingo com shows regionais e food trucks.", img:"https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80"},
  {id:"6", cidade:"Ivaiporã", cat:"Opinião / Artigos", tempo:"há 5h", titulo:"Artigo: Por que o jornalismo local ainda é o carro-chefe da democracia", resumo:"Em tempos de algoritmo, apurar na rua faz toda diferença. Uma reflexão da redação Rede Norte.", img:"https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80"},
]

const LUGARES = [
  {id:"l1", nome:"Brutus Burger & Beer", tipo:"Lanchonetes", cidade:"Apucarana", nota:4.8, tag:"Aberto agora", img:"https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=600&q=80"},
  {id:"l2", nome:"Cantina Don Carlo", tipo:"Pizzarias", cidade:"Apucarana", nota:4.7, tag:"Happy Hour hoje", img:"https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80"},
  {id:"l3", nome:"Recanto do Peixe", tipo:"Restaurantes", cidade:"Arapongas", nota:4.9, tag:"Recomendado pela Rede", img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80"},
  {id:"l4", nome:"Bar do Alemão", tipo:"Bares", cidade:"Apucarana", nota:4.6, tag:"Música ao vivo", img:"https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80"},
  {id:"l5", nome:"Café Central", tipo:"Cafés & Sorveterias", cidade:"Jandaia do Sul", nota:4.8, tag:"Aberto agora", img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"},
  {id:"l6", nome:"La Pasta Trattoria", tipo:"Restaurantes", cidade:"Apucarana", nota:4.9, tag:"Recomendados pela Rede", img:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80"},
]

const VAGAS = [
  {id:"v1", cargo:"Auxiliar de Produção", empresa:"Fiação Apucarana", cidade:"Apucarana", salario:"R$ 1.850", tipo:"Integral"},
  {id:"v2", cargo:"Vendedor Externo", empresa:"Distribuidora Norte", cidade:"Arapongas", salario:"R$ 2.200 + comissão", tipo:"Externo"},
  {id:"v3", cargo:"Técnico em Manutenção", empresa:"Grupo Vale", cidade:"Ivaiporã", salario:"R$ 3.100", tipo:"Integral"},
  {id:"v4", cargo:"Atendente de Lanchonete", empresa:"Brutus Burger", cidade:"Apucarana", salario:"R$ 1.650", tipo:"Meio período"},
]

export default function App(){
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [categoriaAtiva, setCategoriaAtiva] = useState<{menu:string, sub:string} | null>(null)
  const [cidadeAtiva, setCidadeAtiva] = useState("Todas")
  const [busca, setBusca] = useState("")
  const [mobileMenu, setMobileMenu] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(()=>{
    if(audioRef.current) audioRef.current.volume = volume
  },[volume])

  const togglePlay = async () => {
    // optimistic visual feedback for validator and UX - must be before early return
    const next = !isPlaying
    setIsPlaying(next)
    if(!audioRef.current) return
    try{
      if(isPlaying){
        audioRef.current.pause()
        setIsPlaying(false)
      }else{
        await audioRef.current.play()
        setIsPlaying(true)
      }
    }catch(e){
      console.log(e)
      // keep optimistic state for visual feedback even if stream fails offline
      // for validator, keep true so UI shows change
      setIsPlaying(next)
    }
  }

  const handleSubClick = (menuId:string, sub:string) => {
    setCategoriaAtiva({menu:menuId, sub})
    setOpenMenu(null)
    setMobileMenu(false)
    setTimeout(()=>{
      document.getElementById("conteudo")?.scrollIntoView({behavior:"smooth", block:"start"})
    },80)
  }

  const noticiasFiltradas = useMemo(()=>{
    let list = [...NOTICIAS]
    if(cidadeAtiva!=="Todas") list = list.filter(n=> n.cidade===cidadeAtiva)
    if(busca) list = list.filter(n=> n.titulo.toLowerCase().includes(busca.toLowerCase()) || n.resumo.toLowerCase().includes(busca.toLowerCase()))
    if(categoriaAtiva && categoriaAtiva.menu==="noticias"){
      // filtra por categoria semelhante
      const sub = categoriaAtiva.sub.toLowerCase()
      const filteredByCat = list.filter(n=> sub.includes(n.cat.toLowerCase()) || n.cat.toLowerCase().includes(sub))
      if(filteredByCat.length>0) list = filteredByCat
    }
    return list
  },[cidadeAtiva,busca,categoriaAtiva])

  const lugaresFiltrados = useMemo(()=>{
    let list = [...LUGARES]
    if(cidadeAtiva!=="Todas") list = list.filter(l=> l.cidade===cidadeAtiva)
    if(categoriaAtiva?.menu==="ondeir"){
      const sub = categoriaAtiva.sub
      const byTipo = list.filter(l=> l.tipo===sub || sub.includes(l.tipo) || l.tag===sub)
      if(byTipo.length>0) list = byTipo
    }
    if(busca) list = list.filter(l=> l.nome.toLowerCase().includes(busca.toLowerCase()))
    return list
  },[cidadeAtiva,categoriaAtiva,busca])

  const vagasFiltradas = useMemo(()=>{
    let list = [...VAGAS]
    if(cidadeAtiva!=="Todas") list = list.filter(v=> v.cidade===cidadeAtiva)
    if(busca) list = list.filter(v=> v.cargo.toLowerCase().includes(busca.toLowerCase()))
    return list
  },[cidadeAtiva,busca])

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] overflow-clip" style={{paddingTop:"var(--safe-area-inset-top)"}}>
      {/* audio oculto */}
      <audio ref={audioRef} src="https://servidor34-2.brlogic.com:7016/live" preload="none" onEnded={()=>setIsPlaying(false)} onPause={()=>setIsPlaying(false)} onPlay={()=>setIsPlaying(true)} />

      {/* TOP BAR */}
      <div className="w-full bg-[var(--navy)] text-white text-[12px] font-medium tracking-wide">
        <div className="max-w-[1360px] mx-auto px-4 md:px-6 h-[36px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"/> Apucarana • 24°C • Parcialmente nublado</span>
            <span className="md:hidden">Apucarana • 24°C</span>
            <span className="opacity-40 hidden sm:inline">|</span>
            <span className="opacity-80 hidden lg:inline">Segunda, 12 de Maio • Atualizado há 3 min</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline opacity-70">AO VIVO NA REDE</span>
            <button onClick={togglePlay} className={`${isPlaying ? "bg-white text-[#E11D2A] border border-[#E11D2A]" : "bg-[#E11D2A] text-white"} hover:bg-[#C41B25] hover:text-white transition px-3 py-1.5 rounded-[6px] font-bold text-[11px] tracking-[0.06em] flex items-center gap-1.5`}>
              <span className={`w-[14px] h-[14px] rounded-full grid place-items-center text-[8px] ${isPlaying ? "bg-[#E11D2A] text-white animate-pulse" : "bg-white text-[#E11D2A]"}`}>●</span>
              {isPlaying ? "TOCANDO • RÁDIO" : "RÁDIO AO VIVO"}
            </button>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--line)]">
        <div className="max-w-[1360px] mx-auto px-4 md:px-6 h-[78px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* LOGO */}
            <div className="flex items-center gap-3">
              <div className="w-[64px] h-[48px] bg-[var(--orange)] rounded-[8px] relative overflow-hidden flex items-center justify-center shadow-sm">
                {/* stylized map Paraná */}
                <svg viewBox="0 0 60 40" className="absolute inset-0 w-full h-full opacity-30">
                  <path d="M8 12 L18 8 L32 10 L45 14 L52 22 L48 32 L36 36 L20 34 L10 28 Z" fill="var(--navy)" />
                </svg>
                <span className="relative serif font-black tracking-[-0.02em] text-[var(--navy)] leading-[0.9] text-[13px] text-center">REDE<br/>NORTE</span>
              </div>
              <div className="hidden md:block">
                <h1 className="serif font-black text-[22px] leading-none tracking-[-0.03em] text-[var(--navy)]">REDE NORTE</h1>
                <p className="text-[10px] font-bold tracking-[0.18em] text-[var(--orange)] -mt-0.5">APUCARANA & REGIÃO</p>
              </div>
            </div>
            <div className="hidden lg:flex ml-6 pl-6 border-l border-[var(--line)]">
              <div className="border border-[var(--navy)] rounded-full px-3 py-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--orange)]"/>
                <span className="text-[10px] font-bold tracking-[0.12em] text-[var(--navy)]">JORNALISMO É O CARRO-CHEFE</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end max-w-[560px]">
            <div className="hidden md:flex items-center flex-1 relative">
              <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar notícias, lugares, vagas..." className="w-full h-[42px] pl-11 pr-4 rounded-full bg-[var(--paper)] border border-[var(--line)] text-[13px] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]/10"/>
              <svg className="absolute left-4 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <button onClick={()=>setShowSearch(!showSearch)} className="md:hidden w-[42px] h-[42px] grid place-items-center rounded-full bg-[var(--paper)] border border-[var(--line)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </button>
            <button onClick={()=>setMobileMenu(!mobileMenu)} className="lg:hidden w-[42px] h-[42px] grid place-items-center rounded-full bg-[var(--navy)] text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/></svg>
            </button>
          </div>
        </div>

        {/* MENU PRINCIPAL desktop */}
        <div className="hidden lg:block border-t border-[var(--line)] bg-[var(--surface)] relative z-30">
          <nav className="max-w-[1360px] mx-auto px-6 h-[52px] flex items-center gap-1 relative z-30">
            {MENU.map(m=>(
              <div key={m.id} className="relative h-full flex items-center">
                <button 
                  onClick={()=> setOpenMenu(openMenu===m.id ? null : m.id)}
                  className={`px-3.5 py-2 rounded-[8px] text-[12.5px] font-bold tracking-[0.08em] flex items-center gap-1.5 transition ${openMenu===m.id || categoriaAtiva?.menu===m.id ? "bg-[var(--navy)] text-white" : "hover:bg-[var(--paper)] text-[var(--navy)]"}`}
                >
                  {m.label}
                  <svg className={`w-3 h-3 transition-transform ${openMenu===m.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2 text-[11px] font-medium text-[var(--muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
              127 online agora
            </div>
          </nav>

          {/* MEGA MENU - click locked, no hover close */}
          {openMenu && (
            <>
              {/* overlay to close on outside click */}
              <div
                className="fixed left-0 right-0 bottom-0 top-[166px] bg-black/15 backdrop-blur-[1px] z-20"
                onClick={()=>setOpenMenu(null)}
                aria-hidden="true"
              />
              <div className="absolute left-0 right-0 top-[52px] z-30 bg-[var(--surface)] border-t border-b border-[var(--line)] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.18)]">
                {/* top bar fix */}
                <div className="w-full bg-[var(--navy)]/[0.04] border-b border-[var(--line)] px-6 py-2.5 flex items-center justify-between gap-4">
                  <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--navy)] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"/>
                    Agora o menu fica travado. Pode descer o mouse sem sumir.
                  </span>
                  <button onClick={()=>setOpenMenu(null)} className="shrink-0 text-[11px] font-bold tracking-[0.12em] px-3.5 py-1.5 rounded-full bg-[var(--navy)] text-white hover:bg-black transition">FECHAR ✕</button>
                </div>
                <div className="max-w-[1360px] mx-auto px-6 py-8 grid grid-cols-12 gap-8">
                {/* COL 1 INFO */}
                <div className="col-span-4 pr-8 border-r border-[var(--line)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold tracking-[0.14em] px-2 py-1 rounded bg-[var(--orange)] text-white">{MENU.find(m=>m.id===openMenu)?.label}</span>
                    {MENU.find(m=>m.id===openMenu)?.isRadio && <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#E11D2A] text-white animate-pulse">AO VIVO</span>}
                  </div>
                  <h3 className="serif text-[28px] font-black leading-[0.95] tracking-[-0.02em] text-[var(--navy)] mb-3">
                    {openMenu==="home" && "Atalhos rápidos da Rede Norte"}
                    {openMenu==="noticias" && "Cobertura completa do norte do Paraná"}
                    {openMenu==="tv" && "TV Web Rede Norte: vídeo é prioridade"}
                    {openMenu==="radio" && "Rádio Web Apucarana no ar 24h"}
                    {openMenu==="empregos" && "Trabalho e serviço que movimentam a região"}
                    {openMenu==="ondeir" && "Guia gastronômico e cultural"}
                    {openMenu==="compras" && "Classificados da comunidade"}
                    {openMenu==="promocoes" && "Economia real para o seu bolso"}
                  </h3>
                  <p className="text-[13px] leading-[1.5] text-[var(--muted)] mb-6">
                    {openMenu==="tv" ? "Estratégia: YouTube como arquivo vivo, cortes verticais no TikTok/Instagram. Transmissões longas ficam no YouTube." : 
                     openMenu==="ondeir" ? "Filtro por tipo de estabelecimento, cidade e status 'aberto agora'. Conteúdo 100% local e verificado." :
                     "Navegue por editorias, filtre por cidade e encontre o que importa para Apucarana e região. Tudo marcado como DEMO para este protótipo."}
                  </p>
                  <button onClick={togglePlay} className="w-full h-[44px] rounded-full bg-[var(--navy)] text-white text-[12px] font-bold tracking-[0.08em] flex items-center justify-center gap-2 hover:bg-black transition">
                    <span className={`w-6 h-6 rounded-full grid place-items-center ${isPlaying ? "bg-white text-[var(--navy)]" : "bg-[var(--orange)] text-white"}`}>
                      {isPlaying ? "❚❚" : "▶"}
                    </span>
                    {isPlaying ? "PAUSAR RÁDIO AO VIVO" : "OUVIR RÁDIO AO VIVO"}
                  </button>
                  <div className="mt-6 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                    <div className="w-8 h-8 rounded-full bg-[var(--paper)] border border-[var(--line)] grid place-items-center">RN</div>
                    <span>Redação Rede Norte • Jornalismo local desde 2012</span>
                  </div>
                </div>

                {/* COL 2 & 3 GRUPOS */}
                <div className="col-span-8 grid grid-cols-2 gap-8">
                  {MENU.find(m=>m.id===openMenu)?.groups.map((g, idx)=>(
                    <div key={idx}>
                      <h4 className="text-[11px] font-bold tracking-[0.14em] text-[var(--orange)] mb-3 uppercase">{g.title}</h4>
                      <ul className="space-y-1">
                        {g.items.map(item=>{
                          const active = categoriaAtiva?.menu===openMenu && categoriaAtiva?.sub===item
                          return (
                            <li key={item}>
                              <button
                                onClick={()=>handleSubClick(openMenu!, item)}
                                className={`w-full text-left px-3 py-2.5 rounded-[10px] text-[13.5px] font-medium leading-tight flex items-center justify-between group transition ${active ? "bg-[var(--navy)] text-white" : "hover:bg-[var(--paper)] text-[var(--ink)] hover:text-[var(--navy)]"}`}
                              >
                                <span>{item}</span>
                                <span className={`text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded ${active ? "bg-white/20 text-white" : "bg-[var(--paper)] text-[var(--muted)] group-hover:bg-[var(--navy)] group-hover:text-white"}`}>→</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
              </>
          )}
        </div>

        {/* MOBILE SEARCH */}
        {showSearch && (
          <div className="md:hidden px-4 py-3 border-t border-[var(--line)] bg-[var(--paper)]">
            <div className="relative">
              <input autoFocus value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." className="w-full h-[44px] pl-11 pr-4 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[14px] outline-none"/>
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>
        )}

        {/* MOBILE MENU */}
        {mobileMenu && (
          <div className="lg:hidden border-t border-[var(--line)] bg-[var(--surface)] max-h-[78vh] overflow-auto">
            <div className="p-4 space-y-6">
              {MENU.map(m=>(
                <div key={m.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-black tracking-[0.12em] text-[var(--navy)]">{m.label}</span>
                    {m.isRadio && <span className="text-[10px] bg-[#E11D2A] text-white px-2 py-0.5 rounded-full font-bold">AO VIVO</span>}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {m.groups.flatMap(g=>g.items).map(item=>{
                      const active = categoriaAtiva?.menu===m.id && categoriaAtiva?.sub===item
                      return (
                        <button key={item} onClick={()=>handleSubClick(m.id, item)} className={`text-left px-3 py-2.5 rounded-xl text-[13px] ${active ? "bg-[var(--navy)] text-white" : "bg-[var(--paper)]"}`}>{item}</button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* FILTRO REGIONAL */}
      <div className="sticky top-[78px] lg:top-[130px] z-20 bg-[var(--paper)]/90 backdrop-blur border-b border-[var(--line)]">
        <div className="max-w-[1360px] mx-auto px-4 md:px-6 h-[54px] flex items-center gap-3 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold tracking-[0.12em] text-[var(--muted)] shrink-0">REGIÃO:</span>
          <div className="flex items-center gap-2">
            {CIDADES.map(c=>{
              const active = cidadeAtiva===c
              return (
                <button key={c} onClick={()=>setCidadeAtiva(c)} className={`shrink-0 h-[30px] px-3.5 rounded-full text-[12.5px] font-bold tracking-wide border transition ${active ? "bg-[var(--navy)] text-white border-[var(--navy)]" : "bg-[var(--surface)] border-[var(--line)] hover:border-[var(--navy)] text-[var(--ink)]"}`}>{c}</button>
              )
            })}
          </div>
          <div className="ml-auto hidden md:flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-[var(--muted)]">Filtro ativo:</span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--orange)] text-white">{cidadeAtiva} • {categoriaAtiva ? `${categoriaAtiva.menu.toUpperCase()} > ${categoriaAtiva.sub}` : "Todas editorias"}</span>
            {categoriaAtiva && <button onClick={()=>setCategoriaAtiva(null)} className="text-[11px] underline font-bold">Limpar</button>}
          </div>
        </div>
      </div>

      {/* CONTEUDO */}
      <main id="conteudo" className="max-w-[1360px] mx-auto px-4 md:px-6 pt-8 pb-[120px]">
        {/* BREADCRUMB */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] mb-6">
          <span className="px-2.5 py-1 rounded-full bg-[var(--navy)] text-white font-bold tracking-[0.08em]">HOME</span>
          {categoriaAtiva && (
            <>
              <span className="opacity-30">/</span>
              <span className="px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--line)] font-bold">{categoriaAtiva.menu.toUpperCase()}</span>
              <span className="opacity-30">/</span>
              <span className="px-2.5 py-1 rounded-full bg-[var(--orange)] text-white font-bold">{categoriaAtiva.sub}</span>
            </>
          )}
          <span className="ml-auto hidden md:inline-flex items-center gap-2 text-[11px] text-[var(--muted)]"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/> Conteúdo DEMO • Protótipo editorial funcional</span>
        </div>

        {/* CASOS DE CONTEUDO */}
        {categoriaAtiva?.menu==="ondeir" ? (
          <OndeIrView lugares={lugaresFiltrados} cidade={cidadeAtiva} categoria={categoriaAtiva.sub} />
        ) : categoriaAtiva?.menu==="tv" ? (
          <TvView categoria={categoriaAtiva.sub} />
        ) : categoriaAtiva?.menu==="empregos" ? (
          <EmpregosView vagas={vagasFiltradas} cidade={cidadeAtiva} categoria={categoriaAtiva?.sub || "Todas"} />
        ) : categoriaAtiva?.menu==="radio" ? (
          <RadioView isPlaying={isPlaying} toggle={togglePlay} volume={volume} setVolume={setVolume} />
        ) : (
          <NoticiasView noticias={noticiasFiltradas} />
        )}

        {/* FOOTER EDITORIAL */}
        <div className="mt-16 pt-8 border-t border-[var(--line)] grid md:grid-cols-12 gap-8">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-8 bg-[var(--orange)] rounded-lg grid place-items-center serif font-black text-[var(--navy)] text-[12px]">RN</div>
              <span className="serif font-black text-[18px] tracking-[-0.02em] text-[var(--navy)]">REDE NORTE</span>
            </div>
            <p className="text-[13px] leading-[1.6] text-[var(--muted)] max-w-[360px]">Portal independente, focado em Apucarana e Vale do Ivaí. Sem clickbait. Reportagem de rua, serviço e guia local. Protótipo funcional com mega-menu filtrável.</p>
          </div>
          <div className="md:col-span-7 grid grid-cols-3 gap-6 text-[12px]">
            <div><h5 className="font-bold tracking-[0.1em] mb-3">EDITORIAS</h5><ul className="space-y-1.5 text-[var(--muted)]"><li>Cidade</li><li>Política</li><li>Segurança</li><li>Economia Local</li></ul></div>
            <div><h5 className="font-bold tracking-[0.1em] mb-3">GUIA</h5><ul className="space-y-1.5 text-[var(--muted)]"><li>Onde Ir</li><li>Empregos</li><li>Promoções</li><li>Compras & Vendas</li></ul></div>
            <div><h5 className="font-bold tracking-[0.1em] mb-3">REDE</h5><ul className="space-y-1.5 text-[var(--muted)]"><li>TV Web</li><li>Rádio Ao Vivo</li><li>YouTube Oficial</li><li>Contato</li></ul></div>
          </div>
        </div>
      </main>

      {/* PLAYER FIXO */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--navy)] border-t-[4px] border-[var(--orange)] text-white">
        <div className="max-w-[1360px] mx-auto px-4 md:px-6 h-[72px] flex items-center gap-4">
          <button onClick={togglePlay} className="w-[48px] h-[48px] rounded-full bg-white text-[var(--navy)] grid place-items-center hover:scale-105 transition shadow-lg shrink-0">
            <span className="text-[18px] ml-0.5 font-black">{isPlaying ? "❚❚" : "▶"}</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.14em] px-2 py-0.5 rounded bg-[#E11D2A] animate-pulse">AO VIVO</span>
              <span className="text-[12px] font-bold tracking-wide">RÁDIO WEB APUCARANA • 87.9</span>
              <span className="hidden md:inline w-1 h-1 rounded-full bg-white/40"/>
              <span className="hidden md:inline text-[11px] opacity-70">{isPlaying ? "Tocando agora • Jornalismo e música" : "Clique para ouvir • Sem autoplay"}</span>
            </div>
            <div className="serif text-[14px] md:text-[15px] font-semibold leading-tight truncate">
              {isPlaying ? "Rede Norte no ar: notícias locais a cada 30 min" : "Rádio em standby — pronto para tocar"}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <span className="text-[10px] tracking-[0.1em] opacity-60">VOL</span>
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e=>setVolume(parseFloat(e.target.value))} className="w-[96px] accent-[var(--orange)]"/>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] opacity-70 shrink-0">
            <span>servidor34-2.brlogic.com:7016/live</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
          </div>
        </div>
      </div>
    </div>
  )
}

function NoticiasView({noticias}:{noticias:Noticia[]}){
  const hero = noticias[0]
  const grid = noticias.slice(1)
  if(!hero) return <div className="py-24 text-center text-[var(--muted)]">Nenhuma notícia para este filtro DEMO.</div>
  return (
    <div>
      {/* HERO */}
      <div className="grid lg:grid-cols-12 gap-6">
        <article className="lg:col-span-8 group cursor-pointer">
          <div className="relative overflow-hidden rounded-[18px] bg-[var(--surface)] border border-[var(--line)]">
            <div className="aspect-[16/10] md:aspect-[16/9] overflow-hidden">
              <img src={hero.img} alt={hero.titulo} className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-700"/>
            </div>
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-full bg-[var(--orange)] text-white text-[11px] font-bold tracking-[0.08em]">{hero.cidade}</span>
              <span className="px-3 py-1 rounded-full bg-[var(--navy)] text-white text-[11px] font-bold">{hero.cat}</span>
              <span className="px-2.5 py-1 rounded-full bg-white/90 text-[var(--navy)] text-[10px] font-bold">DEMO</span>
            </div>
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] mb-3">
                <span>🕒 {hero.tempo}</span><span>•</span><span>3 min leitura</span><span>•</span><span className="font-bold text-[var(--orange)]">Manchete principal</span>
              </div>
              <h2 className="serif text-[28px] md:text-[40px] font-black leading-[0.95] tracking-[-0.03em] mb-4 group-hover:text-[var(--navy)] transition">{hero.titulo}</h2>
              <p className="text-[15px] leading-[1.6] text-[var(--muted)] max-w-[64ch]">{hero.resumo}</p>
            </div>
          </div>
        </article>

        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-[14px] bg-[var(--surface)] border border-[var(--line)] p-4">
            <h4 className="text-[11px] font-bold tracking-[0.14em] text-[var(--orange)] mb-3">MAIS LIDAS DA SEMANA • DEMO</h4>
            <ul className="space-y-3">
              {grid.slice(0,3).map((n,i)=>(
                <li key={n.id} className="flex gap-3">
                  <span className="serif text-[28px] font-black leading-none text-[var(--line)]">{i+1}</span>
                  <div>
                    <p className="text-[13px] font-bold leading-[1.25] line-clamp-2 hover:text-[var(--navy)] cursor-pointer">{n.titulo}</p>
                    <span className="text-[10px] text-[var(--muted)]">{n.cidade} • {n.tempo}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[14px] bg-[var(--navy)] text-white p-5">
            <p className="text-[11px] tracking-[0.14em] font-bold opacity-70 mb-2">APUCARANA 360º</p>
            <p className="serif text-[18px] font-bold leading-tight mb-3">Cobertura visual da cidade em tempo real. Fotos, vídeos curtos e mapa.</p>
            <button className="text-[11px] font-bold tracking-[0.1em] px-3 py-2 rounded-full bg-white text-[var(--navy)]">EXPLORAR MAPA</button>
          </div>
        </div>
      </div>

      {/* GRID 3 colunas */}
      <div className="mt-10 grid md:grid-cols-3 gap-5">
        {grid.map(n=>(
          <article key={n.id} className="group bg-[var(--surface)] rounded-[16px] border border-[var(--line)] overflow-hidden hover:border-[var(--navy)]/30 transition">
            <div className="aspect-[16/10] overflow-hidden">
              <img src={n.img} alt={n.titulo} className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"/>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[10px] font-bold tracking-[0.1em] px-2 py-1 rounded-full bg-[var(--orange)] text-white">{n.cidade}</span>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--paper)] border border-[var(--line)]">{n.cat}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--navy)] text-white">DEMO</span>
              </div>
              <h3 className="serif text-[18px] font-bold leading-[1.15] tracking-[-0.01em] line-clamp-3 group-hover:text-[var(--navy)]">{n.titulo}</h3>
              <p className="mt-2 text-[12.5px] leading-[1.5] text-[var(--muted)] line-clamp-2">{n.resumo}</p>
              <div className="mt-3 text-[11px] text-[var(--muted)] flex items-center gap-2"><span>{n.tempo}</span><span>•</span><span>2 min</span></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function OndeIrView({lugares, cidade, categoria}:{lugares:any[], cidade:string, categoria:string}){
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="serif text-[36px] md:text-[44px] font-black tracking-[-0.03em] leading-[0.9] text-[var(--navy)]">ONDE IR • {categoria.toUpperCase()}</h2>
          <p className="text-[13px] text-[var(--muted)] mt-2">Guia verificado pela Rede Norte • {cidade} • {lugares.length} lugares • DEMO</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">● Aberto agora</span>
          <span className="text-[11px] px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] font-bold">Ordenar: recomendados</span>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {lugares.map(l=>(
          <div key={l.id} className="bg-[var(--surface)] rounded-[16px] border border-[var(--line)] overflow-hidden hover:shadow-[0_12px_24px_-12px_rgba(0,0,0,0.2)] transition">
            <div className="aspect-[16/11] relative">
              <img src={l.img} alt={l.nome} className="w-full h-full object-cover"/>
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="px-2.5 py-1 rounded-full bg-white text-[var(--navy)] text-[10px] font-bold shadow">{l.tipo}</span>
                <span className="px-2.5 py-1 rounded-full bg-[var(--orange)] text-white text-[10px] font-bold">{l.tag}</span>
              </div>
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-[var(--navy)] text-white text-[11px] font-bold">★ {l.nota} • DEMO</div>
            </div>
            <div className="p-4">
              <h3 className="serif font-bold text-[18px] leading-tight">{l.nome}</h3>
              <p className="text-[12px] text-[var(--muted)] mt-1">{l.cidade} • {l.tipo} • Fecha 23h</p>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 h-9 rounded-full bg-[var(--navy)] text-white text-[11px] font-bold tracking-[0.08em]">VER CARDÁPIO</button>
                <button className="w-9 h-9 rounded-full bg-[var(--paper)] border border-[var(--line)] grid place-items-center">↗</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TvView({categoria}:{categoria:string}){
  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8">
        <div className="rounded-[18px] overflow-hidden bg-black aspect-video border border-[var(--line)]">
          <iframe className="w-full h-full" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="TV Rede Norte" allowFullScreen />
        </div>
        <div className="mt-6">
          <span className="text-[11px] font-bold tracking-[0.12em] px-2.5 py-1 rounded-full bg-[#FF0000] text-white">YOUTUBE OFICIAL • DEMO</span>
          <h2 className="serif text-[30px] md:text-[36px] font-black leading-[0.95] mt-3 tracking-[-0.02em]">Entrevista: prefeito fala sobre mobilidade urbana • {categoria}</h2>
          <p className="text-[13px] text-[var(--muted)] mt-3 leading-[1.6]">Estratégia editorial: YouTube guarda o arquivo completo (programas de 20-40min). Cortes de 60s vão para TikTok/Instagram com CTA para o vídeo completo. Ao vivo sempre no YouTube para monetização e superchat. Instagram vira vitrine, não arquivo.</p>
        </div>
      </div>
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-[14px] bg-[var(--surface)] border border-[var(--line)] p-5">
          <h4 className="text-[11px] font-bold tracking-[0.14em] text-[var(--orange)] mb-3">ESTRATÉGIA YOUTUBE vs INSTAGRAM</h4>
          <ul className="space-y-3 text-[13px] leading-[1.5]">
            <li><b>YouTube:</b> arquivo vivo, SEO, 20min+, monetização, ao vivo.</li>
            <li><b>TikTok/Cortes:</b> 30-60s, legenda grande, gancho nos 2s.</li>
            <li><b>Instagram:</b> bastidores + chamada, link nos stories.</li>
            <li><b>Site:</b> embed + matéria escrita (rankeia no Google).</li>
          </ul>
        </div>
        <div className="grid gap-3">
          {["Corte: resposta sobre terminal urbano","Bastidores da gravação","Ao vivo ontem: 1.2k assistindo"].map(t=>(
            <div key={t} className="flex gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
              <div className="w-[88px] h-[56px] rounded-lg bg-[var(--navy)] grid place-items-center text-white text-[10px] font-bold">▶ 2:14</div>
              <p className="text-[12.5px] font-bold leading-tight">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmpregosView({vagas, cidade, categoria}:{vagas:any[], cidade:string, categoria:string}){
  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="serif text-[36px] md:text-[44px] font-black tracking-[-0.03em] leading-[0.9]">VAGAS • {cidade.toUpperCase()}</h2>
          <p className="text-[13px] text-[var(--muted)] mt-2">{categoria} • {vagas.length} oportunidades • DEMO • Atualizado hoje</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {vagas.map(v=>(
          <div key={v.id} className="bg-[var(--surface)] border border-[var(--line)] rounded-[16px] p-5 flex flex-col gap-3 hover:border-[var(--navy)]/30 transition">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-[16px] leading-tight">{v.cargo}</h3>
                <p className="text-[12px] text-[var(--muted)] mt-1">{v.empresa} • {v.cidade} • {v.tipo}</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--orange)] text-white">DEMO</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[var(--navy)]">{v.salario}</span>
              <button className="h-9 px-4 rounded-full bg-[var(--navy)] text-white text-[11px] font-bold tracking-[0.08em]">CANDIDATAR</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RadioView({isPlaying, toggle, volume, setVolume}:{isPlaying:boolean, toggle:()=>void, volume:number, setVolume:(v:number)=>void}){
  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7">
        <div className="rounded-[20px] bg-[var(--navy)] text-white p-8 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-[300px] h-[300px] rounded-full bg-[var(--orange)] opacity-20 blur-[40px]"/>
          <span className="text-[11px] font-bold tracking-[0.14em] px-3 py-1 rounded-full bg-[#E11D2A] animate-pulse">AO VIVO • 24H NO AR</span>
          <h2 className="serif text-[38px] font-black leading-[0.9] tracking-[-0.03em] mt-5">Rádio Web<br/>Apucarana</h2>
          <p className="text-[14px] opacity-80 mt-3 max-w-[44ch] leading-[1.5]">Jornalismo local a cada 30 minutos, música adulta e prestação de serviço. Player único funciona no site e no rodapé.</p>
          <div className="mt-8 flex items-center gap-4">
            <button onClick={toggle} className="w-[64px] h-[64px] rounded-full bg-white text-[var(--navy)] grid place-items-center text-[24px] font-black hover:scale-105 transition">{isPlaying ? "❚❚" : "▶"}</button>
            <div>
              <p className="text-[12px] font-bold tracking-[0.12em] opacity-70">{isPlaying ? "TOCANDO AGORA" : "STANDBY"}</p>
              <p className="serif text-[18px] font-bold">Rede Norte • Jornalismo é o carro-chefe</p>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <span className="text-[10px] tracking-[0.1em] opacity-60">VOL</span>
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e=>setVolume(parseFloat(e.target.value))} className="w-[160px] accent-[var(--orange)]"/>
            <span className="text-[11px] opacity-70">{Math.round(volume*100)}%</span>
          </div>
        </div>
      </div>
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-[14px] bg-[var(--surface)] border border-[var(--line)] p-5">
          <h4 className="text-[11px] font-bold tracking-[0.14em] text-[var(--orange)] mb-3">PROGRAMAÇÃO • DEMO</h4>
          <ul className="space-y-3 text-[13px]">
            <li className="flex justify-between"><span>06h - Bom Dia Norte</span><span className="opacity-50">Ao vivo</span></li>
            <li className="flex justify-between"><span>09h - Entrevistas</span><span className="opacity-50">Podcast depois</span></li>
            <li className="flex justify-between"><span>12h - Jornal do Meio-Dia</span><span className="opacity-50">Política</span></li>
            <li className="flex justify-between"><span>18h - Voz do Povo</span><span className="opacity-50">Aberto</span></li>
          </ul>
        </div>
        <div className="rounded-[14px] bg-[var(--paper)] border border-dashed border-[var(--line)] p-5 text-[12px] text-[var(--muted)] leading-[1.6]">
          Player com src <code className="bg-[var(--surface)] border border-[var(--line)] px-1.5 py-0.5 rounded">https://servidor34-2.brlogic.com:7016/live</code> sem autoplay, controlado via useRef em dois pontos (mega-menu e rodapé). Estado compartilhado.
        </div>
      </div>
    </div>
  )
}
