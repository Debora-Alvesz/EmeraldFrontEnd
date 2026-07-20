import { useState, useEffect } from "react"
import { Menu } from "lucide-react"

export function DashboardHeader({ onMenuClick }) {
  const [userName, setUserName] = useState("Usuário")
  const [userInitial, setUserInitial] = useState("U")
  const [userEmail, setUserEmail] = useState("executivo@emerald.com")

  // lendo o .env primeiro, e usando localhost só de backup
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080"

  useEffect(() => {
    const usuarioLogadoString = localStorage.getItem("usuarioLogado")
    
    if (usuarioLogadoString) {
      try {
        const usuario = JSON.parse(usuarioLogadoString)
        
        // 1. Carrega o que está no localStorage temporariamente para não abrir em branco
        if (usuario && usuario.nome) {
          setUserName(usuario.nome)
          setUserInitial(usuario.nome.charAt(0).toUpperCase())
          if (usuario.email) {
            setUserEmail(usuario.email)
          }
        }

        // 2. 🌟 SINCROONIZAÇÃO: Busca o dado real e atualizado direto do seu Backend
        if (usuario && usuario.id) {
          fetch(`${API_BASE_URL}/api/v1/usuarios/${usuario.id}`)
            .then((response) => {
              if (!response.ok) {
                throw new Error("Erro ao buscar dados atualizados do servidor")
              }
              return response.json()
            })
            .then((data) => {
              if (data && data.nome) {
                // Atualiza a tela com o nome verdadeiro do banco de dados
                setUserName(data.nome)
                setUserInitial(data.nome.charAt(0).toUpperCase())
                setUserEmail(data.email)
                
                // Corrige o localStorage limpando o nome editado errado anterior
                const usuarioSincronizado = { 
                  ...usuario, 
                  nome: data.nome, 
                  email: data.email 
                }
                localStorage.setItem("usuarioLogado", JSON.stringify(usuarioSincronizado))
              }
            })
            .catch((err) => {
              console.error("Aviso: Não foi possível sincronizar com o banco, usando cache local.", err)
            })
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

      {/* Ações da Direita: Exibição Sincronizada do Perfil */}
      <div className="flex items-center gap-3 select-none">
        {/* Círculo com a Inicial dinâmica */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-semibold text-emerald-600 border border-emerald-100">
          {userInitial}
        </div>
        
        {/* Bloco de textos com Nome e E-mail reais do banco */}
        <div className="hidden flex-col text-left sm:flex">
          <span className="text-xs font-semibold text-gray-800 capitalize truncate max-w-[160px]">
            {userName}
          </span>
          <span className="text-[11px] text-gray-400 truncate max-w-[180px]">
            {userEmail}
          </span>
        </div>
      </div>
    </header>
  )
}