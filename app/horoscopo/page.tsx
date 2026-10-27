const signos = [
  ["Áries", "Coragem para começar e clareza para escolher suas prioridades."],
  ["Touro", "Valorize o que é sólido e avance sem pressa nas decisões importantes."],
  ["Gêmeos", "Uma conversa pode abrir uma oportunidade inesperada hoje."],
  ["Câncer", "Cuide da sua energia e aproxime-se de quem traz acolhimento."],
  ["Leão", "Sua criatividade ganha força quando você assume a liderança."],
  ["Virgem", "Organização e atenção aos detalhes ajudam a destravar a rotina."],
  ["Libra", "Busque equilíbrio sem deixar que a opinião dos outros decida por você."],
  ["Escorpião", "Transformações discretas podem preparar uma fase mais potente."],
  ["Sagitário", "Planeje o próximo passo, mas mantenha espaço para o inesperado."],
  ["Capricórnio", "Disciplina e constância aproximam você de um resultado importante."],
  ["Aquário", "Uma ideia diferente pode inspirar pessoas ao seu redor."],
  ["Peixes", "Intuição e sensibilidade ajudam a perceber o melhor momento de agir."],
];

export default function HoroscopoPage() {
  return (
    <main className="utility-page horoscope-page">
      <div className="container">
        <a className="eyebrow" href="/">← Voltar para a Rede Apucarana</a>
        <span className="eyebrow horoscope-kicker">PREVISÃO DO DIA · REDE APUCARANA</span>
        <h1>Horóscopo</h1>
        <p className="horoscope-intro">
          Confira as previsões dos 12 signos e acompanhe as atualizações diárias da Rede Apucarana.
        </p>
        <div className="horoscope-page-grid">
          {signos.map(([nome, texto]) => (
            <article className="horoscope-page-card" key={nome}>
              <span className="horoscope-glyph">✦</span>
              <h2>{nome}</h2>
              <p>{texto}</p>
              <small>Previsão de hoje</small>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
