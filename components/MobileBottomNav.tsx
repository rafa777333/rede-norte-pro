"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Newspaper, Clapperboard, LayoutGrid, Radio } from "lucide-react";

interface MobileBottomNavProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  onToggleRadio?: () => void;
  radioTocando?: boolean;
}

export default function MobileBottomNav({
  currentTab = "noticias",
  onSelectTab,
  onToggleRadio,
  radioTocando = false,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      if (onSelectTab) onSelectTab("noticias");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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

  const isHome = pathname === "/" && (currentTab === "noticias" || !currentTab);
  const isVideos = pathname === "/videos" || (pathname === "/" && currentTab === "videos");
  const isServicos =
    pathname === "/utilidades" ||
    pathname === "/empregos" ||
    pathname === "/ofertas" ||
    pathname === "/onde-ir";
  const isAoVivo = pathname === "/tv-online" || radioTocando;

  return (
    <nav
      aria-label="Navegação Inferior Estilo App"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex justify-around items-center h-16 md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-1"
    >
      {/* 1. Início (Home) */}
      <Link
        href="/"
        onClick={handleHomeClick}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          isHome
            ? "text-red-600 font-bold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
      >
        <div className={`p-1 rounded-xl transition-transform ${isHome ? "scale-110" : ""}`}>
          <Home className={`w-5 h-5 ${isHome ? "stroke-[2.5]" : "stroke-2"}`} />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight leading-none">Início</span>
      </Link>

      {/* 2. Notícias (Newspaper) */}
      <Link
        href="/#ultimas-noticias"
        onClick={handleNewsClick}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          currentTab === "noticias" && pathname === "/"
            ? "text-red-600 font-bold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
      >
        <div className="p-1 rounded-xl">
          <Newspaper className="w-5 h-5 stroke-2" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight leading-none">Notícias</span>
      </Link>

      {/* 3. Cortes (Clapperboard) */}
      <Link
        href="/videos"
        onClick={() => {
          if (onSelectTab && pathname === "/") onSelectTab("videos");
        }}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          isVideos
            ? "text-red-600 font-bold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
      >
        <div className={`p-1 rounded-xl transition-transform ${isVideos ? "scale-110" : ""}`}>
          <Clapperboard className={`w-5 h-5 ${isVideos ? "stroke-[2.5]" : "stroke-2"}`} />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight leading-none">Cortes</span>
      </Link>

      {/* 4. Serviços (LayoutGrid) */}
      <Link
        href="/utilidades"
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          isServicos
            ? "text-red-600 font-bold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
      >
        <div className={`p-1 rounded-xl transition-transform ${isServicos ? "scale-110" : ""}`}>
          <LayoutGrid className={`w-5 h-5 ${isServicos ? "stroke-[2.5]" : "stroke-2"}`} />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight leading-none">Serviços</span>
      </Link>

      {/* 5. Ao Vivo (Radio com bolinha vermelha pulsante) */}
      <Link
        href="/tv-online"
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          isAoVivo
            ? "text-red-600 font-bold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
      >
        <div className="relative p-1 rounded-xl">
          <Radio className={`w-5 h-5 ${isAoVivo ? "stroke-[2.5]" : "stroke-2"}`} />
          <span className="absolute top-0 right-0 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
          </span>
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight leading-none">Ao Vivo</span>
      </Link>
    </nav>
  );
}
