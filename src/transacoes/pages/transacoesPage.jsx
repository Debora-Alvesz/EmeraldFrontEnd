// Importa as dependências essenciais do React, requisições HTTP e ícones
import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Loader2 } from 'lucide-react';
import '../styles/transacoes-page.css';

// URL base da API configurada nas variáveis de ambiente
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1`;

// Paleta de cores disponíveis para as categorias
const CORES = ['#12b886', '#4c9eff', '#f0616a', '#f5a623', '#a78bfa', '#38bdf8'];
const CORES_CATEGORIAS_STORAGE = 'emerald.coresCategorias';

const lerCoresCategorias = () => {
  try {
    return JSON.parse(window.localStorage.getItem(CORES_CATEGORIAS_STORAGE) || '{}');
  } catch {
    return {};
  }
};

const salvarCorCategoria = (categoriaId, cor) => {
  if (!categoriaId || !cor) return;
  const cores = lerCoresCategorias();
  window.localStorage.setItem(CORES_CATEGORIAS_STORAGE, JSON.stringify({ ...cores, [categoriaId]: cor }));
};

const obterCorCategoria = (categoria) => {
  const coresSalvas = lerCoresCategorias();
  return categoria.cor || categoria.corHex || categoria.corCategoria || categoria.hexCor ||
    categoria.color || coresSalvas[categoria.id] || CORES[0];
};

// Formata um valor numérico para o padrão de moeda do Brasil (R$)
const fmtMoeda = (v) => 
  Math.abs(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Formata a data retornada pela API para o formato local (DD/MM/AAAA)
const fmtDataExibicao = (isoString) => {
  if (!isoString) return '—';
  const data = new Date(isoString);
  const utc = new Date(data.getTime() + data.getTimezoneOffset() * 60000);
  return utc.toLocaleDateString('pt-BR');
};

// Converte a data ISO para o formato de input do HTML (AAAA-MM-DD)
const fmtDataInput = (isoString) => {
  if (!isoString) return '';
  return isoString.split('T')[0];
};

export default function TransacoesPage() {
  // Tenta resgatar o ID do usuário logado através do localStorage do navegador
  const [usuarioId] = useState(() => {
    if (typeof window === 'undefined') return '';
    const idArmazenado = window.localStorage.getItem('usuarioId');
    if (idArmazenado) return idArmazenado;
    try {
      const usuarioLogado = JSON.parse(window.localStorage.getItem('usuarioLogado') || 'null');
      return usuarioLogado?.id || usuarioLogado?.usuarioId || usuarioLogado?.idUsuario ||
        usuarioLogado?.usuario?.id || usuarioLogado?.usuario?.usuarioId || '';
    } catch {
      return '';
    }
  });

  // Estados que armazenam as listas de dados buscadas no back-end
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [metodos, setMetodos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Estados para controlar os filtros de busca em tela
  const [filtroCategoriaId, setFiltroCategoriaId] = useState(null);
  const [busca, setBusca] = useState('');

  // Estados para gerenciar a abertura e dados dos modais (criação/edição)
  const [modalTransacaoAberto, setModalTransacaoAberto] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState(null);

  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  const [modalMetodoAberto, setModalMetodoAberto] = useState(false);
  const [metodoEditando, setMetodoEditando] = useState(null);

  // Faz as chamadas simultâneas à API para carregar todos os dados da página
  const carregarDadosDoSistema = async () => {
    if (!usuarioId) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const [resTransacoes, resCategorias, resContas, resMetodos] = await Promise.all([
        axios.get(`${API_BASE_URL}/transacoes/usuario/${usuarioId}`),
        axios.get(`${API_BASE_URL}/categorias/usuario/${usuarioId}`),
        axios.get(`${API_BASE_URL}/contas-bancarias/usuario/${usuarioId}`),
        axios.get(`${API_BASE_URL}/metodos-pagamento`)
      ]);

      setTransacoes(resTransacoes.data);
      setCategorias(resCategorias.data.map((categoria) => ({
        ...categoria,
        cor: obterCorCategoria(categoria),
      })));
      setContas(resContas.data);
      setMetodos(resMetodos.data);
    } catch (error) {
      console.error("Erro operacional no ecossistema Emerald:", error);
    } finally {
      setCarregando(false);
    }
  };

  // Aciona o carregamento inicial assim que o componente é montado na tela
  useEffect(() => {
    carregarDadosDoSistema();
  }, [usuarioId]);

  // Cria um dicionário rápido para descobrir a cor de uma categoria pelo seu ID
  const corPorCategoriaId = useMemo(() => {
    return Object.fromEntries(categorias.map((c) => [c.id, c.cor]));
  }, [categorias]);

  const nomeMetodoPorId = useMemo(() => {
    return Object.fromEntries(metodos.map((metodo) => [metodo.id, metodo.nomeMetodo]));
  }, [metodos]);

  // Filtra as transações com base na categoria selecionada e no texto digitado na busca
  const transacoesFiltradas = useMemo(() => {
    return transacoes
      .filter((t) => (filtroCategoriaId ? t.categoriaId === filtroCategoriaId : true))
      .filter((t) => t.descricao.toLowerCase().includes(busca.toLowerCase()))
      .sort((a, b) => new Date(b.data) - new Date(a.data)); // Ordena da mais recente para a mais antiga
  }, [transacoes, filtroCategoriaId, busca]);

  // Calcula o valor total de receitas, despesas e o saldo final com base nos dados atuais
  const totais = useMemo(() => {
    let receitas = 0;
    let despesas = 0;
    transacoes.forEach((t) => {
      if (t.valor > 0) receitas += t.valor;
      else despesas += Math.abs(t.valor);
    });
    return { receitas, despesas, saldo: receitas - despesas };
  }, [transacoes]);

  // Prepara e abre o modal para criar ou editar uma transação
  const abrirModalTx = (t = null) => {
    setTransacaoEditando(t);
    setModalTransacaoAberto(true);
  };

  // Trata o envio dos dados da transação para o back-end (via POST ou PUT)
  const salvarTransacao = async (payload) => {
    try {
      if (transacaoEditando) {
        await axios.put(`${API_BASE_URL}/transacoes/${transacaoEditando.id}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/transacoes`, { ...payload, usuarioId });
      }
      carregarDadosDoSistema(); // Recarrega os dados para atualizar a tabela e o resumo
      setModalTransacaoAberto(false);
    } catch (error) {
      alert("Erro ao salvar lançamento financeiro.");
    }
  };

  // Solicita confirmação e apaga a transação do banco de dados
  const excluirTransacao = async (id) => {
    if (!window.confirm("Deseja estornar e excluir esta transação definitivamente?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/transacoes/${id}`);
      setTransacoes((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      alert("Falha ao excluir a transação no servidor.");
    }
  };

  // Prepara e abre o modal de Categorias
  const abrirModalCat = (c = null) => {
    setCategoriaEditando(c);
    setModalCategoriaAberto(true);
  };

  // Trata o envio (Criação/Edição) da categoria
  const salvarCategoria = async (dados) => {
    const payload = { ...dados, usuarioId };
    try {
      let resposta;
      if (categoriaEditando) {
        resposta = await axios.put(`${API_BASE_URL}/categorias/${categoriaEditando.id}/usuario/${usuarioId}`, payload);
      } else {
        resposta = await axios.post(`${API_BASE_URL}/categorias`, payload);
      }
      salvarCorCategoria(resposta.data?.id || categoriaEditando?.id, dados.cor);
      carregarDadosDoSistema();
      setModalCategoriaAberto(false);
    } catch (error) {
      alert("Erro ao salvar categoria.");
    }
  };

  // Remove a categoria do banco caso não tenha transações dependentes
  const excluirCategoria = async (id) => {
    if (!window.confirm("Confirmar exclusão desta categoria?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/categorias/${id}/usuario/${usuarioId}`);
      setCategorias((prev) => prev.filter((c) => c.id !== id));
      if (filtroCategoriaId === id) setFiltroCategoriaId(null);
    } catch (error) {
      alert("Não é possível remover categorias vinculadas a transações existentes.");
    }
  };

  // Prepara e abre o modal de Métodos de Pagamento
  const abrirModalMetodo = (m = null) => {
    setMetodoEditando(m);
    setModalMetodoAberto(true);
  };

  // Empacota o nome digitado e salva o método no back-end
  const salvarMetodo = async (nomeMetodo) => {
    const payload = { nomeMetodo };
    try {
      if (metodoEditando) {
        await axios.put(`${API_BASE_URL}/metodos-pagamento/${metodoEditando.id}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/metodos-pagamento`, payload);
      }
      carregarDadosDoSistema(); // Atualiza toda a tela para que os dropdowns reflitam o novo item
      setModalMetodoAberto(false);
    } catch (error) {
      alert("Erro ao salvar método de pagamento.");
    }
  };

  // Deleta o método de pagamento
  const excluirMetodo = async (id) => {
    if (!window.confirm("Confirmar exclusão deste método?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/metodos-pagamento/${id}`);
      setMetodos((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      alert("Erro ao excluir método.");
    }
  };

  // Tela de loading exibida enquanto os dados estão sendo resgatados na montagem inicial
  if (carregando) {
    return (
      <div className="loading-state" style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', color: 'var(--foreground)' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)', marginBottom: 12 }} />
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 14, color: 'var(--muted-foreground)' }}>Sincronizando com Emerald Ledger...</span>
      </div>
    );
  }

  return (
    <div className="wrap">
      {/* Cabeçalho da página */}
      <header className="top">
        <div>
          <h1>Registros</h1>
          <p>Acompanhe entradas e saídas e organize por categoria.</p>
        </div>
        <button className="btn-primary" onClick={() => abrirModalTx(null)}>
          <Plus size={14} strokeWidth={2.5} /> Novo registro
        </button>
      </header>

      {/* Cards que exibem Saldo, Receitas e Despesas */}
      <section className="summary">
        <div className="summary-card">
          <div className="row">
            <span className="label">Saldo</span>
            <span className="icon-badge" style={{ background: totais.saldo >= 0 ? 'var(--income-soft)' : 'var(--expense-soft)' }}>💼</span>
          </div>
          <p className="value figure" style={{ color: totais.saldo >= 0 ? 'var(--income)' : 'var(--expense)' }}>
            {totais.saldo >= 0 ? '' : '− '}{fmtMoeda(totais.saldo)}
          </p>
        </div>
        <div className="summary-card">
          <div className="row">
            <span className="label">Receitas</span>
            <span className="icon-badge" style={{ background: 'var(--income-soft)', color: 'var(--income)' }}>↑</span>
          </div>
          <p className="value figure" style={{ color: 'var(--income)' }}>{fmtMoeda(totais.receitas)}</p>
        </div>
        <div className="summary-card">
          <div className="row">
            <span className="label">Despesas</span>
            <span className="icon-badge" style={{ background: 'var(--expense-soft)', color: 'var(--expense)' }}>↓</span>
          </div>
          <p className="value figure" style={{ color: 'var(--expense)' }}>{fmtMoeda(totais.despesas)}</p>
        </div>
      </section>

      {/* Grid principal que divide a tela em Menu Lateral e Tabela */}
      <div className="layout">
        <aside>
          {/* Seção 1: Listagem das Categorias */}
          <div className="row">
            <h2>▤ Categorias</h2>
            <button className="icon-btn" onClick={() => abrirModalCat(null)} aria-label="Nova categoria">＋</button>
          </div>
          <div id="catList">
            <div 
              className={`cat-item ${filtroCategoriaId === null ? 'active' : ''}`}
              onClick={() => setFiltroCategoriaId(null)}
            >
              <span className="left">
                <span className="dot" style={{ background: 'var(--muted-foreground)' }}></span>
                <span className="name">Todas</span>
              </span>
            </div>

            {categorias.map((cat) => (
              <div 
                key={cat.id} 
                className={`cat-item ${filtroCategoriaId === cat.id ? 'active' : ''}`}
              >
                <span className="left" onClick={() => setFiltroCategoriaId(cat.id)}>
                  <span className="dot" style={{ background: cat.cor || '#12b886' }}></span>
                  <span className="name">{cat.nome}</span>
                </span>
                <span className="actions">
                  <button title="Editar" onClick={() => abrirModalCat(cat)}>✎</button>
                  <button title="Excluir" className="del" onClick={() => excluirCategoria(cat.id)}>🗑</button>
                </span>
              </div>
            ))}
          </div>

          {/* Seção 2: Listagem dos Métodos de Pagamento */}
          <hr className="aside-divider" />
          
          <div className="row">
            <h2>⚙ Métodos de Pagamento</h2>
            <button className="icon-btn" onClick={() => abrirModalMetodo(null)} aria-label="Novo método">＋</button>
          </div>
          
          <div id="metodoList">
            {metodos.length === 0 ? (
              <div className="empty-text">Nenhum método cadastrado.</div>
            ) : (
              metodos.map((metodo) => (
                <div key={metodo.id} className="cat-item">
                  <span className="left">
                    <span className="name">{metodo.nomeMetodo}</span>
                  </span>
                  <span className="actions">
                    <button title="Editar" onClick={() => abrirModalMetodo(metodo)}>✎</button>
                    <button title="Excluir" className="del" onClick={() => excluirMetodo(metodo.id)}>🗑</button>
                  </span>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Tabela de exibição das transações cadastradas */}
        <section className="panel">
          <div className="panel-head">
            <h2 className="heading" style={{ fontSize: '14px' }}>Histórico</h2>
            <div className="search">
              <span>🔍</span>
              <input 
                value={busca} 
                onChange={(e) => setBusca(e.target.value)} 
                placeholder="Buscar por descrição..." 
              />
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Conta</th>
                  <th>Forma de pagamento</th>
                  <th className="right">Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transacoesFiltradas.map((t) => {
                  const entrada = t.valor > 0;
                  return (
                    <tr key={t.id}>
                      <td className="muted" data-label="Data">{fmtDataExibicao(t.data)}</td>
                      <td data-label="Descrição" style={{ fontWeight: 500 }}>{t.descricao}</td>
                      <td data-label="Categoria">
                        {t.nomeCategoria ? (
                          <span className="badge">
                            <span className="dot" style={{ background: corPorCategoriaId[t.categoriaId] || '#12b886' }}></span>
                            {t.nomeCategoria}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="muted" data-label="Conta">{t.nomeContaBancaria || '—'}</td>
                      <td className="muted" data-label="Forma de pagamento">
                        {t.nomeMetodoPagamento || t.nomeMetodo || nomeMetodoPorId[t.metodoPagamentoId] || '—'}
                      </td>
                      <td className="right" data-label="Valor">
                        <span className={`value-flow figure ${entrada ? 'in' : 'out'}`}>
                          <span className={`flow-icon ${entrada ? 'in' : 'out'}`}>{entrada ? '↑' : '↓'}</span>
                          {entrada ? '+' : '−'} {fmtMoeda(t.valor)}
                        </span>
                      </td>
                      <td className="right" data-label="Ações">
                        <span className="row-actions">
                          <button title="Editar" onClick={() => abrirModalTx(t)}>✎</button>
                          <button title="Excluir" className="del" onClick={() => excluirTransacao(t.id)}>🗑</button>
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {/* Exibido quando o filtro/busca não encontra resultados */}
                {transacoesFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty">Nenhuma transação encontrada para este filtro.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Renderização condicional dos Modais de Ação */}
      {modalTransacaoAberto && (
        <TransacaoModal 
          transacao={transacaoEditando}
          categorias={categorias}
          contas={contas}
          metodos={metodos}
          onFechar={() => setModalTransacaoAberto(false)}
          onSalvar={salvarTransacao}
        />
      )}

      {modalCategoriaAberto && (
        <CategoriaModal 
          categoria={categoriaEditando}
          onFechar={() => setModalCategoriaAberto(false)}
          onSalvar={salvarCategoria}
        />
      )}

      {modalMetodoAberto && (
        <MetodoPagamentoModal
          metodo={metodoEditando}
          onFechar={() => setModalMetodoAberto(false)}
          onSalvar={salvarMetodo}
        />
      )}
    </div>
  );
}

/* ==========================================================================
   COMPONENTE DO MODAL: TRANSAÇÃO
   ========================================================================== */
function TransacaoModal({ transacao, categorias, contas, metodos, onFechar, onSalvar }) {
  // Inicializa o tipo com base no valor (positivo=RECEITA, negativo=DESPESA)
  const [tipo, setTipo] = useState(() => transacao ? (transacao.valor >= 0 ? 'RECEITA' : 'DESPESA') : 'DESPESA');
  const [descricao, setDescricao] = useState(transacao?.descricao ?? '');
  const [valor, setValor] = useState(transacao ? Math.abs(transacao.valor).toString() : '');
  const [data, setData] = useState(transacao ? fmtDataInput(transacao.data) : new Date().toISOString().slice(0, 10));
  
  const [categoriaId, setCategoriaId] = useState(transacao?.categoriaId ?? '');
  const [contaId, setContaId] = useState(transacao?.contaBancariaId ?? contas[0]?.id ?? '');
  const [metodoId, setMetodoId] = useState(transacao?.metodoPagamentoId ?? metodos[0]?.id ?? '');

  // Limita as opções de categorias à aba selecionada (receita ou despesa)
  const categoriasFiltradas = useMemo(() => categorias.filter(c => c.tipo === tipo), [categorias, tipo]);

  // Se trocar o tipo, seleciona a primeira categoria compatível disponível
  useEffect(() => {
    if (!transacao) {
      const prim = categorias.find(c => c.tipo === tipo);
      setCategoriaId(prim ? prim.id : '');
    }
  }, [tipo, categorias, transacao]);

  // Prepara o objeto transacional com o valor ajustado para negativo (se for despesa) e emite para o pai salvar
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!descricao.trim() || !valor) return;

    const valorFinal = tipo === 'DESPESA' ? parseFloat(valor) * -1 : parseFloat(valor);

    onSalvar({
      descricao: descricao.trim(),
      valor: valorFinal,
      data: new Date(data).toISOString(),
      contaBancariaId: contaId,
      categoriaId: categoriaId,
      metodoPagamentoId: Number(metodoId)
    });
  };

  return (
    <div className="overlay open" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{transacao ? 'Editar transação' : 'Nova transação'}</h3>
          <button type="button" onClick={onFechar}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Abas para definir o fluxo do lançamento */}
          <div className="segment">
            <button type="button" className={tipo === 'RECEITA' ? 'active in' : ''} onClick={() => setTipo('RECEITA')}>↑ Receita</button>
            <button type="button" className={tipo === 'DESPESA' ? 'active out' : ''} onClick={() => setTipo('DESPESA')}>↓ Despesa</button>
          </div>

          <div className="field">
            <label>Descrição</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Supermercado, Salário..." required />
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Valor (R$)</label>
              <input type="number" min="0.01" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" required className="figure" />
            </div>
            <div className="field">
              <label>Data</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} required />
            </div>
          </div>

          <div className="field">
            <label>Categoria</label>
            <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} required>
              <option value="" disabled>Selecione uma categoria</option>
              {categoriasFiltradas.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Conta bancária</label>
              <select value={contaId} onChange={e => setContaId(e.target.value)} required>
                {contas.map(c => (
                  <option key={c.id} value={c.id}>{c.nomeConta}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Método de pagamento</label>
              <select value={metodoId} onChange={e => setMetodoId(e.target.value)} required>
                {metodos.map(m => (
                  <option key={m.id} value={m.id}>{m.nomeMetodo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   COMPONENTE DO MODAL: CATEGORIA
   ========================================================================== */
function CategoriaModal({ categoria, onFechar, onSalvar }) {
  const [nome, setNome] = useState(categoria?.nome ?? '');
  const [tipo, setTipo] = useState(categoria?.tipo ?? 'DESPESA');
  const [cor, setCor] = useState(categoria?.cor ?? CORES[0]);

  // Passa as informações preenchidas de volta para o construtor principal salvar na API
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onSalvar({ nome: nome.trim(), tipo, cor });
  };

  return (
    <div className="overlay open" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{categoria ? 'Editar categoria' : 'Nova categoria'}</h3>
          <button type="button" onClick={onFechar}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nome</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Educação, Lazer..." required autoFocus />
          </div>

          <div className="segment">
            <button type="button" className={tipo === 'RECEITA' ? 'active in' : ''} onClick={() => setTipo('RECEITA')}>↑ Receita</button>
            <button type="button" className={tipo === 'DESPESA' ? 'active out' : ''} onClick={() => setTipo('DESPESA')}>↓ Despesa</button>
          </div>

          <div className="field">
            <label>Cor</label>
            {/* Renderiza a lista visual em botões redondos baseada no array de CORES */}
            <div className="swatches">
              {CORES.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`swatch ${c === cor ? 'selected' : ''}`}
                  style={{ background: c, color: c }}
                  onClick={() => setCor(c)}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   COMPONENTE DO MODAL: MÉTODO DE PAGAMENTO
   ========================================================================== */
function MetodoPagamentoModal({ metodo, onFechar, onSalvar }) {
  const [nomeMetodo, setNomeMetodo] = useState(metodo?.nomeMetodo ?? '');

  // Retorna para o pai (TransacoesPage) apenas o texto editado do nome do Método
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nomeMetodo.trim()) return;
    onSalvar(nomeMetodo.trim());
  };

  return (
    <div className="overlay open" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{metodo ? 'Editar método de pagamento' : 'Novo método de pagamento'}</h3>
          <button type="button" onClick={onFechar}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          
          <div className="field">
            <label>Nome do Método</label>
            <input 
              value={nomeMetodo} 
              onChange={e => setNomeMetodo(e.target.value)} 
              placeholder="Ex: Boleto bancário, Cartão Elo..." 
              required 
              autoFocus 
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
