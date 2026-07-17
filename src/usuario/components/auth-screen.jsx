import { useState } from "react";
// Importação baseada na árvore de pastas do seu projeto
import { EmeraldLogo } from "../../infrastructure/components/EmeraldLogo";
import { API_URL } from "../../infrastructure/config/api";

// 🔹 Componente de input premium reutilizável com suporte a ícones
function InputField({ label, type, placeholder, value, onChange, icon }) {
  return (
    <div className="w-full space-y-1.5 text-left">
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full h-11 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 ${
            icon ? "pl-11 pr-4" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}

// 🔹 Componente principal (ESTRUTURA TELA CHEIA SEMÂNTICA)
export function AuthScreen({ onLoginSuccess }) {
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [tab, setTab] = useState("signup"); // Inicia na aba de cadastro

  // ✅ FUNÇÃO DE LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    
    const dadosLogin = { 
      email: loginEmail, 
      senha: loginPassword 
    };

    try {
      const resposta = await fetch(`${API_URL}/api/v1/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosLogin),
      });

      if (resposta.ok) {
        const usuarioLogado = await resposta.json();
        
        // 1. Guarda no localStorage primeiro
        localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));
        const usuarioId =
          usuarioLogado?.id ||
          usuarioLogado?.usuarioId ||
          usuarioLogado?.idUsuario ||
          usuarioLogado?.usuario?.id ||
          usuarioLogado?.usuario?.usuarioId ||
          "";
        if (usuarioId) {
          localStorage.setItem("usuarioId", String(usuarioId));
        }
        
        // 2. Imprime no console para o seu controle
        console.log("Usuário autenticado com sucesso:", usuarioLogado, { usuarioId });
        
        // 3. Muda de tela IMEDIATAMENTE
        if (onLoginSuccess) {
          onLoginSuccess(); 
        }
      } else {
        alert("Erro ao fazer login: Credenciais inválidas.");
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor. Verifique se o backend Spring Boot está rodando.");
    }
  };

  // ✅ FUNÇÃO DE CADASTRO
  const handleSignup = async (e) => {
    e.preventDefault();
    
    const dadosCadastro = {
      nome: name,
      email: signupEmail,
      senha: signupPassword
    };

    try {
      const resposta = await fetch(`${API_URL}/api/v1/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosCadastro),
      });

      if (resposta.ok) {
        alert("Conta criada com sucesso!");
        setTab("login"); // Pula para a tela de login
      } else {
        alert("Erro ao cadastrar. Verifique se o e-mail já existe ou se o perfil padrão está mapeado corretamente no banco.");
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor. O backend está ativo?");
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col md:flex-row font-sans">
      
      {/* 🟢 SEÇÃO ESQUERDA: Painel Institucional Esmeralda */}
      <section className="w-full md:w-[45%] bg-primary p-8 md:p-12 flex flex-col justify-between relative overflow-hidden text-white select-none">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="2" />
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <header className="relative z-10 flex items-center gap-3">
          <EmeraldLogo className="w-6 h-6 text-white" />
          <span className="text-sm font-semibold tracking-widest text-white/90">EMERALD</span>
        </header>

        <div className="relative z-10 my-auto py-8 space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            Riqueza em Detalhes<br />Finanças em Ordem
          </h1>
          <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-md">
            Vá além da planilha. Monitore suas contas, blinde seu orçamento mensal com metas precisas e enxergue o futuro do seu patrimônio de todos os ângulos.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2 pt-4">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/15 rounded-lg text-xs font-medium backdrop-blur-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            Conexão Única
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/15 rounded-lg text-xs font-medium backdrop-blur-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
            Teto de Gastos
          </span>
        </div>
      </section>

      {/* ⚪ SEÇÃO DIREITA: Formulários Interativos integrados à tela */}
      <section className="w-full md:w-[55%] p-6 md:p-12 flex flex-col justify-between items-center bg-[#f7faf8]">
        
        <nav className="w-full max-w-[320px] bg-secondary p-1 rounded-full flex items-center justify-between border border-border/60 mb-6">
          <button
            type="button"
            onClick={() => setTab("signup")}
            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              tab === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cadastrar
          </button>
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              tab === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Entrar
          </button>
        </nav>

        <div className="w-full max-w-[400px] my-auto space-y-6">
          <header className="space-y-1 text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {tab === "login" ? "Acessar conta" : "Criar conta"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tab === "login" ? "Seja bem-vindo de volta às suas finanças." : "Comece a lapidar suas finanças em poucos minutos."}
            </p>
          </header>

          {/* 🔹 FORMULÁRIO DE LOGIN */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <InputField
                label="Endereço de e-mail"
                type="email"
                placeholder="voce@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>}
              />

              <InputField
                label="Senha"
                type="password"
                placeholder="Digite sua senha"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
              />

              <button type="submit" className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors mt-2 cursor-pointer">
                Entrar
              </button>
            </form>
          )}

          {/* 🔹 FORMULÁRIO DE CADASTRO */}
          {tab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <InputField
                label="Nome completo"
                type="text"
                placeholder="Marta Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              />

              <InputField
                label="Endereço de e-mail"
                type="email"
                placeholder="voce@email.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>}
              />

              <div className="space-y-1">
                <InputField
                  label="Senha"
                  type="password"
                  placeholder="Crie uma senha segura"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                />
                {signupPassword && signupPassword.length < 6 ? (
                  <p className="text-[11px] text-destructive font-medium flex items-center gap-1 pl-1 animate-pulse">
                    ❌ A senha precisa ter no mínimo 6 caracteres.
                  </p>
                ) : signupPassword.length >= 6 ? (
                  <p className="text-[11px] text-primary font-medium flex items-center gap-1 pl-1">
                    ✅ Senha válida para o servidor.
                  </p>
                ) : null}
              </div>

              <button type="submit" className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors mt-2 cursor-pointer">
                Criar conta
              </button>
            </form>
          )}
        </div>

        <footer className="w-full flex justify-center gap-4 text-[11px] text-muted-foreground/70 select-none mt-6">
          <a href="#terms" className="hover:underline hover:text-foreground transition-colors">Termos de Serviço</a>
          <span>•</span>
          <a href="#privacy" className="hover:underline hover:text-foreground transition-colors">Política de Privacidade</a>
        </footer>
      </section>

    </main>
  );
}