import { useState } from "react"
import { Inbox } from "lucide-react"

// Mapeamento de cores leves para as Tags das Categorias (alinhado com o Light Mode)
const toneClasses = {
  receita: "bg-emerald-50 text-[#059669]",
  moradia: "bg-blue-50 text-blue-600",
  alimentacao: "bg-amber-50 text-amber-600",
  transporte: "bg-purple-50 text-purple-600",
  lazer: "bg-rose-50 text-rose-600",
}

export function TransactionsTable() {
  // 🌟 Estado real limpo! Começa vazio. Conectaremos com a sua API Java futuramente.
  const [transacoes, setTransacoes] = useState([])

  // Formatador nativo de moeda do JavaScript
  const formatarMoeda = (valor) => {
    return Math.abs(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  const hasData = transacoes.length > 0

  return (
    <section aria-label="Últimas transações" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Últimas Transações</h2>
        <p className="text-sm text-gray-500">Suas movimentações mais recentes</p>
      </header>

      <div className="overflow-x-auto">
        {hasData ? (
          /* 🟢 SE HOUVER DADOS DO BANCO: Renderiza a tabela */
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400">
                <th scope="col" className="pb-3 font-medium">Descrição</th>
                <th scope="col" className="pb-3 font-medium">Categoria</th>
                <th scope="col" className="pb-3 font-medium">Data</th>
                <th scope="col" className="pb-3 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transacoes.map((tx) => {
                const positive = tx.amount > 0
                // Fallback para caso venha uma categoria não mapeada nas cores
                const tagStyle = toneClasses[tx.categoryTone] || "bg-gray-50 text-gray-600"

                return (
                  <tr key={tx.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5">
                      <span className="font-medium text-gray-900">{tx.description}</span>
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tagStyle}`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-400">{tx.date}</td>
                    <td className={`py-3.5 text-right font-semibold ${positive ? "text-[#059669]" : "text-[#E11D48]"}`}>
                      {positive ? "+ " : "- "}
                      {formatarMoeda(tx.amount)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          /* 🔴 SE NÃO HOUVER DADOS (ESTADO ATUAL): Exibe o feedback de lista vazia */
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 gap-2 border border-dashed border-gray-100 rounded-xl bg-gray-50/30">
            <div className="rounded-full bg-gray-50 p-3 text-gray-300">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Nenhuma transação encontrada</p>
              <p className="text-xs text-gray-400 max-w-[280px] mt-0.5">
                Você ainda não registrou movimentações. Elas aparecerão listadas aqui de forma cronológica.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}