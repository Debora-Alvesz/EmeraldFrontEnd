import { useState, useEffect } from "react"
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  Tags, 
  Target, 
  Users, 
  LogOut, 
  X 
} from "lucide-react"
import { EmeraldLogo } from "../../infrastructure/components/EmeraldLogo"

export function Sidebar({ open, onClose, currentTab, onTabChange, onLogout }) {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // 🛡️ Verifica o perfil do usuário para aplicar a Regra de Acesso do Admin
    const usuarioLogadoString = localStorage.getItem("usuarioLogado")
    if (usuarioLogadoString) {
      try {
        const usuario = JSON.parse(usuarioLogadoString)
        // Se o Java retornou 'ADMIN', nós liberamos o menu de gerenciamento
        if (usuario && usuario.nomePerfil === "ADMIN") {
          setIsAdmin(true)
        }
      } catch (e) {
        console.error("Erro ao ler perfil do usuário na Sidebar", e)
      }
    }
  }, [])

  // Lista de Menus para usuários comuns (Clientes - Perfil USER)
  const menuItems = [
    { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { id: "contas", label: "Minhas Contas", icon: Wallet },
    { id: "transacoes", label: "Movimentações", icon: ArrowLeftRight },
    { id: "categorias", label: "Categorias", icon: Tags },
    { id: "metas", label: "Metas Mensais", icon: Target },
  ]

  return (
    <>
      {/* Background escurecido para Mobile (Overlay) */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Container da Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>
        
        {/* Header da Sidebar com a Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <EmeraldLogo className="h-6 w-6 text-emerald-600" />
            <span className="font-bold tracking-wider text-gray-900 text-sm">EMERALD</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Menu Principal
          </p>
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onClose(); // Fecha no mobile após clicar
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  active 
                    ? "bg-emerald-50 text-emerald-600" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-emerald-600" : "text-gray-400"}`} />
                {item.label}
              </button>
            );
          })}

          {/* 👑 BLOCO EXCLUSIVO DO ADMIN: Só renderiza se for administrador */}
          {isAdmin && (
            <div className="pt-6 mt-6 border-t border-gray-100">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-rose-500 mb-2">
                Painel do Administrador
              </p>
              <button
                onClick={() => {
                  onTabChange("usuarios-admin");
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  currentTab === "usuarios-admin"
                    ? "bg-rose-50 text-rose-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-rose-600"
                }`}
              >
                <Users className={`h-4 w-4 ${currentTab === "usuarios-admin" ? "text-rose-600" : "text-gray-400"}`} />
                Gerenciar Usuários
              </button>
            </div>
          )}
        </nav>

        {/* Rodapé da Sidebar com Botão de Sair */}
        <div className="border-t border-gray-100 p-4">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-gray-400 hover:text-rose-600" />
            Sair do Sistema
          </button>
        </div>
      </aside>
    </>
  )
}