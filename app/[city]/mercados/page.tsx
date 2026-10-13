import { CITY_MAP, CITIES } from '@/lib/cities';
import { MARKETS } from '@/lib/mockData';
export function generateStaticParams(){ return CITIES.map(c=>({city:c.slug})); }
export default function MercadosCity({ params }: { params:{ city:string } }){
  const city = CITY_MAP[params.city];
  const list = MARKETS.filter(m=>m.cidade===params.city);
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black">Ofertas em {city?.nome || params.city}</h1>
      <p className="text-sm text-zinc-500">Radar de economia - conteúdo local gratuito</p>
      <div className="grid md:grid-cols-4 gap-4 mt-6">
        {list.map(m=><div key={m.id} className="bg-white rounded-2xl p-4 border"><div className="text-[10px] font-bold">{m.mercado}</div><div className="font-bold">{m.produto}</div><div className="text-2xl font-black">R$ {m.preco.toFixed(2)}</div><div className="text-xs">{m.valido}</div></div>)}
      </div>
    </div>
  );
}
