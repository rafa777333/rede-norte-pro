import './globals.css';
import { Header } from '@/components/Header';
export const metadata = { title: 'Rede Norte de Comunicação', description: 'Conectando o Vale do Ivaí - Notícias globais, serviços e mercados por cidade' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body><Header />{children}
        <footer className="bg-white border-t mt-12 py-8 text-center text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4">© {new Date().getFullYear()} Rede Norte de Comunicação - redeapucarana.com.br • Notícias globais • Serviços e Mercados por cidade • Feito para virar app</div>
        </footer>
      </body>
    </html>
  );
}
