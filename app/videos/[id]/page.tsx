import type { Metadata } from "next";
import { getSupabase } from "../../../lib/supabase";
import VideoPageClient from "./VideoPageClient";

export const revalidate = 60;

type Props = { params: { id: string } };

async function getVideo(id: string) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("videos").select("id,titulo,descricao,thumbnail_url,instagram_url,cidade_slug,categoria,materia_url,tipo,published_at").eq("id", id).eq("status", "published").maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const video = await getVideo(params.id);
  const title = video?.titulo || "Vídeo Rede Norte";
  const description = video?.descricao || "Assista ao vídeo da Rede Norte do Paraná.";
  const image = video?.thumbnail_url || `https://www.redeapucarana.com.br/videos/${params.id}/opengraph-image`;
  const url = `https://www.redeapucarana.com.br/videos/${params.id}`;
  return {
    title: `${title} | Rede Norte`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Rede Norte do Paraná",
      locale: "pt_BR",
      type: "article",
      publishedTime: video?.published_at || undefined,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function VideoPage({ params }: Props) {
  return <VideoPageClient params={params} />;
}
