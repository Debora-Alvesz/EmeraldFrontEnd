import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { PieChart } from "lucide-react"

const RADIUS = 60
const STROKE = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CORES = ["#12b886", "#4c9eff", "#f0616a", "#f5a623", "#a78bfa", "#38bdf8"]

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

function getCoresCategoriasSalvas() {
  try {
    return JSON.parse(window.localStorage.getItem("emerald.coresCategorias") || "{}")
  } catch {
    return {}
  }
}

export function CategoryChart() {
  const [transacoes, setTransacoes] = useState([])
  const [categoriasApi, setCategoriasApi] = useState([])
  const [carregando, setCarregando] = useState(true)
  const usuarioId = useMemo(() => (typeof window === "undefined" ? "" : getUsuarioId()), [])

  useEffect(() => {
    if (!usuarioId) {
      setCarregando(false)
      return
    }
    const baseUrl = `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/v1`
    Promise.all([
      axios.get(`${baseUrl}/transacoes/usuario/${usuarioId}`),
      axios.get(`${baseUrl}/categorias/usuario/${usuarioId}`),
    ])
      .then(([resTransacoes, resCategorias]) => {
        setTransacoes(Array.isArray(resTransacoes.data) ? resTransacoes.data : resTransacoes.data?.data || [])
        setCategoriasApi(Array.isArray(resCategorias.data) ? resCategorias.data : resCategorias.data?.data || [])
      })
      .catch((error) => console.error("Erro ao carregar gastos por categoria:", error))
      .finally(() => setCarregando(false))
  }, [usuarioId])

  const categorias = useMemo(() => {
    const porId = Object.fromEntries(categoriasApi.map((categoria) => [categoria.id, categoria]))
    const coresSalvas = getCoresCategoriasSalvas()
    const totais = new Map()
    const hoje = new Date()
    transacoes.forEach((transacao) => {
      const valor = Number(transacao.valor) || 0
      const data = new Date(transacao.data)
      if (valor >= 0 || Number.isNaN(data.getTime()) || data.getFullYear() !== hoje.getFullYear() || data.getMonth() !== hoje.getMonth()) return
      const categoria = porId[transacao.categoriaId]
      const id = transacao.categoriaId || "sem-categoria"
      const atual = totais.get(id) || {
        name: transacao.nomeCategoria || categoria?.nome || "Sem categoria",
        color: categoria?.cor || categoria?.corHex || categoria?.corCategoria || coresSalvas[transacao.categoriaId] || null,
        valor: 0,
      }
      atual.valor += Math.abs(valor)
      totais.set(id, atual)
    })
    const total = [...totais.values()].reduce((soma, categoria) => soma + categoria.valor, 0)
    return [...totais.values()].sort((a, b) => b.valor - a.valor).map((categoria, indice) => ({
      ...categoria,
      color: categoria.color || CORES[indice % CORES.length],
      percent: total ? Math.round((categoria.valor / total) * 100) : 0,
    }))
  }, [transacoes, categoriasApi])

  const hasData = categorias.length > 0
  let offset = 0

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
      <header className="mb-4"><h2 className="text-base font-semibold text-gray-900">Gastos por Categoria</h2><p className="text-sm text-gray-500">Distribuição das despesas do mês</p></header>
      {hasData ? <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between my-auto">
        <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0 -rotate-90" role="img" aria-label="Gráfico de rosca das despesas">
          {categorias.map((categoria) => {
            const length = (categoria.percent / 100) * CIRCUMFERENCE
            const circle = <circle key={categoria.name} cx="80" cy="80" r={RADIUS} fill="none" stroke={categoria.color} strokeWidth={STROKE} strokeDasharray={`${length} ${CIRCUMFERENCE - length}`} strokeDashoffset={-offset} />
            offset += length
            return circle
          })}
        </svg>
        <ul className="w-full space-y-3">{categorias.map((categoria) => <li key={categoria.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-gray-500"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoria.color }} />{categoria.name}</span><span className="font-semibold text-gray-900">{categoria.percent}%</span></li>)}</ul>
      </div> : <div className="h-52 w-full rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center gap-2 text-center p-4 my-auto"><div className="rounded-full bg-gray-100 p-2.5 text-gray-400"><PieChart className="h-6 w-6" /></div><div><p className="text-sm font-medium text-gray-600">{carregando ? "Carregando despesas..." : "Sem despesas cadastradas"}</p><p className="text-xs text-gray-400 max-w-[240px] mt-0.5">Suas despesas serão agrupadas por categoria e exibidas aqui.</p></div></div>}
    </article>
  )
}
