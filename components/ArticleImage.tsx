"use client";

import React, { useState, useEffect } from "react";

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
  const getValidSrc = (val?: string | null) => {
    if (typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/"))) {
      return val;
    }
    return fallback;
  };

  const [imgSrc, setImgSrc] = useState<string>(() => getValidSrc(src));

  useEffect(() => {
    setImgSrc(getValidSrc(src));
  }, [src, fallback]);

  const isFallback = !imgSrc || imgSrc === fallback;

  return (
    <img
      src={imgSrc}
      alt={alt || "Imagem da notícia"}
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
