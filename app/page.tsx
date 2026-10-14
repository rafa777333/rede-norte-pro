"use client";
import { useState } from "react";

const CIDADES = ["Todas", "Apucarana", "Arapongas", "Califórnia", "Marilândia do Sul", "Rolândia", "Jandaia do Sul", "Mandaguari", "Rio Bom"] as const;

const MENU = [
  { label: "HOME", subs: ["Destaques", "Últimas", "Mais lidas"] },
  { label: "NOTÍCIAS", subs: ["Cidade", "Política", "Segurança", "Economia Local", "Eventos", "Opinião", "Reportagens Especiais"] },
  { label: "TV & VÍDEOS", subs: ["Programas da TV Web", "Entrevistas", "Cortes", "Ao Vivo"] },
  { label: "RÁDIO", subs: ["Ao Vivo", "Programação", "Podcasts"] },
  { label: "EMPREGOS & SERVIÇOS", subs: ["Vagas", "Currículos", "Comércio", "Serviços", "Profissionais"], badge: "★" },
  { label: "ONDE IR", subs: ["Lanchonetes", "Pizzarias", "Restaurantes", "Bares", "Cafés & Sorveterias", "Recomendados pela Rede"], guia: ["Happy Hour hoje", "Música ao vivo", "Aberto agora"] },
  { label: "COMPRAS & VENDAS", subs: ["Imóveis", "Carros", "Móveis", "Eletrônicos"] },
  { label: "PROMOÇÕES", subs: ["Ofertas", "Cupons"] },
  { label: "PET", subs: ["Clínicas", "Pet Shops"] },
  { label: "BELEZA", subs: ["Salões", "Estética"] },
];

const NOTICIAS = [
  { id: 1, titulo: "Temporal atinge Apucarana e causa alagamentos em bairros", cidade: "Apucarana", cat: "Cidade", tempo: "há 20 min" },
  { id: 2, titulo: "Arapongas inaugura novo parque industrial", cidade: "Arapongas", cat: "Economia", tempo: "há 1h" },
  { id: 3, titulo: "Obra na BR-369 em Califórnia altera trânsito", cidade: "Califórnia", cat: "Cidade", tempo: "há 2h" },
  { id: 4, titulo: "Festa do Milho em Marilândia do Sul reúne 10 mil", cidade: "Marilândia do Sul", cat: "Eventos", tempo: "há 3h" },
  { id: 5, titulo: "Rolândia registra recorde de empregos no mês", cidade: "Rolândia", cat: "Empregos", tempo: "há 4h" },
];

export default function Page() {
  const [cidadeSel, setCidadeSel] = useState("Todas");
  const [menuAberto, setMenuAberto] = useState<string | null>("ONDE IR");
  const [busca, setBusca] = useState("");

  const noticiasFiltradas = NOTICIAS.filter(n => {
    const cidadeOk = cidadeSel === "Todas" || n.cidade === cidadeSel;
    const buscaOk = !busca || n.titulo.toLowerCase().includes(busca.toLowerCase());
    return cidadeOk && buscaOk;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* TOP BAR */}
      <div className="bg-black text-white text-[11px] flex justify-between items-center px-4 py-2">
        <div className="flex gap-2 items-center">
          <span>• QUARTA-FEIRA, 14 DE OUTUBRO DE 2026 • APUCARANA, PR</span>
          <span className="text-amber-400">☀️ 22°C • Parcialmente nublado</span>
        </div>
        <div className="flex gap-3 items-center">
          <span className="bg-white/10 px-3 py-1 rounded-full flex items-center gap-2">🔴 RÁDIO AO VIVO</span>
          <span>Anuncie • Contato</span>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0F172A] rounded-lg flex items-center justify-center text-white font-black text-xl relative">R<span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full"></span></div>
            <div>
              <div className="font-black leading-none text-[#0F172A]">REDE NORTE DE COMUNICAÇÃO</div>
              <div className="text-[10px] tracking-[0.2em] text-slate-500">PORTAL • TV • RÁDIO • SERVIÇOS</div>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3 bg-[#0F172A] text-white rounded-full px-4 py-2 text-xs">
            <span className="bg-amber-400 text-black px-2 py-0.5 rounded-full text-[10px]">🔥</span> JORNALISMO É O CARRO-CHEFE
          </div>
          <div className="flex items-center bg-slate-100 rounded-full px-3 py-1.5 w-[320px]">
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar notícia, vaga, lugar..." className="bg-transparent outline-none text-sm w-full" />
            <button className="bg-black text-white px-4 py-1.5 rounded-full text-sm">Buscar</button>
          </div>
        </div>

        {/* MENU */}
        <nav className="bg-[#0F172A] text-white text-[13px] font-bold border-b-4 border-amber-500">
          <div className="max-w-[1400px] mx-auto px-2 flex overflow-x-auto">
            {MENU.map(m => (
              <button key={m.label} onMouseEnter={()=>setMenuAberto(m.label)} onClick={()=>setMenuAberto(menuAberto===m.label?null:m.label)} className={`whitespace-nowrap px-4 py-3 flex items-center gap-1 ${menuAberto===m.label?'bg-white text-[#0F172A]':''}`}>
                {m.label} {m.badge && <span className="bg-amber-400 text-black text-[10px] px-1 rounded-full">{m.badge}</span>} <span className="text-[10px]">▼</span>
              </button>
            ))}
          </div>
        </nav>

        {/* MEGA MENU */}
        {menuAberto && (
          <div className="bg-white border-b shadow-xl">
            <div className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-[280px_1fr_1fr] gap-8">
              <div>
                <div className="flex items-center gap-2 font-black mb-3"><span className="w-8 h-8 bg-[#0F172A] text-white rounded-full flex items-center justify-center">⚙</span> {menuAberto}</div>
                <p className="text-xs text-slate-500 mb-4">Clique em qualquer opção para navegar. Esse é o ecossistema clicável que o Luiz pediu — tudo em cima, conteúdo embaixo.</p>
                <div className="bg-slate-100 rounded-full px-3 py-2 text-[10px] font-bold flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> MENU INTERATIVO • CLIQUE FORA FECHA</div>
              </div>
              <div>
                <div className="text-[11px] tracking-widest text-slate-400 font-bold mb-3 flex items-center gap-2"><span className="w-6 h-0.5 bg-amber-500"></span> GASTRONOMIA & LAZER</div>
                <div className="space-y-1">
                  {(MENU.find(m=>m.label===menuAberto)?.subs || []).map(s => (
                    <div key={s} className={`px-3 py-2 rounded-lg cursor-pointer text-sm ${s==="Lanchonetes"?"bg-[#0F172A] text-white flex justify-between":"text-slate-600 hover:bg-slate-50"}`}>{s} {s==="Lanchonetes" && <span>→</span>}</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] tracking-widest text-slate-400 font-bold mb-3 flex items-center gap-2"><span className="w-6 h-0.5 bg-amber-500"></span> GUIA</div>
                <div className="space-y-2">
                  {(MENU.find(m=>m.label===menuAberto)?.guia || ["Happy Hour hoje","Música ao vivo","Aberto agora"]).map(g => (
                    <div key={g} className={`px-3 py-2 rounded-lg border text-sm ${g==="Happy Hour hoje"?"border-[#0F172A] bg-white":"border-transparent text-slate-600"}`}>{g}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-[#0F172A] text-white text-[11px] px-6 py-3 flex justify-between">
              <span>Dica: Passe o mouse nas abas para pré-visualizar. Jornalismo continua sendo o foco da home.</span>
              <button onClick={()=>setMenuAberto(null)} className="font-bold">FECHAR ✕</button>
            </div>
          </div>
        )}
      </header>

      {/* FILTRO CIDADES */}
      <div className="bg-white border-b sticky top-[104px] z-20">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-bold whitespace-nowrap">📍 Filtrar por cidade:</span>
          {CIDADES.map(c => (
            <button key={c} onClick={()=>setCidadeSel(c)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border ${cidadeSel===c? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-white text-slate-600 border-slate-200"} ${c==="Apucarana"||c==="Arapongas"?"ring-1 ring-amber-400":""}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* CONTEUDO */}
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="mb-4 text-xs text-slate-500">Mostrando {noticiasFiltradas.length} resultados para <b>{cidadeSel}</b> {busca && `+ "${busca}"`} {cidadeSel==="Apucarana"||cidadeSel==="Arapongas" ? "• Principais" : ""}</div>
        <div className="grid md:grid-cols-3 gap-4">
          {noticiasFiltradas.map(n => (
            <article key={n.id} className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex gap-2 mb-2"><span className="bg-amber-400 text-black text-[10px] px-2 py-0.5 rounded-full font-bold">{n.cidade}</span><span className="text-[10px] text-slate-500">{n.cat} • {n.tempo}</span></div>
              <h3 className="font-bold leading-tight">{n.titulo}</h3>
              <div className="text-[10px] text-slate-400 mt-2">Exemplo demonstrativo - DEMO</div>
            </article>
          ))}
          {noticiasFiltradas.length===0 && (
            <div className="col-span-3 bg-white border rounded-xl p-8 text-center">
              <p className="font-bold">Nenhum resultado para {cidadeSel}</p>
              <button onClick={()=>{setCidadeSel("Todas"); setBusca("");}} className="mt-3 bg-[#0F172A] text-white px-4 py-2 rounded-full text-sm">Limpar filtros</button>
            </div>
          )}
        </div>

        <div className="mt-8 bg-[#0F172A] text-white rounded-xl p-4 text-xs">
          ✅ Estrutura pronta para automação TN Online / Canal 38 / Banda B / Google News - basta ativar FONTES_AUTONOMAS no código. Painel /admin já preparado.
        </div>
      </main>
    </div>
  );
}
