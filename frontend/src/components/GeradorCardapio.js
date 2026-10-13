'use client';
import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

export default function GeradorCardapio() {
  const [podsAgrupados, setPodsAgrupados] = useState([]);
  const [textoCopia, setTextoCopia] = useState('');

  // ==========================================
  // INTELIGÊNCIA DE EMOJIS (Lê o sabor e traduz para emoji)
  // ==========================================
  const adicionarEmojis = (saborOriginal) => {
    let texto = saborOriginal.toLowerCase();
    let emojis = '';

    // Frutas
    if (texto.includes('melancia') || texto.includes('watermelon')) emojis += '🍉';
    if (texto.includes('morango') || texto.includes('strawberry')) emojis += '🍓';
    if (texto.includes('uva') || texto.includes('grape')) emojis += '🍇';
    if (texto.includes('manga') || texto.includes('mango')) emojis += '🥭';
    if (texto.includes('pessego') || texto.includes('peach')) emojis += '🍑';
    if (texto.includes('abacaxi') || texto.includes('pineapple')) emojis += '🍍';
    if (texto.includes('limao') || texto.includes('lemon') || texto.includes('citrus') || texto.includes('lime')) emojis += '🍋';
    if (texto.includes('maca') || texto.includes('apple')) emojis += '🍏';
    if (texto.includes('cereja') || texto.includes('cherry')) emojis += '🍒';
    if (texto.includes('blueberry') || texto.includes('mirtilo') || texto.includes('blue')) emojis += '🫐';
    if (texto.includes('banana')) emojis += '🍌';
    if (texto.includes('kiwi')) emojis += '🥝';
    if (texto.includes('coco') || texto.includes('coconut')) emojis += '🥥';
    if (texto.includes('laranja') || texto.includes('orange')) emojis += '🍊';
    if (texto.includes('framboesa') || texto.includes('raspberry')) emojis += '🍓';
    if (texto.includes('maracuja') || texto.includes('passion')) emojis += '🟡';

    // Complementos
    if (texto.includes('hortela') || texto.includes('mint')) emojis += '🌿';
    if (texto.includes('gelo') || texto.includes('ice') || texto.includes('freeze') || texto.includes('cool') || texto.includes('frost')) emojis += '❄️';

    // Doces e Bebidas
    if (texto.includes('chiclete') || texto.includes('bubble') || texto.includes('gum')) emojis += '🍬';
    if (texto.includes('doce') || texto.includes('candy') || texto.includes('cotton')) emojis += '🍭';
    if (texto.includes('energetico') || texto.includes('energy') || texto.includes('bull')) emojis += '⚡';
    if (texto.includes('cafe') || texto.includes('coffee')) emojis += '☕';
    if (texto.includes('baunilha') || texto.includes('vanilla') || texto.includes('creme') || texto.includes('cream')) emojis += '🍦';
    if (texto.includes('chocolate') || texto.includes('choco')) emojis += '🍫';
    if (texto.includes('tabaco') || texto.includes('tobacco')) emojis += '🚬';

    // Se não achou nenhum emoji específico, coloca o ícone de fumaça padrão
    if (emojis === '') emojis = '💨';

    return `${saborOriginal} ${emojis}`;
  };

  useEffect(() => {
    const buscarEAgruparPods = async () => {
      try {
        const resposta = await fetch(`${API_URL}/api/pods`);
        if (resposta.ok) {
          const dados = await resposta.json();

          const grupos = {};
          dados.forEach(pod => {
            if (pod.estoque > 0) {
              const chave = `✨ *${pod.marca}* - R$ ${pod.precoVarejo.toFixed(2).replace('.', ',')}`;
              if (!grupos[chave]) {
                grupos[chave] = new Set();
              }
              // Aplica o filtro de emoji na hora de salvar
              grupos[chave].add(adicionarEmojis(pod.sabor));
            }
          });

          const listaAgrupada = Object.keys(grupos).map(chave => ({
            titulo: chave,
            sabores: Array.from(grupos[chave]).sort() // Coloca os sabores em ordem alfabética
          }));

          setPodsAgrupados(listaAgrupada);

          // ==========================================
          // MONTAGEM DO TEXTO CHAMATIVO PARA O WHATSAPP
          // ==========================================
          let textoFinal = "🔥 *MENU ATUALIZADO* 🔥\n\n";
          textoFinal += "Confira os nossos pods disponíveis a pronta entrega! 👇\n\n";

          listaAgrupada.forEach(grupo => {
            textoFinal += `${grupo.titulo}\n`;
            grupo.sabores.forEach(sabor => {
              textoFinal += `🔸 ${sabor}\n`;
            });
            textoFinal += "\n";
          });

          textoFinal += "🚀 *Entregamos rápido!*\n";
          textoFinal += "💳 *Aceitamos Pix e Cartão*\n\n";
          textoFinal += "Faça seu pedido respondendo esta mensagem! 😉";

          setTextoCopia(textoFinal);
        }
      } catch (erro) {
        console.error('Erro ao buscar dados:', erro);
      }
    };

    buscarEAgruparPods();
  }, []);

  const copiarParaWhatsApp = () => {
    navigator.clipboard.writeText(textoCopia);
    alert('Cardápio copiado! É só abrir o WhatsApp e colar (Ctrl+V).');
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Gerador de Cardápio</h2>
          <p className="text-sm text-gray-400 mt-1">Texto otimizado para vendas no WhatsApp</p>
        </div>
        <button
          onClick={copiarParaWhatsApp}
          className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-3 transition-colors shadow-lg shadow-green-900/30 w-full sm:w-auto justify-center"
        >
          <span className="text-xl">📱</span>
          <span>Copiar para WhatsApp</span>
        </button>
      </div>

      {/* PRÉ-VISUALIZAÇÃO ESTILO CELULAR */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex justify-center">

        {/* Fundo imitando a tela do WhatsApp */}
        <div className="bg-[#efeae2] w-full max-w-md rounded-2xl p-4 shadow-inner relative overflow-hidden" style={{ backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')", backgroundSize: 'cover', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(239, 234, 226, 0.9)' }}>

          {/* Balão de Mensagem */}
          <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-md text-gray-800 font-sans text-[15px] leading-relaxed whitespace-pre-wrap relative z-10">
            {textoCopia ? textoCopia : (
              <span className="text-gray-400 italic">Nenhum produto em estoque para gerar o cardápio.</span>
            )}

            {/* Hora falsa no cantinho da mensagem */}
            <span className="text-[11px] text-gray-400 float-right mt-3 ml-3">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}