"use client";
import { useState } from 'react';
import { CITIES } from '@/lib/cities';
export default function AnunciarVaga(){
  const [ok,setOk]=useState(false);
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black">Anunciar Vaga - Rede Norte</h1>
      <p className="text-sm text-zinc-500 mt-2">Preencha, escolha a cidade e cai no admin para aprovação. Grátis para empresas da região.</p>
      {!ok ? (
        <form onSubmit={e=>{e.preventDefault(); setOk(true);}} className="mt-6 space-y-4 bg-white p-6 rounded-2xl border">
          <select className="w-full border rounded-full px-4 py-3" required><option value="">Escolha a cidade</option>{CITIES.map(c=><option key={c.slug} value={c.slug}>{c.nome}</option>)}</select>
          <input className="w-full border rounded-full px-4 py-3" placeholder="Nome da empresa" required />
          <input className="w-full border rounded-full px-4 py-3" placeholder="Vaga (ex: Auxiliar de Produção)" required />
          <input className="w-full border rounded-full px-4 py-3" placeholder="WhatsApp para contato" required />
          <button className="w-full bg-black text-white py-3 rounded-full font-bold">Enviar Vaga</button>
        </form>
      ) : (
        <div className="mt-6 bg-green-50 border border-green-200 p-6 rounded-2xl text-center"><div className="text-2xl">✅</div><div className="font-bold mt-2">Vaga enviada!</div><div className="text-sm">Nossa equipe vai aprovar e já aparece na cidade escolhida.</div></div>
      )}
    </div>
  );
}
