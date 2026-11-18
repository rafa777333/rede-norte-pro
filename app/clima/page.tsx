import React from "react";
import PortalClient from "../PortalClient";

export const revalidate = 60; // ISR - atualiza previsões e clima a cada 60s

export const metadata = {
  title: "Previsão do Tempo e Clima no Vale do Ivaí e Paraná | Rede Apucarana",
  description:
    "Acompanhe a previsão do tempo em tempo real para Apucarana, Arapongas, Ivaiporã e todas as 27 cidades do Vale do Ivaí. Temperatura, chuva, radar e previsão de 7 dias.",
  alternates: { canonical: "https://www.redeapucarana.com.br/clima" },
};

export default function ClimaPage() {
  return <PortalClient initialTab="clima" initialCity="Apucarana" />;
}
