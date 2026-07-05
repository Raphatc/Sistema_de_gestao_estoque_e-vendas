import './globals.css';
import Header from '../components/Header'; // Importa o nosso novo menu
import SistemaSeguro from '../components/SistemaSeguro'; // <-- Corrigido para ../

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className="bg-gray-950 text-white min-h-screen font-sans">

        {/* ABRINDO O GUARDIÃO: Tudo aqui dentro fica protegido */}
        <SistemaSeguro>

          {/* O Menu vai ficar fixo no topo de todas as páginas */}
          <Header />

          {/* O conteúdo principal de cada página será injetado aqui */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

        </SistemaSeguro>
        {/* FECHANDO O GUARDIÃO */}

      </body>
    </html>
  );
}