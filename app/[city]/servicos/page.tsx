import { CITY_MAP, CITIES } from '@/lib/cities';
import { SERVICES } from '@/lib/mockData';
export function generateStaticParams(){ return CITIES.map(c=>({city:c.slug})); }
export default function ServicosCity({ params }: { params:{ city:string } }){
  const city = CITY_MAP[params.city];
  const list = SERVICES.filter(s=>s.cidade===params.city);
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black">Serviços em {city?.nome || params.city}</h1>
      <p className="text-sm text-zinc-500">Conteúdo local - filtrado por cidade</p>
      <div className="grid md:grid-cols-4 gap-4 mt-6">
        {list.map(s=><div key={s.id} className="bg-white rounded-2xl p-4 border"><div className="font-bold">{s.nome}</div><div className="text-xs">{s.categoria}</div><a href={`https://wa.me/${s.whatsapp}`} className="mt-2 block bg-black text-white text-center py-2 rounded-full text-xs">WhatsApp</a></div>)}
      </div>
    </div>
  );
}
