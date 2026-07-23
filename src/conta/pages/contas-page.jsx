/**
 * src/conta/pages/contas-page.jsx
 *
 * Módulo de Gestão de Contas Bancárias e Carteiras.
 * Centraliza o fluxo de listagem, criação, edição e exclusão de contas.
 * INTEGRADO: Busca automática de dados reais do backend via HTTP Axios.
 */

import React, { useMemo, useState, useEffect } from "react";
import axios from "axios"; // 🔌 Cliente HTTP para conexão com o backend Java
import {
  ArrowLeft, 
  Plus,
  Wallet,
  Landmark,
  TrendingUp,
  PiggyBank,
  Pencil,
  Trash2,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Inbox,
  Layers,
} from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../../../components/ui/sheet";
import { API_URL } from "../../infrastructure/config/api";

import "../styles/contas-page.css";

// Mapeamento dos 4 tipos de conta do Enum do backend -> ícone + rótulo + cor.
// IMPORTANTE: "cor" aqui referencia as classes .cor-* definidas no CSS,
// usadas tanto na barra de composição quanto na legenda, para as cores
// nunca ficarem desencontradas entre os dois lugares.
const TIPOS_CONTA = [
  { value: "CORRENTE", label: "Corrente", icon: Landmark, corClasse: "bg-[#10B981]" }, 
  { value: "POUPANCA", label: "Poupança", icon: PiggyBank, corClasse: "bg-[#3B82F6]" }, 
  { value: "INVESTIMENTO", label: "Investimento", icon: TrendingUp, corClasse: "bg-[#8B5CF6]" }, 
  { value: "DINHEIRO", label: "Dinheiro", icon: Wallet, corClasse: "bg-[#F59E0B]" },
];

const MESES = [
  { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" }, { value: "4", label: "Abril" },
  { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
  { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

// Badge de cada tipo de conta no card — mesma cor da barra de composição,
// com fundo branco para não colorir o interior do badge.
const CORES_BADGE_TIPO = {
  CORRENTE: "bg-white text-[#10B981] border-[#10B981]",
  POUPANCA: "bg-white text-[#3B82F6] border-[#3B82F6]",
  INVESTIMENTO: "bg-white text-[#8B5CF6] border-[#8B5CF6]",
  DINHEIRO: "bg-white text-[#F59E0B] border-[#F59E0B]", 
};

const DATA_ATUAL = new Date();

const FORM_INICIAL = {
  nomeConta: "",
  saldo: "",
  tipoConta: "CORRENTE",
};

export default function ContasPage() {
  // Recupera o ID do usuário autenticado. Tenta primeiro a chave direta
  // "usuarioId" e, se não existir, tenta extrair de um objeto maior
  // "usuarioLogado" salvo pelo fluxo de login (vários formatos possíveis,
  // por isso a cadeia de "||"). Isso é o que garante a trava de posse
  // (IDOR) usada em todas as chamadas abaixo: nunca buscamos/alteramos
  // uma conta sem amarrar a operação a este usuarioId.
  const [usuarioId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const usuarioIdStorage = window.localStorage.getItem("usuarioId");
    if (usuarioIdStorage) {
      return usuarioIdStorage;
    }

    const usuarioLogadoString = window.localStorage.getItem("usuarioLogado");
    if (!usuarioLogadoString) {
      return "";
    }

    try {
      const usuarioLogado = JSON.parse(usuarioLogadoString);
      return (
        usuarioLogado?.id ||
        usuarioLogado?.usuarioId ||
        usuarioLogado?.idUsuario ||
        usuarioLogado?.usuario?.id ||
        usuarioLogado?.usuario?.usuarioId ||
        ""
      );
    } catch (error) {
      console.error("Erro ao parsear usuarioLogado do localStorage:", error);
      return "";
    }
  });

  // Coleção de contas carregada dinamicamente via API (fonte da verdade: o banco)
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Controle do modal de criação/edição
  const [modalAberto, setModalAberto] = useState(false);
  const [contaEmEdicao, setContaEmEdicao] = useState(null);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [erroForm, setErroForm] = useState("");

  // Controle do painel lateral (Sheet) de extrato mensal
  const [extratoAberto, setExtratoAberto] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(null);
  const [filtroMes, setFiltroMes] = useState(String(DATA_ATUAL.getMonth() + 1));
  const [filtroAno, setFiltroAno] = useState(String(DATA_ATUAL.getFullYear()));
  const [linhasExtrato, setLinhasExtrato] = useState([]);

  /* ---------------------------------------------------------------- */
  /* BLOCO DE INTEGRAÇÃO API (DISPARADO AUTOMATICAMENTE NA CARGA)     */
  /* ---------------------------------------------------------------- */

  // GET das contas do usuário logado. Aceita tanto um array "cru" quanto
  // um objeto envelopado ({ contas: [...] } ou { data: [...] }), para não
  // quebrar caso o backend mude o formato de retorno.
  const buscarContasDoBanco = async () => {
    if (!usuarioId) {
      setCarregando(false);
      return;
    }
    try {
      setCarregando(true);
      const response = await axios.get(`${API_URL}/api/v1/contas-bancarias/usuario/${usuarioId}`);
      const payload = response.data;
      const contasRetornadas = Array.isArray(payload)
        ? payload
        : payload?.contas || payload?.data || [];

      setContas(contasRetornadas);
    } catch (error) {
      console.error("Erro ao carregar contas do backend:", error);
    } finally {
      setCarregando(false);
    }
  };

  // Roda a busca assim que sabemos o usuarioId (login concluído/hidratado)
  useEffect(() => {
    buscarContasDoBanco();
  }, [usuarioId]);

  // Busca o extrato de uma conta filtrado por mês/ano (obterExtratoMensal do service)
  const carregarExtratoDaAPI = async (contaId, mes, ano) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/contas-bancarias/${contaId}/usuario/${usuarioId}/extrato?mes=${mes}&ano=${ano}`
      );
      const payload = response.data;
      const linhas = Array.isArray(payload)
        ? payload
        : payload?.extrato || payload?.data || payload?.content || payload?.transacoes || [];
      setLinhasExtrato(linhas);
    } catch (error) {
      console.error("Erro ao carregar extrato:", error);
    }
  };

  /* ---------------------------------------------------------------- */
  /* CONTROLADORES DE INTERFACE (HANDLERS)                            */
  /* ---------------------------------------------------------------- */

  // Soma simples de todos os saldos — recalculada só quando "contas" muda
  const saldoTotal = useMemo(() => {
    return contas.reduce((soma, conta) => soma + Number(conta.saldo || 0), 0);
  }, [contas]);

  // Agrupa o saldo por tipo de conta, para desenhar a barra de composição
  const distribuicaoPorTipo = useMemo(() => {
    const mapa = {};
    TIPOS_CONTA.forEach((t) => (mapa[t.value] = 0));
    contas.forEach((c) => {
      mapa[c.tipoConta] = (mapa[c.tipoConta] || 0) + Number(c.saldo || 0);
    });
    return mapa;
  }, [contas]);

  function abrirModalNovaConta() {
    setContaEmEdicao(null);
    setFormData(FORM_INICIAL);
    setErroForm("");
    setModalAberto(true);
  }

  function abrirModalEdicao(conta) {
    // Trava IDOR: garante que só é possível editar contas do próprio usuário
    if (conta.usuarioId !== usuarioId) return;
    setContaEmEdicao(conta);
    setFormData({
      nomeConta: conta.nomeConta,
      saldo: String(conta.saldo),
      tipoConta: conta.tipoConta,
    });
    setErroForm("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setContaEmEdicao(null);
    setFormData(FORM_INICIAL);
    setErroForm("");
  }

  async function handleSubmitFormulario(e) {
    e.preventDefault();

    if (!formData.nomeConta.trim()) {
      setErroForm("Informe um nome para a conta.");
      return;
    }
    const saldoNumerico = Number(formData.saldo);
    if (Number.isNaN(saldoNumerico)) {
      setErroForm("Informe um saldo numérico válido.");
      return;
    }

    const payload = {
      usuarioId,
      nomeConta: formData.nomeConta.trim(),
      saldo: saldoNumerico,
      tipoConta: formData.tipoConta,
    };

    try {
      if (contaEmEdicao) {
        await axios.put(`${API_URL}/api/v1/contas-bancarias/${contaEmEdicao.id}/usuario/${usuarioId}`, payload);
      } else {
        await axios.post(`${API_URL}/api/v1/contas-bancarias`, payload);
      }
      buscarContasDoBanco(); // Recarrega a lista do banco após salvar
      fecharModal();
    } catch (err) {
      setErroForm(err.response?.data?.message || "Erro ao salvar os dados no servidor.");
    }
  }

  async function handleExcluirConta(conta) {
    if (conta.usuarioId !== usuarioId) return;
    if (!window.confirm(`Tem certeza que deseja excluir a conta "${conta.nomeConta}"?`)) return;

    try {
      await axios.delete(`${API_URL}/api/v1/contas-bancarias/${conta.id}/usuario/${usuarioId}`);
      buscarContasDoBanco();
      if (contaSelecionada?.id === conta.id) {
        setExtratoAberto(false);
        setContaSelecionada(null);
      }
    } catch (err) {
      alert("Erro ao remover a conta do servidor.");
    }
  }

  function abrirExtrato(conta) {
    if (conta.usuarioId !== usuarioId) return;
    setContaSelecionada(conta);
    setLinhasExtrato([]);
    carregarExtratoDaAPI(conta.id, filtroMes, filtroAno);
    setExtratoAberto(true);
  }

  // Sem usuarioId não há como saber quais contas buscar — tela de bloqueio simples
  if (!usuarioId) {
    return (
      <div className="contas-page">
        <div className="mx-auto max-w-3xl px-5 py-12 text-center">
          <p className="text-xl font-semibold text-foreground">ID do usuário não encontrado</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Faça login novamente para que o sistema saiba qual conta carregar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="contas-page">
      <div className="contas-container">
        <header className="contas-header">
          <div>
            <h1 className="contas-header__titulo">Minhas Contas</h1>
            <p className="contas-header__subtitulo">
              Gerencie suas contas bancárias, carteiras e saldos atuais
            </p>
          </div>

          <Button onClick={abrirModalNovaConta} className="btn-nova-conta">
            <Plus className="h-4 w-4" />
            Nova Conta
          </Button>
        </header>

        {/* Bloco de Resumo Financeiro Consolidado */}
        <Card className="resumo-card">
          <CardContent className="resumo-card__conteudo">
            <div>
              <p className="resumo-card__label">Saldo total acumulado</p>
              <p className="resumo-card__valor">
                {saldoTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <p className="resumo-card__subtexto">
                {contas.length} {contas.length === 1 ? "conta cadastrada" : "contas cadastradas"}
              </p>
            </div>

            {/* Composição por tipo de conta: barra + legenda com cor/rótulo.
                A legenda abaixo sempre mostra os 4 tipos (mesmo com saldo
                zero), então ela não depende de haver saldo pra aparecer —
                se ela sumir, o problema é de layout/corte, não de dados. */}
            <div className="composicao">
              <div className="composicao__titulo">
                <Layers className="h-3.5 w-3.5" />
                Composição por tipo de conta
              </div>

          <div className="composicao__barra flex h-2.5 w-full overflow-hidden rounded-full bg-muted/20">
                {TIPOS_CONTA.map((tipo) => {
                  const valor = distribuicaoPorTipo[tipo.value] || 0;
                  const percentual = saldoTotal > 0 ? (valor / saldoTotal) * 100 : 0;
                  if (percentual <= 0) return null;
                  return (
                    <div
                      key={tipo.value}
                      className={`h-full ${tipo.corClasse}`}
                      style={{ width: `${percentual}%` }}
                    />
                  );
                })}
              </div>

              <div className="composicao__legenda mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                {TIPOS_CONTA.map((tipo) => (
                  <span key={tipo.value} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${tipo.corClasse}`} />
                    {tipo.label}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de contas: loading -> vazio -> grid */}
        <section className="mt-8">
          {carregando ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Carregando dados das contas...
            </div>
          ) : contas.length === 0 ? (
            <EstadoVazioContas onNovaConta={abrirModalNovaConta} />
          ) : (
            <div className="contas-grid">
              {contas.map((conta) => (
                <CardConta
                  key={conta.id}
                  conta={conta}
                  onEditar={() => abrirModalEdicao(conta)}
                  onExcluir={() => handleExcluirConta(conta)}
                  onVerExtrato={() => abrirExtrato(conta)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

  {/* Modal de cadastro/edição */}
      <Dialog open={modalAberto} onOpenChange={(aberto) => (aberto ? null : fecharModal())}>
            <DialogContent className="sm:max-w-xl p-6 bg-card border-border rounded-2xl overflow-visible z-50">
            <DialogHeader>
            <DialogTitle>{contaEmEdicao ? "Editar Conta" : "Nova Conta"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Os dados modificados aqui serão persistidos diretamente no seu banco de dados relacional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitFormulario} className="mt-4 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nomeConta">Nome da conta</Label>
              <Input
                id="nomeConta"
                placeholder="Ex.: Nubank, Carteira..."
                value={formData.nomeConta}
                onChange={(e) => setFormData((prev) => ({ ...prev, nomeConta: e.target.value }))}
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saldo">Saldo inicial (R$)</Label>
              <Input
                id="saldo"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.saldo}
                disabled={!!contaEmEdicao}
                onChange={(e) => setFormData((prev) => ({ ...prev, saldo: e.target.value }))}
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoConta">Tipo de conta</Label>
              <Select
                value={formData.tipoConta}
                onValueChange={(valor) => setFormData((prev) => ({ ...prev, tipoConta: valor }))}
              >
                <SelectTrigger id="tipoConta" className="h-11 rounded-lg">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
              <SelectContent 
                side="bottom" 
                className="z-[100] bg-card border-border"
              >
                {TIPOS_CONTA.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>  
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
              </Select>
            </div>

            {erroForm && <p className="text-sm font-medium text-destructive">{erroForm}</p>}

            <DialogFooter className="pt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={fecharModal}
                className="h-11 px-5 rounded-xl font-medium w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 w-full sm:w-auto"
              >
                {contaEmEdicao ? "Salvar alterações" : "Cadastrar conta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

     {/* Painel lateral de extrato mensal. */}
      <Sheet open={extratoAberto} onOpenChange={setExtratoAberto}>
        <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-4 sm:p-6 bg-card border-border shadow-2xl z-50 overflow-visible">
          {contaSelecionada && (
            <>
              {/* CABEÇALHO COM BOTÃO VOLTAR (shrink-0 impede que ele seja espremido) */}
              <div className="flex items-start gap-3 shrink-0">
                <button 
                  onClick={() => setExtratoAberto(false)}
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Voltar e fechar painel"
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                </button>

                <SheetHeader className="text-left flex-1 mt-0">
                  <SheetTitle className="flex items-center gap-2 text-xl">
                    <Receipt className="h-5 w-5 text-primary shrink-0" />
                    <span className="truncate">{contaSelecionada.nomeConta}</span>
                  </SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground mt-1">
                    Consome em tempo real os registros vinculados à chave primária desta conta.
                  </SheetDescription>
                </SheetHeader>
              </div>

              {/* FILTROS FIXOS NO TOPO
                  Adicionamos "relative z-20" para garantir que flutuem SOBRE a lista
                  e tiramos de dentro do bloco com overflow-y-auto */}
              <div className="extrato-filtros grid grid-cols-2 gap-3 mt-6 shrink-0 relative z-20">
                <div className="form-field flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Mês de Análise</Label>
                  <Select
                    value={filtroMes}
                    onValueChange={(v) => {
                      setFiltroMes(v);
                      carregarExtratoDaAPI(contaSelecionada.id, v, filtroAno);
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-lg bg-background border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      align="start"
                      // Mudamos de max-h-64 para max-h-[400px] para caberem todos os 12 meses sem cortar
                      className="z-[120] max-h-[400px] w-full bg-card border-border"
                    >
                      {MESES.map((mes) => (
                        <SelectItem key={mes.value} value={mes.value}>
                          {mes.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="form-field flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Ano de Análise</Label>
                  <Input
                    type="number"
                    value={filtroAno}
                    className="h-10 rounded-lg bg-background border-input"
                    onChange={(e) => {
                      setFiltroAno(e.target.value);
                      if (e.target.value.length === 4) {
                        carregarExtratoDaAPI(contaSelecionada.id, filtroMes, e.target.value);
                      }
                    }}
                  />
                </div>
              </div>

              {/* ÁREA ROLÁVEL: Agora apenas a lista ou o empty state tem scroll, 
                  evitando o recorte (clip) no dropdown dos filtros logo acima */}
              <div className="flex-1 overflow-y-auto mt-6 pr-2">
                {linhasExtrato.length === 0 ? (
                  <div className="empty-state empty-state--extrato flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border bg-muted/30">
                    <Inbox className="h-8 w-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium text-muted-foreground text-center">
                      Nenhum registro retornado
                    </p>
                    <p className="mt-1 max-w-[200px] text-xs text-muted-foreground/80 text-center">
                      Não há registros nesse período.
                    </p>
                  </div>
                ) : (
                  <ul className="extrato-lista divide-y divide-border rounded-xl border border-border bg-background overflow-hidden relative z-0">
                    {linhasExtrato.map((transacao) => {
                      const isDespesa = Number(transacao.valor) < 0; 
                      
                      return (
                        <li key={transacao.id} className="extrato-item flex items-center justify-between gap-3 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`extrato-item__icone flex h-8 w-8 items-center justify-center rounded-full ${isDespesa ? 'bg-red-100' : 'bg-emerald-100'}`}>
                              {isDespesa ? (
                                <ArrowDownRight className="h-4 w-4 text-red-600" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                              )}
                            </span>
                            
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {transacao.descricao || transacao.nomeCategoria}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transacao.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`text-sm font-bold ${isDespesa ? 'text-red-600' : 'text-emerald-600'}`}>
                            {Number(transacao.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CardConta({ conta, onEditar, onExcluir, onVerExtrato }) {
  const tipoInfo = TIPOS_CONTA.find((t) => t.value === conta.tipoConta) || TIPOS_CONTA[0];
  const IconeConta = conta.tipoConta === "DINHEIRO" ? Wallet : Landmark; 
  const tipoClasse = conta.tipoConta.toLowerCase().replace("ç", "c");

  return (
    <Card className={`conta-card conta-card--${tipoClasse}`}>
      <CardHeader className="conta-card__header">
        <div className="flex items-center gap-3">
          <span className="conta-card__icone">
            <IconeConta className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="conta-card__titulo">{conta.nomeConta}</CardTitle>
            <Badge
              variant="outline"
              className={`mt-1 rounded-full border px-2 py-0 text-[11px] font-medium ${CORES_BADGE_TIPO[conta.tipoConta]}`}
            >
              {tipoInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <p className="conta-card__saldo-label">Saldo atual</p>
        <p className="conta-card__saldo-valor">
          {conta.saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
      </CardContent>

      <CardFooter className="conta-card__footer">
        <div className="conta-card__acoes">
          {/* Botões com ícone + title (tooltip nativo), para a ação ficar
              clara mesmo sem texto ao lado do ícone */}
          <button
            type="button"
            onClick={onEditar}
            title="Editar conta"
            aria-label="Editar conta"
            className="icon-btn icon-btn--editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onExcluir}
            title="Excluir conta"
            aria-label="Excluir conta"
            className="icon-btn icon-btn--excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <Button onClick={onVerExtrato} size="sm" variant="outline" className="btn-extrato">
          <Receipt className="h-3.5 w-3.5" />
          Ver Extrato
        </Button>
      </CardFooter>
    </Card>
  );
}

function EstadoVazioContas({ onNovaConta }) {
  return (
    <div className="empty-state">
      <Wallet className="h-9 w-9 text-muted-foreground" />
      <p className="mt-4 text-sm font-medium text-foreground">Nenhuma conta retornada pela API</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Dispare o método save() do service Java cadastrando a primeira.
      </p>
      <Button onClick={onNovaConta} className="btn-nova-conta mt-5">
        <Plus className="h-4 w-4" /> Nova Conta
      </Button>
    </div>
  );
}
