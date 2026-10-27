import { notFound } from "next/navigation";
import PortalClient from "../../PortalClient";

const CITY_NAMES: Record<string, string> = {
  apucarana: "Apucarana",
  arapongas: "Arapongas",
  arapua: "Arapuã",
  "ariranha-do-ivai": "Ariranha do Ivaí",
  "bom-sucesso": "Bom Sucesso",
  borrazopolis: "Borrazópolis",
  california: "Califórnia",
  cambira: "Cambira",
  cruzmaltina: "Cruzmaltina",
  faxinal: "Faxinal",
  "godoy-moreira": "Godoy Moreira",
  "grandes-rios": "Grandes Rios",
  ivaipora: "Ivaiporã",
  "jandaia-do-sul": "Jandaia do Sul",
  "jardim-alegre": "Jardim Alegre",
  kalore: "Kaloré",
  lidianopolis: "Lidianópolis",
  lunardelli: "Lunardelli",
  "marilandia-do-sul": "Marilândia do Sul",
  marumbi: "Marumbi",
  "maua-da-serra": "Mauá da Serra",
  "novo-itacolomi": "Novo Itacolomi",
  "rio-bom": "Rio Bom",
  "rio-branco-do-ivai": "Rio Branco do Ivaí",
  "rosario-do-ivai": "Rosário do Ivaí",
  "sao-joao-do-ivai": "São João do Ivaí",
  "sao-pedro-do-ivai": "São Pedro do Ivaí",
};

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const name = CITY_NAMES[slug];
  if (!name) return { title: "Cidade não encontrada | Rede Apucarana" };
  return {
    title: `${name}: Notícias, Rádio, TV e Serviços | Rede Apucarana de Comunicação`,
    description: `Acompanhe as últimas notícias, empresas, vagas e acontecimentos de ${name} e do Vale do Ivaí no portal Rede Apucarana.`,
    alternates: { canonical: `https://www.redeapucarana.com.br/cidades/${slug}` },
  };
}

export default function CityPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const cityName = CITY_NAMES[slug];
  if (!cityName) notFound();

  return <PortalClient initialCity={cityName} />;
}
