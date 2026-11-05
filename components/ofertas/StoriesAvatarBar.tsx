"use client";

import React from "react";
import { RetailerItem } from "@/types/ofertas";

interface StoriesAvatarBarProps {
  retailers: RetailerItem[];
  onSelectRetailer: (retailer: RetailerItem) => void;
}

export default function StoriesAvatarBar({
  retailers,
  onSelectRetailer,
}: StoriesAvatarBarProps) {
  return (
    <div className="w-full my-6 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-base">📸</span>
          <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
            Encartes em Stories · Folhetos Digitais do Dia
          </span>
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Toque para folhear ofertas no formato Stories
        </span>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
        {retailers.map((r) => {
          const itemsCount = r.storiesItems?.length || 0;

          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRetailer(r)}
              className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            >
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-emerald-500 via-amber-400 to-red-500 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                <div className="p-0.5 bg-white rounded-full">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                    <img
                      src={r.logo}
                      alt={r.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>

                {r.isVip && (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full border border-white shadow">
                    VIP
                  </span>
                )}
              </div>

              <div className="w-20 text-center">
                <span className="font-bold text-[11px] text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                  {r.name}
                </span>
                <span className="text-[10px] text-slate-600 block font-semibold leading-tight">
                  {itemsCount} ofertas
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
