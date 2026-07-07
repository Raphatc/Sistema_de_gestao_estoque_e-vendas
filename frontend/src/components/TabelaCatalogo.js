'use client';
import React, { useState, useEffect } from 'react';

export default function TabelaCatalogo() {
  const [podsAgrupados, setPodsAgrupados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // ==========================================
  // GERENCIADOR CENTRAL DE MODAIS (POP-UPS)
  // ==========================================
  const [modal, setModal] = useState({ aberto: false, tipo: '', dados: null });
  const [form, setForm] = useState({ val1: '', val2: '' });

  const fecharModal = () => {
    setModal({ aberto: false, tipo: '', dados: null });
    setForm({ val1: '', val2: '' });
  };

  const buscarEAgruparPods = async () => {
    try {
      const resposta = await fetch('https://tabacaria-system.onrender.com/api/pods');
      if (resposta.ok) {
        const dados = await resposta.json();

        const grupos = dados.reduce((acc, pod) => {
          if (!acc[pod.marca]) {
            acc[pod.marca] = {
              marca: pod.marca,
              imagemUrl: pod.imagemUrl,
              precoAtacado: pod.precoAtacado,
              precoVarejo: pod.precoVarejo,
              sabores: []
            };
          }
          acc[pod.marca].sabores.push(pod);
          return acc;
        }, {});

        setPodsAgrupados(Object.values(grupos));
      }
    } catch (erro) {
      console.error('Erro ao buscar dados:', erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarEAgruparPods();
  }, []);

  // ==========================================
  // AÇÕES IMEDIATAS (Não precisam de Pop-up)
  // ==========================================
  const handleVender = async (id) => {
    try {
      const resposta = await fetch(`https://tabacaria-system.onrender.com/api/pods/${id}/vender`, { method: 'PUT' });
      if (resposta.ok) buscarEAgruparPods();
      else alert("Erro: Estoque insuficiente!");
    } catch (erro) { console.error('Erro ao vender:', erro); }
  };

  const handleDesfazerVenda = async (id, vendidos) => {
    if (vendidos === 0) return alert("Não há vendas para desfazer neste sabor.");
    try {
      const resposta = await fetch(`https://tabacaria-system.onrender.com/api/pods/${id}/desfazer-venda`, { method: 'PUT' });
      if (resposta.ok) buscarEAgruparPods();
    } catch (erro) { console.error('Erro ao desfazer:', erro); }
  };

  // ==========================================
  // PROCESSAMENTO DOS MODAIS (Quando clica em Salvar/Confirmar)
  // ==========================================
  const executarAcaoModal = async (e) => {
    e.preventDefault(); // Evita recarregar a página
    const { tipo, dados } = modal;

    try {
      if (tipo === 'ADICIONAR') {
        const quantidade = parseInt(form.val1);
        if (quantidade > 0) {
          await fetch(`https://tabacaria-system.onrender.com/api/pods/${dados.id}/adicionar-estoque?quantidade=${quantidade}`, { method: 'PUT' });
        }
      }

      else if (tipo === 'AJUSTAR') {
        const quantidade = parseInt(form.val1);
        if (quantidade >= 0) {
          await fetch(`https://tabacaria-system.onrender.com/api/pods/${dados.id}/ajustar-estoque?quantidade=${quantidade}`, { method: 'PUT' });
        }
      }

      else if (tipo === 'VENDA_ANTIGA') {
        const data = form.val1; // O input type="date" já entrega no formato AAAA-MM-DD do Java
        const quantidade = parseInt(form.val2);
        if (data && quantidade > 0) {
          await fetch(`https://tabacaria-system.onrender.com/api/pods/${dados.id}/venda-retroativa?data=${data}&quantidade=${quantidade}`, { method: 'POST' });
        }
      }

      else if (tipo === 'EXCLUIR') {
        await fetch(`https://tabacaria-system.onrender.com/api/pods/${dados.id}`, { method: 'DELETE' });
      }

      else if (tipo === 'EDITAR_PRECOS') {
        const atacado = parseFloat(form.val1.replace(',', '.'));
        const varejo = parseFloat(form.val2.replace(',', '.'));
        if (!isNaN(atacado) && !isNaN(varejo)) {
          await Promise.all(dados.sabores.map(sabor => {
            return fetch(`https://tabacaria-system.onrender.com/api/pods/${sabor.id}/precos?atacado=${atacado}&varejo=${varejo}`, { method: 'PUT' });
          }));
        }
      }

      // Após executar qualquer uma das ações, atualiza a tela e fecha o Pop-up
      buscarEAgruparPods();
      fecharModal();

    } catch (erro) {
      console.error('Erro ao processar modal:', erro);
      alert("Ocorreu um erro ao processar sua solicitação.");
    }
  };

  const formatarMoeda = (valor) => valor ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';

  if (carregando) return <div className="text-center p-10 text-purple-400 font-bold">Carregando catálogo...</div>;

  return (
    <div className="space-y-6 relative">
      {podsAgrupados.length === 0 ? (
        <div className="text-center p-10 text-gray-500 bg-gray-900 rounded-xl">Nenhum pod cadastrado no estoque.</div>
      ) : (
        podsAgrupados.map((grupo, index) => (
          <div key={index} className="bg-gray-900 border border-purple-500/30 rounded-xl overflow-hidden shadow-lg flex flex-col md:flex-row">

            {/* Resumo da Marca (Esquerda) */}
            <div className="bg-gray-950 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-800 w-full md:w-64 relative group">
              <div className="w-24 h-24 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden flex items-center justify-center mb-4 shadow-inner">
                {grupo.imagemUrl ? <img src={grupo.imagemUrl} alt={grupo.marca} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">Sem Foto</span>}
              </div>
              <h3 className="text-xl font-bold text-gray-100 text-center mb-2">{grupo.marca}</h3>

              <div className="flex flex-col items-center gap-1 w-full mt-2 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                <div className="flex justify-between w-full text-sm">
                  <span className="text-gray-500">Custo:</span>
                  <span className="text-gray-400 line-through">{formatarMoeda(grupo.precoAtacado)}</span>
                </div>
                <div className="flex justify-between w-full text-sm">
                  <span className="text-gray-500">Venda:</span>
                  <span className="text-green-400 font-bold">{formatarMoeda(grupo.precoVarejo)}</span>
                </div>

                {/* ABRIR MODAL: EDITAR PREÇOS */}
                <button
                  onClick={() => {
                    setForm({ val1: grupo.precoAtacado.toString(), val2: grupo.precoVarejo.toString() });
                    setModal({ aberto: true, tipo: 'EDITAR_PRECOS', dados: grupo });
                  }}
                  className="mt-3 w-full text-xs font-bold bg-gray-800 hover:bg-purple-900/50 text-purple-400 hover:text-purple-300 border border-purple-500/30 py-2 rounded transition-colors"
                >
                  ✎ Editar Preços
                </button>
              </div>
            </div>

            {/* Lista de Sabores (Direita) */}
            <div className="flex-1 p-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-4 border-b border-gray-800 pb-2 flex justify-between">
                <span>GERENCIAR SABORES</span>
                <span className="text-gray-500">{grupo.sabores.length} opções</span>
              </h4>
              <div className="space-y-3">
                {grupo.sabores.map((sabor) => (
                  <div key={sabor.id} className="flex flex-col xl:flex-row xl:items-start justify-between bg-gray-800/40 p-4 rounded-lg border border-gray-700/50 hover:border-purple-500/30 transition-colors">

                    <div className="flex items-center gap-4 mb-4 xl:mb-0 xl:mt-2">
                      <span className="font-medium text-purple-300 w-48 truncate">{sabor.sabor}</span>
                      <span className={`text-sm font-bold bg-gray-900 px-3 py-1 rounded-full border ${sabor.estoque <= 2 ? 'text-red-400 border-red-500/30' : 'text-blue-400 border-blue-500/30'}`}>
                        {sabor.estoque} un.
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 w-full xl:w-auto">

                      {/* Primeira Linha: Vendas */}
                      <div className="flex items-center gap-2 flex-wrap xl:justify-end">
                        <button onClick={() => handleVender(sabor.id)} disabled={sabor.estoque === 0} className="flex-1 xl:flex-none bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-colors">💰 Vender</button>
                        <button onClick={() => handleDesfazerVenda(sabor.id, sabor.vendidos)} disabled={sabor.vendidos === 0} className="flex-1 xl:flex-none bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-colors">↩️ Desfazer</button>

                        {/* ABRIR MODAL: VENDA ANTIGA */}
                        <button onClick={() => {
                          const hoje = new Date().toISOString().split('T')[0];
                          setForm({ val1: hoje, val2: '' });
                          setModal({ aberto: true, tipo: 'VENDA_ANTIGA', dados: { ...sabor, marca: grupo.marca } });
                        }} className="flex-1 xl:flex-none bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-colors">📅 Venda Antiga</button>
                      </div>

                      {/* Segunda Linha: Estoque e Exclusão */}
                      <div className="flex items-center gap-2 flex-wrap xl:justify-end">

                        {/* ABRIR MODAL: ADICIONAR ESTOQUE */}
                        <button onClick={() => {
                          setForm({ val1: '' });
                          setModal({ aberto: true, tipo: 'ADICIONAR', dados: { ...sabor, marca: grupo.marca } });
                        }} className="flex-1 xl:flex-none bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-colors">+ Receber Lote</button>

                        {/* ABRIR MODAL: AJUSTAR ESTOQUE */}
                        <button onClick={() => {
                          setForm({ val1: sabor.estoque.toString() });
                          setModal({ aberto: true, tipo: 'AJUSTAR', dados: { ...sabor, marca: grupo.marca } });
                        }} className="flex-1 xl:flex-none bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-colors">📦 Ajustar Físico</button>

                        {/* ABRIR MODAL: EXCLUIR */}
                        <button onClick={() => {
                          setModal({ aberto: true, tipo: 'EXCLUIR', dados: { ...sabor, marca: grupo.marca } });
                        }} className="flex-1 xl:flex-none text-red-400 hover:bg-red-900/50 border border-transparent hover:border-red-800 text-xs font-bold py-1.5 px-3 rounded transition-colors">🗑️ Excluir</button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        ))
      )}

      {/* ========================================== */}
      {/* O SUPER MODAL INTELIGENTE E DINÂMICO       */}
      {/* ========================================== */}
      {modal.aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={fecharModal}></div>

          <div className="bg-gray-900 border border-purple-500/50 rounded-2xl w-full max-w-md shadow-2xl z-10 overflow-hidden transform transition-all scale-100 opacity-100">

            <form onSubmit={executarAcaoModal}>
              {/* CABEÇALHO DO MODAL */}
              <div className="bg-gray-950/80 p-5 border-b border-gray-800 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-100">
                    {modal.tipo === 'ADICIONAR' && 'Receber Novo Lote'}
                    {modal.tipo === 'AJUSTAR' && 'Ajuste Físico de Estoque'}
                    {modal.tipo === 'VENDA_ANTIGA' && 'Registrar Venda Retroativa'}
                    {modal.tipo === 'EDITAR_PRECOS' && 'Atualizar Tabela de Preços'}
                    {modal.tipo === 'EXCLUIR' && 'Confirmar Exclusão'}
                  </h3>
                  <p className="text-sm text-purple-400 font-medium mt-1">
                    {modal.dados.marca} {modal.dados.sabor ? `- ${modal.dados.sabor}` : '(Todos os sabores)'}
                  </p>
                </div>
                <button type="button" onClick={fecharModal} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">&times;</button>
              </div>

              {/* CORPO DO MODAL (Muda dependendo da ação) */}
              <div className="p-6 space-y-4 bg-gray-900">

                {modal.tipo === 'ADICIONAR' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantas unidades chegaram do fornecedor?</label>
                    <input autoFocus type="number" min="1" required value={form.val1} onChange={(e) => setForm({...form, val1: e.target.value})} className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-lg text-center" placeholder="Ex: 10" />
                  </div>
                )}

                {modal.tipo === 'AJUSTAR' && (
                  <div>
                    <div className="bg-blue-900/20 border border-blue-500/20 text-blue-400 p-3 rounded-lg text-sm mb-4">
                      Estoque no sistema: <strong className="text-white">{modal.dados.estoque} un.</strong><br/>
                      Use isso para corrigir perdas, defeitos ou erros de contagem. Não gera lucro no gráfico.
                    </div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantas unidades EXATAS estão na sua mão agora?</label>
                    <input autoFocus type="number" min="0" required value={form.val1} onChange={(e) => setForm({...form, val1: e.target.value})} className="w-full bg-gray-800 border border-indigo-500/30 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-lg text-center" />
                  </div>
                )}

                {modal.tipo === 'VENDA_ANTIGA' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Data da Venda</label>
                      <input type="date" required value={form.val1} onChange={(e) => setForm({...form, val1: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none color-scheme-dark" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Quantidade Vendida</label>
                      <input type="number" min="1" required value={form.val2} onChange={(e) => setForm({...form, val2: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" placeholder="Ex: 2" />
                    </div>
                  </div>
                )}

                {modal.tipo === 'EDITAR_PRECOS' && (
                  <div className="space-y-4">
                    <div className="bg-purple-900/20 border border-purple-500/20 text-purple-300 p-3 rounded-lg text-sm mb-2">
                      Atenção: A alteração será aplicada a <strong>todos os {modal.dados.sabores.length} sabores</strong> da linha {modal.dados.marca}.
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Custo (Atacado)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-500 font-bold">R$</span>
                          <input type="number" step="0.01" required value={form.val1} onChange={(e) => setForm({...form, val1: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-purple-500 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-green-400 mb-1">Venda (Varejo)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-500 font-bold">R$</span>
                          <input type="number" step="0.01" required value={form.val2} onChange={(e) => setForm({...form, val2: e.target.value})} className="w-full bg-gray-800 border border-green-500/30 rounded-xl pl-10 pr-4 py-3 text-green-400 font-bold focus:border-green-500 outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {modal.tipo === 'EXCLUIR' && (
                  <div className="text-center py-4">
                    <div className="text-5xl mb-4">🗑️</div>
                    <p className="text-gray-300 text-lg">Tem certeza que deseja apagar o sabor <strong className="text-white">{modal.dados.sabor}</strong> permanentemente do sistema?</p>
                    <p className="text-red-400 text-sm mt-2 font-medium">Esta ação não poderá ser desfeita.</p>
                  </div>
                )}

              </div>

              {/* RODAPÉ DO MODAL (Botões) */}
              <div className="bg-gray-950/80 p-5 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={fecharModal} className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${
                  modal.tipo === 'EXCLUIR' ? 'bg-red-600 hover:bg-red-500 shadow-red-900/50' :
                  modal.tipo === 'ADICIONAR' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/50' :
                  modal.tipo === 'AJUSTAR' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50' :
                  'bg-purple-600 hover:bg-purple-500 shadow-purple-900/50'
                }`}>
                  {modal.tipo === 'EXCLUIR' ? 'Sim, Excluir' : 'Salvar Alterações'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}