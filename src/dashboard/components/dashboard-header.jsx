import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import PerfilModal from "../../infrastructure/components/perfil-modal" 

export function DashboardHeader({ onMenuClick }) {
  const [userName, setUserName] = useState("Usuário")
  const [userInitial, setUserInitial] = useState("U")
  const [userEmail, setUserEmail] = useState("executivo@emerald.com")
  
  // 2. ESTADO PARA CONTROLAR A ABERTURA DO MODAL
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false)

  // Lendo o .env primeiro, e usando localhost só de backup
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080"

  // Função isolada para podermos chamar sempre que o usuário editar o perfil
  const carregarDadosUsuario = () => {
    const usuarioLogadoString = localStorage.getItem("usuarioLogado")
    
    if (usuarioLogadoString) {
      try {
        const usuario = JSON.parse(usuarioLogadoString)
        
        if (usuario && usuario.nome) {
          setUserName(usuario.nome)
          setUserInitial(usuario.nome.charAt(0).toUpperCase())
          if (usuario.email) {
            setUserEmail(usuario.email)
          }
        }

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
                setUserName(data.nome)
                setUserInitial(data.nome.charAt(0).toUpperCase())
                setUserEmail(data.email)
                
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
  }

  useEffect(() => {
    carregarDadosUsuario()
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

      {/* 3. AÇÕES DA DIREITA: Agora clicável e com efeito hover! */}
      <div 
        onClick={() => setIsPerfilModalOpen(true)}
        className="flex items-center gap-3 select-none cursor-pointer hover:bg-emerald-50/60 p-1.5 px-2 rounded-lg transition-all border border-transparent hover:border-emerald-100"
        title="Clique para ver seu perfil"
      >
        {/* Círculo com a Inicial dinâmica */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-semibold text-emerald-600 border border-emerald-100">
          {userInitial}
        </div>
        
        {/* Bloco de textos com Nome e E-mail */}
        <div className="hidden flex-col text-left sm:flex">
          <span className="text-xs font-semibold text-gray-800 capitalize truncate max-w-[160px]">
            {userName}
          </span>
          <span className="text-[11px] text-gray-400 truncate max-w-[180px]">
            {userEmail}
          </span>
        </div>
      </div>

      {/* 4. COMPONENTE DO MODAL */}
      <PerfilModal 
        isOpen={isPerfilModalOpen} 
        onClose={() => {
          setIsPerfilModalOpen(false)
          carregarDadosUsuario() // Recarrega os dados do topo instantaneamente caso o nome/email tenha mudado!
        }} 
      />
    </header>
  )
}