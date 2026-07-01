import { useState } from "react"
import { BarChart3 } from "lucide-react"

const WIDTH = 560
const HEIGHT = 220
const PADDING = 8

// Função matemática que desenha as curvas suaves do SVG
function buildPath(values, max) {
  if (!values || values.length === 0) return { linePath: "", areaPath: "" }
  const step = WIDTH / (values.length - 1)
  const points = values.map((v, i) => {
    const x = i * step
    const y = HEIGHT - PADDING - (v / max) * (HEIGHT - PADDING * 2)
    return { x, y }
  })

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return { linePath: d, areaPath: `${d} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z` }
}

export function CashflowChart() {
  // 🌟 Estado real: Começa vazio ([]). Mudar para true apenas quando tiver dados do Java.
  const [dadosFluxo, setDadosFluxo] = useState({
    entradas: [],
    saidas: [],
    labels: ["Dia 05", "Dia 10", "Dia 15", "Dia 20", "Dia 25", "Dia 30"]
  })

  const hasData = dadosFluxo.entradas.length > 0 && dadosFluxo.saidas.length > 0

  // Variáveis de cálculo do SVG (só rodam se houver dados reais)
  let entradas = { areaPath: "", linePath: "" }
  let saidas = { areaPath: "", linePath: "" }
  if (hasData) {
    const max = Math.max(...dadosFluxo.entradas, ...dadosFluxo.saidas) * 1.15
    entradas = buildPath(dadosFluxo.entradas, max)
    saidas = buildPath(dadosFluxo.saidas, max)
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Entradas vs. Saídas</h2>
        <p className="text-sm text-gray-500">Evolução do fluxo de caixa neste mês</p>
      </header>

      {/* 🟢 SE HOUVER DADOS DO BANCO: Renderiza o gráfico em curvas originais */}
      {hasData ? (
        <>
          <div className="w-full">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-52 w-full"
              preserveAspectRatio="none"
              role="img"
              aria-label="Gráfico de fluxo de caixa"
            >
              <defs>
                <linearGradient id="entradasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="saidasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E11D48" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#E11D48" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path d={entradas.areaPath} fill="url(#entradasGrad)" />
              <path d={saidas.areaPath} fill="url(#saidasGrad)" />
              <path d={saidas.linePath} fill="none" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
              <path d={entradas.linePath} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="mt-2 flex justify-between px-1 text-xs text-gray-400">
            {dadosFluxo.labels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </>
      ) : (
        /* 🔴 SE NÃO HOUVER DADOS: Exibe placeholder limpo e profissional */
        <div className="h-52 w-full rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center gap-2 text-center p-4">
          <div className="rounded-full bg-gray-100 p-2.5 text-gray-400">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Sem registros de movimentações</p>
            <p className="text-xs text-gray-400 max-w-[280px] mt-0.5">
              O gráfico de evolução ficará disponível assim que você cadastrar receitas ou despesas.
            </p>
          </div>
        </div>
      )}

      {/* Legendas inferiores */}
      <div className="mt-5 flex items-center justify-center gap-6 text-xs border-t border-gray-50 pt-3">
        <span className="flex items-center gap-2 text-gray-500">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#059669]" aria-hidden="true" />
          Entradas
        </span>
        <span className="flex items-center gap-2 text-gray-500">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#E11D48]" aria-hidden="true" />
          Saídas
        </span>
      </div>
    </article>
  )
}