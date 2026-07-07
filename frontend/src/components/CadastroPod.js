'use client';
import React, { useState, useEffect } from 'react';

export default function CadastroPod() {
  // Estado para controlar se é uma marca nova ou existente
  const [modo, setModo] = useState('novo'); // 'novo' ou 'existente'
  const [marcasExistentes, setMarcasExistentes] = useState([]);
  const [marcaSelecionada, setMarcaSelecionada] = useState('');

  // Dados do formulário
  const [marca, setMarca] = useState('');
  const [precoAtacado, setPrecoAtacado] = useState('');
  const [precoVarejo, setPrecoVarejo] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [sabores, setSabores] = useState([{ nome: '', estoque: '' }]);

  // Busca as marcas que já existem no banco de dados ao abrir a tela
  useEffect(() => {
    const buscarMarcas = async () => {
      try {
        const resposta = await fetch('https://tabacaria-system.onrender.com/api/pods');
        if (resposta.ok) {
          const dados = await resposta.json();
          
          // Agrupa para pegar apenas uma configuração de cada marca
          const marcasUnicas = {};
          dados.forEach(pod => {
            if (!marcasUnicas[pod.marca]) {
              marcasUnicas[pod.marca] = {
                marca: pod.marca,
                precoAtacado: pod.precoAtacado,
                precoVarejo: pod.precoVarejo,
                imagemUrl: pod.imagemUrl || ''
              };
            }
          });
          
          setMarcasExistentes(Object.values(marcasUnicas));
        }
      } catch (erro) {
        console.error('Erro ao buscar marcas:', erro);
      }
    };
    buscarMarcas();
  }, [modo]); // Recarrega a lista sempre que mudar de aba

  // Alterna entre modo Novo e Existente e limpa os campos
  const alternarModo = (novoModo) => {
    setModo(novoModo);
    setMarcaSelecionada('');
    setMarca('');
    setPrecoAtacado('');
    setPrecoVarejo('');
    setPreviewUrl('');
    setSabores([{ nome: '', estoque: '' }]);
  };

  // Quando escolhe uma marca na lista, preenche tudo sozinho
  const handleSelecionarMarca = (e) => {
    const nome = e.target.value;
    setMarcaSelecionada(nome);

    if (nome) {
      const dadosMarca = marcasExistentes.find(m => m.marca === nome);
      if (dadosMarca) {
        setMarca(dadosMarca.marca);
        setPrecoAtacado(dadosMarca.precoAtacado);
        setPrecoVarejo(dadosMarca.precoVarejo);
        setPreviewUrl(dadosMarca.imagemUrl);
      }
    } else {
      setMarca('');
      setPrecoAtacado('');
      setPrecoVarejo('');
      setPreviewUrl('');
    }
  };

  // Funções para gerenciar os campos dinâmicos de sabores
  const adicionarCampoSabor = () => setSabores([...sabores, { nome: '', estoque: '' }]);
  const removerCampoSabor = (index) => setSabores(sabores.filter((_, i) => i !== index));
  const atualizarSabor = (index, campo, valor) => {
    const novosSabores = [...sabores];
    novosSabores[index][campo] = valor;
    setSabores(novosSabores);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await Promise.all(sabores.map(saborItem => {
        const dadosPod = {
          marca: marca,
          sabor: saborItem.nome,
          estoque: parseInt(saborItem.estoque),
          precoAtacado: parseFloat(precoAtacado),
          precoVarejo: parseFloat(precoVarejo),
          imagemUrl: previewUrl
        };

        return fetch('https://tabacaria-system.onrender.com/api/pods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosPod),
        });
      }));

      alert('Sabores cadastrados com sucesso!');
      alternarModo(modo); // Reseta a tela mantendo a aba que você estava
    } catch (erro) {
      console.error('Erro de conexão:', erro);
      alert('Erro ao cadastrar no banco de dados.');
    }
  };

  return (
    <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-8 w-full max-w-2xl shadow-2xl shadow-purple-500/10 mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-100">Gerenciar Catálogo</h2>
      
      {/* Botões de Escolha no Topo */}
      <div className="flex bg-gray-950 border border-gray-800 rounded-lg p-1 mb-6">
        <button 
          type="button"
          onClick={() => alternarModo('novo')} 
          className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${modo === 'novo' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
          Cadastrar Nova Linha
        </button>
        <button 
          type="button"
          onClick={() => alternarModo('existente')} 
          className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${modo === 'existente' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
          Adicionar a Linha Existente
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ÁREA DE SELEÇÃO DE MARCA */}
        {modo === 'existente' ? (
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <label className="block text-sm font-medium text-purple-400 mb-2">Escolha uma linha já cadastrada:</label>
            <select 
              value={marcaSelecionada} 
              onChange={handleSelecionarMarca}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none font-medium"
              required
            >
              <option value="">-- Selecione na lista --</option>
              {marcasExistentes.map((m, idx) => (
                <option key={idx} value={m.marca}>{m.marca} (Venda: R$ {m.precoVarejo.toFixed(2)})</option>
              ))}
            </select>
          </div>
        ) : (
          /* ÁREA DE CRIAÇÃO DE NOVA MARCA */
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Marca / Modelo</label>
                <input type="text" placeholder="Ex: Ignite V400" value={marca} onChange={(e) => setMarca(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">URL da Imagem</label>
                <input type="text" placeholder="Link da foto (Opcional)" value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Custo Atacado (R$)</label>
                <input type="number" step="0.01" placeholder="Ex: 45.00" value={precoAtacado} onChange={(e) => setPrecoAtacado(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Preço Venda (R$)</label>
                <input type="number" step="0.01" placeholder="Ex: 90.00" value={precoVarejo} onChange={(e) => setPrecoVarejo(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none" required />
              </div>
            </div>
          </div>
        )}

        {/* ÁREA DINÂMICA DOS SABORES */}
        <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800">
          <h3 className="text-purple-400 font-bold mb-3 flex justify-between items-center">
            Sabores & Quantidades
            <button type="button" onClick={adicionarCampoSabor} className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded shadow">+ Adicionar outro sabor</button>
          </h3>
          
          <div className="space-y-3">
            {sabores.map((sabor, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <input type="text" placeholder="Nome do sabor (Ex: Blueberry Ice)" value={sabor.nome} onChange={(e) => atualizarSabor(index, 'nome', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none text-sm" required />
                </div>
                <div className="w-24">
                  <input type="number" placeholder="Estoque" value={sabor.estoque} onChange={(e) => atualizarSabor(index, 'estoque', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none text-sm" required />
                </div>
                {sabores.length > 1 && (
                  <button type="button" onClick={() => removerCampoSabor(index)} className="bg-red-900/50 text-red-400 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-colors border border-red-900/30" title="Remover">
                    X
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-500 hover:to-green-400 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg text-lg">
          {modo === 'existente' ? 'Adicionar Sabores ao Catálogo' : 'Cadastrar Nova Linha no Estoque'}
        </button>
      </form>
    </div>
  );
}