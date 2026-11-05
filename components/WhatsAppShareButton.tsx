"use client";

import React from "react";

interface WhatsAppShareButtonProps {
  titulo: string;
  href: string;
  className?: string;
  variant?: "pill" | "icon";
}

export default function WhatsAppShareButton({
  titulo,
  href,
  className = "",
  variant = "pill",
}: WhatsAppShareButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const base = typeof window !== "undefined" ? window.location.origin : "https://www.redeapucarana.com.br";
    const fullUrl = href.startsWith("http") ? href : `${base}${href}`;
    const text = encodeURIComponent(`*${titulo}*\n\nLeia mais na Rede Apucarana:\n${fullUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank", "noopener,noreferrer");
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-all shadow-2xs cursor-pointer ${className}`}
        title="Compartilhar no WhatsApp"
        aria-label="Compartilhar no WhatsApp"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.127-.532-1.831-.757-3.003-2.617-3.095-2.738-.09-.12-1.077-1.433-1.077-2.735 0-1.303.682-1.944.924-2.208.241-.264.529-.329.706-.329.176 0 .352.002.507.01.164.009.385-.062.602.459.224.538.762 1.859.829 1.994.066.136.109.296.02.473-.09.177-.135.287-.267.442-.132.155-.278.347-.397.466-.132.133-.27.278-.117.541.154.263.684 1.127 1.468 1.825 1.011.899 1.862 1.178 2.125 1.308.264.13.418.109.574-.07.157-.18.665-.774.843-1.039.177-.264.354-.22.593-.132.24.088 1.52.716 1.78.847.26.13.435.195.5.304.066.109.066.634-.078 1.039z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all shadow-2xs cursor-pointer ${className}`}
      title="Compartilhar no WhatsApp"
      aria-label="Compartilhar no WhatsApp"
    >
      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.127-.532-1.831-.757-3.003-2.617-3.095-2.738-.09-.12-1.077-1.433-1.077-2.735 0-1.303.682-1.944.924-2.208.241-.264.529-.329.706-.329.176 0 .352.002.507.01.164.009.385-.062.602.459.224.538.762 1.859.829 1.994.066.136.109.296.02.473-.09.177-.135.287-.267.442-.132.155-.278.347-.397.466-.132.133-.27.278-.117.541.154.263.684 1.127 1.468 1.825 1.011.899 1.862 1.178 2.125 1.308.264.13.418.109.574-.07.157-.18.665-.774.843-1.039.177-.264.354-.22.593-.132.24.088 1.52.716 1.78.847.26.13.435.195.5.304.066.109.066.634-.078 1.039z" />
      </svg>
      <span>WhatsApp</span>
    </button>
  );
}
