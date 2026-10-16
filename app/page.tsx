"use client";

import { useEffect, useMemo, useState } from "react";

type Noticia = {
  id: string;
  cidade: string;
  cat: string;
  titulo: string;
  sub: string;
  resumo: string;
  texto: string;
  img: string;
  hora?: string;
  autor?: string;
  credit?: string;
};

const cidades = ["Todas", "Apucarana", "Arapongas", "Arapuã", "Ariranha do Ivaí", "Bom Sucesso", "Borrazópolis", "Califórnia", "Cambira", "Cruzmaltina", "Faxinal", "Godoy Moreira", "Grandes Rios", "Ivaiporã", "Jandaia do Sul", "Jardim Alegre", "Kaloré", "Lidianópolis", "Lunardelli", "Marilândia do Sul", "Marumbi", "Mauá da Serra", "Novo Itacolomi", "Rio Bom", "Rio Branco do Ivaí", "Rosário do Ivaí", "São João do Ivaí", "São Pedro do Ivaí"];
const categorias = ["Todas", "Política", "Cidade", "Segurança", "Mídia", "Esportes"];

const noticiasFixas: Noticia[] = [
  {
    id: "1",
    cidade: "Apucarana",
    cat: "Política",
    titulo: "Datafolha aponta empate técnico entre Flávio Bolsonaro e Lula",
    sub: "Pesquisa mostra Flávio com 51% e Lula com 49% dos votos válidos; rejeição aparece como fator decisivo.",
    resumo: "Nova pesquisa mostra cenário acirrado entre os dois nomes e margem de diferença dentro do empate técnico.",
    texto: "O Datafolha divulgou nesta quinta-feira (15) nova pesquisa mostrando Flávio Bolsonaro com 51% e Lula com 49% dos votos válidos, em empate técnico. A distância, que exclui brancos, nulos e indecisos, era de quatro pontos na semana passada.\n\nJosé Roberto de Toledo analisa que Lula não ganha votos que saem de Flávio, mas pode ser beneficiado pela rejeição. Segundo a pesquisa, Lula é rejeitado por 46% dos eleitores, e Flávio Bolsonaro por 44%.\n\nO governo Lula tem avaliação negativa de 41% e positiva de 35%, segundo o Datafolha. A pesquisa ouviu 2.000 eleitores em todo o país.",
    img: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1400&q=85",
    hora: "09:10",
    autor: "Redação Rede Norte",
    credit: "Imagem ilustrativa / Unsplash",
  },
  {
    id: "2",
    cidade: "Arapongas",
    cat: "Cidade",
    titulo: "Senado aprova maior limite de faturamento do MEI e perdão de dívidas",
    sub: "Medida amplia espaço para microempreendedores e prevê condições especiais para regularização.",
    resumo: "Projeto amplia limite de faturamento para microempreendedores.",
    texto: "O Senado aprovou nesta quinta-feira novas regras para o Microempreendedor Individual. A proposta amplia o limite de faturamento e cria condições para a regularização de dívidas.",
    img: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=1000&q=85",
    hora: "08:42",
    autor: "Redação Rede Norte",
    credit: "Imagem ilustrativa / Unsplash",
  },
  {
    id: "3",
    cidade: "Apucarana",
    cat: "Segurança",
    titulo: "Alcolumbre desiste de votar hoje a PEC da Segurança",
    sub: "Votação fica para a próxima semana após pedido de líderes do Senado.",
    resumo: "Presidente do Senado adiou votação após pedido de líderes.",
    texto: "O presidente do Senado, Davi Alcolumbre, desistiu de votar nesta quinta-feira a PEC da Segurança. A análise deve ser retomada na próxima semana.",
    img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1000&q=85",
    hora: "08:18",
    autor: "Redação Rede Norte",
    credit: "Imagem ilustrativa / Unsplash",
  },
  {
    id: "4",
    cidade: "Ivaiporã",
    cat: "Mídia",
    titulo: "Grupo Globo demite diretor-geral após vazamento de conversas com Vorcaro",
    sub: "Demissão foi comunicada nesta quinta-feira; empresa informou que apura o caso.",
    resumo: "Executivo foi desligado após áudios vazados nas redes sociais.",
    texto: "O Grupo Globo demitiu o diretor-geral após o vazamento de conversas. A empresa informou que a decisão foi tomada nesta quinta-feira.",
    img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1000&q=85",
    hora: "07:55",
    autor: "Redação Rede Norte",
    credit: "Imagem ilustrativa / Unsplash",
  },
];

function formatarNoticiasAdmin(items: any[]): Noticia[] {
  return items.map((n: any, index) => ({
    id: String(n.id ?? `admin-${index}`),
    cidade: n.cidade || "Apucarana",
    cat: n.cat || "Cidade",
    titulo: n.titulo || "Nova notícia",
    sub: n.resumo || "Confira os principais detalhes desta notícia.",
    resumo: n.resumo || "Confira os principais detalhes desta notícia.",
    texto: n.texto || n.resumo || "Confira os principais detalhes desta notícia.",
    img: n.img || noticiasFixas[index % noticiasFixas.length].img,
    hora: n.hora || "Agora",
    autor: n.autor || "Redação Rede Norte",
    credit: n.credit || "Imagem ilustrativa",
  }));
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="news-badge">{children}</span>;
}

function NewsCard({ noticia, onOpen, compact = false }: { noticia: Noticia; onOpen: (n: Noticia) => void; compact?: boolean }) {
  return (
    <button className={`news-card ${compact ? "news-card--compact" : ""}`} onClick={() => onOpen(noticia)}>
      <img src={noticia.img} alt={`Imagem ilustrativa da notícia: ${noticia.titulo}`} loading="lazy" />
      <span className="card-content">
        <span className="card-kicker"><Badge>{noticia.cat}</Badge><span>{noticia.cidade}</span></span>
        <strong>{noticia.titulo}</strong>
        {!compact && <span className="card-summary">{noticia.sub}</span>}
        <span className="card-meta">{noticia.hora || "Agora"} · {noticia.autor || "Redação Rede Norte"}</span>
      </span>
    </button>
  );
}

export default function Page() {
  const [cidade, setCidade] = useState("Todas");
  const [aba, setAba] = useState("noticias");
  const [categoria, setCategoria] = useState("Todas");
  const [sel, setSel] = useState<Noticia | null>(null);
  const [busca, setBusca] = useState("");
  const [noticiasAdmin, setNoticiasAdmin] = useState<any[]>([]);
  const [locaisAdmin, setLocaisAdmin] = useState<any[]>([]);
  const [vagasAdmin, setVagasAdmin] = useState<any[]>([]);
  const [classifAdmin, setClassifAdmin] = useState<any[]>([]);
  const [promocoesAdmin, setPromocoesAdmin] = useState<any[]>([]);

  useEffect(() => {
    try {
      const n = localStorage.getItem("rn_noticias"); if (n) setNoticiasAdmin(JSON.parse(n));
      const l = localStorage.getItem("rn_locais"); if (l) setLocaisAdmin(JSON.parse(l));
      const v = localStorage.getItem("rn_vagas"); if (v) setVagasAdmin(JSON.parse(v));
      const c = localStorage.getItem("rn_classif"); if (c) setClassifAdmin(JSON.parse(c));
      const p = localStorage.getItem("rn_promocoes"); if (p) setPromocoesAdmin(JSON.parse(p));
    } catch { /* mantém conteúdo inicial */ }
  }, []);

  const todas = noticiasAdmin.length ? formatarNoticiasAdmin(noticiasAdmin) : noticiasFixas;
  const filtradas = useMemo(() => todas.filter((n) => {
    const passaCidade = cidade === "Todas" || n.cidade === cidade;
    const passaCategoria = categoria === "Todas" || n.cat === categoria;
    const termo = busca.trim().toLowerCase();
    const passaBusca = !termo || `${n.titulo} ${n.resumo} ${n.cidade} ${n.cat}`.toLowerCase().includes(termo);
    return passaCidade && passaCategoria && passaBusca;
  }), [todas, cidade, categoria, busca]);

  if (sel) {
    return (
      <main className="article-page">
        <header className="article-header">
          <button className="back-button" onClick={() => setSel(null)}>← Voltar às notícias</button>
          <a className="brand brand--small" href="/" onClick={(e) => { e.preventDefault(); setSel(null); }}><span className="brand-mark">RN</span><span>REDE NORTE</span></a>
          <span className="article-header-status"><i /> Jornalismo regional</span>
        </header>
        <article className="article-shell">
          <div className="article-breadcrumb">Início / {sel.cat} / {sel.cidade}</div>
          <div className="article-category"><Badge>{sel.cat}</Badge><span>{sel.cidade}</span></div>
          <h1>{sel.titulo}</h1>
          <p className="article-dek">{sel.sub}</p>
          <div className="article-byline"><span className="avatar">RN</span><span><strong>{sel.autor || "Redação Rede Norte"}</strong><small>Publicado hoje às {sel.hora || "09:10"} · leitura de 2 min</small></span></div>
          <figure className="article-figure"><img src={sel.img} alt={`Imagem ilustrativa da notícia: ${sel.titulo}`} /><figcaption>{sel.credit || "Imagem ilustrativa"}</figcaption></figure>
          <div className="article-body">{sel.texto.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>
          <div className="article-footer-note"><strong>Encontrou um erro?</strong><span> Fale com a redação para solicitar uma correção ou enviar informação.</span></div>
          <section className="related"><div className="section-heading"><span>Leia também</span><i /></div><div className="related-grid">{todas.filter((n) => n.id !== sel.id).slice(0, 3).map((n) => <NewsCard key={n.id} noticia={n} onOpen={setSel} compact />)}</div></section>
        </article>
      </main>
    );
  }

  const destaque = filtradas[0];
  const menores = filtradas.slice(1, 4);
  const ultimas = filtradas.slice(1, 8);

  return (
    <main className="site-shell">
      <div className="topline"><div className="container topline-inner"><span>SEXTA-FEIRA, 16 DE OUTUBRO DE 2026</span><span>Apucarana e região</span><a href="/admin">Acesso da redação</a></div></div>
      <header className="site-header">
        <div className="container header-main"><a className="brand" href="/"><span className="brand-mark">RN</span><span className="brand-name">REDE NORTE <em>DO PARANÁ</em></span></a><div className="header-actions"><button className="live-pill" onClick={() => setAba("noticias")}><i /> AO VIVO</button><label className="search-box"><span>⌕</span><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar notícia" aria-label="Buscar notícia" /></label><button className="menu-button" aria-label="Abrir menu">☰</button></div></div>
        <nav className="main-nav"><div className="container nav-inner">{[["noticias", "Notícias"], ["ondeir", "Onde ir"], ["empregos", "Empregos"], ["compras", "Compras e vendas"], ["promocoes", "Promoções"]].map(([id, label]) => <button className={aba === id ? "active" : ""} key={id} onClick={() => setAba(id)}>{label}</button>)}</div></nav>
      </header>

      <div className="city-nav"><div className="container city-scroll">{cidades.map((c) => <button key={c} className={cidade === c ? "active" : ""} onClick={() => setCidade(c)}>{c}</button>)}</div></div>

      <section className="container editorial-intro"><div><span className="eyebrow">REDE NORTE · JORNALISMO REGIONAL</span><h1>O que acontece perto de você.</h1></div><p>Informação local, serviço e notícias do Paraná com apuração e contexto.</p></section>

      {aba === "noticias" && <>
        <div className="container category-scroll">{categorias.map((c) => <button key={c} className={categoria === c ? "active" : ""} onClick={() => setCategoria(c)}>{c}</button>)}</div>
        <section className="container content-grid">
          <div className="main-column">
            {destaque ? <button className="hero-story" onClick={() => setSel(destaque)}><img src={destaque.img} alt={`Imagem ilustrativa: ${destaque.titulo}`} /><span className="hero-copy"><span className="card-kicker"><Badge>{destaque.cat}</Badge><span>{destaque.cidade} · {destaque.hora}</span></span><strong>{destaque.titulo}</strong><span>{destaque.sub}</span><small>Leia a matéria completa →</small></span></button> : <div className="empty-state">Nenhuma notícia encontrada para os filtros selecionados.</div>}
            {menores.length > 0 && <section className="news-section"><div className="section-heading"><span>Mais notícias</span><i /></div><div className="news-grid">{menores.map((n) => <NewsCard key={n.id} noticia={n} onOpen={setSel} />)}</div></section>}
            <section className="news-section latest-section"><div className="section-heading"><span>Últimas notícias</span><i /><a href="#ultimas">Ver todas →</a></div><div className="latest-list" id="ultimas">{ultimas.map((n) => <button key={n.id} onClick={() => setSel(n)}><span className="latest-time">{n.hora}</span><span><b>{n.cat}</b>{n.titulo}<small>{n.cidade}</small></span><span className="latest-arrow">→</span></button>)}</div></section>
          </div>
          <aside className="sidebar"><div className="live-card"><div className="live-card-head"><span><i /> Rede Norte ao vivo</span><b>REDECAST</b></div><div className="video-placeholder"><span className="play">▶</span><strong>Informação que acompanha<br />o seu dia.</strong><small>Assista à programação no YouTube</small></div><a href="https://www.youtube.com/@redeapucarana" target="_blank" rel="noreferrer">Assista no YouTube →</a></div><div className="flash-card"><span className="flash-label">FLASH</span><strong>Quando começa a valer a escala 5x2?</strong><p>Acompanhe as principais atualizações ao longo do dia.</p></div><div className="newsletter-card"><span className="eyebrow">RECEBA AS NOTÍCIAS</span><strong>Informação local no seu e-mail.</strong><p>As principais notícias de Apucarana e região, sem excesso.</p><button>Quero receber</button></div></aside>
        </section>
      </>}

      {aba === "ondeir" && <section className="container utility-page"><span className="eyebrow">GUIA REGIONAL</span><h2>Onde ir em {cidade}</h2><div className="public-list-grid">{locaisAdmin.filter((l: any) => cidade === "Todas" || l.cidade === cidade).map((l: any) => <button className="public-list-card" key={l.id} onClick={() => setSel({ id: l.id, titulo: l.nome, cidade: l.cidade, cat: l.cat, sub: l.end, resumo: l.detalhes || "Confira os detalhes deste local.", texto: l.detalhes || "Confira os detalhes deste local.", img: l.img || noticiasFixas[1].img, hora: "", autor: "Guia Rede Norte", credit: "Imagem enviada pelo anunciante" })}><img src={l.img || noticiasFixas[1].img} alt={`Imagem de ${l.nome}`} /><span><b>{l.cat}</b><strong>{l.nome}</strong><small>{l.cidade} · {l.end}</small></span></button>)}{!locaisAdmin.length && <div className="empty-state">Em breve, lugares, serviços e experiências da região.</div>}</div></section>}
      {aba === "empregos" && <section className="container utility-page"><span className="eyebrow">OPORTUNIDADES</span><h2>Vagas em {cidade}</h2><div className="utility-list">{vagasAdmin.filter((v: any) => cidade === "Todas" || v.cidade === cidade).map((v: any) => <div key={v.id}><span><strong>{v.cargo}</strong><small>{v.empresa}</small></span><a href={`https://wa.me/${(v.zap || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer">Chamar</a></div>)}{!vagasAdmin.length && <div className="empty-state">Em breve, oportunidades de trabalho da região.</div>}</div></section>}
      {aba === "compras" && <section className="container utility-page"><span className="eyebrow">CLASSIFICADOS REGIONAIS</span><h2>Compras e vendas em {cidade}</h2><div className="public-list-grid">{classifAdmin.filter((c: any) => cidade === "Todas" || c.cidade === cidade).map((c: any) => <button className="public-list-card" key={c.id} onClick={() => setSel({ id: c.id, titulo: c.titulo, cidade: c.cidade, cat: c.cat, sub: c.preco, resumo: c.detalhes || "Veja os detalhes deste anúncio.", texto: c.detalhes || "Veja os detalhes deste anúncio.", img: c.img || noticiasFixas[2].img, hora: "", autor: "Anunciante", credit: "Imagem enviada pelo anunciante" })}><img src={c.img || noticiasFixas[2].img} alt={`Imagem do anúncio: ${c.titulo}`} /><span><b>{c.cat}</b><strong>{c.titulo}</strong><small>{c.cidade} · {c.preco}</small></span></button>)}{!classifAdmin.length && <div className="empty-state">Ainda não há anúncios cadastrados.</div>}</div></section>}
      {aba === "promocoes" && <section className="container utility-page"><span className="eyebrow">OFERTAS DA REGIÃO</span><h2>Promoções em {cidade}</h2><div className="public-list-grid">{promocoesAdmin.filter((p: any) => cidade === "Todas" || p.cidade === cidade).map((p: any) => <button className="public-list-card" key={p.id} onClick={() => setSel({ id: p.id, titulo: p.titulo, cidade: p.cidade, cat: p.categoria, sub: p.validade, resumo: p.detalhes || "Confira os detalhes desta promoção.", texto: p.detalhes || "Confira os detalhes desta promoção.", img: p.img || noticiasFixas[3].img, hora: "", autor: "Rede Norte", credit: "Imagem enviada pelo anunciante" })}><img src={p.img || noticiasFixas[3].img} alt={`Imagem da promoção: ${p.titulo}`} /><span><b>{p.categoria}</b><strong>{p.titulo}</strong><small>{p.cidade} · {p.validade}</small></span></button>)}{!promocoesAdmin.length && <div className="empty-state">Ainda não há promoções cadastradas.</div>}</div></section>}

      <footer className="site-footer"><div className="container footer-grid"><div><a className="brand brand--footer" href="/"><span className="brand-mark">RN</span><span>REDE NORTE</span></a><p>Jornalismo regional para Apucarana e todo o Norte do Paraná.</p></div><div><strong>Redação</strong><a href="/admin">Acesso da redação</a><a href="#">Quem somos</a><a href="#">Contato</a></div><div><strong>Transparência</strong><a href="#">Política de correções</a><a href="#">Privacidade e LGPD</a><a href="#">Publicidade</a></div></div><div className="container footer-bottom"><span>© 2026 Rede Norte do Paraná</span><span>Feito para informar a região.</span></div></footer>
    </main>
  );
}
