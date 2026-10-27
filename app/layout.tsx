import "./globals.css";

export const metadata = {
  title: "Rede Apucarana de Comunicação | Jornalismo regional",
  description: "Notícias de Apucarana e do Norte do Paraná, com informação local, serviço e contexto.",
  metadataBase: new URL("https://www.redeapucarana.com.br"),
  openGraph: {
    title: "Rede Apucarana de Comunicação | Jornalismo regional",
    description: "Informação local, serviço e notícias do Paraná.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
