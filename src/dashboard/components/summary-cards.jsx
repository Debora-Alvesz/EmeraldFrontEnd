import { useState } from "react"
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Target,
  Minus,
} from "lucide-react"

export function SummaryCards() {
  // 🌟 Estados preparados para receber os dados reais do seu Java futuramente.
  // Como você não quer dados fakes, tudo começa zerado ou vazio.
  const [financeData, setFinanceData] = useState({
    receitas: 0.0,
    despesas: 0.0,
    saldoTotal: 0.0,
    metasAtingidas: "0 de 0"
  })

  // Formatador de moeda para o padrão brasileiro
  const formatarMoeda = (valor) => {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  const cards = [
    { 
      label: "Receitas", 
      value: formatarMoeda(financeData.receitas), 
      icon: ArrowUpCircle, 
      iconClass: "bg-emerald-50 text-[#059669]" 
    },
    { 
      label: "Despesas", 
      value: formatarMoeda(financeData.despesas), 
      icon: ArrowDownCircle, 
      iconClass: "bg-rose-50 text-[#E11D48]" 
    },
    { 
      label: "Saldo Total", 
      value: formatarMoeda(financeData.saldoTotal), 
      icon: Wallet, 
      iconClass: "bg-blue-50 text-blue-600" 
    },
    { 
      label: "Metas Atingidas", 
      value: financeData.metasAtingidas, 
      icon: Target, 
      iconClass: "bg-purple-50 text-purple-600" 
    },
  ]

  return (
    <section aria-label="Resumo financeiro" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <article key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${card.iconClass}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            
            <p className="mt-3 text-2xl font-bold text-gray-900">{card.value}</p>
            
            {/* 💡 Exibe "Sem registros" de forma limpa já que não há dados reais ainda */}
            <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <Minus className="h-3.5 w-3.5 text-gray-300" aria-hidden="true" />
              <span className="font-medium text-gray-400">
                Sem registros
              </span>
              este mês
            </p>
          </article>
        )
      })}
    </section>
  )
}