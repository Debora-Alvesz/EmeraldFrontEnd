/**
 * src/dashboard/components/sidebar.jsx
 * 
 * Componente Estrutural de Navegação e Controle de Sessão (Sidebar).
 * Gerencia a renderização dos menus operacionais e restrições de perfis administrativos.
 */

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Wallet, 
  Tags, 
  Target, 
  Users, 
  LogOut, 
  X 
} from "lucide-react";
import { EmeraldLogo } from "../../infrastructure/components/EmeraldLogo";

export function Sidebar({ open, onClose, currentTab, onTabChange, onLogout }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Recuperação de payload de sessão para validação de privilégios em nível de interface
    const usuarioLogadoString = localStorage.getItem("usuarioLogado");
    if (usuarioLogadoString) {
      try {
        const usuario = JSON.parse(usuarioLogadoString);
        // Desbloqueia recursos administrativos caso o perfil retornado pelo Java seja ADMIN
        if (usuario && usuario.nomePerfil === "ADMIN") {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error("Erro ao ler perfil do usuário na Sidebar", e);
      }
    }
  }, []);

  // Mapeamento dos módulos públicos acessíveis para todos os usuários comuns (USER)
  const menuItems = [
    { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { id: "contas", label: "Minhas Contas", icon: Wallet },
    { id: "categorias", label: "Despesas e Receitas", icon: Tags },
    { id: "metas", label: "Metas Mensais", icon: Target },
  ];

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Menu Lateral Estruturado com os Tokens do Design System (@theme inline) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:static lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>
        
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <EmeraldLogo className="h-6 w-6 text-primary" />
            <span className="font-bold tracking-wider text-foreground text-sm">EMERALD</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
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
                  onClose(); 
                }}
                // Alternância automática de estados visuais baseada na propriedade 'currentTab' ativa
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  active 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-sidebar-accent-foreground" : "text-muted-foreground"}`} />
                {item.label}
              </button>
            );
          })}

          {/* Renderização Condicional Restrita: Apenas visível para contas de escopo ADMIN */}
          {isAdmin && (
            <div className="pt-6 mt-6 border-t border-sidebar-border">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-destructive mb-2">
                Painel do Administrador
              </p>
              <button
                onClick={() => {
                  onTabChange("usuarios-admin");
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  currentTab === "usuarios-admin"
                    ? "bg-rose-50 text-destructive border-rose-100"
                    : "text-sidebar-foreground hover:bg-rose-50 hover:text-destructive"
                }`}
              >
                <Users className={`h-4 w-4 ${currentTab === "usuarios-admin" ? "text-destructive" : "text-muted-foreground"}`} />
                Gerenciar Usuários
              </button>
            </div>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-rose-50 hover:text-destructive transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            Sair do Sistema
          </button>
        </div>
      </aside>
    </>
  );
}