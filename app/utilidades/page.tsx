import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Utilidade Pública de Apucarana e Vale do Ivaí | Telefones Úteis, Plantão e Serviços",
  description:
    "Guia completo de utilidade pública em Apucarana e região: telefones de emergência (SAMU, Bombeiros, Polícia), farmácias de plantão, serviços de água e luz (Sanepar, Copel) e atendimento ao cidadão.",
  keywords: [
    "utilidade pública apucarana",
    "telefones de emergência apucarana",
    "farmácias de plantão apucarana",
    "samu apucarana 192",
    "bombeiros apucarana 193",
    "sanepar apucarana",
    "copel apucarana",
  ],
};

const EMERGENCY_CONTACTS = [
  { name: "SAMU (Urgência Médica)", number: "192", desc: "Atendimento pré-hospitalar móvel 24h", color: "#dc2626" },
  { name: "Corpo de Bombeiros", number: "193", desc: "Resgate, incêndios e emergências 24h", color: "#ea580c" },
  { name: "Polícia Militar", number: "190", desc: "Ocorrências policiais e segurança pública", color: "#2563eb" },
  { name: "Guarda Municipal de Apucarana", number: "153", desc: "Patrulhamento preventivo e praças", color: "#0284c7" },
  { name: "Defesa Civil", number: "199", desc: "Enchentes, desmoronamentos e desastres", color: "#d97706" },
  { name: "Disque Denúncia", number: "181", desc: "Denúncias anônimas de crimes", color: "#475569" },
  { name: "Polícia Rodoviária Federal", number: "191", desc: "Rodovias federais (BR-376)", color: "#1e3a8a" },
  { name: "Polícia Rodoviária Estadual", number: "198", desc: "Rodovias estaduais do Paraná", color: "#166534" },
];

const UTILITY_SERVICES = [
  {
    category: "Água & Saneamento",
    title: "Sanepar Apucarana",
    contact: "0800 200 0115",
    desc: "Falta de água, vazamentos na rede, consertos e ligações novas. Atendimento 24 horas por telefone e aplicativo Sanepar.",
    badge: "24 Horas",
  },
  {
    category: "Energia Elétrica",
    title: "Copel Energia",
    contact: "0800 51 00 116 / WhatsApp: (41) 3010-5000",
    desc: "Quedas de energia, fios caídos e emergências na rede elétrica. Atendimento rápido e protocolo automático.",
    badge: "24 Horas",
  },
  {
    category: "Saúde & Plantão",
    title: "UPA 24h de Apucarana",
    contact: "(43) 3422-0000",
    desc: "Unidade de Pronto Atendimento Infantil e Adulto. Endereço: Rua Miguel Simião / Centro.",
    badge: "Plantão Médico",
  },
  {
    category: "Saúde & Plantão",
    title: "Hospital da Providência",
    contact: "(43) 3420-1400",
    desc: "Referência regional de saúde e pronto-socorro para o Vale do Ivaí.",
    badge: "Hospital Geral",
  },
  {
    category: "Cidadania & Documentos",
    title: "Agência do Trabalhador (SINE)",
    contact: "(43) 3422-4000",
    desc: "Vagas de emprego, entrada no seguro-desemprego e confecção de carteira de trabalho.",
    badge: "Seg a Sex",
  },
  {
    category: "Cidadania & Direitos",
    title: "Procon Apucarana",
    contact: "(43) 3425-2034",
    desc: "Defesa do consumidor, orientações, renegociação de dívidas e abertura de reclamações.",
    badge: "Seg a Sex",
  },
];

export default function UtilidadesPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      {/* HEADER PRINCIPAL */}
      <header className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 mb-2">
            <span>🔴 Hub de Utilidade Pública</span>
            <span>·</span>
            <span>Apucarana & Vale do Ivaí</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight">
            Guia de Telefones de Emergência e Serviços Essenciais
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed">
            Consulte os números de emergência de resposta imediata, atendimento médico de plantão, serviços de água e luz, e contatos da prefeitura para quem vive em Apucarana e região.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
            >
              ← Voltar para a Capa de Notícias
            </Link>
            <Link
              href="/empregos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
            >
              💼 Ver Vagas de Emprego
            </Link>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
            >
              📞 Fale com a Redação
            </Link>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* NÚMEROS DE EMERGÊNCIA (RESPOSTA RÁPIDA) */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900">
              Telefones de Emergência (Gratuitos · 24 Horas)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EMERGENCY_CONTACTS.map((item) => (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className="group p-5 bg-white rounded-xl border border-slate-200 hover:border-red-400 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <span
                    className="inline-block text-2xl font-black tracking-tight mb-1"
                    style={{ color: item.color }}
                  >
                    Ligue {item.number}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-red-600 transition">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-red-600 transition">
                  <span>Toque para discar</span>
                  <span>📞</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* SERVIÇOS PÚBLICOS E CONCESSIONÁRIAS */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900">
              Serviços Essenciais & Concessionárias
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {UTILITY_SERVICES.map((srv, idx) => (
              <div
                key={idx}
                className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                      {srv.category}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {srv.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {srv.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {srv.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    {srv.contact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FARMÁCIAS DE PLANTÃO & NOTAS DE FALECIMENTO */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-200">
            <span className="text-2xl">💊</span>
            <h3 className="mt-2 text-lg font-bold text-emerald-950 font-display">
              Farmácias de Plantão em Apucarana
            </h3>
            <p className="mt-2 text-xs text-emerald-800 leading-relaxed">
              O rodízio oficial de farmácias e drogarias de plantão noturno e aos domingos é atualizado semanalmente pela Prefeitura de Apucarana e Conselho Regional de Farmácia.
            </p>
            <div className="mt-4">
              <a
                href="https://www.apucarana.pr.gov.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
              >
                Consultar escala oficial no portal do município →
              </a>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-slate-100 to-white rounded-xl border border-slate-300">
            <span className="text-2xl">🕊️</span>
            <h3 className="mt-2 text-lg font-bold text-slate-900 font-display">
              Serviço Funerário & Notas de Falecimento
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Acompanhamento de notas de falecimento, horários de velório e sepultamentos nos cemitérios Cristo Rei, Saudade e distritos de Apucarana pela ASERFA (Autarquia de Serviços Funerários).
            </p>
            <div className="mt-4 text-xs font-semibold text-slate-700">
              Plantão ASERFA: <span className="font-bold text-slate-900">(43) 3422-0051</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
