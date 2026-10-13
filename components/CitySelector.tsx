"use client";
import { CITIES } from '@/lib/cities';

export function CitySelector({ selected, onSelect }: { selected: string; onSelect: (s:string)=>void }) {
  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto">
        <div className="text-xs font-bold tracking-widest text-zinc-500 whitespace-nowrap">VOCÊ ESTÁ VENDO:</div>
        <div className="flex gap-2">
          <button onClick={()=>onSelect('todas')} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${selected==='todas' ? 'city-pill-active' : 'city-pill'}`}>Todas as cidades</button>
          {CITIES.map(c=>(
            <button key={c.slug} onClick={()=>onSelect(c.slug)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${selected===c.slug ? 'city-pill-active' : 'city-pill hover:border-zinc-400'}`}>{c.nome}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
