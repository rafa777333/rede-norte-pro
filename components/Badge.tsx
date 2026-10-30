import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  category?: string;
  variant?: "subtle" | "solid";
  size?: "xs" | "sm" | "md";
  className?: string;
  dot?: boolean;
}

export function getCategoryClasses(category?: string, variant: "subtle" | "solid" = "subtle") {
  const cat = (category || "").toLowerCase().trim();

  // Policial / Plantão / Urgência
  if (cat.includes("policial") || cat.includes("plantão") || cat.includes("plantao") || cat.includes("urgente") || cat.includes("segurança")) {
    if (variant === "solid") {
      return "bg-red-600 text-white border-red-700 shadow-sm";
    }
    return "bg-red-50 text-red-700 border-red-200";
  }

  // Esportes / Jogos / Futebol
  if (cat.includes("esporte") || cat.includes("jogo") || cat.includes("futebol") || cat.includes("brasileirão") || cat.includes("libertadores")) {
    if (variant === "solid") {
      return "bg-emerald-600 text-white border-emerald-700 shadow-sm";
    }
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  // Utilidade Pública (Vagas / Classificados / Serviços / Onde Ir / Guia)
  if (
    cat.includes("vaga") ||
    cat.includes("emprego") ||
    cat.includes("classificado") ||
    cat.includes("compra") ||
    cat.includes("venda") ||
    cat.includes("serviço") ||
    cat.includes("servico") ||
    cat.includes("onde ir") ||
    cat.includes("guia") ||
    cat.includes("promoç") ||
    cat.includes("promoc")
  ) {
    if (variant === "solid") {
      return "bg-amber-500 text-white border-amber-600 shadow-sm";
    }
    return "bg-amber-50 text-amber-800 border-amber-200";
  }

  // Política / Paraná / Geral / Brasil / Economia / Mundo / Cidade (Default institucional)
  if (variant === "solid") {
    return "bg-blue-600 text-white border-blue-700 shadow-sm";
  }
  return "bg-blue-50 text-blue-700 border-blue-200";
}

export default function Badge({
  children,
  category,
  variant = "subtle",
  size = "xs",
  className = "",
  dot = false,
}: BadgeProps) {
  const textValue = typeof children === "string" ? children : "";
  const catToUse = category || textValue;
  const colorClasses = getCategoryClasses(catToUse, variant);

  const sizeClasses = {
    xs: "text-[10px] px-2 py-0.5",
    sm: "text-xs px-2.5 py-0.5",
    md: "text-sm px-3 py-1",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border transition-colors ${sizeClasses} ${colorClasses} ${className}`}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  );
}
