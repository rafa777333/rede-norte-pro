import { CITIES, CITY_MAP } from '@/lib/cities';
import { SERVICES, MARKETS, JOBS, NEWS } from '@/lib/mockData';
import Link from 'next/link';
export function generateStaticParams(){ return CITIES.map(c=>({city:c.slug})); }
export default function CityPage({ params }: { params: { city: string } }){
  const city = CITY_MAP[params.city] || { nome: params.city, slug: params.city };
  const services = SERVICES.filter(s=>s.cidade===city.slug);
  const markets = MARKETS.filter(m=>m.cidade===city.slug);
  const jobs = JOBS.filter(j=>j.cidade===city.slug);
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black">Rede Norte - {city.nome}</h1>
      <p className="text-sm text-zinc-500 mt-2">Notícias globais do Vale + serviços e mercados só de {city.nome}</p>
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Link href={`/${city.slug}/servicos`} className="bg-white rounded-2xl p-6 border"><div className="text-2xl font-black">{services.length}</div><div className="font-bold">Serviços em {city.nome}</div></Link>
        <Link href={`/${city.slug}/mercados`} className="bg-white rounded-2xl p-6 border"><div className="text-2xl font-black">{markets.length}</div><div className="font-bold">Ofertas em {city.nome}</div></Link>
        <Link href={`/${city.slug}/empregos`} className="bg-white rounded-2xl p-6 border"><div className="text-2xl font-black">{jobs.length}</div><div className="font-bold">Vagas em {city.nome}</div></Link>
      </div>
      <div className="mt-8">
        <h2 className="font-black mb-3">Notícias globais (igual pra todo mundo)</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {NEWS.map(n=><div key={n.id} className="bg-white rounded-2xl p-4 border"><div className="text-[10px] opacity-60">{n.categoria}</div><div className="font-bold">{n.titulo}</div></div>)}
        </div>
      </div>
    </div>
  );
}
