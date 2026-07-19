import { useState, useEffect } from "react"
import { Menu, Bell, User } from "lucide-react"

export function DashboardHeader({ onMenuClick }) {
  const [userName, setUserName] = useState("Usuário")
  const [userInitial, setUserInitial] = useState("U")

  useEffect(() => {
    // 🔍 Busca os dados reais guardados no localStorage pelo processo de login
    const usuarioLogadoString = localStorage.getItem("usuarioLogado")
    
    if (usuarioLogadoString) {
      try {
        const usuario = JSON.parse(usuarioLogadoString)
        if (usuario && usuario.nome) {
          setUserName(usuario.nome)
          // Pega a primeira letra do nome e joga em maiúsculo (ex: "maria" -> "M")
          setUserInitial(usuario.nome.charAt(0).toUpperCase())
        }
      } catch (error) {
        console.error("Erro ao ler dados do usuário do localStorage", error)
      }
    }
  }, [])

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6 rounded-xl shadow-sm">
      {/* Botão do Menu Mobile */}
      <button
        onClick={onMenuClick}
        className="text-gray-500 hover:text-gray-700 focus:outline-none lg:hidden cursor-pointer"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Título de boas-vindas dinâmico */}
      <div className="flex flex-col text-left">
        <h1 className="text-sm font-medium text-gray-400">Olá, bem-vindo de volta!</h1>
        <p className="text-base font-semibold text-gray-900 capitalize">{userName}</p>
      </div>

      {/* Ações da Direita: Avatar */}
      <div className="flex items-center gap-4">
        {/* Bloco do Perfil / Avatar */}
        <div className="flex items-center gap-3">
          {/* Círculo com a Inicial dinâmica consertada! */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 font-semibold text-emerald-600 border border-emerald-100 select-none">
            {userInitial}
          </div>
          
          <div className="hidden flex-col text-left sm:flex">
            <span className="text-xs font-medium text-gray-700 capitalize">{userName}</span>
            <span className="text-[10px] text-gray-400 font-mono">Painel Executivo</span>
          </div>
        </div>
      </div>
    </header>
  )
}