import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, Plus, Scale, Search, Trash2, X } from 'lucide-react';
import api from '../api';
import { obterStatusEstoque } from '../utils/estoqueStatus';
import { extrairMensagemErro } from '../utils/mensagemErro';

const API_PRODUTOS_URL = '/api/produtos';
const DURACAO_FALLBACK_DRAWER_MS = 280;

const formatadorBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const FORM_INICIAL = {
  nome: '',
  categoria: '',
  preco: '',
  quantidade: '',
  estoqueMinimo: ''
};

function normalizarTexto(valor) {
  return String(valor ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function validarFormularioProduto(valores) {
  const erros = {};

  if (!valores.nome.trim()) {
    erros.nome = 'O nome é obrigatório';
  }

  if (!valores.categoria.trim()) {
    erros.categoria = 'A categoria é obrigatória';
  }

  if (valores.preco === '' || valores.preco == null) {
    erros.preco = 'O preço é obrigatório';
  } else {
    const precoNumero = Number(valores.preco);
    if (!Number.isFinite(precoNumero) || precoNumero <= 0) {
      erros.preco = 'O preço deve ser maior que zero';
    }
  }

  if (valores.quantidade === '' || valores.quantidade == null) {
    erros.quantidade = 'A quantidade é obrigatória';
  } else {
    const qtdNumero = Number(valores.quantidade);
    if (!Number.isInteger(qtdNumero) || qtdNumero < 0) {
      erros.quantidade = 'A quantidade não pode ser negativa';
    }
  }

  if (valores.estoqueMinimo === '' || valores.estoqueMinimo == null) {
    erros.estoqueMinimo = 'O estoque mínimo é obrigatório';
  } else {
    const minNumero = Number(valores.estoqueMinimo);
    if (!Number.isInteger(minNumero) || minNumero < 0) {
      erros.estoqueMinimo = 'O estoque mínimo não pode ser negativo';
    }
  }

  return erros;
}

function ProdutosView({
  produtos,
  carregando,
  onRecarregar,
  onAbrirMovimentacao,
  onAbrirAjuste,
  mostrarToast
}) {
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');

  // Estados do Drawer lateral de Novo Produto
  const [drawerMontado, setDrawerMontado] = useState(false);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [formulario, setFormulario] = useState(FORM_INICIAL);
  const [errosForm, setErrosForm] = useState({});
  const [enviando, setEnviando] = useState(false);

  const botaoNovoProdutoRef = useRef(null);
  const primeiroCampoRef = useRef(null);
  const timerFechamentoRef = useRef(null);

  const listaProdutos = useMemo(
    () => (Array.isArray(produtos) ? produtos.filter(Boolean) : []),
    [produtos]
  );

  const categoriasDisponiveis = useMemo(() => {
    const unicas = new Set();
    listaProdutos.forEach((produto) => {
      const cat = String(produto.categoria ?? '').trim();
      if (cat) unicas.add(cat);
    });
    return Array.from(unicas).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [listaProdutos]);

  const produtosFiltrados = useMemo(() => {
    const termoBusca = normalizarTexto(busca);
    return listaProdutos.filter((produto) => {
      const correspondeNome =
        !termoBusca || normalizarTexto(produto.nome).includes(termoBusca);

      const correspondeCategoria =
        !categoriaFiltro || String(produto.categoria ?? '').trim() === categoriaFiltro;

      const status = obterStatusEstoque(produto);
      const correspondeStatus = !statusFiltro || status.chave === statusFiltro;

      return correspondeNome && correspondeCategoria && correspondeStatus;
    });
  }, [listaProdutos, busca, categoriaFiltro, statusFiltro]);

  const temFiltroAtivo = Boolean(busca.trim() || categoriaFiltro || statusFiltro);

  const limparFiltros = () => {
    setBusca('');
    setCategoriaFiltro('');
    setStatusFiltro('');
  };

  const abrirDrawer = () => {
    if (timerFechamentoRef.current) {
      clearTimeout(timerFechamentoRef.current);
      timerFechamentoRef.current = null;
    }
    setErrosForm({});
    setDrawerMontado(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDrawerAberto(true);
      });
    });
  };

  const finalizarFechamentoDrawer = () => {
    if (timerFechamentoRef.current) {
      clearTimeout(timerFechamentoRef.current);
      timerFechamentoRef.current = null;
    }
    setDrawerMontado(false);
    setFormulario(FORM_INICIAL);
    setErrosForm({});
    requestAnimationFrame(() => {
      botaoNovoProdutoRef.current?.focus();
    });
  };

  const fecharDrawer = () => {
    if (enviando) return;
    setDrawerAberto(false);

    const semAnimacao =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (semAnimacao) {
      finalizarFechamentoDrawer();
      return;
    }

    timerFechamentoRef.current = setTimeout(
      finalizarFechamentoDrawer,
      DURACAO_FALLBACK_DRAWER_MS
    );
  };

  // Foco no primeiro campo ao abrir e bloqueio do scroll de fundo enquanto montado
  useEffect(() => {
    if (!drawerMontado) return undefined;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timerFoco = setTimeout(() => {
      primeiroCampoRef.current?.focus();
    }, 30);

    return () => {
      clearTimeout(timerFoco);
      document.body.style.overflow = overflowAnterior;
    };
  }, [drawerMontado]);

  // Fechar Drawer com tecla Esc
  useEffect(() => {
    if (!drawerMontado) return undefined;

    const aoPressionarTecla = (evento) => {
      if (evento.key === 'Escape' && !enviando) {
        setDrawerAberto(false);
        const semAnimacao = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (semAnimacao) {
          finalizarFechamentoDrawer();
        } else {
          timerFechamentoRef.current = setTimeout(
            finalizarFechamentoDrawer,
            DURACAO_FALLBACK_DRAWER_MS
          );
        }
      }
    };

    document.addEventListener('keydown', aoPressionarTecla);
    return () => document.removeEventListener('keydown', aoPressionarTecla);
  }, [drawerMontado, enviando]);

  useEffect(() => {
    return () => {
      if (timerFechamentoRef.current) {
        clearTimeout(timerFechamentoRef.current);
      }
    };
  }, []);

  const aoAlterarCampo = (campo, valor) => {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    if (errosForm[campo]) {
      setErrosForm((anterior) => ({ ...anterior, [campo]: '' }));
    }
  };

  const handleSalvarProduto = async (evento) => {
    evento.preventDefault();
    const erros = validarFormularioProduto(formulario);
    if (Object.keys(erros).length > 0) {
      setErrosForm(erros);
      return;
    }

    setEnviando(true);
    try {
      await api.post(API_PRODUTOS_URL, {
        nome: formulario.nome.trim(),
        categoria: formulario.categoria.trim(),
        preco: Number(Number(formulario.preco).toFixed(2)),
        quantidade: Number(formulario.quantidade),
        estoqueMinimo: Number(formulario.estoqueMinimo)
      });

      mostrarToast('sucesso', 'Produto cadastrado com sucesso!');
      setEnviando(false);
      setDrawerAberto(false);
      const semAnimacao = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (semAnimacao) {
        finalizarFechamentoDrawer();
      } else {
        timerFechamentoRef.current = setTimeout(
          finalizarFechamentoDrawer,
          DURACAO_FALLBACK_DRAWER_MS
        );
      }
      onRecarregar();
    } catch (erroApi) {
      console.error('Erro ao cadastrar produto:', erroApi);
      mostrarToast(
        'erro',
        extrairMensagemErro(erroApi, 'Erro ao cadastrar produto. Verifique os campos.')
      );
      setEnviando(false);
    }
  };

  const handleExcluirProduto = async (produto) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${produto.nome}"?`)) return;

    try {
      await api.delete(`${API_PRODUTOS_URL}/${produto.id}`);
      mostrarToast('info', 'Produto excluído com sucesso.');
      onRecarregar();
    } catch (erroExclusao) {
      console.error('Erro ao excluir produto:', erroExclusao);
      const statusHttp = erroExclusao?.response?.status;
      const dados = erroExclusao?.response?.data;
      const ehErroGenericoVinculo =
        statusHttp === 500 ||
        statusHttp === 409 ||
        (typeof dados === 'object' && dados?.error === 'Internal Server Error');

      if (ehErroGenericoVinculo) {
        mostrarToast(
          'erro',
          'Não foi possível excluir: o produto possui movimentações ou vendas vinculadas.'
        );
      } else {
        mostrarToast(
          'erro',
          extrairMensagemErro(erroExclusao, 'Falha ao excluir o produto.')
        );
      }
    }
  };

  return (
    <div className="produtos-container">
      <header className="produtos-header">
        <div>
          <h2 className="produtos-titulo">Produtos</h2>
          <p className="produtos-subtitulo">
            Catálogo, níveis de estoque, movimentações e balanço de inventário.
          </p>
        </div>

        <button
          ref={botaoNovoProdutoRef}
          type="button"
          className="btn btn-primary produtos-btn-novo"
          onClick={abrirDrawer}
        >
          <Plus size={18} aria-hidden="true" />
          Novo Produto
        </button>
      </header>

      <section className="cloud-surface produtos-filtros" aria-label="Filtros de produtos">
        <div className="produtos-filtros-campos">
          <div className="produtos-busca-wrapper">
            <Search size={16} className="produtos-busca-icone" aria-hidden="true" />
            <input
              type="text"
              className="form-control produtos-busca-input"
              placeholder="Buscar produto por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar produto por nome"
            />
            {Boolean(busca) && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setBusca('')}
                aria-label="Limpar busca"
                title="Limpar busca"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="produtos-filtro-select-grupo">
            <label htmlFor="filtro-categoria" className="produtos-filtro-label">
              Categoria
            </label>
            <select
              id="filtro-categoria"
              className="form-control"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <option value="">Todas</option>
              {categoriasDisponiveis.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="produtos-filtro-select-grupo">
            <label htmlFor="filtro-status" className="produtos-filtro-label">
              Status
            </label>
            <select
              id="filtro-status"
              className="form-control"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="normal">Normal</option>
              <option value="baixo">Estoque Baixo</option>
              <option value="esgotado">Esgotado</option>
            </select>
          </div>
        </div>

        <div className="produtos-filtros-meta">
          <span className="produtos-contador">
            {`${produtosFiltrados.length} de ${listaProdutos.length} ${
              listaProdutos.length === 1 ? 'produto' : 'produtos'
            }`}
          </span>

          {temFiltroAtivo && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={limparFiltros}
            >
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      <section className="cloud-surface produtos-tabela-card">
        {carregando ? (
          <div className="produtos-estado" aria-live="polite">
            <p className="produtos-estado-texto">Carregando produtos...</p>
          </div>
        ) : listaProdutos.length === 0 ? (
          <div className="produtos-estado">
            <p className="produtos-estado-titulo">Nenhum produto cadastrado.</p>
            <p className="produtos-estado-texto">
              Cadastre o primeiro item para começar a controlar o estoque.
            </p>
            <button type="button" className="btn btn-primary" onClick={abrirDrawer}>
              <Plus size={16} aria-hidden="true" />
              Novo Produto
            </button>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="produtos-estado">
            <p className="produtos-estado-titulo">Nenhum produto encontrado para os filtros aplicados.</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={limparFiltros}>
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="produtos-table-wrapper">
            <table className="cloud-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Saldo</th>
                  <th>Mínimo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((produto) => {
                  const status = obterStatusEstoque(produto);
                  return (
                    <tr key={`produto-${produto.id}`}>
                      <td className="produtos-nome-cell">{produto.nome}</td>
                      <td>
                        <span className="produtos-categoria-tag">{produto.categoria}</span>
                      </td>
                      <td>{formatadorBRL.format(Number(produto.preco ?? 0))}</td>
                      <td className="produtos-saldo-cell">{produto.quantidade}</td>
                      <td>{produto.estoqueMinimo}</td>
                      <td>
                        <span className={status.classeBadge}>{status.rotulo}</span>
                      </td>
                      <td>
                        <div className="produtos-acoes">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => onAbrirMovimentacao(produto)}
                            title="Movimentar estoque"
                            aria-label={`Movimentar estoque de ${produto.nome}`}
                          >
                            <ArrowLeftRight size={15} aria-hidden="true" />
                            <span>Movimentar</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => onAbrirAjuste(produto)}
                            title="Ajustar"
                            aria-label={`Ajustar inventário de ${produto.nome}`}
                          >
                            <Scale size={15} aria-hidden="true" />
                            <span>Ajustar</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-outline btn-sm"
                            onClick={() => handleExcluirProduto(produto)}
                            title="Excluir produto"
                            aria-label={`Excluir ${produto.nome}`}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {drawerMontado && (
        <>
          <div
            className={`drawer-backdrop ${drawerAberto ? 'is-open' : ''}`}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) fecharDrawer();
            }}
            aria-hidden="true"
          />

          <aside
            className={`drawer-panel ${drawerAberto ? 'is-open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-drawer-produto"
            onTransitionEnd={(e) => {
              if (e.target === e.currentTarget && !drawerAberto) {
                finalizarFechamentoDrawer();
              }
            }}
          >
            <div className="drawer-header">
              <h3 id="titulo-drawer-produto" className="produtos-drawer-titulo">
                Novo Produto
              </h3>
              <button
                type="button"
                className="produtos-drawer-fechar"
                onClick={fecharDrawer}
                disabled={enviando}
                aria-label="Fechar painel"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="drawer-body">
              <form
                id="form-novo-produto"
                onSubmit={handleSalvarProduto}
                className="produtos-drawer-form"
                noValidate
              >
                <div className="input-group">
                  <label htmlFor="drawer-produto-nome">Nome do Produto</label>
                  <input
                    id="drawer-produto-nome"
                    ref={primeiroCampoRef}
                    className={`form-control ${errosForm.nome ? 'produtos-input-erro' : ''}`}
                    type="text"
                    placeholder="Ex: Teclado Mecânico"
                    value={formulario.nome}
                    onChange={(e) => aoAlterarCampo('nome', e.target.value)}
                    aria-invalid={Boolean(errosForm.nome)}
                    required
                  />
                  {errosForm.nome && (
                    <span className="produtos-campo-erro" role="alert">
                      {errosForm.nome}
                    </span>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor="drawer-produto-categoria">Categoria</label>
                  <input
                    id="drawer-produto-categoria"
                    className={`form-control ${errosForm.categoria ? 'produtos-input-erro' : ''}`}
                    type="text"
                    placeholder="Ex: Periféricos"
                    value={formulario.categoria}
                    onChange={(e) => aoAlterarCampo('categoria', e.target.value)}
                    aria-invalid={Boolean(errosForm.categoria)}
                    required
                  />
                  {errosForm.categoria && (
                    <span className="produtos-campo-erro" role="alert">
                      {errosForm.categoria}
                    </span>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor="drawer-produto-preco">Preço (R$)</label>
                  <input
                    id="drawer-produto-preco"
                    className={`form-control ${errosForm.preco ? 'produtos-input-erro' : ''}`}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={formulario.preco}
                    onChange={(e) => aoAlterarCampo('preco', e.target.value)}
                    aria-invalid={Boolean(errosForm.preco)}
                    required
                  />
                  {errosForm.preco && (
                    <span className="produtos-campo-erro" role="alert">
                      {errosForm.preco}
                    </span>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor="drawer-produto-quantidade">Quantidade Inicial</label>
                  <input
                    id="drawer-produto-quantidade"
                    className={`form-control ${errosForm.quantidade ? 'produtos-input-erro' : ''}`}
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={formulario.quantidade}
                    onChange={(e) => aoAlterarCampo('quantidade', e.target.value)}
                    aria-invalid={Boolean(errosForm.quantidade)}
                    required
                  />
                  {errosForm.quantidade && (
                    <span className="produtos-campo-erro" role="alert">
                      {errosForm.quantidade}
                    </span>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor="drawer-produto-minimo">Estoque Mínimo</label>
                  <input
                    id="drawer-produto-minimo"
                    className={`form-control ${errosForm.estoqueMinimo ? 'produtos-input-erro' : ''}`}
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Ex: 5"
                    value={formulario.estoqueMinimo}
                    onChange={(e) => aoAlterarCampo('estoqueMinimo', e.target.value)}
                    aria-invalid={Boolean(errosForm.estoqueMinimo)}
                    required
                  />
                  {errosForm.estoqueMinimo && (
                    <span className="produtos-campo-erro" role="alert">
                      {errosForm.estoqueMinimo}
                    </span>
                  )}
                </div>
              </form>
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={fecharDrawer}
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="form-novo-produto"
                className="btn btn-primary"
                disabled={enviando}
              >
                {enviando ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

export default ProdutosView;
