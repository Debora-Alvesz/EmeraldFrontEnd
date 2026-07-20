import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { Inbox } from "lucide-react"

const COR_PADRAO_CATEGORIA = "#12b886"

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

export function TransactionsTable() {
  const [transacoes, setTransacoes] = useState([])
  const [categorias, setCategorias] = useState([])
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
        const dados = Array.isArray(resTransacoes.data) ? resTransacoes.data : resTransacoes.data?.data || []
        setTransacoes(dados)
        setCategorias(Array.isArray(resCategorias.data) ? resCategorias.data : resCategorias.data?.data || [])
      })
      .catch((error) => console.error("Erro ao carregar últimas transações:", error))
      .finally(() => setCarregando(false))
  }, [usuarioId])

  const ultimasTransacoes = useMemo(() => [...transacoes]
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 4), [transacoes])

  const corPorCategoriaId = useMemo(() => {
    const coresSalvas = getCoresCategoriasSalvas()
    return Object.fromEntries(categorias.map((categoria) => [
      categoria.id,
      categoria.cor || categoria.corHex || categoria.corCategoria || coresSalvas[categoria.id] || COR_PADRAO_CATEGORIA,
    ]))
  }, [categorias])

  const formatarData = (data) => new Date(data).toLocaleDateString("pt-BR")
  const formatarMoeda = (valor) => Math.abs(Number(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <section aria-label="Últimas transações" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <header className="mb-4"><h2 className="text-base font-semibold text-gray-900">Últimas Transações</h2><p className="text-sm text-gray-500">As quatro movimentações mais recentes</p></header>
      <div className="overflow-x-auto">
        {ultimasTransacoes.length > 0 ? <table className="w-full table-fixed border-collapse text-sm">
          <colgroup><col className="w-[24%]" /><col /><col className="w-[30%]" /></colgroup>
          <thead><tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400"><th scope="col" className="pb-3 font-medium">Data</th><th scope="col" className="pb-3 font-medium">Categoria</th><th scope="col" className="pb-3 text-right font-medium">Valor</th></tr></thead>
          <tbody>{ultimasTransacoes.map((transacao) => {
            const entrada = Number(transacao.valor) >= 0
            return <tr key={transacao.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
              <td className="py-3.5 text-gray-400 whitespace-nowrap">{formatarData(transacao.data)}</td>
              <td className="py-3.5 overflow-hidden"><span className="inline-flex max-w-full items-center gap-2 truncate rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: corPorCategoriaId[transacao.categoriaId] || COR_PADRAO_CATEGORIA }} /> <span className="truncate">{transacao.nomeCategoria || "Sem categoria"}</span></span></td>
              <td className={`py-3.5 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${entrada ? "text-[#059669]" : "text-[#E11D48]"}`}>{entrada ? "+ " : "- "}{formatarMoeda(transacao.valor)}</td>
            </tr>
          })}</tbody>
        </table> : <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-100 bg-gray-50/30 py-12 text-center text-gray-400"><div className="rounded-full bg-gray-50 p-3 text-gray-300"><Inbox className="h-6 w-6" /></div><div><p className="text-sm font-medium text-gray-600">{carregando ? "Carregando transações..." : "Nenhuma transação encontrada"}</p><p className="mt-0.5 max-w-[280px] text-xs text-gray-400">As suas movimentações mais recentes aparecerão aqui.</p></div></div>}
      </div>
    </section>
  )
}
