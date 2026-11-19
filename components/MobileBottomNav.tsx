"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Newspaper,
  Tv,
  ShoppingBag,
  Briefcase,
  Compass,
  Tag,
} from "lucide-react";

interface MobileBottomNavProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  onToggleRadio?: () => void;
  radioTocando?: boolean;
}

export default function MobileBottomNav({
  currentTab = "noticias",
  onSelectTab,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  const handleNewsClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      if (onSelectTab) onSelectTab("noticias");
      const el = document.getElementById("ultimas-noticias");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const isNoticias =
    pathname === "/noticias" ||
    pathname.startsWith("/noticia") ||
    ((pathname === "/" || !pathname) && currentTab === "noticias");

  const isTv =
    pathname === "/tv-online" ||
    pathname.startsWith("/videos") ||
    currentTab === "tv" ||
    currentTab === "videos";

  const isCompras =
    pathname.startsWith("/comprasevendas") ||
    pathname.startsWith("/classificados") ||
    currentTab === "compras";

  const isEmpregos =
    pathname.startsWith("/empregos") ||
    currentTab === "empregos";

  const isOndeIr =
    pathname.startsWith("/onde-ir") ||
    currentTab === "onde-ir";

  const isPromocoes =
    pathname.startsWith("/ofertas") ||
    currentTab === "ofertas" ||
    currentTab === "promocoes";

  return (
    <nav
      aria-label="Navegação Principal do Aplicativo"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-md border-t border-slate-200/90 flex items-center justify-between h-15 md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-0.5"
    >
      {/* 1. Notícias */}
      <Link
        href="/noticias"
        onClick={handleNewsClick}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          isNoticias
            ? "text-red-600 font-extrabold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
        title="Notícias da Região"
      >
        <div className={`p-1 rounded-xl transition-transform ${isNoticias ? "scale-110" : ""}`}>
          <Newspaper className={`w-4.5 h-4.5 ${isNoticias ? "stroke-[2.5]" : "stroke-2"}`} />
        </div>
        <span className="text-[9px] tracking-tight leading-none">Notícias</span>
      </Link>

      {/* 2. TV ao Vivo */}
      <Link
        href="/tv-online"
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          isTv
            ? "text-red-600 font-extrabold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
        title="TV Rede Apucarana Ao Vivo"
      >
        <div className={`relative p-1 rounded-xl transition-transform ${isTv ? "scale-110" : ""}`}>
          <Tv className={`w-4.5 h-4.5 ${isTv ? "stroke-[2.5]" : "stroke-2"}`} />
          <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
          </span>
        </div>
        <span className="text-[9px] tracking-tight leading-none">TV ao Vivo</span>
      </Link>

      {/* 3. Compras e Vendas */}
      <Link
        href="/comprasevendas"
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          isCompras
            ? "text-orange-600 font-extrabold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
        title="Classificados e Compras & Vendas"
      >
        <div className={`p-1 rounded-xl transition-transform ${isCompras ? "scale-110" : ""}`}>
          <ShoppingBag className={`w-4.5 h-4.5 ${isCompras ? "stroke-[2.5]" : "stroke-2"}`} />
        </div>
        <span className="text-[9px] tracking-tight leading-none">Compras</span>
      </Link>

      {/* 4. Empregos */}
      <Link
        href="/empregos"
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          isEmpregos
            ? "text-blue-600 font-extrabold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
        title="Vagas de Emprego no Vale do Ivaí"
      >
        <div className={`p-1 rounded-xl transition-transform ${isEmpregos ? "scale-110" : ""}`}>
          <Briefcase className={`w-4.5 h-4.5 ${isEmpregos ? "stroke-[2.5]" : "stroke-2"}`} />
        </div>
        <span className="text-[9px] tracking-tight leading-none">Empregos</span>
      </Link>

      {/* 5. Para Onde Ir */}
      <Link
        href="/onde-ir"
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          isOndeIr
            ? "text-amber-600 font-extrabold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
        title="Guia Gastronômico e de Lazer"
      >
        <div className={`p-1 rounded-xl transition-transform ${isOndeIr ? "scale-110" : ""}`}>
          <Compass className={`w-4.5 h-4.5 ${isOndeIr ? "stroke-[2.5]" : "stroke-2"}`} />
        </div>
        <span className="text-[9px] tracking-tight leading-none">Onde Ir</span>
      </Link>

      {/* 6. Promoções */}
      <Link
        href="/ofertas"
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          isPromocoes
            ? "text-emerald-600 font-extrabold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
        title="Encartes e Promoções do Dia"
      >
        <div className={`p-1 rounded-xl transition-transform ${isPromocoes ? "scale-110" : ""}`}>
          <Tag className={`w-4.5 h-4.5 ${isPromocoes ? "stroke-[2.5]" : "stroke-2"}`} />
        </div>
        <span className="text-[9px] tracking-tight leading-none">Promoções</span>
      </Link>
    </nav>
  );
}
