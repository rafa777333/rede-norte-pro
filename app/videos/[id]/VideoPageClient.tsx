"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../../lib/supabase";

type Video = {
  id: string;
  titulo: string;
  descricao: string;
  video_url: string | null;
  thumbnail_url: string | null;
  instagram_url: string | null;
  cidade_slug: string | null;
  categoria: string;
  materia_url: string | null;
  tipo: "upload" | "instagram";
  published_at: string;
};

function instagramEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/(reel|p|tv)\/([^/]+)/i);
    return match ? `https://www.instagram.com/${match[1]}/${match[2]}/embed/` : url;
  } catch {
    return url;
  }
}

export default function VideoPage({ params }: { params: { id: string } }) {
  const [video, setVideo] = useState<Video | null>(null);
  const [cidade, setCidade] = useState("Rede Apucarana");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setErro("A conexão com o portal não está disponível.");
        setCarregando(false);
        return;
      }
      const [{ data, error }, { data: city }] = await Promise.all([
        supabase
          .from("videos")
          .select(
            "id,titulo,descricao,video_url,thumbnail_url,instagram_url,cidade_slug,categoria,materia_url,tipo,published_at"
          )
          .eq("id", params.id)
          .eq("status", "published")
          .maybeSingle(),
        supabase.from("cities").select("slug,nome").limit(100),
      ]);
      if (error || !data) setErro("Vídeo não encontrado ou ainda não publicado.");
      else {
        setVideo(data as Video);
        const found = (city || []).find(
          (item: { slug: string; nome: string }) => item.slug === data.cidade_slug
        );
        if (found) setCidade(found.nome);
      }
      setCarregando(false);
    };
    void carregar();
  }, [params.id]);

  const url = useMemo(() => (typeof window === "undefined" ? "" : window.location.href), []);
  const compartilhar = async () => {
    if (!video) return;
    const shareData = { title: video.titulo, text: video.descricao || video.titulo, url };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* cancelado */
      }
    }
    await copiarLink();
  };
  const copiarLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    } catch {
      window.prompt("Copie o link do vídeo:", url);
    }
  };

  if (carregando)
    return (
      <main className="video-detail-page">
        <div className="video-detail-loading">Carregando vídeo…</div>
      </main>
    );
  if (erro || !video)
    return (
      <main className="video-detail-page">
        <div className="video-detail-error">
          <span className="eyebrow">REDE APUCARANA</span>
          <h1>{erro || "Vídeo indisponível"}</h1>
          <a className="video-back-link" href="/">
            Voltar para o portal
          </a>
        </div>
      </main>
    );

  return (
    <main className="video-detail-page">
      <header className="video-detail-header">
        <a className="brand brand--small" href="/">
          <img
            src="/logo-rede-apucarana.png?v=2"
            alt="Logo Rede Apucarana"
            className="brand-mark"
            style={{ objectFit: "cover", width: "36px", height: "36px", padding: 0 }}
          />
          <span>REDE APUCARANA</span>
        </a>
        <a className="video-back-link" href="/">
          ← Voltar
        </a>
      </header>
      <div className="video-detail-layout">
        <section className="video-detail-player">
          {(() => {
            const rawIgUrl =
              video.instagram_url ||
              (video.video_url &&
              (video.video_url.includes("instagram.com/") ||
                video.video_url.includes("instagr.am/"))
                ? video.video_url
                : null);

            if (rawIgUrl) {
              return (
                <div className="video-detail-embed">
                  <iframe
                    src={instagramEmbedUrl(rawIgUrl)}
                    title={video.titulo}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                  />
                  <a href={rawIgUrl} target="_blank" rel="noreferrer">
                    Abrir origem da publicação ↗
                  </a>
                </div>
              );
            }

            return (
              <video
                controls
                playsInline
                preload="metadata"
                poster={video.thumbnail_url || undefined}
              >
                <source src={video.video_url || ""} type="video/mp4" />
                Seu navegador não suporta vídeo HTML5.
              </video>
            );
          })()}
        </section>
        <article className="video-detail-copy">
          <span className="card-kicker">
            <span className="news-badge">{video.categoria}</span>
            <span>{cidade}</span>
          </span>
          <h1>{video.titulo}</h1>
          <p>{video.descricao || "Confira este corte da Rede Apucarana."}</p>
          <small>
            Publicado em {new Date(video.published_at).toLocaleDateString("pt-BR")}
          </small>
          <div className="video-share-actions">
            <button className="share-primary" onClick={() => void compartilhar()}>
              Compartilhar vídeo
            </button>
            <button className="share-secondary" onClick={() => void copiarLink()}>
              {copiado ? "Link copiado" : "Copiar link"}
            </button>
            <a
              className="share-whatsapp"
              href={`https://wa.me/?text=${encodeURIComponent(`${video.titulo} ${url}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              Enviar pelo WhatsApp
            </a>
          </div>
          {video.materia_url && (
            <a className="video-materia-link" href={video.materia_url}>
              Ler a matéria relacionada →
            </a>
          )}
        </article>
      </div>
    </main>
  );
}
