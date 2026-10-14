"use client";
import { useState, useRef, useEffect } from "react";

const STREAM_URL = "https://servidor34-2.brlogic.com:7016/live";
const CIDADES = ["Todas", "Apucarana", "Arapongas", "Vale do Ivaí"] as const;
const MENU = [
  { label: "NOTÍCIAS", subs: ["Cidade", "Política", "Segurança", "Economia Local"] },
  { label: "OUÇA AO VIVO", isRadio: true },
  { label: "VÍDEOS E TV WEB", subs: ["Ao Vivo", "Entrevistas", "Programas", "Cortes"] },
  { label: "PODCASTS", subs: ["Podcasts em vídeo", "Cortes"] },
  { label: "EMPREGOS", subs: ["Vagas", "Currículos"] },
  { label: "SERVIÇOS E GUIA", subs: ["Lanchonetes", "Restaurantes", "Bares", "Comércio"] },
  { label: "AGENDA REGIONAL", subs: ["Festas", "Shows", "Eventos"] },
];

export default function Page() {
  const [cidadeSel, setCidadeSel] = useState("Todas");
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleRadio = async () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { try { audioRef.current.volume = 0.8; await audioRef.current.play(); setIsPlaying(true);} catch(e){ alert("Permita áudio no navegador"); }}
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-[90px]">
      <audio ref={audioRef} src={STREAM_URL} preload="none" />

      {/* TOP BAR */}
      <div className="bg-[#0A2342] text-white text-[11px] flex justify-between items-center px-4 py-2">
        <span>REDE NORTE • APUCARANA, ARAPONGAS E VALE DO IVAÍ • 🔴 AO VIVO</span>
        <button onClick={toggleRadio} className={`px-4 py-1 rounded-full font-black text-[11px] ${isPlaying ? "bg-[#FF6B00] text-white animate-pulse" : "bg-white text-[#0A2342]"}`}>
          {isPlaying ? "⏸️ TOCANDO RÁDIO" : "▶ OUÇA AO VIVO"}
        </button>
      </div>

      {/* HEADER COM LOGO NOVO */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* LOGO - usar seu PNG aqui */}
            <div className="relative w-[140px] h-[70px] bg-[#FF6B00] rounded-[12px] flex items-center justify-center overflow-hidden" style={{clipPath: "url(#mapClip)"}}>
              <div className="text-[#0A2342] font-black text-center leading-[0.9] text-[18px]">REDE<br/><span className="text-[28px]">NORTE</span></div>
            </div>
            <div className="hidden md:block">
              <div className="font-black text-[#0A2342] leading-none text-[22px]">REDE NORTE</div>
              <div className="text-[10px] tracking-[0.25em] text-[#FF6B00] font-bold">COMUNICAÇÃO • JORNALISMO REGIONAL</div>
              <div className="text-[10px] text-slate-500">Apucarana • Arapongas • Vale do Ivaí</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-[#0A2342] text-white rounded-full px-4 py-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-[#FF6B00] animate-ping" : "bg-slate-500"}`}></span>
              Rádio Web Apucarana - BRLogic
            </div>
            <div className="bg-slate-100 rounded-full px-3 py-2 flex items-center gap-2">
              <span className="text-slate-400">🔍</span>
              <input placeholder="Buscar notícia..." className="bg-transparent outline-none text-sm w-[180px]" />
            </div>
          </div>
        </div>

        {/* MENU NOVO CONFORME BRIEFING */}
        <nav className="bg-[#0A2342] text-white text-[13px] font-bold border-b-4 border-[#FF6B00]">
          <div className="max-w-[1400px] mx-auto px-2 flex">
            {MENU.map(m => (
              <button key={m.label} onClick={()=> m.isRadio ? toggleRadio() : setMenuAberto(menuAberto===m.label?null:m.label)} className={`px-4 py-3 whitespace-nowrap flex items-center gap-1 ${m.isRadio ? "bg-[#FF6B00] text-[#0A2342]" : ""} ${menuAberto===m.label ? "bg-white text-[#0A2342]" : ""}`}>
                {m.label} {!m.isRadio && <span className="text-[10px]">▼</span>}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex gap-2 overflow-x-auto">
          <span className="text-xs font-bold">📍 Cidade:</span>
          {CIDADES.map(c => (
            <button key={c} onClick={()=>setCidadeSel(c)} className={`px-4 py-1 rounded-full text-xs font-bold border ${cidadeSel===c ? "bg-[#0A2342] text-white border-[#0A2342]" : "bg-white border-slate-200"}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* EXPLICAÇÃO YOUTUBE vs INSTAGRAM */}
      <div className="max-w-[1400px] mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl border p-5">
          <h2 className="font-black text-lg text-[#0A2342]">📹 Estratégia de vídeo: YouTube + Instagram juntos</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-[#0A2342] text-white rounded-xl p-4">
              <div className="font-black text-[#FF6B00]">YOUTUBE - Base do portal</div>
              <ul className="mt-2 space-y-1 text-xs text-slate-200">
                <li>• Hospeda vídeo completo, entrevista, programa</li>
                <li>• Google indexa e aparece no Search</li>
                <li>• Embed no site sem custo de servidor</li>
                <li>• Monetiza com Adsense</li>
                <li>• Fica pra sempre (Instagram some no feed)</li>
              </ul>
            </div>
            <div className="bg-orange-50 border border-[#FF6B00]/30 rounded-xl p-4">
              <div className="font-black text-[#0A2342]">INSTAGRAM - Distribuição</div>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                <li>• Corte de 30-60s com legenda grande</li>
                <li>• CTA: "Veja completo no site - link bio"</li>
                <li>• Leva tráfego pro portal (YouTube não leva)</li>
                <li>• Stories com enquete + link</li>
                <li>• Pacote comercial: corte + post no portal</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-xs bg-amber-100 border border-amber-300 rounded-lg p-3">
            <b>Fluxo ideal:</b> Grava entrevista completa → Sobe no YouTube → Embed automático em /videos/entrevista-X → Corta 3 cortes de 45s → Posta no Instagram Reels com "Assista completo em redenorte.com.br"
          </div>
        </div>
        <div className="bg-[#0A2342] text-white rounded-xl p-5">
          <div className="font-black">✅ RÁDIO JÁ PLUGADA</div>
          <div className="text-xs mt-2 text-slate-300">Mesmo streaming funciona em 2 sites</div>
          <div className="text-[10px] mt-3 font-mono bg-white/10 p-2 rounded break-all">{STREAM_URL}</div>
          <button onClick={toggleRadio} className="mt-4 w-full bg-[#FF6B00] text-white font-black py-3 rounded-full text-sm">{isPlaying ? "⏸️ PAUSAR" : "▶ OUVIR AGORA"}</button>
        </div>
      </div>

      {/* PLAYER FIXO */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A2342] text-white border-t-4 border-[#FF6B00] z-[100]">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={toggleRadio} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black ${isPlaying ? "bg-[#FF6B00]" : "bg-white text-[#0A2342]"}`}>{isPlaying ? "❚❚" : "▶"}</button>
            <div>
              <div className="font-black text-sm">REDE NORTE • Rádio Web Apucarana</div>
              <div className="text-[11px] text-slate-400">AO VIVO • BRLogic Plus • Pode usar nos 2 sites</div>
            </div>
          </div>
          <div className="text-[11px] text-slate-400">🔴 Ouça ao vivo sem parar ao navegar</div>
        </div>
      </div>
    </div>
  );
}
