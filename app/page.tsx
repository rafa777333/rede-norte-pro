"use client";
import { useState, useEffect } from 'react';
import { CitySelector } from '@/components/CitySelector';
import { NEWS, SERVICES, MARKETS, JOBS } from '@/lib/mockData';
import { CITIES } from '@/lib/cities';
import Link from 'next/link';

export default function Home() {
  const [city, setCity] = useState('todas');
  const [offers, setOffers] = useState(MARKETS);
  const [services, setServices] = useState(SERVICES);
  const [jobs, setJobs] = useState(JOBS);

  useEffect(()=>{
    const saved = localStorage.getItem('rn_offers');
    if(saved) try{ setOffers(JSON.parse(saved)); }catch{}
    const savedS = localStorage.getItem('rn_services');
    if(savedS) try{ setServices(JSON.parse(savedS)); }catch{}
    const savedJ = localStorage.getItem('rn_jobs');
    if(savedJ) try{ setJobs(JSON.parse(savedJ)); }catch{}
    const savedCity = localStorage.getItem('rn_city');
    if(savedCity) setCity(savedCity);
  },[]);
  useEffect(()=>{ localStorage.setItem('rn_city', city); },[city]);

  const filteredServices = city==='todas' ? services : services.filter(s=>s.cidade===city);
  const filteredMarkets = city==='todas' ? offers : offers.filter(m=>m.cidade===city);
  const filteredJobs = city==='todas' ? jobs : jobs.filter(j=>j.cidade===city);
  const cityName = city==='todas' ? 'Todas as cidades' : (CITIES.find(c=>c.slug===city)?.nome || city);

  // radar economia - produto mais barato por cidade
  const cheapest = (() => {
    if(city==='todas' || filteredMarkets.length===0) return null;
    const grouped: any = {};
    filteredMarkets.forEach(o=>{
      if(!grouped[o.produto] || o.preco < grouped[o.produto].preco) grouped[o.produto]=o;
    });
    return Object.values(grouped).slice(0,3) as any[];
  })();

  return (
    <main>
      <CitySelector selected={city} onSelect={setCity} />
      
      {/* HERO NEWS - GLOBAL */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-black text-white text-[10px] px-2 py-1 rounded font-bold tracking-widest">CONTEÚDO GLOBAL</span>
          <h2 className="text-xl font-black">NOTÍCIAS - VALE TODO</h2>
          <span className="text-xs text-zinc-500">Mesma notícia pra todas as cidades</span>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {NEWS.map(n=>(
            <div key={n.id} className={`bg-white rounded-2xl p-4 border shadow-sm ${n.destaque ? 'md:col-span-2 bg-zinc-900 text-white' : ''}`}>
              <div className="text-[10px] font-bold tracking-widest opacity-60 mb-2">{n.categoria} • {n.tempo}</div>
              <div className="font-bold leading-tight">{n.titulo}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ECONOMIA */}
      {cheapest && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-[#e11d48] text-white rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="font-black">💰 RADAR ECONOMIA - {cityName.toUpperCase()}: onde tá mais barato hoje</div>
            <div className="flex gap-2 flex-wrap">
              {cheapest.map((c:any)=><span key={c.id} className="bg-white text-black text-xs px-3 py-1 rounded-full font-bold">{c.produto} R$ {c.preco} no {c.mercado}</span>)}
            </div>
          </div>
        </section>
      )}

      {/* SERVIÇOS LOCAL */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="bg-[#0f172a] text-white text-[10px] px-2 py-1 rounded font-bold tracking-widest">CONTEÚDO LOCAL</span>
            <h2 className="text-xl font-black">Serviços em {cityName}</h2>
          </div>
          <Link href={`/${city==='todas'?'apucarana':city}/servicos`} className="text-sm font-bold underline">Ver todos</Link>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {filteredServices.slice(0,8).map(s=>(
            <div key={s.id} className="bg-white rounded-2xl p-4 border">
              <div className="text-[10px] bg-zinc-100 px-2 py-1 rounded-full inline-block mb-2 font-bold">{s.categoria} • {s.cidade}</div>
              <div className="font-bold">{s.nome}</div>
              <div className="text-xs text-zinc-500 mt-1">★ {s.nota} • Verificado</div>
              <a href={`https://wa.me/${s.whatsapp}`} target="_blank" className="mt-3 block text-center bg-black text-white text-xs py-2 rounded-full font-bold">WhatsApp</a>
            </div>
          ))}
        </div>
      </section>

      {/* MERCADOS LOCAL */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-[#0f172a] text-white text-[10px] px-2 py-1 rounded font-bold tracking-widest">CONTEÚDO LOCAL</span>
          <h2 className="text-xl font-black">Ofertas dos Mercados em {cityName}</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {filteredMarkets.slice(0,8).map(m=>(
            <div key={m.id} className="bg-white rounded-2xl p-4 border">
              <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold bg-zinc-900 text-white px-2 py-1 rounded-full">{m.mercado}</span><span className="text-[10px] text-zinc-500">{m.cidade} • {m.valido}</span></div>
              <div className="font-bold leading-tight">{m.produto}</div>
              <div className="text-2xl font-black mt-2">R$ {m.preco.toFixed(2).replace('.',',')}</div>
              <div className="text-[11px] text-zinc-500">Economia de até R$ 2,60 vs concorrente</div>
            </div>
          ))}
        </div>
      </section>

      {/* VAGAS LOCAL */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-[#0f172a] text-white text-[10px] px-2 py-1 rounded font-bold tracking-widest">CONTEÚDO LOCAL</span>
          <h2 className="text-xl font-black">Vagas em {cityName}</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {filteredJobs.slice(0,6).map(j=>(
            <div key={j.id} className="bg-white rounded-2xl p-4 border flex justify-between items-center">
              <div><div className="font-bold">{j.vaga}</div><div className="text-xs text-zinc-500">{j.empresa} • {j.cidade} • {j.tipo}</div></div>
              <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-full">Ver</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
