import Link from "next/link";

const playerUrl = "https://playerv.samcast.com.br/video-chat/tvapucarana/VTNSdGRqRXVjMkZ0WTJGemRDNWpiMjB1WW5JPSta/true//nao/true";

export const metadata = {
  title: "TV Apucarana ao vivo | Rede Norte",
  description: "Assista à programação ao vivo da TV Apucarana no portal Rede Norte.",
};

export default function TvOnlinePage() {
  return (
    <main className="tv-page">
      <div className="topline">
        <div className="container topline-inner">
          <span>REDE NORTE · TV ONLINE</span>
          <span>Apucarana e região</span>
          <Link href="/admin">Acesso da redação</Link>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-main">
          <Link className="brand" href="/">
            <span className="brand-mark">RN</span>
            <span className="brand-name">REDE NORTE <em>DO PARANÁ</em></span>
          </Link>
          <Link className="tv-back-link" href="/">← Voltar para notícias</Link>
        </div>
      </header>

      <section className="container tv-hero">
        <span className="eyebrow">TRANSMISSÃO OFICIAL</span>
        <div className="tv-heading-row">
          <div>
            <h1>TV Apucarana ao vivo.</h1>
            <p>Acompanhe a programação da nossa TV online diretamente pelo Rede Norte.</p>
          </div>
          <span className="tv-live-status"><i /> AO VIVO</span>
        </div>
      </section>

      <section className="container tv-player-section" aria-label="Player da TV Apucarana">
        <div className="tv-player-frame">
          <iframe
            src={playerUrl}
            title="TV Apucarana ao vivo"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="tv-player-footer">
          <div>
            <strong>TV APUCARANA</strong>
            <span>Conectada com você</span>
          </div>
          <a href={playerUrl} target="_blank" rel="noreferrer">Abrir transmissão em nova aba ↗</a>
        </div>
      </section>

      <section className="container tv-info-grid">
        <article className="tv-info-card tv-info-card--dark">
          <span className="eyebrow">PROGRAMAÇÃO</span>
          <h2>Informação, notícias e conteúdo regional.</h2>
          <p>Quando a transmissão estiver disponível, ela aparecerá neste player oficial. Se o vídeo não carregar, use o botão para abrir a transmissão em uma nova aba.</p>
        </article>
        <article className="tv-info-card">
          <span className="eyebrow">REDE NORTE</span>
          <h2>Continue acompanhando as notícias.</h2>
          <p>Volte para a página inicial e confira as matérias mais recentes de Apucarana e do Norte do Paraná.</p>
          <Link className="tv-primary-link" href="/">Ver últimas notícias →</Link>
        </article>
      </section>

      <footer className="site-footer tv-footer">
        <div className="container footer-grid">
          <div>
            <Link className="brand brand--footer" href="/"><span className="brand-mark">RN</span><span>REDE NORTE</span></Link>
            <p>Jornalismo regional para Apucarana e todo o Norte do Paraná.</p>
          </div>
          <div><strong>TV online</strong><Link href="/tv-online">Assistir ao vivo</Link><a href="https://www.tvapucarana.com.br/" target="_blank" rel="noreferrer">Site da TV Apucarana</a></div>
          <div><strong>Redação</strong><Link href="/admin">Acesso da redação</Link><Link href="/">Notícias</Link></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 Rede Norte do Paraná</span><span>Feito para informar a região.</span></div>
      </footer>
    </main>
  );
}
