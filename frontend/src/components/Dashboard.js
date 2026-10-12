'use client';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { API_URL } from '../config/api';

export default function Dashboard() {
  const [pods, setPods] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [caixa, setCaixa] = useState({ saldo: 0, gastoMercadoria: 0, divida: 0 });
  const [formCaixa, setFormCaixa] = useState({ saldo: '', gastoMercadoria: '' });
  const [salvandoCaixa, setSalvandoCaixa] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [diasFiltro, setDiasFiltro] = useState(7);
  const [alertasVencimento, setAlertasVencimento] = useState([]);

  // ESTADOS DO POP-UP
  const [modalAberto, setModalAberto] = useState(false);
  const [detalhesDoDia, setDetalhesDoDia] = useState({ data: '', dataOriginal: '', vendas: [] });

  const dataLocalISO = (date = new Date()) => {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const formatarDataBR = (dataISO) => {
    if (!dataISO) return '—';
    return dataISO.split('-').reverse().join('/');
  };

  const buscarDados = async () => {
    try {
      const respCaixa = await fetch(`${API_URL}/api/caixa`);
      if (respCaixa.ok) {
        const dados = await respCaixa.json();
        setCaixa(dados);
        setFormCaixa({
          saldo: dados.saldo != null ? String(dados.saldo) : '',
          gastoMercadoria: dados.gastoMercadoria != null ? String(dados.gastoMercadoria) : ''
        });
      }
    } catch (e) {}
    try {
      const resPods = await fetch(`${API_URL}/api/pods`);
      if (resPods.ok) setPods(await resPods.json());

      const resVendas = await fetch(`${API_URL}/api/pods/vendas`);
      if (resVendas.ok) setVendas(await resVendas.json());
    } catch (erro) {
      console.error("Erro de conexão:", erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDados();
  }, []);

  useEffect(() => {
    const abertas = vendas.filter(v => v.statusPagamento === 'A_PRAZO' && v.dataVencimento);
    if (abertas.length === 0) {
      setAlertasVencimento([]);
      return;
    }

    const hojeStr = dataLocalISO();
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = dataLocalISO(amanha);

    const alertas = abertas
      .map(v => {
        if (v.dataVencimento === hojeStr) {
          return {
            id: v.id,
            tipo: 'hoje',
            titulo: 'Pagamento de fiado hoje',
            texto: `${v.marca} — ${v.sabor}: ${(Number(v.faturamento) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} vence hoje (${formatarDataBR(v.dataVencimento)}).`
          };
        }
        if (v.dataVencimento === amanhaStr) {
          return {
            id: v.id,
            tipo: 'amanha',
            titulo: 'Pagamento de fiado amanhã',
            texto: `${v.marca} — ${v.sabor}: ${(Number(v.faturamento) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} vence amanhã (${formatarDataBR(v.dataVencimento)}).`
          };
        }
        return null;
      })
      .filter(Boolean);

    setAlertasVencimento(alertas);
  }, [vendas]);

  const estoqueTotal = pods.reduce((acc, pod) => acc + pod.estoque, 0);
  const statsMarcas = {};
  pods.forEach(pod => {
    if (!statsMarcas[pod.marca]) statsMarcas[pod.marca] = { marca: pod.marca, saboresAtivos: 0 };
    if (pod.estoque > 0) statsMarcas[pod.marca].saboresAtivos += 1;
  });
  const relatorioSabores = Object.values(statsMarcas).sort((a, b) => a.saboresAtivos - b.saboresAtivos);
  const marcasEmAlerta = relatorioSabores.filter(m => m.saboresAtivos <= 2).length;

  const hoje = new Date();
  const diasDoPeriodo = [...Array(diasFiltro)].map((_, i) => {
    const d = new Date();
    d.setDate(hoje.getDate() - (diasFiltro - 1 - i));
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  });

  const vendasDoPeriodo = vendas.filter(v => diasDoPeriodo.includes(v.dataVenda));

  const faturamentoPeriodo = vendasDoPeriodo.reduce((acc, v) => acc + v.faturamento, 0);
  const lucroPeriodo = vendasDoPeriodo.reduce((acc, v) => acc + v.lucro, 0);
  const margemLucro = faturamentoPeriodo > 0 ? ((lucroPeriodo / faturamentoPeriodo) * 100).toFixed(1) : 0;

  const dadosGraficoArea = diasDoPeriodo.map(dataStr => {
    const vendasDia = vendasDoPeriodo.filter(v => v.dataVenda === dataStr);
    const fat = vendasDia.reduce((acc, v) => acc + v.faturamento, 0);
    const luc = vendasDia.reduce((acc, v) => acc + v.lucro, 0);
    const [, mes, dia] = dataStr.split('-');
    return { dataOriginal: dataStr, data: `${dia}/${mes}`, Faturamento: fat, Lucro: luc };
  });

  const vendasPorMarca = {};
  vendasDoPeriodo.forEach(v => {
    if (!vendasPorMarca[v.marca]) vendasPorMarca[v.marca] = { nome: v.marca, Vendas: 0 };
    vendasPorMarca[v.marca].Vendas += 1;
  });
  const dadosGraficoTop = Object.values(vendasPorMarca).sort((a, b) => b.Vendas - a.Vendas).slice(0, 5);

  const formatarMoeda = (valor) => (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const vendasAPrazo = vendas.filter(v => v.statusPagamento === 'A_PRAZO');

  const salvarCaixa = async (recalcularDivida = false) => {
    setSalvandoCaixa(true);
    try {
      const payload = {
        saldo: parseFloat(String(formCaixa.saldo).replace(',', '.')) || 0,
        gastoMercadoria: parseFloat(String(formCaixa.gastoMercadoria).replace(',', '.')) || 0
      };
      const url = recalcularDivida
        ? `${API_URL}/api/caixa?recalcularDivida=true`
        : `${API_URL}/api/caixa`;
      const resp = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const dados = await resp.json();
        setCaixa(dados);
        setFormCaixa({
          saldo: dados.saldo != null ? String(dados.saldo) : '',
          gastoMercadoria: dados.gastoMercadoria != null ? String(dados.gastoMercadoria) : ''
        });
      } else {
        alert('Erro ao salvar o caixa.');
      }
    } catch (erro) {
      console.error('Erro ao salvar caixa:', erro);
      alert('Erro de conexão ao salvar o caixa.');
    } finally {
      setSalvandoCaixa(false);
    }
  };

  const handleMarcarComoPaga = async (idVenda) => {
    const confirmacao = window.confirm('Marcar esta venda a prazo como paga? O valor entrará no caixa e abaterá a dívida.');
    if (!confirmacao) return false;

    try {
      const resposta = await fetch(`${API_URL}/api/pods/vendas/${idVenda}/pagar`, {
        method: 'PUT'
      });
      if (resposta.ok) {
        await buscarDados();
        setDetalhesDoDia(prev => ({
          ...prev,
          vendas: prev.vendas.map(v =>
            v.id === idVenda ? { ...v, statusPagamento: 'PAGO' } : v
          )
        }));
        return true;
      }
      alert('Não foi possível marcar a venda como paga.');
      return false;
    } catch (erro) {
      console.error('Erro ao marcar venda como paga:', erro);
      alert('Erro de conexão com o servidor.');
      return false;
    }
  };

  // ==========================================
  // FUNÇÃO DE ABRIR MODAL (AGORA LISTA INDIVIDUAL)
  // ==========================================
  const handleAbrirRelatorio = (dadosDoDia) => {
    if (!dadosDoDia || !dadosDoDia.dataOriginal) return;

    // Pega todas as vendas individuais deste dia (sem agrupar, para podermos desfazer por ID)
    const vendasNesseDia = vendas.filter(v => v.dataVenda === dadosDoDia.dataOriginal);

    setDetalhesDoDia({
      data: dadosDoDia.data,
      dataOriginal: dadosDoDia.dataOriginal,
      vendas: vendasNesseDia
    });
    setModalAberto(true);
  };

  // ==========================================
  // NOVA FUNÇÃO: DESFAZER VENDA
  // ==========================================
  const handleDesfazerVenda = async (idVenda) => {
    const confirmacao = window.confirm(`Tem a certeza que deseja desfazer esta venda? O valor será removido e o estoque devolvido.`);

    if (!confirmacao) return;

    try {
      // Faz a requisição DELETE para a API Java
      const resposta = await fetch(`${API_URL}/api/pods/vendas/${idVenda}`, {
        method: 'DELETE',
      });

      if (resposta.ok) {
        alert('Venda desfeita com sucesso!');

        // 1. Remove a venda visualmente da lista geral
        setVendas(prevVendas => prevVendas.filter(v => v.id !== idVenda));

        // 2. Remove a venda visualmente de dentro do Modal
        setDetalhesDoDia(prevDetalhes => ({
          ...prevDetalhes,
          vendas: prevDetalhes.vendas.filter(v => v.id !== idVenda)
        }));

        // 3. Atualiza o estoque total buscando novamente da API
        buscarDados();

      } else {
        alert('Erro ao desfazer a venda no servidor.');
      }
    } catch (erro) {
      console.error('Erro de conexão:', erro);
      alert('Erro de conexão com o servidor Java.');
    }
  };


  const BolinhaPersonalizada = (props) => {
    const { cx, cy, payload, stroke } = props;
    return (
      <g>
        <circle cx={cx} cy={cy} r={25} fill="transparent" cursor="pointer" onClick={() => handleAbrirRelatorio(payload)} style={{ pointerEvents: 'all' }} />
        <circle cx={cx} cy={cy} r={7} stroke={stroke} strokeWidth={3} fill="#111827" style={{ pointerEvents: 'none' }} />
      </g>
    );
  };

  if (carregando) return <div className="flex h-64 items-center justify-center text-purple-400 font-bold">Carregando Financeiro...</div>;

  return (
    <div className="space-y-6 relative">

      {alertasVencimento.length > 0 && (
        <div className="space-y-2">
          {alertasVencimento.map(alerta => (
            <div
              key={`${alerta.id}-${alerta.tipo}`}
              className={`border rounded-xl p-4 ${
                alerta.tipo === 'hoje'
                  ? 'bg-red-900/20 border-red-500/40 text-red-200'
                  : 'bg-orange-900/20 border-orange-500/40 text-orange-200'
              }`}
            >
              <p className="font-bold text-sm uppercase tracking-wide mb-1">{alerta.titulo}</p>
              <p className="text-sm">{alerta.texto}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
          Visão Geral
          <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Tempo Real
          </span>
        </h2>

        <div className="flex items-center gap-3 bg-gray-900 border border-purple-500/30 p-1.5 rounded-lg">
          <span className="text-sm font-medium text-gray-400 pl-2">Analisar:</span>
          <select
            value={diasFiltro}
            onChange={(e) => setDiasFiltro(Number(e.target.value))}
            className="bg-gray-800 text-purple-300 font-bold text-sm rounded-md px-3 py-1.5 border border-gray-700 outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={15}>Últimos 15 dias</option>
            <option value={30}>Últimos 30 dias</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-green-500/30 p-6 rounded-2xl shadow-xl transition-all">
          <div className="text-gray-400 text-xs font-bold mb-1 uppercase">Faturamento (No Período)</div>
          <div className="text-3xl font-bold text-gray-100">{formatarMoeda(faturamentoPeriodo)}</div>
        </div>

        <div className="bg-gray-900 border border-purple-500/30 p-6 rounded-2xl shadow-xl transition-all">
          <div className="text-gray-400 text-xs font-bold mb-1 uppercase">Lucro Líquido (No Período)</div>
          <div className="text-3xl font-bold text-purple-400">{formatarMoeda(lucroPeriodo)}</div>
          <div className="text-xs font-medium mt-2 text-purple-400">Margem de {margemLucro}%</div>
        </div>

        <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-xl">
          <div className="text-gray-400 text-xs font-bold mb-1 uppercase">Total em Estoque (Agora)</div>
          <div className="text-3xl font-bold text-blue-400">{estoqueTotal}</div>
        </div>

        <div className="bg-gray-900 border border-red-500/30 p-6 rounded-2xl shadow-xl">
          <div className="text-gray-400 text-xs font-bold mb-1 uppercase">Marcas em Alerta (Agora)</div>
          <div className="text-3xl font-bold text-red-400">{marcasEmAlerta}</div>
          <div className="text-xs font-medium mt-2 text-red-400">Com 2 ou menos sabores</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* GRÁFICO 1: LINHA DO TEMPO */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-300">Desempenho Financeiro</h3>
            <span className="text-xs text-purple-400 bg-purple-900/30 px-3 py-1.5 rounded-lg border border-purple-500/40 animate-pulse font-medium shadow-lg">
              👆 Clique nas bolinhas para ver detalhes
            </span>
          </div>

          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosGraficoArea} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="corFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="corLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="data" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} allowDecimals={false} />

                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 30 }}
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />

                <Area type="monotone" name="Faturamento (R$)" dataKey="Faturamento" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#corFaturamento)" activeDot={<BolinhaPersonalizada />} />
                <Area type="monotone" name="Lucro (R$)" dataKey="Lucro" stroke="#A855F7" strokeWidth={3} fillOpacity={1} fill="url(#corLucro)" activeDot={<BolinhaPersonalizada />} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col h-[380px]">
          <h3 className="text-lg font-bold text-gray-300 mb-4 flex justify-between items-center">
            Top 5 Marcas
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">No Período</span>
          </h3>
          <div className="flex-1 w-full">
            {dadosGraficoTop.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoTop} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="nome" type="category" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} width={80} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} />
                  <Bar dataKey="Vendas" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500 text-center">Nenhuma venda neste período.</div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* CAIXA E DÍVIDAS                            */}
      {/* ========================================== */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl mt-6">
        <h3 className="text-lg font-bold text-gray-300 mb-2 flex items-center gap-2">
          <span>Caixa e Financeiro</span>
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Vendas à vista entram no saldo e abatem a dívida. Aumentar o gasto com mercadoria aumenta a dívida na mesma proporção.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
            <label className="block text-sm font-medium text-gray-400 mb-2">Dinheiro em Caixa</label>
            <input
              type="number"
              step="0.01"
              value={formCaixa.saldo}
              onChange={(e) => setFormCaixa({ ...formCaixa, saldo: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
            />
          </div>

          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
            <label className="block text-sm font-medium text-gray-400 mb-2">Gasto com Mercadoria</label>
            <input
              type="number"
              step="0.01"
              value={formCaixa.gastoMercadoria}
              onChange={(e) => setFormCaixa({ ...formCaixa, gastoMercadoria: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"
            />
          </div>

          {(() => {
            const saldoAtual = Number(caixa?.saldo) || 0;
            const dividaAtual = Number(caixa?.divida) || 0;
            const caixaMaiorQueDivida = saldoAtual > dividaAtual;

            if (caixaMaiorQueDivida) {
              const sobraAposDivida = saldoAtual - dividaAtual;
              return (
                <div className="p-4 rounded-xl border bg-green-900/20 border-green-500/30 flex flex-col justify-center">
                  <span className="text-sm font-medium text-gray-400">Sobra após pagar a dívida</span>
                  <span className="text-3xl font-bold text-green-400">
                    {formatarMoeda(sobraAposDivida)}
                  </span>
                </div>
              );
            }

            return (
              <div className="p-4 rounded-xl border bg-red-900/20 border-red-500/30 flex flex-col justify-center">
                <span className="text-sm font-medium text-gray-400">Devendo (Dívida Restante)</span>
                <span className="text-3xl font-bold text-red-400">
                  {formatarMoeda(dividaAtual)}
                </span>
              </div>
            );
          })()}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            disabled={salvandoCaixa}
            onClick={() => salvarCaixa(false)}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            {salvandoCaixa ? 'Salvando...' : 'Salvar Caixa'}
          </button>
          <button
            type="button"
            disabled={salvandoCaixa}
            onClick={() => {
              if (window.confirm('Recalcular a dívida como (gasto − saldo)? Isso redefine a dívida atual.')) {
                salvarCaixa(true);
              }
            }}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-50 text-gray-200 font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            Recalcular dívida (gasto − saldo)
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* VENDAS A PRAZO (FIADO)                     */}
      {/* ========================================== */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl mt-6">
        <h3 className="text-lg font-bold text-gray-300 mb-2 flex items-center gap-2">
          <span>Vendas a Prazo (Fiado)</span>
          {vendasAPrazo.length > 0 && (
            <span className="text-xs bg-orange-900/40 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
              {vendasAPrazo.length}
            </span>
          )}
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Quando o cliente pagar, marque como pago para entrar no caixa e abater a dívida.
        </p>

        {vendasAPrazo.length > 0 ? (
          <ul className="space-y-3">
            {vendasAPrazo.map((item) => {
              const hojeStr = dataLocalISO();
              const amanha = new Date();
              amanha.setDate(amanha.getDate() + 1);
              const amanhaStr = dataLocalISO(amanha);
              const vencido = item.dataVencimento && item.dataVencimento < hojeStr;
              const venceHoje = item.dataVencimento === hojeStr;
              const venceAmanha = item.dataVencimento === amanhaStr;

              let borda = 'border-orange-500/20';
              let badge = null;
              if (vencido) {
                borda = 'border-red-500/50';
                badge = <span className="text-[10px] uppercase font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded">Vencido</span>;
              } else if (venceHoje) {
                borda = 'border-red-500/40';
                badge = <span className="text-[10px] uppercase font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded">Vence hoje</span>;
              } else if (venceAmanha) {
                borda = 'border-orange-500/50';
                badge = <span className="text-[10px] uppercase font-bold bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded">Vence amanhã</span>;
              }

              return (
              <li key={item.id} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-gray-800/40 p-4 rounded-xl border ${borda}`}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-200">{item.marca} <span className="text-purple-400 font-medium">— {item.sabor}</span></p>
                    {badge}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Venda: {formatarDataBR(item.dataVenda)} · Pagamento: {formatarDataBR(item.dataVencimento)} · ID #{item.id}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-orange-300">{formatarMoeda(item.faturamento)}</span>
                  <button
                    type="button"
                    onClick={() => handleMarcarComoPaga(item.id)}
                    className="text-xs uppercase tracking-wider font-bold bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    Marcar como pago
                  </button>
                </div>
              </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-sm text-gray-500 bg-gray-800/30 border border-gray-800 rounded-xl p-4">
            Nenhuma venda a prazo em aberto.
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl mt-6">
        <h3 className="text-lg font-bold text-gray-300 mb-6 flex items-center gap-2">
          <span>📦 Variedade em Estoque (Sabores Disponíveis por Marca)</span>
        </h3>

        {relatorioSabores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatorioSabores.map((marca, idx) => (
              <div key={idx} className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-xl flex justify-between items-center hover:border-purple-500/30 transition-colors">
                <span className="font-bold text-gray-200 truncate pr-2" title={marca.marca}>
                  {marca.marca}
                </span>
                <span className={`px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap shadow-sm
                  ${marca.saboresAtivos === 0 ? 'bg-red-900/50 text-red-400 border border-red-800/50'
                  : marca.saboresAtivos <= 2 ? 'bg-orange-900/50 text-orange-400 border border-orange-800/50'
                  : 'bg-blue-900/50 text-blue-400 border border-blue-800/50'}`}>
                  {marca.saboresAtivos === 0 ? 'ESGOTADO' : `${marca.saboresAtivos} ${marca.saboresAtivos === 1 ? 'Sabor' : 'Sabores'}`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">
            Nenhuma marca cadastrada no sistema.
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* POP-UP (MODAL) COM BOTÃO DE DESFAZER         */}
      {/* ========================================== */}
      {modalAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" onClick={() => setModalAberto(false)}></div>

          <div className="bg-gray-900 border border-purple-500/50 rounded-2xl w-full max-w-lg shadow-2xl shadow-purple-900/20 z-10 overflow-hidden transform transition-all">

            <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-950/80">
              <div>
                <h3 className="text-xl font-bold text-gray-100">Transações de {detalhesDoDia.data}</h3>
                <p className="text-xs text-gray-400 mt-1">Histórico exato do dia</p>
              </div>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                &times;
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {detalhesDoDia.vendas.length > 0 ? (
                <ul className="space-y-3">
                  {detalhesDoDia.vendas.map((item) => (
                    <li key={item.id} className="flex justify-between items-center bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-colors">
                      <div>
                        <p className="font-bold text-gray-200 text-lg">{item.marca}</p>
                        <p className="text-sm font-medium text-purple-400">{item.sabor}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          ID #{item.id}
                          {item.statusPagamento === 'A_PRAZO' ? (
                            <span className="ml-2 text-orange-400">· A prazo</span>
                          ) : (
                            <span className="ml-2 text-green-500">· Pago</span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className={`font-bold text-lg px-2 py-0.5 rounded inline-block ${item.statusPagamento === 'A_PRAZO' ? 'text-orange-300 bg-orange-900/20' : 'text-green-400 bg-green-900/20'}`}>
                          {formatarMoeda(item.faturamento)}
                        </p>
                        {item.statusPagamento === 'A_PRAZO' && (
                          <button
                            onClick={() => handleMarcarComoPaga(item.id)}
                            className="text-[10px] uppercase tracking-wider font-bold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500 hover:text-white px-3 py-1.5 rounded transition-colors"
                          >
                            Marcar como pago
                          </button>
                        )}
                        <button
                          onClick={() => handleDesfazerVenda(item.id)}
                          className="text-[10px] uppercase tracking-wider font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded transition-colors"
                        >
                          Desfazer Venda
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">😴</div>
                  <p className="text-gray-400 font-medium">Nenhuma venda registrada<br/>nesta data.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-950/80">
              <button onClick={() => setModalAberto(false)} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg">
                Fechar Relatório
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}