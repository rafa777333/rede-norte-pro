import { CITY_MAP, CITIES } from '@/lib/cities';
import { JOBS } from '@/lib/mockData';
export function generateStaticParams(){ return CITIES.map(c=>({city:c.slug})); }
export default function EmpregosCity({ params }: { params:{ city:string } }){
  const city = CITY_MAP[params.city];
  const list = JOBS.filter(j=>j.cidade===params.city);
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black">Vagas em {city?.nome || params.city}</h1>
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        {list.map(j=><div key={j.id} className="bg-white rounded-2xl p-4 border"><div className="font-bold">{j.vaga}</div><div className="text-xs text-zinc-500">{j.empresa} • {j.tipo}</div></div>)}
      </div>
    </div>
  );
}
