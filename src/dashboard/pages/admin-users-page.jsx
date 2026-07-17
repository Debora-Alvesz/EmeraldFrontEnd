import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../infrastructure/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { User, Loader2 } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get(`${API_URL}/api/v1/usuarios`);
        const payload = response.data;
        const userList = Array.isArray(payload) ? payload : payload?.data || payload?.usuarios || [];
        setUsers(userList);
      } catch (err) {
        console.error("Erro ao buscar usuários admin:", err);
        setError("Não foi possível carregar a lista de usuários. Verifique o backend.");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return (
    <div className="min-h-[400px] rounded-3xl bg-white p-6 shadow-sm border border-border">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
          <h2 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui está a lista de usuários cadastrados no sistema.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-3xl border border-border bg-muted/50 p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando usuários...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
      ) : users.length === 0 ? (
        <div className="rounded-3xl border border-border bg-muted/50 p-6 text-muted-foreground">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id || user.usuarioId || user.email} className="border-border bg-card">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {user.nome || user.name || user.email}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {user.email || user.usuarioEmail || "Sem e-mail"}
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="rounded-full border px-3 py-1 text-[11px] font-semibold">
                  {user.nomePerfil || user.perfil || user.role || "Usuário"}
                </Badge>
              </CardHeader>

              <CardContent className="grid gap-3 sm:grid-cols-2 sm:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                  <p className="mt-1 text-sm text-foreground">{user.ativo === false ? "Inativo" : "Ativo"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Perfil</p>
                  <p className="mt-1 text-sm text-foreground">{user.nomePerfil || user.perfil || user.role || "Usuário"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
