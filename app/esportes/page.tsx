import React from "react";
import FutebolWidget from "../../components/FutebolWidget";

export const metadata = {
  title: "Jogos de Hoje, Placares ao Vivo e Classificação | Rede Apucarana Esportes",
  description: "Acompanhe todos os jogos de futebol ao vivo, placares em tempo real e tabelas completas do Brasileirão Série A, Série B, Copa do Brasil e Libertadores.",
};

export default function EsportesPage() {
  return (
    <main className="site-shell">
      {/* Topline com link de volta */}
      <div className="topline">
        <div className="container topline-inner">
          <span>⚽ CENTRAL DE ESPORTES REDE APUCARANA · AO VIVO</span>
          <a href="/" style={{ color: "#fff", textDecoration: "none" }}>← Voltar para a Página Principal</a>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-main">
          <a className="brand" href="/">
            <img
              src="/logo-rede-apucarana.png?v=2"
              alt="Logo Rede Apucarana"
              className="brand-mark"
              style={{ objectFit: "cover", width: "44px", height: "44px", padding: 0 }}
            />
            <span className="brand-name">
              REDE APUCARANA <em>DE COMUNICAÇÃO</em>
            </span>
          </a>
          <div className="header-actions">
            <a href="/" className="back-button" style={{ textDecoration: "none", color: "#1e293b", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 14px", fontWeight: "700", fontSize: "13px" }}>
              ← Início
            </a>
          </div>
        </div>
      </header>

      <section className="container" style={{ padding: "30px 0 60px" }}>
        <div className="editorial-intro" style={{ borderBottom: "none", paddingBottom: "10px" }}>
          <div>
            <span className="eyebrow">CENTRAL DE JOGOS & PLACARES</span>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0" }}>
              Futebol ao Vivo, Placares e Classificação
            </h1>
          </div>
          <p style={{ maxWidth: "380px" }}>
            Acompanhe o minuto a minuto das principais competições nacionais e internacionais com resultados atualizados via dados oficiais abertos.
          </p>
        </div>

        {/* Widget Completo com Partidas e Tabela de Classificação */}
        <FutebolWidget variant="full" />
      </section>

      {/* Footer simples */}
      <footer className="site-footer" style={{ marginTop: "40px" }}>
        <div className="container footer-bottom" style={{ borderTop: "none", marginTop: 0 }}>
          <span>© {new Date().getFullYear()} Rede Apucarana de Comunicação. Todos os direitos reservados.</span>
          <span>Dados esportivos providos via ESPN Open API</span>
        </div>
      </footer>
    </main>
  );
}
