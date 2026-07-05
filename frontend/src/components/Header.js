'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname(); // Descobre em qual página estamos

  return (
    <header className="bg-gray-900 border-b border-purple-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-green-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-white font-bold text-xl">X</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-green-400 tracking-tight">
              Tabacaria System
            </h1>
          </div>

          {/* Links de Navegação */}
          <nav className="flex space-x-1 border border-gray-800 rounded-lg p-1 bg-gray-950/50">
            <Link href="/" className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${pathname === '/' ? 'bg-gray-800 text-purple-400 shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}>
              Visão Geral
            </Link>
            <Link href="/catalogo" className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${pathname === '/catalogo' ? 'bg-gray-800 text-purple-400 shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}>
              Estoque & Preços
            </Link>
            <Link href="/cardapio" className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${pathname === '/cardapio' ? 'bg-gray-800 text-purple-400 shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}>
              Tabela P/ Clientes
            </Link>
            <Link href="/novo" className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${pathname === '/novo' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}>
              + Novo Produto
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
}