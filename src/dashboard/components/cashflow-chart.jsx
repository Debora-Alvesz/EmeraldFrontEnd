import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { BarChart3 } from "lucide-react"

const WIDTH = 560
const HEIGHT = 220
const PADDING = 8

function buildPath(values, max) {
  if (!values.length) return { linePath: "", areaPath: "" }
  if (values.length === 1) {
    const y = HEIGHT - PADDING - (values[0] / max) * (HEIGHT - PADDING * 2)
    const linePath = `M 0 ${y} L ${WIDTH} ${y}`
    return { linePath, areaPath: `${linePath} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z` }
  }

  const step = WIDTH / (values.length - 1)
  const points = values.map((value, index) => ({
    x: index * step,
    y: HEIGHT - PADDING - (value / max) * (HEIGHT - PADDING * 2),
  }))
  let linePath = `M ${points[0].x} ${points[0].y}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index === 0 ? 0 : index - 1]
    const current = points[index]
    const next = points[index + 1]
    const afterNext = points[index + 2] ?? next
    linePath += ` C ${current.x + (next.x - previous.x) / 6} ${current.y + (next.y - previous.y) / 6}, ${next.x - (afterNext.x - current.x) / 6} ${next.y - (afterNext.y - current.y) / 6}, ${next.x} ${next.y}`
  }
  return { linePath, areaPath: `${linePath} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z` }
}

function getUsuarioId() {
  const id = window.localStorage.getItem("usuarioId")
  if (id) return id
  try {
    const usuario = JSON.parse(window.localStorage.getItem("usuarioLogado") || "null")
    return usuario?.id || usuario?.usuarioId || usuario?.idUsuario || usuario?.usuario?.id || ""
  } catch {
    return ""
  }
}

export function CashflowChart() {
  const [transacoes, setTransacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const usuarioId = useMemo(() => (typeof window === "undefined" ? "" : getUsuarioId()), [])

  useEffect(() => {
    if (!usuarioId) {
      setCarregando(false)
      return
    }
    axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/v1/transacoes/usuario/${usuarioId}`)
      .then((response) => setTransacoes(Array.isArray(response.data) ? response.data : response.data?.data || []))
      .catch((error) => console.error("Erro ao carregar fluxo de caixa:", error))
      .finally(() => setCarregando(false))
  }, [usuarioId])

  const dadosFluxo = useMemo(() => {
    const hoje = new Date()
    const porDia = new Map()
    transacoes.forEach((transacao) => {
      const data = new Date(transacao.data)
      if (Number.isNaN(data.getTime()) || data.getFullYear() !== hoje.getFullYear() || data.getMonth() !== hoje.getMonth()) return
      const dia = data.getDate()
      const total = porDia.get(dia) || { entradas: 0, saidas: 0 }
      const valor = Number(transacao.valor) || 0
      if (valor >= 0) total.entradas += valor
      else total.saidas += Math.abs(valor)
      porDia.set(dia, total)
    })
    const dias = [...porDia.keys()].sort((a, b) => a - b)
    return {
      labels: dias.map((dia) => String(dia).padStart(2, "0")),
      entradas: dias.map((dia) => porDia.get(dia).entradas),
      saidas: dias.map((dia) => porDia.get(dia).saidas),
    }
  }, [transacoes])

  const hasData = dadosFluxo.labels.length > 0
  const max = hasData ? Math.max(...dadosFluxo.entradas, ...dadosFluxo.saidas, 1) * 1.15 : 1
  const entradas = hasData ? buildPath(dadosFluxo.entradas, max) : { linePath: "", areaPath: "" }
  const saidas = hasData ? buildPath(dadosFluxo.saidas, max) : { linePath: "", areaPath: "" }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Entradas vs. Saídas</h2>
        <p className="text-sm text-gray-500">Evolução do fluxo de caixa neste mês</p>
      </header>
      {hasData ? <>
        <div className="w-full"><svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-52 w-full" preserveAspectRatio="none" role="img" aria-label="Gráfico de fluxo de caixa">
          <defs>
            <linearGradient id="entradasGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#059669" stopOpacity="0.25" /><stop offset="100%" stopColor="#059669" stopOpacity="0" /></linearGradient>
            <linearGradient id="saidasGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E11D48" stopOpacity="0.18" /><stop offset="100%" stopColor="#E11D48" stopOpacity="0" /></linearGradient>
          </defs>
          <path d={entradas.areaPath} fill="url(#entradasGrad)" /><path d={saidas.areaPath} fill="url(#saidasGrad)" />
          <path d={saidas.linePath} fill="none" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" /><path d={entradas.linePath} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        </svg></div>
      </> : <div className="h-52 w-full rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center gap-2 text-center p-4">
        <div className="rounded-full bg-gray-100 p-2.5 text-gray-400"><BarChart3 className="h-6 w-6" /></div><div><p className="text-sm font-medium text-gray-600">{carregando ? "Carregando movimentações..." : "Sem registros de movimentações"}</p><p className="text-xs text-gray-400 max-w-[280px] mt-0.5">O gráfico ficará disponível assim que você cadastrar receitas ou despesas neste mês.</p></div>
      </div>}
      <div className="mt-5 flex items-center justify-center gap-6 text-xs border-t border-gray-50 pt-3"><span className="flex items-center gap-2 text-gray-500"><span className="h-2.5 w-2.5 rounded-sm bg-[#059669]" />Entradas</span><span className="flex items-center gap-2 text-gray-500"><span className="h-2.5 w-2.5 rounded-sm bg-[#E11D48]" />Saídas</span></div>
    </article>
  )
}
