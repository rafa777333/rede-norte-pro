"use client";
import Link from 'next/link';
export function Header() {
  return (
    <header className="bg-[#0f172a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex flex-col">
          <span className="text-2xl font-black tracking-tight">REDE NORTE</span>
          <span className="text-[10px] tracking-[0.3em] opacity-70 -mt-1">DE COMUNICAÇÃO</span>
        </Link>
        <div className="hidden md:flex gap-6 text-sm">
          <Link href="/" className="opacity-80 hover:opacity-100">Início</Link>
          <Link href="/apucarana/servicos" className="opacity-80 hover:opacity-100">Serviços</Link>
          <Link href="/apucarana/mercados" className="opacity-80 hover:opacity-100">Mercados</Link>
          <Link href="/admin" className="bg-white text-black px-4 py-2 rounded-full font-bold">Admin</Link>
        </div>
      </div>
      <div className="bg-[#e11d48] text-white text-[11px] py-1">
        <div className="max-w-7xl mx-auto px-4 flex gap-2"><span className="font-bold">REDE APUCARANA AGORA É REDE NORTE</span><span className="opacity-80">• Conectando 8 cidades do Vale do Ivaí</span></div>
      </div>
    </header>
  );
}
