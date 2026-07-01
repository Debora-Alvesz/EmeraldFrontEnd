import { useState } from "react"
import { PieChart } from "lucide-react"

const RADIUS = 60
const STROKE = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function CategoryChart() {
  // 🌟 Estado real iniciado como vazio. No futuro, você atualizará este array com dados vindos do Java.
  // Exemplo de formato futuro: { name: "Alimentação", percent: 40, color: "#EF4444" }
  const [categorias, setCategorias] = useState([])

  const hasData = categorias.length > 0
  let offset = 0

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Gastos por Categoria</h2>
        <p className="text-sm text-gray-500">Distribuição das despesas do mês</p>
      </header>

      {/* 🟢 SE HOUVER DADOS DO BANCO: Desenha a rosca e a lista de porcentagens */}
      {hasData ? (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between my-auto">
          <svg
            viewBox="0 0 160 160"
            className="h-40 w-40 shrink-0 -rotate-90"
            role="img"
            aria-label="Gráfico de rosca das despesas"
          >
            {categorias.map((cat) => {
              const length = (cat.percent / 100) * CIRCUMFERENCE
              const circle = (
                <circle
                  key={cat.name}
                  cx="80"
                  cy="80"
                  r={RADIUS}
                  fill="none"
                  stroke={cat.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                  strokeDashoffset={-offset}
                />
              )
              offset += length
              return circle
            })}
          </svg>

          <ul className="w-full space-y-3">
            {categorias.map((cat) => (
              <li key={cat.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-500">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                    aria-hidden="true"
                  />
                  {cat.name}
                </span>
                <span className="font-semibold text-gray-900">{cat.percent}%</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* 🔴 SE NÃO HOUVER DADOS (ESTADO ATUAL): Exibe o informativo limpo */
        <div className="h-52 w-full rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center gap-2 text-center p-4 my-auto">
          <div className="rounded-full bg-gray-100 p-2.5 text-gray-400">
            <PieChart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Sem despesas cadastradas</p>
            <p className="text-xs text-gray-400 max-w-[240px] mt-0.5">
              Suas despesas serão categorizadas automaticamente e exibidas aqui em formato de gráfico.
            </p>
          </div>
        </div>
      )}
    </article>
  )
}