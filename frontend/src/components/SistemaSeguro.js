'use client';
import React, { useState, useEffect } from 'react';

export default function SistemaSeguro({ children }) {
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  // Verifica se o usuário já fez login antes (salvo no navegador)
  useEffect(() => {
    const tokenSalvo = localStorage.getItem('token_tabacaria');
    if (tokenSalvo) {
      ativarInterceptor(tokenSalvo);
      setToken(tokenSalvo);
    }
    setCarregando(false);
  }, []);

  // O "Guardião": Adiciona o crachá de acesso em TODAS as conversas com o Java
  const ativarInterceptor = (tokenAtivo) => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      let [resource, config] = args;
      if (typeof resource === 'string' && resource.includes('localhost:8080')) {
        config = config || {};
        config.headers = {
          ...config.headers,
          'Authorization': `Basic ${tokenAtivo}`
        };
      }
      return originalFetch(resource, config);
    };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    // Cria a chave no padrão do Spring Security (Base64)
    const tokenTentativa = btoa(`${usuario}:${senha}`);

    try {
      // Bate na porta do Java para testar se a chave é válida
      const resposta = await fetch('http://localhost:8080/api/pods', {
        headers: { 'Authorization': `Basic ${tokenTentativa}` }
      });

      if (resposta.ok) {
        localStorage.setItem('token_tabacaria', tokenTentativa);
        ativarInterceptor(tokenTentativa);
        setToken(tokenTentativa);
      } else {
        setErro('Usuário ou senha incorretos. Acesso negado!');
      }
    } catch (error) {
      setErro('Servidor offline. Verifique se o Java está rodando.');
    } finally {
      setCarregando(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token_tabacaria');
    window.location.reload();
  };

  if (carregando && !token && !erro && usuario === '') {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-purple-500 font-bold">Iniciando segurança...</div>;
  }

  // ==========================================
  // TELA DE LOGIN (Se não tiver a chave)
  // ==========================================
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-4" style={{ backgroundImage: "radial-gradient(circle at 50% 0%, #3b0764 0%, transparent 50%)" }}>
        <div className="bg-gray-900 border border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-900/20 w-full max-w-md relative overflow-hidden">

          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-500"></div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl border border-gray-700 mx-auto flex items-center justify-center mb-4 shadow-inner">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-100">Acesso Restrito</h1>
            <p className="text-gray-400 text-sm mt-1">Insira suas credenciais para gerenciar o estoque.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {erro && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm font-medium text-center">
                {erro}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Usuário</label>
              <input type="text" required autoFocus value={usuario} onChange={(e) => setUsuario(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors" placeholder="Seu usuário" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
              <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={carregando} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/30 mt-2 disabled:opacity-50">
              {carregando ? 'Autenticando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>

        <p className="text-gray-600 text-xs mt-6 font-bold tracking-widest uppercase">Tabacaria System © 2026</p>
      </div>
    );
  }

  // ==========================================
  // LIBERA O SISTEMA E INJETA BOTÃO DE SAIR
  // ==========================================
  return (
    <div className="relative">
       <button onClick={handleLogout} className="fixed bottom-4 right-4 z-[9999] bg-gray-900 border border-gray-700 hover:border-red-500/50 hover:text-red-400 text-gray-500 text-xs font-bold py-2 px-4 rounded-full shadow-lg transition-all flex items-center gap-2">
         <span>🚪</span> Sair
       </button>
       {children}
    </div>
  );
}