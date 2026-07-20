import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Target, Pencil, Trash2, Tag, Loader2 } from 'lucide-react';
import '../styles/metas-page.css'; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const API_BASE_URL = `${API_URL}/api/v1`;

// Formatador de Moeda
const fmtMoeda = (v) => 
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Conversores de Data (Frontend 'AAAA-MM' <---> Backend 'MM/AAAA')
const toBackendMesAno = (yyyy_mm) => {
  if (!yyyy_mm) return '';
  const [ano, mes] = yyyy_mm.split('-');
  return `${mes}/${ano}`;
};

const toFrontendMonth = (mm_yyyy) => {
  if (!mm_yyyy) return '';
  const [mes, ano] = mm_yyyy.split('/');
  return `${ano}-${mes}`;
};

const mesAtualFrontend = () => {
  const data = new Date();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${ano}-${mes}`;
};

export default function MetasPage() {
  const [usuarioId] = useState(() => {
    if (typeof window === "undefined") return "";
    const id = window.localStorage.getItem("usuarioId");
    if (id) return id;
    const userLogado = window.localStorage.getItem("usuarioLogado");
    return userLogado ? JSON.parse(userLogado).id : "3fa85f64-5717-4562-b3fc-2c963f66afa6"; 
  });

  const [metas, setMetas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroPeriodo, setFiltroPeriodo] = useState(mesAtualFrontend());
  const [exibirTodas, setExibirTodas] = useState(false); // ✨ NOVO ESTADO: Controla se exibe o histórico completo

  // Controle do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [metaEmEdicao, setMetaEmEdicao] = useState(null);
  const [formData, setFormData] = useState({
    categoriaId: '',
    mesAno: mesAtualFrontend(),
    valorLimite: ''
  });

  const buscarDadosIniciais = async () => {
    if (!usuarioId) return;
    setCarregando(true);
    try {
      console.log(`Buscando metas para o usuário: ${usuarioId}`);
      
      const [resMetas, resCategorias] = await Promise.all([
        axios.get(`${API_BASE_URL}/metas-financeiras/usuario/${usuarioId}`),
        axios.get(`${API_BASE_URL}/categorias/usuario/${usuarioId}`)
      ]);
      
      console.log("RESPOSTA DA API (METAS):", resMetas.data);
      console.log("RESPOSTA DA API (CATEGORIAS):", resCategorias.data);

      setMetas(Array.isArray(resMetas.data) ? resMetas.data : []);
      setCategorias(Array.isArray(resCategorias.data) ? resCategorias.data : []);
    } catch (error) {
      console.error("Erro ao buscar dados da API de metas:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDadosIniciais();
  }, [usuarioId]);

  // 🔥 FILTRO INTELIGENTE: Filtra por mês específico OU lista todas ordenadas de forma decrescente (mais recentes primeiro)
  const metasFiltradas = useMemo(() => {
    if (exibirTodas) {
      console.log(`Exibindo histórico completo. Total de metas: ${metas.length}`);
      return [...metas].sort((a, b) => {
        const [mA, aA] = a.mesAno.split('/').map(Number);
        const [mB, aB] = b.mesAno.split('/').map(Number);
        return (aB * 12 + mB) - (aA * 12 + mA); // Ordenação Cronológica Decrescente
      });
    }

    const periodoBackend = toBackendMesAno(filtroPeriodo);
    console.log(`Filtrando por: ${periodoBackend}. Total de metas carregadas: ${metas.length}`);
    return metas.filter(m => m.mesAno === periodoBackend);
  }, [metas, filtroPeriodo, exibirTodas]);

  // Handlers do Modal
  const abrirModal = (meta = null) => {
    if (meta) {
      setMetaEmEdicao(meta);
      setFormData({
        categoriaId: meta.categoriaId || meta.categoria?.id || '',
        mesAno: toFrontendMonth(meta.mesAno),
        valorLimite: meta.valorLimite
      });
    } else {
      setMetaEmEdicao(null);
      setFormData({
        categoriaId: categorias.length > 0 ? categorias[0].id : '',
        mesAno: filtroPeriodo || mesAtualFrontend(),
        valorLimite: ''
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setMetaEmEdicao(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoriaId || !formData.valorLimite) return;

    const payload = {
      usuarioId: usuarioId,
      categoriaId: formData.categoriaId,
      mesAno: toBackendMesAno(formData.mesAno),
      valorLimite: parseFloat(formData.valorLimite)
    };

    try {
      if (metaEmEdicao) {
        await axios.put(`${API_BASE_URL}/metas-financeiras/${metaEmEdicao.id}/usuario/${usuarioId}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/metas-financeiras`, payload);
      }
      buscarDadosIniciais();
      fecharModal();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar meta financeira. Verifique o console.");
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm("Deseja realmente remover esta meta?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/metas-financeiras/${id}/usuario/${usuarioId}`);
      setMetas(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao remover a meta.");
    }
  };

  if (carregando) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <main className="metas-page">
      {/* 1. CABEÇALHO DA PÁGINA */}
      <header className="metas-header">
        <div className="metas-header__texto">
          <h1 className="metas-header__titulo">Metas Financeiras</h1>
          <p className="metas-header__subtitulo">
            Defina tetos de gastos por categoria para manter seu orçamento sob controle.
          </p>
        </div>

        <button type="button" className="btn btn--primario" onClick={() => abrirModal(null)}>
          <span className="btn__icone" aria-hidden="true">
            <Target size={18} />
          </span>
          <span className="btn__texto">Definir Nova Meta</span>
        </button>
      </header>

      {/* 2. PAINEL CENTRAL — GRID DE METAS ATIVAS */}
      <section className="metas-painel" aria-labelledby="metas-painel-titulo">
        <div className="metas-painel__cabecalho">
          <h2 id="metas-painel-titulo" className="metas-painel__titulo">
            {exibirTodas ? "Histórico Completo de Metas" : "Metas do Período"}
          </h2>
          
          {/* ✨ SEÇÃO DE FILTROS UPGRADED COM VISUAL PREMIUM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--muted-foreground)', userSelect: 'none' }}>
              <input 
                type="checkbox" 
                checked={exibirTodas} 
                onChange={(e) => setExibirTodas(e.target.checked)}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              Exibir todas as metas
            </label>

            {!exibirTodas && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="metas-painel__periodo">Filtro:</span>
                <input 
                  type="month" 
                  value={filtroPeriodo} 
                  onChange={(e) => setFiltroPeriodo(e.target.value)}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', padding: '6px 12px', borderRadius: 'var(--radius)', fontSize: '13px', outline: 'none' }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="metas-grid">
          {metasFiltradas.map((meta) => (
            <MetaCard 
              key={meta.id} 
              meta={meta} 
              usuarioId={usuarioId}
              onEdit={() => abrirModal(meta)} 
              onDelete={() => handleExcluir(meta.id)} 
            />
          ))}

          {metasFiltradas.length === 0 && (
            <div className="metas-grid__vazio">
              <p className="metas-grid__vazio-texto" style={{ marginBottom: '16px', color: 'var(--muted-foreground)' }}>
                {exibirTodas 
                  ? "Nenhuma meta cadastrada na sua conta até o momento."
                  : `Nenhuma meta cadastrada ou visível para este período (${toBackendMesAno(filtroPeriodo)}).`}
              </p>
              <button type="button" className="btn btn--secundario" onClick={() => abrirModal(null)}>
                Criar primeira meta
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. MODAL — CONFIGURAR META DE GASTOS */}
      {modalAberto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <dialog open className="modal-meta" aria-labelledby="modal-meta-titulo" style={{ display: 'block', margin: 0, position: 'relative' }}>
            <form onSubmit={handleSubmit} className="modal-meta__form">
              <header className="modal-meta__cabecalho">
                <h2 id="modal-meta-titulo" className="modal-meta__titulo">
                  {metaEmEdicao ? 'Editar Meta de Gastos' : 'Configurar Meta de Gastos'}
                </h2>
                <button type="button" className="modal-meta__fechar" onClick={fecharModal} aria-label="Fechar">
                  ✕
                </button>
              </header>

              <div className="modal-meta__corpo">
                <div className="campo-form">
                  <label htmlFor="meta-categoria" className="campo-form__label">Categoria (Apenas Despesas)</label>
                  <select 
                    id="meta-categoria" 
                    value={formData.categoriaId}
                    onChange={e => setFormData({...formData, categoriaId: e.target.value})}
                    className="campo-form__select" 
                    required
                  >
                    <option value="" disabled>Selecione uma categoria</option>
                    {categorias
                      .filter(c => c.tipo?.toUpperCase() === 'DESPESA' || !c.tipo)
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                      ))}
                  </select>
                </div>

                <div className="campo-form">
                  <label htmlFor="meta-periodo" className="campo-form__label">Período de Referência</label>
                  <input
                    type="month"
                    id="meta-periodo"
                    value={formData.mesAno}
                    onChange={e => setFormData({...formData, mesAno: e.target.value})}
                    className="campo-form__input"
                    required
                  />
                </div>

                <div className="campo-form">
                  <label htmlFor="meta-valor-limite" className="campo-form__label">Valor Limite (R$)</label>
                  <input
                    type="number"
                    id="meta-valor-limite"
                    value={formData.valorLimite}
                    onChange={e => setFormData({...formData, valorLimite: e.target.value})}
                    className="campo-form__input"
                    min="0.01"
                    step="0.01"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <footer className="modal-meta__rodape">
                <button type="button" className="btn btn--secundario" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primario">
                  Salvar Meta
                </button>
              </footer>
            </form>
          </dialog>
        </div>
      )}
    </main>
  );
}

/* ==========================================================================
   SUBCOMPONENTE: CARD DA META (Com inteligência de Ciclo de Vida integrada)
   ========================================================================== */
function MetaCard({ meta, usuarioId, onEdit, onDelete }) {
  const [progresso, setProgresso] = useState(0);
  const [alertaMsg, setAlertaMsg] = useState("");

  useEffect(() => {
    const buscarProgresso = async () => {
      try {
        const [resProgresso, resAlerta] = await Promise.all([
          axios.get(`${API_BASE_URL}/metas-financeiras/${meta.id}/usuario/${usuarioId}/progresso`),
          axios.get(`${API_BASE_URL}/metas-financeiras/${meta.id}/usuario/${usuarioId}/alerta`)
        ]);

        const pct = typeof resProgresso.data === 'number' ? resProgresso.data : 0;
        setProgresso(pct);
        setAlertaMsg(resAlerta.data || "");
      } catch (error) {
        console.error(`Erro nas sub-rotas de progresso da meta ${meta.id}:`, error);
      }
    };
    if (meta.id) buscarProgresso();
  }, [meta.id, usuarioId]);

  // Inteligência de Ciclo de Vida do Orçamento
  const mesAnoAtualStr = useMemo(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }, []);

  const infoStatus = useMemo(() => {
    // Cenário A: A meta é do mês corrente (Mundo Dinâmico)
    if (meta.mesAno === mesAnoAtualStr) {
      if (progresso >= 100) return { texto: alertaMsg || "Limite Atingido!", classe: "estourado" };
      if (progresso >= 80) return { texto: alertaMsg || "Atenção", classe: "atencao" };
      return { texto: "Dentro do limite", classe: "ok" };
    }

    // Cenário B: A data da meta é do passado (Mundo Histórico)
    const [mMeta, aMeta] = meta.mesAno.split('/').map(Number);
    const [mAtual, aAtual] = mesAnoAtualStr.split('/').map(Number);
    
    const scoreMeta = aMeta * 12 + mMeta;
    const scoreAtual = aAtual * 12 + mAtual;

    if (scoreMeta < scoreAtual) {
      if (progresso >= 100) {
        return { texto: "Não Atingida (Estourou)", classe: "passado-estourado" };
      } else {
        return { texto: "Concluída com Sucesso! 🏆", classe: "sucesso" };
      }
    }

    // Cenário C: Meta de planejamento futuro
    return { texto: "Planejada", classe: "ok" };
  }, [meta.mesAno, mesAnoAtualStr, progresso, alertaMsg]);

  const valorGasto = (progresso / 100) * (meta.valorLimite || 0);
  const nomeExibicaoCategoria = meta.nomeCategoria || meta.categoria?.nome || "Categoria";

  return (
    <article className="meta-card" data-status={infoStatus.classe}>
      <header className="meta-card__cabecalho">
        <div className="meta-card__categoria">
          <span className="meta-card__categoria-icone" aria-hidden="true" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}><Tag size={16}/></span>
          <h3 className="meta-card__categoria-nome">{nomeExibicaoCategoria}</h3>
        </div>
        <span className="meta-card__periodo">{meta.mesAno}</span>
      </header>

      <div className="meta-card__valores">
        <span className="meta-card__valor-limite">Limite: {fmtMoeda(meta.valorLimite)}</span>
        <span className="meta-card__valor-gasto">Gasto: {fmtMoeda(valorGasto)}</span>
      </div>

      <div className="meta-card__progresso" role="progressbar" aria-valuenow={progresso} aria-valuemin="0" aria-valuemax="100">
        <div className="progresso-barra">
          <div 
            className={`progresso-barra__preenchimento ${
              infoStatus.classe === 'atencao' ? 'progresso-barra__preenchimento--atencao' : 
              infoStatus.classe === 'estourado' || infoStatus.classe === 'passado-estourado' ? 'progresso-barra__preenchimento--estourado' : 
              infoStatus.classe === 'sucesso' ? 'progresso-barra__preenchimento--sucesso' : ''
            }`} 
            style={{ width: `${Math.min(progresso, 100)}%` }}
          ></div>
        </div>
        <span className="progresso-barra__porcentagem">{progresso.toFixed(0)}% consumido</span>
      </div>

      <div className="meta-card__rodape">
        <span className={`meta-card__badge meta-card__badge--${infoStatus.classe}`}>
          {infoStatus.texto}
        </span>

        <div className="meta-card__acoes">
          <button type="button" className="icone-btn icone-btn--editar" onClick={onEdit} title="Editar meta">
            <Pencil size={14} />
          </button>
          <button type="button" className="icone-btn icone-btn--excluir" onClick={onDelete} title="Excluir meta">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}