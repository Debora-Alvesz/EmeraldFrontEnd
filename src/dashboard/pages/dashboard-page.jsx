import "../styles/dashboard.css"
import { useState } from "react"
import { Sidebar } from "../components/sidebar"
import { DashboardHeader } from "../components/dashboard-header"
import { SummaryCards } from "../components/summary-cards"
import { CashflowChart } from "../components/cashflow-chart"
import { CategoryChart } from "../components/category-chart"
import { TransactionsTable } from "../components/transactions-table"
import ContasPage from "../../conta/pages/contas-page.jsx"
import TransacoesPage from "../../transacoes/pages/transacoesPage.jsx"
import AdminUsersPage from "./admin-users-page.jsx"

export default function DashboardPage({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState("dashboard") // 👈 Controla qual tela exibir

  return (
    // bg-[#F9FAFB] garante o fundo cinza claro premium da paleta executiva
    <div className="flex min-h-screen bg-[#F9FAFB] text-gray-900 font-sans">
      
      {/* Menu Lateral passando controle de abas e a função de logout */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onLogout={onLogout}
      />

      {/* Conteúdo Principal Dinâmico */}
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
          
          {/* Cabeçalho do Painel */}
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          
          {/* 🔄 Renderização condicional: Exibe cada tela de acordo com a aba selecionada */}
          {currentTab === "dashboard" ? (
            <>
              {/* Cards de Resumo Operacional */}
              <SummaryCards />

              {/* Grid de Gráficos (SVGs) */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CashflowChart />
                <CategoryChart />
              </div>

              {/* Histórico/Tabela de Movimentações */}
              <TransactionsTable />
            </>
          ) : currentTab === "contas" ? (
            <ContasPage />
          ) : currentTab === "categorias" ? (
            <TransacoesPage />
          ) : currentTab === "usuarios-admin" ? (
            <AdminUsersPage />
          ) : (
            /* 🖥️ Placeholder para as próximas telas (Metas, Perfil, etc) */
            <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-gray-200 rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-base font-semibold text-gray-800 capitalize">
                Tela de {currentTab}
              </p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                Esta seção está pronta para ser integrada.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}