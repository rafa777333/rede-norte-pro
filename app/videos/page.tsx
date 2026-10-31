import PortalClient from "../PortalClient";

export const metadata = {
  title: "Vídeos & Cortes Digitais | Rede Apucarana de Comunicação",
  description: "Assista aos vídeos curtos, reportagens, YouTube Shorts, reels e bastidores de Apucarana e região no portal Rede Apucarana de Comunicação.",
  alternates: {
    canonical: "https://www.redeapucarana.com.br/videos",
  },
  openGraph: {
    title: "Vídeos & Cortes Digitais | Rede Apucarana de Comunicação",
    description: "Assista aos vídeos curtos, reportagens, YouTube Shorts, reels e bastidores de Apucarana e região.",
    url: "https://www.redeapucarana.com.br/videos",
    siteName: "Rede Apucarana de Comunicação",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vídeos & Cortes Digitais | Rede Apucarana de Comunicação",
    description: "Assista aos vídeos curtos, reportagens, YouTube Shorts, reels e bastidores de Apucarana e região.",
  },
};

export default function VideosPage() {
  return <PortalClient initialCity="Geral" initialTab="videos" />;
}
