"use client";
import { useState, useEffect } from "react";

const CIDADES = ["Todas", "Apucarana", "Arapongas", "Califórnia", "Marilândia do Sul", "Rolândia"] as const;

const MENU = [
  { label: "HOME", subs: ["Destaques", "Últimas", "Mais lidas"] },
  { label: "NOTÍCIAS", subs: ["Cidade", "Política", "Segurança", "Economia Local", "Eventos", "Opinião"] },
  { label: "TV & VÍDEOS", subs: ["Programas da TV Web", "Entrevistas", "Cortes", "Ao Vivo"] },
  { label: "RÁDIO", subs: ["Ao Vivo", "Programação", "Podcasts"] },
  { label: "EMPREGOS & SERVIÇOS", subs: ["Vagas", "Currículos", "Comércio", "Serviços", "Profissionais"], badge: "★" },
  { label: "ONDE IR", subs: ["Lanchonetes", "Pizzarias", "Restaurantes", "Bares", "Cafés & Sorveterias", "Recomendados pela Rede"], guia: ["Happy Hour hoje", "Música ao vivo", "Aberto agora"] },
  { label: "COMPRAS & VENDAS", subs: ["Imóveis", "Carros", "Móveis", "Eletrônicos"] },
];

const VAGAS_MOCK = [
  { id: 1, titulo: "Auxiliar Administrativo", empresa: "Auto Peças Central", cidade: "Apucarana", tipo: "CLT" },
  { id: 2, titulo: "Vendedor(a)", empresa: "Loja Estilo", cidade: "Arapongas", tipo: "CLT" },
  { id: 3, titulo: "Motorista Entregador", empresa: "Distribuidora Norte", cidade: "Apucarana", tipo: "CLT" },
  { id: 4, titulo: "Atendente de Lanchonete", empresa: "Burger Top", cidade: "Arapongas", tipo: "Meio período" },
  { id: 5, titulo: "Auxiliar de Produção", empresa: "Indústria Califórnia", cidade: "Califórnia", tipo: "CLT" },
];

const LUGARES_MOCK = [
  { id: 1, nome: "Dona Chica Lanchonete", cat: "Lanchonetes", cidade: "Apucarana", nota: "4.8", status: "Aberto agora" },
  { id: 2, nome: "Cantina da Praça", cat: "Restaurantes", cidade: "Apucarana", nota: "4.6", status: "Aberto agora" },
  { id: 3, nome: "Bar do Alemão", cat: "Bares", cidade: "Arapongas", nota: "4.9", status: "Happy Hour hoje" },
  { id: 4, nome: "Pizzaria Forno & Lenha", cat: "Pizzarias", cidade: "Arapongas", nota: "4.7", status: "Música ao vivo" },
  { id: 5, nome: "Café Central", cat: "Cafés & Sorveterias", cidade: "Apucarana", nota: "4.8", status: "Aberto agora" },
];

const NOTICIAS = [
  { id: 1, titulo: "Temporal atinge Apucarana e causa alagamentos em bairros", cidade: "Apucarana", cat: "Cidade" },
  { id: 2, titulo: "Arapongas inaugura novo parque industrial", cidade: "Arapongas", cat: "Economia Local" },
  { id: 3, titulo: "Obra na BR-369 em Califórnia altera trânsito", cidade: "Califórnia", cat: "Cidade" },
  { id: 4, titulo: "Festa do Milho em Marilândia do Sul reúne 10 mil", cidade: "Marilândia do Sul", cat: "Eventos" },
];

export default function Page() {
  const [cidadeSel, setCidadeSel] = useState("Todas");
  const [menuAberto, setMenuAberto] = useState<string | null>("ONDE IR");
  const [categoriaAtiva, setCategoriaAtiva] = useState<{ menu: string; sub: string } | null>({ menu: "ONDE IR", sub: "Lanchonetes" });
  const [busca, setBusca] = useState("");

  const handleClickSub = (menu: string, sub: string) => {
    setCategoriaAtiva({ menu, sub });
    setMenuAberto(null);
    setTimeout(() => {
      document.getElementById("conteudo")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const vagasFiltradas = VAGAS_MOCK.filter(v => {
    const cidadeOk = cidadeSel === "Todas" || v.cidade === cidadeSel;
    const buscaOk = !busca || v.titulo.toLowerCase().includes(busca.toLowerCase());
    const catOk = !categoriaAtiva || categoriaAtiva.menu !== "EMPREGOS & SERVIÇOS" || categoriaAtiva.sub === "Vagas" || categoriaAtiva.sub === "Todas" ? true : true;
    return cidadeOk && buscaOk;
  });

  const lugaresFiltrados = LUGARES_MOCK.filter(l => {
    const cidadeOk = cidadeSel === "Todas" || l.cidade === cidadeSel;
    const subOk = !categoriaAtiva || categoriaAtiva.menu !== "ONDE IR" ? true : l.cat === categoriaAtiva.sub || categoriaAtiva.sub === "Recomendados pela Rede";
    const buscaOk = !busca || l.nome.toLowerCase().includes(busca.toLowerCase());
    return cidadeOk && subOk && buscaOk;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="bg-black text-white text-[11px] flex justify-between items-center px-4 py-2">
        <span>• QUARTA-FEIRA, 14 OUT • APUCARANA, PR • ☀️ 22°C</span>
        <span className="bg-white/10 px-3 py-1 rounded-full">🔴 RÁDIO AO VIVO</span>
      </div>

      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0F172A] rounded-lg flex items-center justify-center text-white font-black text-xl">R</div>
            <div>
              <div className="font-black leading-none text-[#0F172A]">REDE NORTE DE COMUNICAÇÃO</div>
              <div className="text-[10px] tracking-[0.2em] text-slate-500">PORTAL • TV • RÁDIO • SERVIÇOS</div>
            </div>
          </div>
          <div className="flex items-center bg-slate-100 rounded-full px-3 py-1.5 w-[320px]">
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar vaga, lugar, notícia..." className="bg-transparent outline-none text-sm w-full" />
          </div>
        </div>

        <nav className="bg-[#0F172A] text-white text-[13px] font-bold border-b-4 border-amber-500">
          <div className="max-w-[1400px] mx-auto px-2 flex overflow-x-auto">
            {MENU.map(m => (
              <button key={m.label} onMouseEnter={()=>setMenuAberto(m.label)} onClick={()=>setMenuAberto(menuAberto===m.label?null:m.label)} className={`whitespace-nowrap px-4 py-3 flex items-center gap-1 ${menuAberto===m.label?'bg-white text-[#0F172A]':''}`}>
                {m.label} {m.badge && <span className="bg-amber-400 text-black text-[10px] px-1 rounded-full ml-1">{m.badge}</span>} <span className="text-[10px] ml-1">▼</span>
              </button>
            ))}
          </div>
        </nav>

        {menuAberto && (
          <div className="bg-white border-b shadow-xl animate-in">
            <div className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-[280px_1fr_1fr] gap-8">
              <div>
                <div className="flex items-center gap-2 font-black mb-3">⚙ {menuAberto}</div>
                <p className="text-xs text-slate-500 mb-3">Agora tudo é clicável! Clique em qualquer sub-aba e o conteúdo embaixo vai filtrar automaticamente.</p>
                <div className="bg-emerald-50 text-emerald-700 rounded-full px-3 py-2 text-[10px] font-bold">✅ MODO CLICÁVEL ATIVO</div>
              </div>
              <div>
                <div className="text-[11px] tracking-widest text-slate-400 font-bold mb-3 flex items-center gap-2"><span className="w-6 h-0.5 bg-amber-500"></span> {menuAberto === "ONDE IR" ? "GASTRONOMIA & LAZER" : "CATEGORIAS"}</div>
                <div className="space-y-1">
                  {(MENU.find(m=>m.label===menuAberto)?.subs || []).map(s => (
                    <button key={s} onClick={()=>handleClickSub(menuAberto, s)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${categoriaAtiva?.menu===menuAberto && categoriaAtiva?.sub===s ? "bg-[#0F172A] text-white font-bold flex justify-between items-center" : "text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]"}`}>
                      {s} {categoriaAtiva?.menu===menuAberto && categoriaAtiva?.sub===s && <span>→</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] tracking-widest text-slate-400 font-bold mb-3">GUIA RÁPIDO</div>
                <div className="space-y-2">
                  {["Happy Hour hoje","Música ao vivo","Aberto agora"].map(g => (
                    <button key={g} onClick={()=>handleClickSub(menuAberto, g)} className="w-full text-left px-3 py-2 rounded-lg border text-sm text-slate-600 hover:border-[#0F172A]">{g}</button>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500">
                  Cidade filtrada: <b>{cidadeSel}</b> {cidadeSel==="Apucarana" && "(foco principal)"} {cidadeSel==="Arapongas" && "(foco principal)"}
                </div>
              </div>
            </div>
            <div className="bg-[#0F172A] text-white text-[11px] px-6 py-3 flex justify-between">
              <span>💡 Clique em qualquer opção acima para ver o conteúdo filtrar lá embaixo instantaneamente.</span>
              <button onClick={()=>setMenuAberto(null)} className="font-bold">FECHAR ✕</button>
            </div>
          </div>
        )}
      </header>

      <div className="bg-white border-b sticky top-[104px] z-20">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-bold whitespace-nowrap">📍 Filtrar por cidade:</span>
          {CIDADES.map(c => (
            <button key={c} onClick={()=>setCidadeSel(c)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${cidadeSel===c? "bg-[#0F172A] text-white border-[#0F172A] scale-105" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"} ${c==="Apucarana"||c==="Arapongas"?"ring-1 ring-amber-400 ring-offset-1":""}`}>{c}</button>
          ))}
        </div>
      </div>

      <main id="conteudo" className="max-w-[1400px] mx-auto px-4 py-6">
        {categoriaAtiva && (
          <div className="mb-6 bg-[#0F172A] text-white rounded-xl px-5 py-4 flex justify-between items-center">
            <div>
              <div className="text-[10px] tracking-widest text-amber-400 font-bold">{categoriaAtiva.menu}</div>
              <div className="font-black text-xl">{categoriaAtiva.sub} {cidadeSel!=="Todas" && `em ${cidadeSel}`}</div>
              <div className="text-xs text-slate-400 mt-1">Você clicou em {categoriaAtiva.menu} &gt; {categoriaAtiva.sub} • Filtrado por {cidadeSel}</div>
            </div>
            <button onClick={()=>setCategoriaAtiva(null)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-xs">Limpar filtro ✕</button>
          </div>
        )}

        {(!categoriaAtiva || categoriaAtiva.menu==="ONDE IR") && (
          <>
            <h2 className="font-black text-lg mb-4 flex items-center gap-2">🍔 {categoriaAtiva?.sub || "ONDE IR"} {cidadeSel!=="Todas" && `- ${cidadeSel}`} <span className="text-xs font-normal text-slate-500">({lugaresFiltrados.length} lugares)</span></h2>
            <div className="grid md:grid-cols-3 gap-4 mb-10">
              {lugaresFiltrados.map(l => (
                <div key={l.id} className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-amber-400 text-black text-[10px] px-2 py-0.5 rounded-full font-bold">{l.cat}</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{l.status}</span>
                  </div>
                  <h3 className="font-bold">{l.nome}</h3>
                  <div className="flex gap-2 mt-2 text-[11px] text-slate-500">
                    <span>⭐ {l.nota}</span> <span>• {l.cidade}</span> <span>• DEMO</span>
                  </div>
                  <button className="mt-3 w-full bg-[#0F172A] text-white text-xs py-2 rounded-full">Ver cardápio / Contato</button>
                </div>
              ))}
            </div>
          </>
        )}

        {(!categoriaAtiva || categoriaAtiva.menu==="EMPREGOS & SERVIÇOS") && (
          <>
            <h2 className="font-black text-lg mb-4 flex items-center gap-2">💼 Vagas {cidadeSel!=="Todas" && `em ${cidadeSel}`} <span className="text-xs font-normal text-slate-500">({vagasFiltradas.length})</span></h2>
            <div className="grid md:grid-cols-2 gap-3 mb-10">
              {vagasFiltradas.map(v => (
                <div key={v.id} className="bg-white rounded-xl p-4 border flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm">{v.titulo}</div>
                    <div className="text-xs text-slate-500">{v.empresa} • {v.cidade} • {v.tipo}</div>
                  </div>
                  <button className="bg-amber-400 text-black text-xs font-bold px-4 py-1.5 rounded-full">Candidatar</button>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="font-black text-lg mb-4">📰 Notícias {cidadeSel!=="Todas" && `de ${cidadeSel}`}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {NOTICIAS.filter(n=>cidadeSel==="Todas" || n.cidade===cidadeSel).map(n => (
            <article key={n.id} className="bg-white rounded-xl p-4 border">
              <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">{n.cidade}</span>
              <h3 className="font-bold mt-2 text-sm leading-tight">{n.titulo}</h3>
            </article>
          ))}
        </div>

        <div className="mt-10 bg-amber-400 rounded-xl p-4 text-xs text-black">
          ✅ AGORA ESTÁ CLICÁVEL! Clique nas sub-abas acima que o conteúdo filtra. Próximo passo é alimentar com dados reais do seu admin.
        </div>
      </main>
    </div>
  );
}
