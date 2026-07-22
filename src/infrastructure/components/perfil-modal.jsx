import React, { useState, useEffect } from "react";
import axios from "axios";
import { User, Mail, Calendar, Edit2, X, Save, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function PerfilModal({ isOpen, onClose }) {
  const [usuarioId] = useState(() => localStorage.getItem("usuarioId") || "");
  
  const [modoEdicao, setModoEdicao] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: "", texto: "" });

  const [usuario, setUsuario] = useState({
    nome: "",
    email: "",
    dataCriacao: "",
  });

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
  });

         // Busca os dados do usuário e reseta estados ao abrir o Modal
        useEffect(() => {
        if (!isOpen) return;

        // 🧹 1. Limpa mensagens anteriores e força o modo de visualização
        setMensagem({ tipo: "", texto: "" });
        setModoEdicao(false);

        if (!usuarioId) return;

        const carregarPerfil = async () => {
            try {
            setCarregando(true);
            const res = await axios.get(`${API_URL}/api/v1/usuarios/${usuarioId}`);
            setUsuario(res.data);
            setFormData({
                nome: res.data.nome || "",
                email: res.data.email || "",
                senha: "",
            });
            } catch (err) {
            console.error("Erro ao carregar perfil:", err);
            setMensagem({ tipo: "erro", texto: "Erro ao buscar dados do perfil." });
            } finally {
            setCarregando(false);
            }
        };

        carregarPerfil();
        }, [isOpen, usuarioId]);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setMensagem({ tipo: "", texto: "" });
    setSalvando(true);

    const payload = {
      nome: formData.nome,
      email: formData.email,
    };

    if (formData.senha && formData.senha.trim() !== "") {
      payload.senha = formData.senha;
    }

    try {
      const res = await axios.put(`${API_URL}/api/v1/usuarios/${usuarioId}`, payload);
      
      setUsuario(res.data);
      setModoEdicao(false);
      setFormData((prev) => ({ ...prev, senha: "" }));
      setMensagem({ tipo: "sucesso", texto: "Perfil atualizado com sucesso!" });

      const usuarioLogado = localStorage.getItem("usuarioLogado");
      if (usuarioLogado) {
        const parsed = JSON.parse(usuarioLogado);
        localStorage.setItem("usuarioLogado", JSON.stringify({ ...parsed, nome: res.data.nome }));
      }
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      setMensagem({
        tipo: "erro",
        texto: err.response?.data?.mensagem || "Erro ao salvar alterações. Verifique os campos.",
      });
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Cabeçalho usando a cor --primary (Verde Esmeralda) */}
        <div className="bg-primary text-primary-foreground p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-primary-foreground/80 hover:text-primary-foreground hover:bg-black/10 p-1.5 rounded-full transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-foreground/20 text-primary-foreground flex items-center justify-center font-bold text-xl border border-primary-foreground/30">
              {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-lg font-bold">{usuario.nome || "Usuário"}</h2>
              <p className="text-xs text-primary-foreground/80">{usuario.email}</p>
            </div>
          </div>
        </div>

        {/* Corpo do Modal usando variáveis de fundo e borda */}
        <div className="p-6 space-y-4">
          {mensagem.texto && (
            <div
              className={`p-3 rounded-lg text-xs font-medium border ${
                mensagem.tipo === "sucesso"
                  ? "bg-secondary text-secondary-foreground border-primary/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
            >
              {mensagem.texto}
            </div>
          )}

          {carregando ? (
            <div className="flex py-8 justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !modoEdicao ? (
            /* MODO VISUALIZAÇÃO */
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Nome</p>
                  <p className="text-sm font-medium text-foreground">{usuario.nome}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">E-mail</p>
                  <p className="text-sm font-medium text-foreground">{usuario.email}</p>
                </div>
              </div>

              {usuario.dataCriacao && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Membro desde</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(usuario.dataCriacao).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setModoEdicao(true)}
                className="w-full mt-2 py-2.5 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-border"
              >
                <Edit2 className="h-4 w-4" /> Editar Perfil
              </button>
            </div>
          ) : (
            /* MODO EDIÇÃO */
            <form onSubmit={handleSalvar} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nova Senha <span className="text-muted-foreground font-normal">(Deixe em branco para não alterar)</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModoEdicao(false)}
                  className="flex-1 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg font-medium transition-colors cursor-pointer border border-border"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}