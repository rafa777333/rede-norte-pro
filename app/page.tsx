"use client";
import { useState, useRef, useEffect } from "react";

const STREAM_URL = "https://servidor34-2.brlogic.com:7016/live";
const CIDADES = ["Todas", "Apucarana", "Arapongas", "Califórnia", "Marilândia do Sul", "Rolândia"] as const;

const MENU = [
  { label: "HOME", subs: ["Destaques", "Últimas", "Mais lidas"] },
  { label: "NOTÍCIAS", subs: ["Cidade", "Política", "Segurança", "Economia Local", "Eventos"] },
  { label: "TV & VÍDEOS", subs: ["Programas da TV Web", "Entrevistas", "Cortes", "Ao Vivo"] },
  { label: "RÁDIO", subs: ["Ao Vivo", "Programação", "Podcasts"] },
  { label: "EMPREGOS & SERVIÇOS", subs: ["Vagas", "Currículos", "Comércio", "Serviços", "Profissionais"], badge: "★" },
  { label: "ONDE IR", subs: ["Lanchonetes", "Pizzarias", "Restaurantes", "Bares", "Cafés & Sorveterias", "Recomendados pela Rede"], guia: ["Happy Hour hoje", "Música ao vivo", "Aberto agora"] },
  { label: "COMPRAS & VENDAS", subs: ["Imóveis", "Carros", "Móveis", "Eletrônicos"] },
];

const VAGAS_MOCK = [
  { id: 1, titulo: "Auxiliar Administrativo", empresa: "Auto Peças Central", cidade: "Apucarana", tipo: "CLT" },
  { id: 2, titulo: "Vendedor(a)", empresa: "Loja Estilo", cidade: "Arapongas", tipo: "CLT" },
  { id: 3, titulo: "Atendente de Lanchonete", empresa: "Burger Top", cidade: "Arapongas", tipo: "Meio período" },
];

const LUGARES_MOCK = [
  { id: 1, nome: "Dona Chica Lanchonete", cat: "Lanchonetes", cidade: "Apucarana", nota: "4.8", status: "Aberto agora" },
  { id: 2, nome: "Cantina da Praça", cat: "Restaurantes", cidade: "Apucarana", nota: "4.6", status: "Aberto agora" },
  { id: 3, nome: "Bar do Alemão", cat: "Bares", cidade: "Arapongas", nota: "4.9", status: "Happy Hour hoje" },
  { id: 4, nome: "Pizzaria Forno & Lenha", cat: "Pizzarias", cidade: "Arapongas", nota: "4.7", status: "Música ao vivo" },
];

export default function Page() {
  const [cidadeSel, setCidadeSel] = useState("Todas");
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<{ menu: string; sub: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [busca, setBusca] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleRadio = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        audioRef.current.volume = 0.8;
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.log("Erro ao tocar:", e);
        alert("Clique em permitir áudio se o navegador bloquear. O streaming é: " + STREAM_URL);
      }
    }
  };

  const handleClickSub = (menu: string, sub: string) => {
    setCategoriaAtiva({ menu, sub });
    setMenuAberto(null);
    setTimeout(() => document.getElementById("conteudo")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setIsPlaying(false);
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);
    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
    };
  }, []);

  const lugaresFiltrados = LUGARES_MOCK.filter(l => {
    const cidadeOk = cidadeSel === "Todas" || l.cidade === cidadeSel;
    const subOk = !categoriaAtiva || categoriaAtiva.menu !== "ONDE IR" ? true : l.cat === categoriaAtiva.sub || categoriaAtiva.sub === "Recomendados pela Rede";
    const buscaOk = !busca || l.nome.toLowerCase().includes(busca.toLowerCase());
    return cidadeOk && subOk && buscaOk;
  });

  const vagasFiltradas = VAGAS_MOCK.filter(v => {
    const cidadeOk = cidadeSel === "Todas" || v.cidade === cidadeSel;
    const buscaOk = !busca || v.titulo.toLowerCase().includes(busca.toLowerCase());
    return cidadeOk && buscaOk;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-[90px]">
      {/* ÁUDIO ELEMENT - PLAYER REAL BRLOGIC */}
      <audio ref={audioRef} src={STREAM_URL} preload="none" crossOrigin="anonymous" />

      {/* TOP BAR COM RÁDIO */}
      <div className="bg-black text-white text-[11px] flex justify-between items-center px-4 py-2 sticky top-0 z-50">
        <span>• QUARTA, 14 OUT • APUCARANA, PR • ☀️ 22°C</span>
        <div className="flex items-center gap-2">
          <button onClick={toggleRadio} className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold transition-all ${isPlaying ? "bg-red-600 animate-pulse" : "bg-white/10 hover:bg-white/20"}`}>
            <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-white animate-ping" : "bg-red-500"}`}></span>
            {isPlaying ? "🔊 TOCANDO AO VIVO - CLIQUE PARA PAUSAR" : "🔴 RÁDIO AO VIVO - CLIQUE PARA OUVIR"}
          </button>
        </div>
      </div>

      <header className="bg-white border-b sticky top-[32px] z-30">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0F172A] rounded-lg flex items-center justify-center text-white font-black text-xl">R</div>
            <div>
              <div className="font-black leading-none text-[#0F172A]">REDE NORTE DE COMUNICAÇÃO</div>
              <div className="text-[10px] tracking-[0.2em] text-slate-500">PORTAL • TV • RÁDIO • SERVIÇOS</div>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 bg-amber-400 text-black rounded-full px-4 py-1.5 text-xs font-bold">
            <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span> RÁDIO WEB APUCARANA - {isPlaying ? "AO VIVO TOCANDO" : "ONLINE"}
          </div>
          <div className="flex items-center bg-slate-100 rounded-full px-3 py-1.5 w-[320px]">
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." className="bg-transparent outline-none text-sm w-full" />
          </div>
        </div>

        <nav className="bg-[#0F172A] text-white text-[13px] font-bold border-b-4 border-amber-500">
          <div className="max-w-[1400px] mx-auto px-2 flex overflow-x-auto">
            {MENU.map(m => (
              <button key={m.label} onMouseEnter={()=>setMenuAberto(m.label)} onClick={()=>setMenuAberto(menuAberto===m.label?null:m.label)} className={`whitespace-nowrap px-4 py-3 flex items-center gap-1 ${menuAberto===m.label?'bg-white text-[#0F172A]':''}`}>
                {m.label} <span className="text-[10px] ml-1">▼</span>
              </button>
            ))}
          </div>
        </nav>

        {menuAberto && (
          <div className="bg-white border-b shadow-xl">
            <div className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-[280px_1fr_1fr] gap-8">
              <div>
                <div className="font-black mb-2">{menuAberto}</div>
                <p className="text-xs text-slate-500">Clique em qualquer sub-aba - agora com rádio integrado!</p>
                <button onClick={toggleRadio} className="mt-4 w-full bg-black text-white rounded-full py-2 text-xs font-bold">{isPlaying ? "⏸️ Pausar Rádio" : "▶️ Ouvir Rádio Web Apucarana"}</button>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold mb-3">SUBCATEGORIAS - CLIQUE PARA FILTRAR</div>
                <div className="space-y-1">
                  {(MENU.find(m=>m.label===menuAberto)?.subs || []).map(s => (
                    <button key={s} onClick={()=>handleClickSub(menuAberto, s)} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${categoriaAtiva?.menu===menuAberto && categoriaAtiva?.sub===s ? "bg-[#0F172A] text-white" : "hover:bg-slate-50"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold mb-3">RÁDIO AO VIVO</div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-xs font-bold">Radio Web Apucarana</div>
                  <div className="text-[11px] text-slate-500">Streaming BRLOGIC Plus • 128kbps</div>
                  <div className="text-[10px] mt-2 bg-white p-2 rounded border font-mono break-all">{STREAM_URL}</div>
                  <div className="mt-3 flex items-center gap-2 text-[11px]"><span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-500" : "bg-slate-300"}`}></span>{isPlaying ? "Tocando agora (Não informado)" : "Parado"}</div>
                </div>
              </div>
            </div>
            <div className="bg-[#0F172A] text-white text-[11px] px-6 py-3 flex justify-between">
              <span>💡 O mesmo streaming funciona no site antigo e no novo ao mesmo tempo.</span>
              <button onClick={()=>setMenuAberto(null)} className="font-bold">FECHAR ✕</button>
            </div>
          </div>
        )}
      </header>

      <div className="bg-white border-b sticky top-[104px] z-20">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-bold">📍 Filtrar por cidade:</span>
          {CIDADES.map(c => (
            <button key={c} onClick={()=>setCidadeSel(c)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border ${cidadeSel===c? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-white text-slate-600 border-slate-200"}`}>{c}</button>
          ))}
        </div>
      </div>

      <main id="conteudo" className="max-w-[1400px] mx-auto px-4 py-6">
        {categoriaAtiva && (
          <div className="mb-6 bg-[#0F172A] text-white rounded-xl px-5 py-4 flex justify-between items-center">
            <div><div className="text-[10px] text-amber-400 font-bold">{categoriaAtiva.menu}</div><div className="font-black text-xl">{categoriaAtiva.sub} {cidadeSel!=="Todas" && `em ${cidadeSel}`}</div></div>
            <button onClick={()=>setCategoriaAtiva(null)} className="bg-white/10 px-4 py-2 rounded-full text-xs">Limpar ✕</button>
          </div>
        )}

        <h2 className="font-black text-lg mb-4">🍔 ONDE IR • {lugaresFiltrados.length} lugares</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {lugaresFiltrados.map(l => (
            <div key={l.id} className="bg-white rounded-xl p-4 border">
              <div className="flex justify-between mb-2"><span className="bg-amber-400 text-black text-[10px] px-2 py-0.5 rounded-full font-bold">{l.cat}</span><span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{l.status}</span></div>
              <h3 className="font-bold">{l.nome}</h3>
              <div className="text-[11px] text-slate-500 mt-1">⭐ {l.nota} • {l.cidade}</div>
            </div>
          ))}
        </div>

        <h2 className="font-black text-lg mb-4">💼 Vagas</h2>
        <div className="grid md:grid-cols-2 gap-3 mb-10">
          {vagasFiltradas.map(v => (
            <div key={v.id} className="bg-white rounded-xl p-4 border flex justify-between items-center">
              <div><div className="font-bold text-sm">{v.titulo}</div><div className="text-xs text-slate-500">{v.empresa} • {v.cidade}</div></div>
              <button className="bg-amber-400 text-black text-xs font-bold px-4 py-1.5 rounded-full">Candidatar</button>
            </div>
          ))}
        </div>
      </main>

      {/* PLAYER FIXO RODAPÉ - PERSISTENTE */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0F172A] text-white border-t-4 border-amber-500 z-[100] shadow-2xl">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={toggleRadio} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black transition-all ${isPlaying ? "bg-red-600 animate-pulse" : "bg-amber-400 text-black"}`}>{isPlaying ? "❚❚" : "▶"}</button>
            <div>
              <div className="font-black text-sm flex items-center gap-2"><span className={`w-2 h-2 bg-red-500 rounded-full ${isPlaying ? "animate-ping" : ""}`}></span>Radio Web Apucarana - AO VIVO</div>
              <div className="text-[11px] text-slate-400">BRLOGIC Plus • {isPlaying ? "Tocando agora - streaming 128kbps" : "Clique para ouvir"} • {STREAM_URL.replace("https://","")}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-[11px] text-slate-400 text-right">
              <div>Servidor 34-2 • 1GB / 1024GB</div>
              <div className="text-emerald-400">● Online • Pode usar nos 2 sites</div>
            </div>
            <input type="range" min={0} max={1} step={0.1} defaultValue={0.8} onChange={e=>{ if(audioRef.current) audioRef.current.volume = parseFloat(e.target.value)}} className="w-24 accent-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
