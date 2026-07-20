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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

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
    metasAtingidas: "0 de 0",
    statusSemaforo: "ok" // 🚦 ESTADO DO SEMÁFORO: ok, atencao, estourado
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
      
      const [respostaContas, respostaTransacoes, respostaMetas] = await Promise.all([
        axios.get(`${API_URL}/api/v1/contas-bancarias/usuario/${usuarioId}`),
        axios.get(`${API_URL}/api/v1/transacoes/usuario/${usuarioId}`),
        axios.get(`${API_URL}/api/v1/metas-financeiras/usuario/${usuarioId}`)
      ]);

        const contas = respostaContas.data || [];
        const transacoes = respostaTransacoes.data || [];
        const metas = respostaMetas.data || [];

        // 1. Consolidação do Saldo Total
        const saldoCalculado = contas.reduce((soma, conta) => soma + Number(conta.saldo || 0), 0);

        // 2. Consolidação das Receitas e Despesas
        const totalReceitas = transacoes
          .filter(t => Number(t.valor || 0) > 0)
          .reduce((soma, t) => soma + Number(t.valor || 0), 0);

        const totalDespesas = transacoes
          .filter(t => Number(t.valor || 0) < 0)
          .reduce((soma, t) => soma + Math.abs(Number(t.valor || 0)), 0);

        // 3. Consolidação com Regra do Semáforo Inteligente
        const d = new Date();
        const mesAnoAtualStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

        const metasDoMes = metas.filter(m => m.mesAno === mesAnoAtualStr);
        const totalMetasDoMes = metasDoMes.length;
        
        let categoriasSobControle = 0;
        let piorStatusDoMes = "ok"; // Cascata de gravidade inicial

        metasDoMes.forEach(meta => {
          const catId = meta.categoriaId || meta.categoria?.id;

          const gastoTotalNaCategoria = transacoes
            .filter(t => {
              const tCatId = t.categoriaId || t.categoria?.id;
              if (tCatId !== catId || Number(t.valor || 0) >= 0) return false;
              const tDate = t.data || t.dataHora;
              if (!tDate) return false;
              const [ano, mes] = tDate.split('-');
              return `${mes}/${ano.substring(0, 4)}` === mesAnoAtualStr;
            })
            .reduce((soma, t) => soma + Math.abs(Number(t.valor || 0)), 0);

          // 📐 CÁLCULO DE PROGRESSO PARA O SEMÁFORO
          const limite = Number(meta.valorLimite || 0);
          const percentualConsumido = limite > 0 ? (gastoTotalNaCategoria / limite) * 100 : 0;

          // Avaliação da gravidade do orçamento individual
          if (percentualConsumido >= 100) {
            piorStatusDoMes = "estourado"; // Vermelho atropela qualquer aviso anterior
          } else if (percentualConsumido >= 80 && piorStatusDoMes !== "estourado") {
            piorStatusDoMes = "atencao";   // Amarelo assume se não houver vermelho
          }

          if (gastoTotalNaCategoria <= limite) {
            categoriasSobControle++;
          }
        });

        setFinanceData({
          receitas: totalReceitas,
          despesas: totalDespesas,
          saldoTotal: saldoCalculado,
          metasAtingidas: `${categoriasSobControle} de ${totalMetasDoMes}`,
          statusSemaforo: totalMetasDoMes === 0 ? "ok" : piorStatusDoMes
        });
        
      } catch (error) {
        console.error("Falha na consolidação dos dados do Dashboard:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarDadosDoDashboard();
  }, [usuarioId]);

  const formatarMoeda = (valor) => {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // 🎨 CONFIGURADOR DINÂMICO DO SEMÁFORO (Padrão de Cores Emerald Light Premium)
  const obterConfigSemaforo = (status) => {
    switch (status) {
      case "estourado":
        return {
          classe: "bg-rose-50 text-[#E11D48]",
          descricao: "Aviso crítico: Limite ultrapassado!"
        };
      case "atencao":
        return {
          classe: "bg-amber-50 text-[#D97706]",
          descricao: "Atenção: Teto de gastos acima de 80%"
        };
      default:
        return {
          classe: "bg-emerald-50 text-[#059669]",
          descricao: "Excelente: Orçamentos sob controle"
        };
    }
  };

  const semaforoMeta = obterConfigSemaforo(financeData.statusSemaforo);

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
      label: "Categorias Sob Controle", 
      value: financeData.metasAtingidas, 
      icon: Target, 
      iconClass: semaforoMeta.classe, // 🚦 Ícone muda dinamicamente (Verde, Amarelo ou Vermelho)
      descricao: semaforoMeta.descricao // 📝 Texto auxiliar contextualizado com a saúde financeira
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