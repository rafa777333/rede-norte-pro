import type { Metadata, Viewport } from "next";
import LocutorClient from "./LocutorClient";

export const metadata: Metadata = {
  title: "Estúdio Móvel • Rede Apucarana",
  description:
    "Transmissão ao vivo simplificada para locutores e repórteres da Rede Apucarana de Comunicação.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Estúdio Móvel",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function LocutorPage() {
  return <LocutorClient />;
}
