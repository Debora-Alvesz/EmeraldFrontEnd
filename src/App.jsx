import { useState, useEffect } from "react"
import AuthPage from "./usuario/pages/auth-page.jsx"
import DashboardPage from "./dashboard/pages/dashboard-page.jsx" // 👈 Importando o seu novo Dashboard
import "./infrastructure/assets/css/global/elements.css"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Toda vez que o app inicia, ele checa se o usuário já logou anteriormente
    const usuarioLogado = localStorage.getItem("usuarioLogado")
    if (usuarioLogado) {
      setIsLoggedIn(true)
    }
  }, [])

  // Função para tratar o logout (passada para a Sidebar)
  const handleLogout = () => {
    localStorage.removeItem("usuarioLogado")
    setIsLoggedIn(false)
  }

  // Se estiver logado, exibe o painel completo do Dashboard
  if (isLoggedIn) {
    return <DashboardPage onLogout={handleLogout} />
  }

  // Se não estiver logado, exibe a tela de Login/Cadastro
  // Passamos a propriedade 'onLoginSuccess' para que a tela de login avise o App.jsx quando o Java autenticar!
  return <AuthPage onLoginSuccess={() => setIsLoggedIn(true)} />
}

export default App