"use client";

import React, { useState } from "react";

interface ArticleImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  fallback?: string;
}

export default function ArticleImage({
  src,
  alt,
  className = "",
  priority = false,
  fallback = "/logo-rede-apucarana.png",
}: ArticleImageProps) {
  const initial = src && typeof src === "string" && src.startsWith("http") ? src : fallback;
  const [imgSrc, setImgSrc] = useState<string>(initial);
  const isFallback = !imgSrc || imgSrc === fallback;

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      className={isFallback ? "w-full h-64 object-contain p-6 bg-slate-900" : className}
      onError={() => {
        if (typeof imgSrc === "string" && imgSrc.startsWith("http://")) {
          setImgSrc(imgSrc.replace(/^http:\/\//i, "https://"));
        } else if (imgSrc !== fallback) {
          setImgSrc(fallback);
        }
      }}
    />
  );
}
