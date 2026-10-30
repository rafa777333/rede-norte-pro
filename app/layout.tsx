import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "Rede Apucarana de Comunicação | Jornalismo, Rádio, TV e Esportes",
  description: "Notícias de Apucarana, Arapongas e Vale do Ivaí com informação local, esportes ao vivo, rádio, vídeos e utilidade pública.",
  metadataBase: new URL("https://www.redeapucarana.com.br"),
  openGraph: {
    title: "Rede Apucarana de Comunicação | Jornalismo, Rádio, TV e Esportes",
    description: "Informação local, serviço e notícias do Paraná.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body className="bg-slate-50 text-slate-800 antialiased font-sans">{children}</body>
    </html>
  );
}
