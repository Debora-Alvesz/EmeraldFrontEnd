/**
 * src/conta/pages/contas-page.jsx
 *
 * Módulo de Gestão de Contas Bancárias e Carteiras.
 * Centraliza o fluxo de listagem, criação, edição e exclusão de contas.
 * INTEGRADO: Busca automática de dados reais do backend via HTTP Axios.
 *
 * Estilos: os utilitários do Tailwind foram organizados em classes
 * semânticas dentro de "./contas-page.css" (ex.: .conta-card,
 * .icon-btn--editar). Isso evita strings gigantes de className no JSX
 * e deixa mais fácil ajustar o visual em um único arquivo.
 */

import React, { useMemo, useState, useEffect } from "react";
import axios from "axios"; // 🔌 Cliente HTTP para conexão com o backend Java
import {
  Plus,
  Wallet,
  Landmark,
  TrendingUp,
  PiggyBank,
  Pencil,
  Trash2,
  Receipt,
  ArrowUpRight,
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

import "./contas-page.css";

// Mapeamento dos 4 tipos de conta do Enum do backend -> ícone + rótulo + cor.
// IMPORTANTE: "cor" aqui referencia as classes .cor-* definidas no CSS,
// usadas tanto na barra de composição quanto na legenda, para as cores
// nunca ficarem desencontradas entre os dois lugares.
const TIPOS_CONTA = [
  { value: "CORRENTE", label: "Corrente", icon: Landmark, cor: "cor-corrente" },
  { value: "POUPANCA", label: "Poupança", icon: PiggyBank, cor: "cor-poupanca" },
  { value: "INVESTIMENTO", label: "Investimento", icon: TrendingUp, cor: "cor-investimento" },
  { value: "ESPECIE", label: "Dinheiro em Espécie", icon: Wallet, cor: "cor-especie" },
];

const MESES = [
  { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" }, { value: "4", label: "Abril" },
  { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
  { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

// Badge de cada tipo de conta no card — mantém as cores do tema (primary/info/etc)
const CORES_BADGE_TIPO = {
  CORRENTE: "bg-primary/10 text-primary border-primary/20",
  POUPANCA: "bg-info/10 text-info border-info/20",
  INVESTIMENTO: "bg-muted text-muted-foreground border-border",
  ESPECIE: "bg-amber-50 text-amber-700 border-amber-200",
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
      const response = await axios.get(`http://localhost:8080/api/v1/contas-bancarias/usuario/${usuarioId}`);
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
        `http://localhost:8080/api/v1/contas-bancarias/${contaId}/usuario/${usuarioId}/extrato?mes=${mes}&ano=${ano}`
      );
      setLinhasExtrato(response.data);
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
        await axios.put(`http://localhost:8080/api/v1/contas-bancarias/${contaEmEdicao.id}/usuario/${usuarioId}`, payload);
      } else {
        await axios.post("http://localhost:8080/api/v1/contas-bancarias", payload);
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
      await axios.delete(`http://localhost:8080/api/v1/contas-bancarias/${conta.id}/usuario/${usuarioId}`);
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

            {/* Composição por tipo de conta: barra + legenda com cor/rótulo */}
            <div className="composicao">
              <div className="composicao__titulo">
                <Layers className="h-3.5 w-3.5" />
                Composição por tipo de conta
              </div>

              <div className="composicao__barra">
                {TIPOS_CONTA.map((tipo) => {
                  const valor = distribuicaoPorTipo[tipo.value] || 0;
                  // Guarda contra divisão por zero quando ainda não há saldo algum
                  const percentual = saldoTotal > 0 ? (valor / saldoTotal) * 100 : 0;
                  if (percentual <= 0) return null;
                  return (
                    <div
                      key={tipo.value}
                      className={`h-full ${tipo.cor}`}
                      style={{ width: `${percentual}%` }}
                    />
                  );
                })}
              </div>

              {/* Legenda: sempre mostra os 4 tipos, mesmo com saldo zero,
                  para deixar claro qual cor pertence a qual tipo de conta */}
              <div className="composicao__legenda">
                {TIPOS_CONTA.map((tipo) => (
                  <span key={tipo.value} className="composicao__legenda-item">
                    <span className={`composicao__dot ${tipo.cor}`} />
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

      {/* Modal de cadastro/edição — largura maior (max-w-xl) para o Select
          de "Tipo de conta" não ficar espremido/cortado */}
      <Dialog open={modalAberto} onOpenChange={(aberto) => (aberto ? null : fecharModal())}>
        <DialogContent className="modal-conta">
          <DialogHeader>
            <DialogTitle>{contaEmEdicao ? "Editar Conta" : "Nova Conta"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Os dados modificados aqui serão persistidos diretamente no seu banco de dados relacional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitFormulario} className="modal-conta__form">
            <div className="form-field">
              <Label htmlFor="nomeConta">Nome da conta</Label>
              <Input
                id="nomeConta"
                placeholder="Ex.: Nubank, Carteira..."
                value={formData.nomeConta}
                onChange={(e) => setFormData((prev) => ({ ...prev, nomeConta: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <Label htmlFor="saldo">Saldo inicial (R$)</Label>
              <Input
                id="saldo"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.saldo}
                // Em edição o saldo não é digitado livremente: ele deve mudar
                // através de lançamentos (extrato), não por edição direta,
                // para manter o histórico e a soma sempre consistentes.
                disabled={!!contaEmEdicao}
                onChange={(e) => setFormData((prev) => ({ ...prev, saldo: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <Label htmlFor="tipoConta">Tipo de conta</Label>
              <Select
                value={formData.tipoConta}
                onValueChange={(valor) => setFormData((prev) => ({ ...prev, tipoConta: valor }))}
              >
                <SelectTrigger id="tipoConta" className="form-input">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {/* As 4 opções do Enum do backend: Corrente, Poupança,
                      Investimento e Dinheiro em Espécie */}
                  {TIPOS_CONTA.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {erroForm && <p className="form-erro">{erroForm}</p>}

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={fecharModal} className="rounded-lg">
                Cancelar
              </Button>
              <Button type="submit" className="btn-nova-conta rounded-lg">
                {contaEmEdicao ? "Salvar alterações" : "Cadastrar conta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Painel lateral de extrato mensal */}
      <Sheet open={extratoAberto} onOpenChange={setExtratoAberto}>
        <SheetContent className="sheet-extrato">
          {contaSelecionada && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Receipt className="h-4.5 w-4.5 text-primary" />
                  Extrato — {contaSelecionada.nomeConta}
                </SheetTitle>
                <SheetDescription className="text-muted-foreground">
                  Consome em tempo real os registros vinculados à chave primária desta conta.
                </SheetDescription>
              </SheetHeader>

              <div className="extrato-filtros">
                <div className="form-field">
                  <Label className="text-xs text-muted-foreground">Mês de Análise</Label>
                  <Select
                    value={filtroMes}
                    onValueChange={(v) => {
                      setFiltroMes(v);
                      // Recarrega o extrato imediatamente ao trocar o mês
                      carregarExtratoDaAPI(contaSelecionada.id, v, filtroAno);
                    }}
                  >
                    <SelectTrigger className="form-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {MESES.map((mes) => (
                        <SelectItem key={mes.value} value={mes.value}>
                          {mes.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="form-field">
                  <Label className="text-xs text-muted-foreground">Ano de Análise</Label>
                  <Input
                    type="number"
                    value={filtroAno}
                    className="form-input"
                    onChange={(e) => {
                      setFiltroAno(e.target.value);
                      // Só refaz a busca quando o ano tiver 4 dígitos completos
                      if (e.target.value.length === 4) {
                        carregarExtratoDaAPI(contaSelecionada.id, filtroMes, e.target.value);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="mt-6">
                {linhasExtrato.length === 0 ? (
                  <div className="empty-state empty-state--extrato">
                    <Inbox className="h-8 w-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium text-muted-foreground">
                      Nenhum registro retornado pelo Service
                    </p>
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
                      Nota: o método obterExtratoMensal() na classe Java precisa
                      realizar o mapeamento físico na tabela de transações.
                    </p>
                  </div>
                ) : (
                  <ul className="extrato-lista">
                    {/* O backend ainda retorna cada lançamento como texto simples;
                        por isso usamos String(linha) até o DTO de extrato existir */}
                    {linhasExtrato.map((linha, index) => (
                      <li key={index} className="extrato-item">
                        <div className="flex items-center gap-3">
                          <span className="extrato-item__icone bg-muted">
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                          </span>
                          <p className="text-sm font-medium text-foreground">{String(linha)}</p>
                        </div>
                      </li>
                    ))}
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
  const IconeConta = conta.tipoConta === "ESPECIE" ? Wallet : Landmark;

  return (
    <Card className="conta-card">
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