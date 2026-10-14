import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "REDE NORTE DE COMUNICAÇÃO", description: "Portal regional com admin de notícias" };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
