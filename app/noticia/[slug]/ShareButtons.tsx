"use client";

import React, { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copie o link da notícia:", url);
    }
  };

  const shareNative = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {}
    }
    copy();
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Compartilhar:</span>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} - Leia mais em: ${url}`)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
        title="Compartilhar no WhatsApp"
      >
        <span>WhatsApp</span>
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs"
        title="Compartilhar no Facebook"
      >
        <span>Facebook</span>
      </a>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
        title="Copiar link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700">Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Copiar Link</span>
          </>
        )}
      </button>
    </div>
  );
}
