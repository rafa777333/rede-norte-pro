"use client";
import { useState, useRef, useEffect } from 'react';
import { CitySelector } from '@/components/CitySelector';
import { NEWS, SERVICES, MARKETS, JOBS } from '@/lib/mockData';
import { CITIES } from '@/lib/cities';

const STREAM_URL = "https://servidor34-2.brlogic.com:7016/live";
// Troque pelo ID do seu vídeo do YouTube - exemplo: https://youtube.com/watch?v=ABC123 => ID = ABC123
const YOUTUBE_DESTAQUE_ID = "dQw4w9WgXcQ"; 

export default function Home() {
  const [city, setCity] = useState('todas');
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoId, setVideoId] = useState(YOUTUBE_DESTAQUE_ID);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(()=>{
    const savedCity = localStorage.getItem('rn_city');
    if(savedCity) setCity(savedCity);
    const savedVideo = localStorage.getItem('rn_youtube_id');
    if(savedVideo) setVideoId(savedVideo);
  },[]);
  useEffect(()=>{ localStorage.setItem('rn_city', city); },[city]);

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
      } catch(e){
        alert("Se o navegador bloqueou o áudio, clique em permitir. Stream: " + STREAM_URL);
      }
    }
  };

  const filteredServices = city==='todas' ? SERVICES : SERVICES.filter(s=>s.cidade===city);
  const filteredMarkets = city==='todas' ? MARKETS : MARKETS.filter(m=>m.cidade===city);
  const filteredJobs = city==='todas' ? JOBS : JOBS.filter(j=>j.cidade===city);
  const cityName = city==='todas' ? 'Todas as cidades' : (CITIES.find(c=>c.slug===city)?.nome || city);

  const cheapest = (() => {
    if(city==='todas' || filteredMarkets.length===0) return null;
    const grouped: any = {};
    filteredMarkets.forEach(o=>{
      if(!grouped[o.produto] || o.preco < grouped[o.produto].preco) grouped[o.produto]=o;
    });
    return Object.values(grouped).slice(0,3) as any[];
  })();

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-[95px]">
      {/* AUDIO REAL BRLOGIC - NÃO TOCA SOZINHO */}
      <audio ref={audioRef} src={STREAM_URL} preload="none" crossOrigin="anonymous" />

      {/* TOPO NOVO MARCA LARANJA + AZUL MARINHO */}
      <div className="bg-[#0A2342] text-white text-[11px] flex justify-between items-center px-4 py-2 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="bg-[#FF6B00] text-white px-2 py-0.5 rounded font-black text-[10px]">NOVA MARCA</span>
          <span className="hidden md:inline">REDE NORTE • APUCARANA, ARAPONGAS E VALE DO IVAÍ • JORNALISMO REGIONAL</span>
          <span className="md:hidden">REDE NORTE • 8 CIDADES</span>
        </div>
        <button onClick={toggleRadio} className={`flex items-center gap-2 px-4 py-1 rounded-full font-black text-[11px] transition-all ${isPlaying ? "bg-[#FF6B00] text-white animate-pulse" : "bg-white text-[#0A2342] hover:bg-slate-100"}`}>
          <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-white animate-ping" : "bg-red-500"}`}></span>
          {isPlaying ? "🔊 TOCANDO - PAUSAR" : "🔴 RÁDIO AO VIVO"}
        </button>
      </div>

      {/* HEADER LOGO MAPA PARANÁ LARANJA */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-[56px] h-[56px] bg-[#FF6B00] rounded-[14px] flex items-center justify-center relative overflow-hidden shadow-sm">
              <div className="text-[#0A2342] font-black text-center leading-[0.85] text-[11px]">REDE<br/><span className="text-[18px]">NORTE</span></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#0A2342] rounded-full border-2 border-white"></div>
            </div>
            <div>
              <div className="font-black text-[#0A2342] leading-none text-[22px] tracking-tight">REDE NORTE</div>
              <div className="text-[10px] tracking-[0.25em] text-[#FF6B00] font-black">DE COMUNICAÇÃO</div>
              <div className="text-[11px] text-slate-500">Portal • TV Web • Rádio • Serviços • {cityName}</div>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="bg-[#0A2342] text-white rounded-full px-4 py-2 text-xs flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-[#FF6B00] animate-pulse" : "bg-slate-500"}`}></span>
              Rádio Web Apucarana - BRLogic Plus
            </div>
          </div>
        </div>
        
        {/* MENU */}
        <div className="bg-[#0A2342] border-b-4 border-[#FF6B00]">
          <div className="max-w-7xl mx-auto px-2 flex overflow-x-auto text-[13px] font-bold text-white">
            <div className="px-4 py-3 bg-white text-[#0A2342] whitespace-nowrap">HOME</div>
            <div className="px-4 py-3 whitespace-nowrap opacity-80">NOTÍCIAS</div>
            <div className="px-4 py-3 whitespace-nowrap bg-[#FF6B00] text-[#0A2342]">TV & VÍDEOS • YouTube</div>
            <div className="px-4 py-3 whitespace-nowrap opacity-80">RÁDIO</div>
            <div className="px-4 py-3 whitespace-nowrap opacity-80">EMPREGOS</div>
            <div className="px-4 py-3 whitespace-nowrap opacity-80">ONDE IR</div>
          </div>
        </div>
      </header>

      {/* SELETOR DE CIDADE */}
      <CitySelector selected={city} onSelect={setCity} />

      {/* TV & VÍDEOS - YOUTUBE EMBED - AQUI ESTÁ A SOLUÇÃO */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-[#0A2342] rounded-2xl p-1">
          <div className="bg-white rounded-[14px] p-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-black text-lg text-[#0A2342] flex items-center gap-2">
                <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm">▶</span>
                TV & VÍDEOS • Via YouTube (não via Instagram)
              </h2>
              <span className="text-[11px] bg-amber-100 border border-amber-300 px-3 py-1 rounded-full font-bold">Instagram só para cortes de 45s</span>
            </div>
            
            <div className="grid md:grid-cols-[1.6fr_1fr] gap-4">
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <iframe 
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Rede Norte - Vídeo em destaque"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="space-y-3">
                <div className="bg-slate-50 border rounded-xl p-3">
                  <div className="font-black text-sm text-[#0A2342]">Como usar vídeo no portal</div>
                  <ul className="mt-2 space-y-1.5 text-[12px] text-slate-700 leading-tight">
                    <li>✅ <b>YouTube:</b> sobe entrevista completa → cola ID aqui → aparece no site e no Google</li>
                    <li>✅ <b>Instagram:</b> corta 45s com legenda grande → CTA "Veja completo no site"</li>
                    <li>✅ Mesmo vídeo pode ficar no site antigo e no novo</li>
                  </ul>
                </div>
                <div className="bg-[#0A2342] text-white rounded-xl p-3">
                  <div className="text-[11px] font-black tracking-widest text-[#FF6B00]">TROCAR VÍDEO DESTAQUE</div>
                  <div className="mt-2 flex gap-2">
                    <input value={videoId} onChange={e=>setVideoId(e.target.value)} placeholder="ID do YouTube" className="flex-1 bg-white/10 border border-white/20 rounded-full px-3 py-2 text-xs outline-none" />
                    <button onClick={()=>{ localStorage.setItem('rn_youtube_id', videoId); alert("Vídeo salvo! Commit no GitHub para ficar para todos"); }} className="bg-[#FF6B00] text-white px-4 py-2 rounded-full text-xs font-black">Salvar</button>
                  </div>
                  <div className="text-[10px] mt-2 text-slate-400 break-all">Ex: https://youtube.com/watch?v={videoId} → use só o ID</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white border rounded-xl p-2">
                    <div className="text-[10px] font-bold">Entrevistas</div>
                    <div className="text-[11px] text-slate-500">Playlist YouTube</div>
                  </div>
                  <div className="bg-white border rounded-xl p-2">
                    <div className="text-[10px] font-bold">Programas</div>
                    <div className="text-[11px] text-slate-500">Ao vivo via YouTube</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NOTÍCIAS GLOBAL */}
      <section className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-black text-white text-[10px] px-2 py-1 rounded font-bold">GLOBAL</span>
          <h2 className="font-black">Notícias - vale para {cityName}</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          {NEWS.map(n=>(
            <div key={n.id} className={`bg-white rounded-2xl p-4 border shadow-sm ${n.destaque ? 'md:col-span-2 bg-[#0A2342] text-white' : ''}`}>
              <div className="text-[10px] font-bold opacity-60 mb-1">{n.categoria} • {n.tempo}</div>
              <div className="font-bold leading-tight text-sm">{n.titulo}</div>
            </div>
          ))}
        </div>
      </section>

      {cheapest && (
        <section className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-[#e11d48] text-white rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="font-black text-sm">💰 RADAR ECONOMIA - {cityName.toUpperCase()}: mais barato hoje</div>
            <div className="flex gap-2 flex-wrap">
              {cheapest.map((c:any)=><span key={c.id} className="bg-white text-black text-xs px-3 py-1 rounded-full font-bold">{c.produto} R$ {c.preco} no {c.mercado}</span>)}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="font-black mb-3">📍 Serviços em {cityName} • {filteredServices.length}</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {filteredServices.slice(0,6).map(s=>(
              <div key={s.id} className="bg-white rounded-2xl p-4 border">
                <div className="text-[10px] bg-zinc-100 px-2 py-1 rounded-full inline-block mb-2 font-bold">{s.categoria} • {s.cidade}</div>
                <div className="font-bold text-sm">{s.nome}</div>
                <div className="text-xs text-zinc-500 mt-1">★ {s.nota} • Verificado</div>
                <a href={`https://wa.me/${s.whatsapp}`} target="_blank" className="mt-3 block text-center bg-black text-white text-xs py-2 rounded-full font-bold">WhatsApp</a>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-black mb-3">💼 Vagas em {cityName}</h2>
          <div className="space-y-2">
            {filteredJobs.map(j=>(
              <div key={j.id} className="bg-white rounded-2xl p-3 border flex justify-between items-center">
                <div><div className="font-bold text-sm">{j.vaga}</div><div className="text-[11px] text-zinc-500">{j.empresa} • {j.cidade}</div></div>
                <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-full">Ver</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLAYER FIXO RODAPÉ */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A2342] text-white border-t-4 border-[#FF6B00] z-[100] shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={toggleRadio} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black transition-all ${isPlaying ? "bg-[#FF6B00] animate-pulse" : "bg-white text-[#0A2342]"}`}>{isPlaying ? "❚❚" : "▶"}</button>
            <div>
              <div className="font-black text-sm flex items-center gap-2"><span className={`w-2 h-2 bg-[#FF6B00] rounded-full ${isPlaying ? "animate-ping" : ""}`}></span>Radio Web Apucarana - AO VIVO</div>
              <div className="text-[11px] text-slate-300">BRLogic Plus • {isPlaying ? "Tocando agora 128kbps" : "Clique para ouvir"} • Pode usar nos 2 sites ao mesmo tempo</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-[11px] text-slate-400 text-right">
              <div>Servidor 34-2 • 1GB/1024GB</div>
              <div className="text-emerald-400">● Online</div>
            </div>
            <input type="range" min={0} max={1} step={0.1} defaultValue={0.8} onChange={e=>{ if(audioRef.current) audioRef.current.volume = parseFloat(e.target.value)}} className="w-24 accent-[#FF6B00]" />
          </div>
        </div>
      </div>
    </main>
  );
}
