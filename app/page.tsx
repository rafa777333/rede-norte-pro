import PortalClient from "./PortalClient";

export const metadata = {
  title: "Rede Apucarana de Comunicação | Jornalismo, Podcasts, Rádio e TV",
  description: "As principais notícias de Apucarana, Arapongas e do Vale do Ivaí com rádio ao vivo, web TV, previsão do tempo e classificados.",
};

export default function HomePage() {
  return <PortalClient initialCity="Geral" />;
}
