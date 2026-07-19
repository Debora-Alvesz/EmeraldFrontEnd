/**
 * Componente SummaryCards
 * 
 * Responsável por renderizar os indicadores (KPIs) financeiros do painel principal (Dashboard).
 * Realiza chamadas simultâneas às APIs de Contas Bancárias, Transações e Metas Financeiras
 * e processa os dados em memória respeitando a tipagem dos ResponseDTOs do backend.
 */
import { useState, useEffect } from "react";
import axios from "axios";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Target,
  Activity
} from "lucide-react";

export function SummaryCards() {
  const [usuarioId] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("usuarioId") || "";
    }
    return "";
  });

  const [financeData, setFinanceData] = useState({
    receitas: 0.0,
    despesas: 0.0,
    saldoTotal: 0.0,
    metasAtingidas: "0 de 0"
  });
  
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarDadosDoDashboard = async () => {
      if (!usuarioId) {
        setCarregando(false);
        return;
      }
      
      try {
        setCarregando(true);
        
        // Execução concorrente das requisições para os controllers corretos
        const [respostaContas, respostaTransacoes, respostaMetas] = await Promise.all([
          axios.get(`http://localhost:8080/api/v1/contas-bancarias/usuario/${usuarioId}`),
          axios.get(`http://localhost:8080/api/v1/transacoes/usuario/${usuarioId}`),
          axios.get(`http://localhost:8080/api/v1/metas-financeiras/usuario/${usuarioId}`)
        ]);

        const contas = respostaContas.data || [];
        const transacoes = respostaTransacoes.data || [];
        const metas = respostaMetas.data || [];

        // 1. Consolidação do Saldo Total (ContaBancariaResponseDTO)
        const saldoCalculado = contas.reduce((soma, conta) => soma + Number(conta.saldo || 0), 0);

        // 2. Consolidação das Receitas e Despesas (TransacaoResponseDTO)
        // Regra de negócio: Valores > 0 representam receitas, < 0 representam despesas.
        const totalReceitas = transacoes
          .filter(t => Number(t.valor || 0) > 0)
          .reduce((soma, t) => soma + Number(t.valor || 0), 0);

        const totalDespesas = transacoes
          .filter(t => Number(t.valor || 0) < 0)
          .reduce((soma, t) => soma + Math.abs(Number(t.valor || 0)), 0);

        // 3. Consolidação das Metas Financeiras (MetaFinanceiraResponseDTO)
        // O DTO atual expõe os limites, mas não o progresso individual.
        // O valor de metas concluídas permanecerá estático até a evolução do DTO.
        const totalMetas = metas.length;
        const metasConcluidas = 0; 

        setFinanceData({
          receitas: totalReceitas,
          despesas: totalDespesas,
          saldoTotal: saldoCalculado,
          metasAtingidas: `${metasConcluidas} de ${totalMetas}`
        });
        
      } catch (error) {
        console.error("Falha na consolidação dos dados do Dashboard:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarDadosDoDashboard();
  }, [usuarioId]);

  /**
   * Formata valores numéricos para o padrão monetário BRL (Real Brasileiro).
   * @param {number} valor - Valor numérico a ser formatado.
   * @returns {string} String formatada (ex: R$ 1.500,00).
   */
  const formatarMoeda = (valor) => {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const cards = [
    { 
      label: "Receitas", 
      value: formatarMoeda(financeData.receitas), 
      icon: ArrowUpCircle, 
      iconClass: "bg-emerald-50 text-[#059669]",
      descricao: "Total de entradas computadas"
    },
    { 
      label: "Despesas", 
      value: formatarMoeda(financeData.despesas), 
      icon: ArrowDownCircle, 
      iconClass: "bg-rose-50 text-[#E11D48]",
      descricao: "Total de saídas computadas"
    },
    { 
      label: "Saldo Total", 
      value: formatarMoeda(financeData.saldoTotal), 
      icon: Wallet, 
      iconClass: "bg-blue-50 text-blue-600",
      descricao: "Acumulado de todas as contas"
    },
    { 
      label: "Metas Atingidas", 
      value: financeData.metasAtingidas, 
      icon: Target, 
      iconClass: "bg-purple-50 text-purple-600",
      descricao: "Progresso dos objetivos atuais"
    },
  ];

  return (
    <section aria-label="Resumo financeiro" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${card.iconClass}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {carregando ? "Carregando..." : card.value}
            </p>
            
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
              <Activity className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              <span className="font-medium text-gray-400">
                {card.descricao}
              </span>
            </p>
          </article>
        );
      })}
    </section>
  );
}