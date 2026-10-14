import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "REDE NORTE DE COMUNICAÇÃO | Portal • TV • Rádio • Serviços",
  description: "Jornalismo regional do Norte do Paraná e Vale do Ivaí - Apucarana, Arapongas, Ivaiporã e região. Rádio ao vivo BRLogic.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
