'use client';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Dashboard() {
  const [pods, setPods] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [diasFiltro, setDiasFiltro] = useState(7);

  // ESTADOS DO POP-UP
  const [modalAberto, setModalAberto] = useState(false);
  const [detalhesDoDia, setDetalhesDoDia] = useState({ data: '', vendas: [] });

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resPods = await fetch('http://localhost:8080/api/pods');
        if (resPods.ok) setPods(await resPods.json());

        const resVendas = await fetch('http://localhost:8080/api/pods/vendas');
        if (resVendas.ok) setVendas(await resVendas.json());
      } catch (erro) {
        console.error("Erro de conexão:", erro);
      } finally {
        setCarregando(false);
      }
    };
    buscarDados();
  }, []);

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

  const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


  // ==========================================
  // NOVA FUNÇÃO: O CLIQUE INFALÍVEL
  // ==========================================
  const handleAbrirRelatorio = (dadosDoDia) => {
    if (!dadosDoDia || !dadosDoDia.dataOriginal) return;

    const vendasNesseDia = vendas.filter(v => v.dataVenda === dadosDoDia.dataOriginal);

    const vendasAgrupadas = {};
    vendasNesseDia.forEach(v => {
      const chave = `${v.marca} - ${v.sabor}`;
      if(!vendasAgrupadas[chave]) {
        vendasAgrupadas[chave] = { marca: v.marca, sabor: v.sabor, quantidade: 0, total: 0 };
      }
      vendasAgrupadas[chave].quantidade += 1;
      vendasAgrupadas[chave].total += v.faturamento;
    });

    setDetalhesDoDia({
      data: dadosDoDia.data,
      vendas: Object.values(vendasAgrupadas).sort((a, b) => b.quantidade - a.quantidade)
    });
    setModalAberto(true);
  };

  // DESENHO DA NOSSA PRÓPRIA BOLINHA COM HITBOX GIGANTE
  const BolinhaPersonalizada = (props) => {
    const { cx, cy, payload, stroke } = props;
    return (
      <g>
        {/* HITBOX: Círculo invisível de 40 pixels (Fácil de acertar o clique) */}
        <circle cx={cx} cy={cy} r={25} fill="transparent" cursor="pointer" onClick={() => handleAbrirRelatorio(payload)} style={{ pointerEvents: 'all' }} />
        {/* VISUAL: A bolinha que você realmente enxerga */}
        <circle cx={cx} cy={cy} r={7} stroke={stroke} strokeWidth={3} fill="#111827" style={{ pointerEvents: 'none' }} />
      </g>
    );
  };

  if (carregando) return <div className="flex h-64 items-center justify-center text-purple-400 font-bold">Carregando Financeiro...</div>;

  return (
    <div className="space-y-6 relative">

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
              {/* Removido o onClick da raiz do gráfico que estava causando conflito */}
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

                {/* AQUI ESTÁ A MÁGICA: A bolinha personalizada com a zona de clique gigante! */}
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
      {/* POP-UP (MODAL) REFORÇADO (z-[9999])        */}
      {/* ========================================== */}
      {modalAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" onClick={() => setModalAberto(false)}></div>

          <div className="bg-gray-900 border border-purple-500/50 rounded-2xl w-full max-w-lg shadow-2xl shadow-purple-900/20 z-10 overflow-hidden transform transition-all">

            <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-950/80">
              <div>
                <h3 className="text-xl font-bold text-gray-100">Vendas do dia {detalhesDoDia.data}</h3>
                <p className="text-xs text-gray-400 mt-1">Detalhes de movimentação</p>
              </div>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                &times;
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {detalhesDoDia.vendas.length > 0 ? (
                <ul className="space-y-3">
                  {detalhesDoDia.vendas.map((item, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-colors">
                      <div>
                        <p className="font-bold text-gray-200 text-lg">{item.marca}</p>
                        <p className="text-sm font-medium text-purple-400">{item.sabor}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400 text-lg bg-green-900/20 px-2 py-0.5 rounded inline-block">{item.quantidade} un.</p>
                        <p className="text-xs font-medium text-gray-400 mt-1">Recibo: {formatarMoeda(item.total)}</p>
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