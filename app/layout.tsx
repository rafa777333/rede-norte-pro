import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "REDE NORTE DE COMUNICAÇÃO", description: "Portal regional com Onde Ir e Empregos" };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
