"use client";
import { useState, useEffect } from 'react';
import { CITIES } from '@/lib/cities';
import { MARKETS as INIT_MARKETS, SERVICES as INIT_SERV, JOBS as INIT_JOBS } from '@/lib/mockData';

export default function Admin(){
  const [tab, setTab] = useState<'mercados'|'servicos'|'vagas'>('mercados');
  const [markets, setMarkets] = useState(INIT_MARKETS);
  const [services, setServices] = useState(INIT_SERV);
  const [jobs, setJobs] = useState(INIT_JOBS);
  const [form, setForm] = useState({ cidade:'apucarana', mercado:'Muffato', produto:'', preco:'', valido:'até 14/10' });
  const [formS, setFormS] = useState({ cidade:'apucarana', nome:'', categoria:'Eletricista', whatsapp:'5543' });
  const [formJ, setFormJ] = useState({ cidade:'apucarana', empresa:'', vaga:'', tipo:'CLT' });

  useEffect(()=>{
    const m = localStorage.getItem('rn_offers'); if(m) try{ setMarkets(JSON.parse(m)); }catch{}
    const s = localStorage.getItem('rn_services'); if(s) try{ setServices(JSON.parse(s)); }catch{}
    const j = localStorage.getItem('rn_jobs'); if(j) try{ setJobs(JSON.parse(j)); }catch{}
  },[]);
  useEffect(()=>{ localStorage.setItem('rn_offers', JSON.stringify(markets)); },[markets]);
  useEffect(()=>{ localStorage.setItem('rn_services', JSON.stringify(services)); },[services]);
  useEffect(()=>{ localStorage.setItem('rn_jobs', JSON.stringify(jobs)); },[jobs]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black">Painel Admin - Rede Norte</h1>
      <p className="text-sm text-zinc-500">Adicione conteúdo por cidade. Salva no seu navegador + Supabase futuro.</p>
      
      <div className="flex gap-2 mt-6">
        <button onClick={()=>setTab('mercados')} className={`px-4 py-2 rounded-full font-bold ${tab==='mercados'?'bg-black text-white':'bg-white border'}`}>Mercados</button>
        <button onClick={()=>setTab('servicos')} className={`px-4 py-2 rounded-full font-bold ${tab==='servicos'?'bg-black text-white':'bg-white border'}`}>Serviços</button>
        <button onClick={()=>setTab('vagas')} className={`px-4 py-2 rounded-full font-bold ${tab==='vagas'?'bg-black text-white':'bg-white border'}`}>Vagas</button>
      </div>

      {tab==='mercados' && (
        <div className="mt-6 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 border">
            <h3 className="font-bold mb-3">Nova Oferta por Cidade</h3>
            <div className="space-y-3">
              <select value={form.cidade} onChange={e=>setForm({...form,cidade:e.target.value})} className="w-full border rounded-full px-4 py-2">
                {CITIES.map(c=><option key={c.slug} value={c.slug}>{c.nome}</option>)}
              </select>
              <input placeholder="Mercado (ex: Muffato)" value={form.mercado} onChange={e=>setForm({...form,mercado:e.target.value})} className="w-full border rounded-full px-4 py-2" />
              <input placeholder="Produto (ex: Arroz 5kg)" value={form.produto} onChange={e=>setForm({...form,produto:e.target.value})} className="w-full border rounded-full px-4 py-2" />
              <input placeholder="Preço (ex: 26.90)" value={form.preco} onChange={e=>setForm({...form,preco:e.target.value})} className="w-full border rounded-full px-4 py-2" />
              <input placeholder="Válido até" value={form.valido} onChange={e=>setForm({...form,valido:e.target.value})} className="w-full border rounded-full px-4 py-2" />
              <button onClick={()=>{
                if(!form.produto || !form.preco) return alert('Preencha produto e preço');
                setMarkets([{ id: Date.now(), mercado: form.mercado, cidade: form.cidade, produto: form.produto, preco: parseFloat(form.preco.replace(',','.')), unidade:'un', valido: form.valido }, ...markets]);
                setForm({...form, produto:'', preco:''});
              }} className="w-full bg-black text-white py-3 rounded-full font-bold">Salvar Oferta em {form.cidade}</button>
            </div>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-auto">
            {markets.map(m=><div key={m.id} className="bg-white p-3 rounded-xl border flex justify-between"><span>{m.produto} - R$ {m.preco} - {m.mercado} - {m.cidade}</span><button onClick={()=>setMarkets(markets.filter(x=>x.id!==m.id))} className="text-red-500">x</button></div>)}
          </div>
        </div>
      )}

      {tab==='servicos' && (
        <div className="mt-6 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 border">
            <h3 className="font-bold mb-3">Novo Serviço por Cidade</h3>
            <div className="space-y-3">
              <select value={formS.cidade} onChange={e=>setFormS({...formS,cidade:e.target.value})} className="w-full border rounded-full px-4 py-2">
                {CITIES.map(c=><option key={c.slug} value={c.slug}>{c.nome}</option>)}
              </select>
              <input placeholder="Nome" value={formS.nome} onChange={e=>setFormS({...formS,nome:e.target.value})} className="w-full border rounded-full px-4 py-2" />
              <input placeholder="Categoria" value={formS.categoria} onChange={e=>setFormS({...formS,categoria:e.target.value})} className="w-full border rounded-full px-4 py-2" />
              <input placeholder="WhatsApp" value={formS.whatsapp} onChange={e=>setFormS({...formS,whatsapp:e.target.value})} className="w-full border rounded-full px-4 py-2" />
              <button onClick={()=>{
                if(!formS.nome) return;
                setServices([{ id: Date.now(), nome: formS.nome, categoria: formS.categoria, cidade: formS.cidade, nota: 5.0, whatsapp: formS.whatsapp }, ...services]);
                setFormS({...formS,nome:''});
              }} className="w-full bg-black text-white py-3 rounded-full font-bold">Salvar Serviço</button>
            </div>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-auto">
            {services.map(s=><div key={s.id} className="bg-white p-3 rounded-xl border flex justify-between"><span>{s.nome} - {s.categoria} - {s.cidade}</span><button onClick={()=>setServices(services.filter(x=>x.id!==s.id))} className="text-red-500">x</button></div>)}
          </div>
        </div>
      )}

      {tab==='vagas' && (
        <div className="mt-6 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 border">
            <h3 className="font-bold mb-3">Nova Vaga por Cidade</h3>
            <div className="space-y-3">
              <select value={formJ.cidade} onChange={e=>setFormJ({...formJ,cidade:e.target.value})} className="w-full border rounded-full px-4 py-2">
                {CITIES.map(c=><option key={c.slug} value={c.slug}>{c.nome}</option>)}
              </select>
              <input placeholder="Empresa" value={formJ.empresa} onChange={e=>setFormJ({...formJ,empresa:e.target.value})} className="w-full border rounded-full px-4 py-2" />
              <input placeholder="Vaga" value={formJ.vaga} onChange={e=>setFormJ({...formJ,vaga:e.target.value})} className="w-full border rounded-full px-4 py-2" />
              <button onClick={()=>{
                if(!formJ.vaga) return;
                setJobs([{ id: Date.now(), empresa: formJ.empresa, vaga: formJ.vaga, cidade: formJ.cidade, tipo: formJ.tipo }, ...jobs]);
                setFormJ({...formJ,vaga:''});
              }} className="w-full bg-black text-white py-3 rounded-full font-bold">Salvar Vaga</button>
            </div>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-auto">
            {jobs.map(j=><div key={j.id} className="bg-white p-3 rounded-xl border flex justify-between"><span>{j.vaga} - {j.empresa} - {j.cidade}</span><button onClick={()=>setJobs(jobs.filter(x=>x.id!==j.id))} className="text-red-500">x</button></div>)}
          </div>
        </div>
      )}
    </div>
  );
}
