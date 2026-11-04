import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade & Termos (LGPD) | Rede Apucarana",
  description: "Informações sobre tratamento de dados, privacidade, cookies e conformidade com a Lei Geral de Proteção de Dados (LGPD) na Rede Apucarana de Comunicação.",
};

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="h-16 bg-[#101114] text-white flex items-center justify-between px-4 sm:px-8 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/logo-rede-apucarana.png?v=2"
            alt="Logo Rede Apucarana"
            className="w-9 h-9 object-cover rounded-md"
          />
          <span className="font-bold tracking-wider text-sm sm:text-base">
            REDE APUCARANA
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
        >
          ← Voltar ao Início
        </Link>
      </header>

      <section className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
          <h1 className="editorial-headline text-slate-900">
            Política de Privacidade & LGPD
          </h1>
          <p className="text-xs text-slate-400">
            Última atualização: Novembro de 2026.
          </p>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed font-sans">
            <h2 className="text-lg font-bold text-slate-900 font-sans mt-6">
              1. Compromisso com a Privacidade
            </h2>
            <p>
              A <strong>Rede Apucarana de Comunicação</strong> tem como princípio basilar o respeito à privacidade e a proteção dos dados pessoais de todos os usuários, leitores, ouvintes e parceiros comerciais que acessam nosso portal em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)</strong>.
            </p>

            <h2 className="text-lg font-bold text-slate-900 font-sans mt-6">
              2. Coleta de Informações e Cookies
            </h2>
            <p>
              Nosso site utiliza cookies estritamente necessários para navegação, medição de audiência (Google Analytics 4 / Tag Manager) e entrega de anúncios comerciais relevantes. As métricas coletadas incluem páginas visitadas, tempo de permanência, tipo de dispositivo e localização geográfica aproximada (cidade/estado), sem identificação individualizada do leitor.
            </p>

            <h2 className="text-lg font-bold text-slate-900 font-sans mt-6">
              3. Formulários de Classificados e Vagas de Emprego
            </h2>
            <p>
              Ao submeter anúncios de empregos ou classificados de compra e venda em nosso portal, os dados fornecidos pelo usuário (como nome, cargo, empresa, telefone/WhatsApp de contato e descrição do item) são tratados exclusivamente com a finalidade de publicação pública consentida pelo anunciante. A moderação prévia da equipe editorial resguarda a veracidade das informações.
            </p>

            <h2 className="text-lg font-bold text-slate-900 font-sans mt-6">
              4. Direitos do Titular de Dados
            </h2>
            <p>
              O titular dos dados tem o direito de solicitar a qualquer momento a confirmação da existência de tratamento, a retificação de dados incorretos ou a exclusão de informações veiculadas em classificados ou comentários públicos.
            </p>

            <h2 className="text-lg font-bold text-slate-900 font-sans mt-6">
              5. Canal de Contato do Encarregado (DPO)
            </h2>
            <p>
              Para esclarecer dúvidas ou exercer seus direitos de privacidade, entre em contato com nosso Encarregado de Proteção de Dados pelo e-mail: <a href="mailto:privacidade@redeapucarana.com.br" className="text-red-600 font-bold hover:underline">privacidade@redeapucarana.com.br</a>.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-400 py-8 px-4 text-center text-xs border-t border-slate-800">
        <p>© 2026 Rede Apucarana de Comunicação. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
