import PortalClient from "./PortalClient";
import { getInitialPortalData } from "@/lib/portal-data";

export const revalidate = 60; // ISR - revalidação inteligente a cada 60 segundos

export const metadata = {
  title: "Rede Apucarana de Comunicação | Jornalismo, Rádio, TV e Esportes",
  description: "Super-Portal de notícias de Apucarana, Arapongas e Vale do Ivaí. Jornalismo regional em tempo real, rádio ao vivo, web TV, previsão do tempo e classificados.",
  alternates: {
    canonical: "https://www.redeapucarana.com.br",
  },
  openGraph: {
    title: "Rede Apucarana de Comunicação | Jornalismo, Rádio, TV e Esportes",
    description: "Super-Portal de notícias de Apucarana, Arapongas e Vale do Ivaí.",
    url: "https://www.redeapucarana.com.br",
    siteName: "Rede Apucarana de Comunicação",
    locale: "pt_BR",
    type: "website",
  },
};

export default async function HomePage() {
  const initialData = await getInitialPortalData("Geral");

  return (
    <PortalClient
      initialCity="Geral"
      initialData={initialData}
    />
  );
}
