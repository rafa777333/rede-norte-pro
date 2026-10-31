"use client";

import React from "react";

interface MobileBottomNavProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export default function MobileBottomNav({
  currentTab = "noticias",
  onSelectTab,
}: MobileBottomNavProps) {
  const navItems = [
    {
      id: "inicio",
      label: "Início",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      href: "/",
      action: () => {
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/videos")) {
          window.location.href = "/";
          return;
        }
        if (onSelectTab) onSelectTab("noticias");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      isActive: currentTab === "noticias" || currentTab === "inicio",
    },
    {
      id: "noticias",
      label: "Notícias",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      href: "/",
      action: () => {
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/videos")) {
          window.location.href = "/";
          return;
        }
        if (onSelectTab) onSelectTab("noticias");
        const el = document.getElementById("ultimas") || document.querySelector(".content-grid");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      },
      isActive: currentTab === "noticias",
    },
    {
      id: "jogos",
      label: "Jogos",
      badge: "AO VIVO",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 7l3 2.5v3.5l-3 2.5-3-2.5V9.5L12 7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v4M12 17v4M3.5 9l3.5 1M17 10l3.5-1M4.5 16l3.5-1.5M16 14.5l3.5 1.5" />
        </svg>
      ),
      href: "/esportes",
      isActive: currentTab === "esportes",
    },
    {
      id: "vagas",
      label: "Vagas / Guia",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: () => {
        if (onSelectTab) onSelectTab("empregos");
      },
      isActive: currentTab === "empregos" || currentTab === "ondeir" || currentTab === "compras",
    },
    {
      id: "videos",
      label: "Vídeos",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: "/videos",
      action: () => {
        if (onSelectTab) onSelectTab("videos");
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/videos")) {
          window.history.pushState(null, "", "/videos");
        }
      },
      isActive: currentTab === "videos",
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 flex justify-around items-center py-2 px-1 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      aria-label="Navegação rápida mobile"
    >
      {navItems.map((item) => {
        const activeClass = item.isActive
          ? "text-blue-600 font-bold"
          : "text-slate-500 hover:text-slate-800 font-medium";

        const content = (
          <div className="flex flex-col items-center justify-center relative py-1 px-2 transition-all">
            <div className={`p-1 rounded-xl transition-all ${item.isActive ? "bg-blue-50 text-blue-600 scale-105" : ""}`}>
              {item.icon}
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight ${activeClass}`}>
              {item.label}
            </span>
            {item.badge && (
              <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-red-600 text-white text-[8px] font-black rounded-full leading-tight">
                {item.badge}
              </span>
            )}
          </div>
        );

        if (item.href) {
          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                if (item.action) {
                  e.preventDefault();
                  item.action();
                }
              }}
              className="flex-1 flex justify-center text-decoration-none focus:outline-none"
            >
              {content}
            </a>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={item.action}
            className="flex-1 flex justify-center bg-transparent border-0 focus:outline-none cursor-pointer"
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
