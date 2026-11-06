"use client";

import React from "react";
import Link from "next/link";
import {
  Briefcase,
  Tag,
  Radio,
  HeartPulse,
  MapPin,
  MessageCircle,
} from "lucide-react";

interface MobileSuperAppGridProps {
  onToggleRadio?: () => void;
  radioTocando?: boolean;
}

export default function MobileSuperAppGrid({
  onToggleRadio,
  radioTocando = false,
}: MobileSuperAppGridProps) {
  const WHATSAPP_BRONCA_URL =
    "https://wa.me/5543999809454?text=Ol%C3%A1%2C%20quero%20mandar%20uma%20sugest%C3%A3o%20ou%20bronca%20para%20a%20Rede%20Apucarana";

  return (
    <section
      aria-label="Painel de Ações Rápidas"
      className="block md:hidden px-3.5 py-3 sm:px-4 sm:py-3.5 bg-gradient-to-b from-[#0a192f] via-slate-900 to-slate-900"
    >
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* 1. Vagas de Emprego */}
        <Link
          href="/empregos"
          className="flex flex-col items-center justify-center p-3 rounded-2xl shadow-md bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <Briefcase className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <span className="font-bold text-xs text-white text-center leading-tight">
            Vagas de Emprego
          </span>
        </Link>

        {/* 2. Ofertas do Dia */}
        <Link
          href="/ofertas"
          className="flex flex-col items-center justify-center p-3 rounded-2xl shadow-md bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 active:scale-95 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <Tag className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <span className="font-bold text-xs text-white text-center leading-tight">
            Ofertas do Dia
          </span>
        </Link>

        {/* 3. TV & Rádio */}
        {onToggleRadio ? (
          <button
            type="button"
            onClick={onToggleRadio}
            className="flex flex-col items-center justify-center p-3 rounded-2xl shadow-md bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 active:scale-95 transition-all group text-left cursor-pointer"
          >
            <div className="relative w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5 text-white" strokeWidth={2.4} />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-400 border-2 border-white" />
              </span>
            </div>
            <span className="font-bold text-xs text-white text-center leading-tight">
              {radioTocando ? "Pausar Rádio" : "TV & Rádio"}
            </span>
          </button>
        ) : (
          <Link
            href="/tv-online"
            className="flex flex-col items-center justify-center p-3 rounded-2xl shadow-md bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 active:scale-95 transition-all group"
          >
            <div className="relative w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5 text-white" strokeWidth={2.4} />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-400 border-2 border-white" />
              </span>
            </div>
            <span className="font-bold text-xs text-white text-center leading-tight">
              TV & Rádio
            </span>
          </Link>
        )}

        {/* 4. Farmácias 24h */}
        <Link
          href="/utilidades"
          className="flex flex-col items-center justify-center p-3 rounded-2xl shadow-md bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-95 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <HeartPulse className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <span className="font-bold text-xs text-white text-center leading-tight">
            Farmácias 24h
          </span>
        </Link>

        {/* 5. Onde Ir */}
        <Link
          href="/onde-ir"
          className="flex flex-col items-center justify-center p-3 rounded-2xl shadow-md bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 active:scale-95 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <MapPin className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <span className="font-bold text-xs text-white text-center leading-tight">
            Onde Ir
          </span>
        </Link>

        {/* 6. Mandar Bronca (WhatsApp) */}
        <a
          href={WHATSAPP_BRONCA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 rounded-2xl shadow-md bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 active:scale-95 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <MessageCircle className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <span className="font-bold text-xs text-white text-center leading-tight">
            Mandar Bronca
          </span>
        </a>
      </div>
    </section>
  );
}
