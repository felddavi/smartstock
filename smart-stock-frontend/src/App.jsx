import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import PdvView from './PdvView';

function App() {
  const [produtos, setProdutos] = useState([]);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');

  // Estado de controle de navegação entre telas
  const [abaAtiva, setAbaAtiva] = useState('estoque'); // Opções: 'estoque' | 'pdv'
  const [subAbaProduto, setSubAbaProduto] = useState('cadastrar'); // 'cadastrar' | 'listar'

  // Estados para busca e filtro rápido da listagem (RF01)
  const [busca, setBusca] = useState('');
  const [apenasCriticos, setApenasCriticos] = useState(false);

  // Estados para o Modal de Movimentação de Estoque
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState('ENTRADA_REPOSICAO');
  const [quantidadeMovimentacao, setQuantidadeMovimentacao] = useState('');
  const [motivoMovimentacao, setMotivoMovimentacao] = useState('');
  const [enviandoMovimentacao, setEnviandoMovimentacao] = useState(false);

  // Estados para o Modal de Ajuste / Balanço de Inventário (RF06)
  const [produtoAjuste, setProdutoAjuste] = useState(null);
  const [contagemFisica, setContagemFisica] = useState('');
  const [erroAjuste, setErroAjuste] = useState('');
  const [enviandoAjuste, setEnviandoAjuste] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const API_PRODUTOS_URL = `${API_BASE_URL}/api/produtos`;
  const API_MOVIMENTACOES_URL = `${API_BASE_URL}/api/movimentacoes`;

  // Função para carregar os produtos do Spring Boot
  const carregarProdutos = async () => {
    try {
      const resposta = await axios.get(API_PRODUTOS_URL);
      setProdutos(Array.isArray(resposta.data) ? resposta.data : []);
    } catch (erro) {
      console.error("Erro ao carregar produtos:", erro);
      setProdutos([]);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  // Função para cadastrar novo produto
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_PRODUTOS_URL, {
        nome,
        categoria,
        preco: parseFloat(preco),
        quantidade: parseInt(quantidade),
        estoqueMinimo: parseInt(estoqueMinimo)
      });
      setNome('');
      setCategoria('');
      setPreco('');
      setQuantidade('');
      setEstoqueMinimo('');
      carregarProdutos();
      setSubAbaProduto('listar');
    } catch (erro) {
      console.error("Erro ao cadastrar produto:", erro);
      alert("Erro ao cadastrar produto. Verifique os campos e tente novamente.");
    }
  };

  // Abrir o modal com o produto selecionado
  const abrirModalMovimentacao = (produto) => {
    setProdutoSelecionado(produto);
    setTipoMovimentacao('ENTRADA_REPOSICAO');
    setQuantidadeMovimentacao('');
    setMotivoMovimentacao('');
    setModalAberto(true);
  };

  // Fechar o modal
  const fecharModal = () => {
    setModalAberto(false);
    setProdutoSelecionado(null);
    setQuantidadeMovimentacao('');
    setMotivoMovimentacao('');
  };

  // Confirmar e registrar movimentação de estoque
  const handleConfirmarMovimentacao = async (e) => {
    e.preventDefault();
    if (!produtoSelecionado) return;

    const qtd = parseInt(quantidadeMovimentacao);
    if (isNaN(qtd) || qtd <= 0) {
      alert("Informe uma quantidade válida maior que zero.");
      return;
    }

    setEnviandoMovimentacao(true);
    try {
      await axios.post(API_MOVIMENTACOES_URL, {
        produtoId: produtoSelecionado.id,
        tipo: tipoMovimentacao,
        quantidade: qtd,
        motivo: motivoMovimentacao ? motivoMovimentacao.trim() : null
      });

      alert("Movimentação registrada com sucesso!");
      fecharModal();
      carregarProdutos(); // Atualiza os dados e recarrega os alertas de estoque
    } catch (erro) {
      console.error("Erro ao registrar movimentação:", erro);
      const mensagemErro = erro.response?.data || "Falha ao registrar movimentação.";
      alert("Erro: " + mensagemErro);
    } finally {
      setEnviandoMovimentacao(false);
    }
  };

  // Abrir e fechar o modal de ajuste / balanço
  const abrirModalAjuste = (produto) => {
    setProdutoAjuste(produto);
    setContagemFisica('');
    setErroAjuste('');
  };

  const fecharModalAjuste = () => {
    if (enviandoAjuste) return;
    setProdutoAjuste(null);
    setContagemFisica('');
    setErroAjuste('');
  };

  // Contagem física válida: inteiro >= 0. Diferença = contagem - saldo atual
  const contagemFisicaNumero = contagemFisica === '' ? null : Number(contagemFisica);
  const contagemValida = Number.isInteger(contagemFisicaNumero) && contagemFisicaNumero >= 0;
  const diferencaAjuste =
    produtoAjuste && contagemValida ? contagemFisicaNumero - Number(produtoAjuste.quantidade) : null;

  // Confirmar ajuste: uma única movimentação com a diferença absoluta
  const handleConfirmarAjuste = async (e) => {
    e.preventDefault();
    if (!produtoAjuste || !contagemValida || diferencaAjuste === 0) return;

    setEnviandoAjuste(true);
    setErroAjuste('');
    try {
      await axios.post(API_MOVIMENTACOES_URL, {
        produtoId: produtoAjuste.id,
        tipo: diferencaAjuste < 0 ? 'SAIDA_AVARIA' : 'ENTRADA_REPOSICAO',
        quantidade: Math.abs(diferencaAjuste),
        motivo: 'Ajuste de inventário (balanço)'
      });
      setProdutoAjuste(null);
      setContagemFisica('');
      carregarProdutos();
    } catch (erro) {
      console.error("Erro ao registrar ajuste de inventário:", erro);
      const dados = erro.response?.data;
      setErroAjuste(
        typeof dados === 'string' && dados ? dados : (dados?.message || "Falha ao registrar o ajuste.")
      );
    } finally {
      setEnviandoAjuste(false);
    }
  };

  // Função para deletar produto
  const deletarProduto = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await axios.delete(`${API_PRODUTOS_URL}/${id}`);
      carregarProdutos();
    } catch (erro) {
      console.error("Erro ao deletar produto:", erro);
    }
  };

  // Função auxiliar para normalização segura de texto (trata null, undefined, números e acentos)
  const normalizarTexto = (valor) =>
    String(valor ?? '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const listaProdutos = Array.isArray(produtos) ? produtos : [];

  // Identifica produtos em situação de alerta (quantidade <= estoqueMinimo)
  const produtosEmAlerta = listaProdutos.filter(
    (p) => p && p.estoqueMinimo != null && Number(p.quantidade) <= Number(p.estoqueMinimo)
  );

  // Filtragem combinada da listagem: busca por nome/categoria/id e toggle de críticos (RF01)
  const termoBuscaNormalizado = normalizarTexto(busca);
  const produtosFiltrados = listaProdutos.filter((p) => {
    if (!p) return false;

    const nome = normalizarTexto(p.nome);
    const categoria = normalizarTexto(p.categoria);
    const id = String(p.id ?? '');

    const correspondeBusca =
      !termoBuscaNormalizado ||
      nome.includes(termoBuscaNormalizado) ||
      categoria.includes(termoBuscaNormalizado) ||
      id === termoBuscaNormalizado;

    const isCritico = p.estoqueMinimo != null && Number(p.quantidade) <= Number(p.estoqueMinimo);
    const correspondeCritico = !apenasCriticos || isCritico;

    return Boolean(correspondeBusca && correspondeCritico);
  });

  return (
    <div className="app-shell">
      {/* Topbar Estilo Aplicativo */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand">
            <div className="brand-icon" aria-hidden="true">📦</div>
            <div className="brand-text">
              <h1>Smart Stock</h1>
              <span>Sistema de Gestão de Estoque & PDV</span>
            </div>
          </div>

          {/* Barra de Navegação entre Telas */}
          <nav className="nav-tabs" aria-label="Navegação principal">
            <button
              type="button"
              className={`nav-tab ${abaAtiva === 'estoque' ? 'nav-tab--ativa' : ''}`}
              onClick={() => setAbaAtiva('estoque')}
              aria-current={abaAtiva === 'estoque' ? 'page' : undefined}
            >
              📦 Painel de Estoque
            </button>
            <button
              type="button"
              className={`nav-tab ${abaAtiva === 'pdv' ? 'nav-tab--ativa' : ''}`}
              onClick={() => setAbaAtiva('pdv')}
              aria-current={abaAtiva === 'pdv' ? 'page' : undefined}
            >
              🛒 Caixa / PDV
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {/* Tela 1: Painel de Estoque */}
        {abaAtiva === 'estoque' && (
          <>
            {/* Alerta de Ruptura / Estoque Baixo no topo */}
            {produtosEmAlerta.length > 0 && (
              <div className="alert-banner" role="alert">
                <span className="alert-icon" aria-hidden="true">⚠️</span>
                <div>
                  <strong>Atenção:</strong> Há <strong>{produtosEmAlerta.length}</strong> produto(s) com estoque no limite ou abaixo do mínimo recomendado!
                </div>
              </div>
            )}

            {/* Card unificado de Produtos */}
            <section className="panel-card module-card">
              <h2 className="module-title">📦 Produtos</h2>

              <div className="sub-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={subAbaProduto === 'cadastrar'}
                  className={`sub-tab ${subAbaProduto === 'cadastrar' ? 'sub-tab--ativa' : ''}`}
                  onClick={() => setSubAbaProduto('cadastrar')}
                >
                  + Cadastrar produto
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={subAbaProduto === 'listar'}
                  className={`sub-tab ${subAbaProduto === 'listar' ? 'sub-tab--ativa' : ''}`}
                  onClick={() => setSubAbaProduto('listar')}
                >
                  ☰ Listar produtos
                </button>
              </div>

              {subAbaProduto === 'cadastrar' && (
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="input-group">
                    <label htmlFor="input-nome">Nome do Produto</label>
                    <input
                      id="input-nome"
                      className="form-control"
                      type="text"
                      placeholder="Ex: Teclado Mecânico"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="input-categoria">Categoria</label>
                    <input
                      id="input-categoria"
                      className="form-control"
                      type="text"
                      placeholder="Ex: Periféricos"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="input-preco">Preço (R$)</label>
                    <input
                      id="input-preco"
                      className="form-control"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      value={preco}
                      onChange={(e) => setPreco(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="input-qtd">Qtd. Inicial</label>
                    <input
                      id="input-qtd"
                      className="form-control"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={quantidade}
                      onChange={(e) => setQuantidade(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="input-minimo">Estoque Mínimo</label>
                    <input
                      id="input-minimo"
                      className="form-control"
                      type="number"
                      min="0"
                      placeholder="Ex: 5"
                      value={estoqueMinimo}
                      onChange={(e) => setEstoqueMinimo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-success">
                    ✓ Cadastrar Produto
                  </button>
                </div>
              </form>
              )}

              {subAbaProduto === 'listar' && (
              <>
              {/* Barra de Busca e Filtros Rápidos (RF01) */}
              <div className="table-toolbar">
                <div className="search-filter-group">
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      className="form-control search-input"
                      placeholder="🔍 Buscar por nome ou categoria..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      aria-label="Buscar produtos por nome ou categoria"
                    />
                    {Boolean(busca) && (
                      <button
                        key="btn-limpar-busca"
                        type="button"
                        className="btn-clear-search"
                        onClick={() => setBusca('')}
                        aria-label="Limpar busca"
                        title="Limpar busca"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`btn btn-toggle-filter ${apenasCriticos ? 'btn-toggle-filter--ativo' : ''}`}
                    onClick={() => setApenasCriticos((prev) => !prev)}
                    aria-pressed={apenasCriticos}
                  >
                    ⚠️ Mostrar Apenas Críticos
                  </button>
                </div>

                <div className="table-counts">
                  {busca.trim() || apenasCriticos ? (
                    <span key="badge-filtrado" className="panel-badge panel-badge--filtered">
                      <span>Exibindo </span>
                      <strong>{produtosFiltrados.length}</strong>
                      <span>{` de ${listaProdutos.length} ${listaProdutos.length === 1 ? 'item' : 'itens'}`}</span>
                    </span>
                  ) : (
                    <span key="badge-total" className="panel-badge">
                      <span>{`${listaProdutos.length} ${listaProdutos.length === 1 ? 'item cadastrado' : 'itens cadastrados'}`}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="table-container">
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Categoria</th>
                      <th>Preço</th>
                      <th>Qtd</th>
                      <th>Estoque Mín.</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosFiltrados.length > 0 ? (
                      produtosFiltrados.map((p, idx) => {
                        const isZerado = p.quantidade <= 0;
                        const isAbaixoDoMinimo = p.estoqueMinimo != null && p.quantidade <= p.estoqueMinimo;

                        const rowClass = isZerado
                          ? 'row-zerado'
                          : isAbaixoDoMinimo
                            ? 'row-alerta'
                            : '';

                        const rowKey = p.id != null ? `prod-${p.id}` : `prod-idx-${idx}`;

                        return (
                          <tr key={rowKey} className={rowClass}>
                            <td data-label="ID" className="product-id">{`#${p.id}`}</td>
                            <td data-label="Produto" className="product-name">{p.nome}</td>
                            <td data-label="Categoria">
                              <span className="category-tag">{p.categoria}</span>
                            </td>
                            <td data-label="Preço">
                              {`R$ ${p.preco != null ? Number(p.preco).toFixed(2) : '0.00'}`}
                            </td>
                            <td data-label="Qtd. Atual">
                              <span className={isAbaixoDoMinimo ? 'qty-critical' : ''}>
                                {p.quantidade}
                              </span>
                            </td>
                            <td data-label="Estoque Mín.">{p.estoqueMinimo ?? '-'}</td>
                            <td data-label="Status">
                              {isZerado ? (
                                <span key="status-esgotado" className="status-badge status-badge--esgotado">
                                  ⛔ Esgotado
                                </span>
                              ) : isAbaixoDoMinimo ? (
                                <span key="status-baixo" className="status-badge status-badge--baixo">
                                  ⚠️ Estoque Baixo
                                </span>
                              ) : (
                                <span key="status-normal" className="status-badge status-badge--normal">
                                  ✅ Normal
                                </span>
                              )}
                            </td>
                            <td data-label="Ações">
                              <div className="action-group">
                                <button
                                  type="button"
                                  onClick={() => abrirModalMovimentacao(p)}
                                  className="btn btn-primary btn-sm"
                                >
                                  📦 Movimentar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => abrirModalAjuste(p)}
                                  className="btn btn-secondary btn-sm"
                                >
                                  ⚖️ Ajustar / Balanço
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deletarProduto(p.id)}
                                  className="btn btn-danger-outline btn-sm"
                                >
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : listaProdutos.length === 0 ? (
                      <tr key="empty-sem-produtos">
                        <td colSpan="8" className="empty-state">
                          <span>Nenhum produto cadastrado ainda. Utilize a aba "Cadastrar produto" para começar.</span>
                        </td>
                      </tr>
                    ) : (
                      <tr key="empty-sem-filtros">
                        <td colSpan="8" className="empty-state">
                          <div className="empty-state-content">
                            <span>🔍 Nenhum produto encontrado para os filtros aplicados.</span>
                            <button
                              type="button"
                              className="btn btn-outline-clear"
                              onClick={() => {
                                setBusca('');
                                setApenasCriticos(false);
                              }}
                            >
                              Limpar filtros
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              </>
              )}
            </section>
          </>
        )}

        {/* Tela 2: Frente de Caixa (PDV) */}
        {abaAtiva === 'pdv' && (
          <PdvView produtos={produtos} onVendaConcluida={carregarProdutos} />
        )}
      </main>

      {/* Modal Flutuante de Movimentação de Estoque */}
      {modalAberto && produtoSelecionado && (
        <div className="modal-backdrop">
          <div className="modal-card" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3 className="panel-title">📦 Movimentar Estoque</h3>
            </div>

            <div className="modal-summary">
              <div><strong>Produto:</strong> {produtoSelecionado.nome} (#{produtoSelecionado.id})</div>
              <div><strong>Estoque Atual:</strong> {produtoSelecionado.quantidade} unidades</div>
              <div><strong>Estoque Mínimo:</strong> {produtoSelecionado.estoqueMinimo ?? '-'} unidades</div>
            </div>

            <form onSubmit={handleConfirmarMovimentacao} className="modal-form">
              <div className="input-group">
                <label htmlFor="select-tipo">Tipo de Movimentação</label>
                <select
                  id="select-tipo"
                  className="form-control"
                  value={tipoMovimentacao}
                  onChange={(e) => setTipoMovimentacao(e.target.value)}
                  required
                >
                  <optgroup label="Entradas (Soma ao Estoque)">
                    <option value="ENTRADA_REPOSICAO">📥 Entrada - Reposição de Estoque</option>
                    <option value="ENTRADA_DEVOLUCAO">📥 Entrada - Devolução de Cliente</option>
                  </optgroup>
                  <optgroup label="Saídas (Subtrai do Estoque)">
                    <option value="SAIDA_VENDA">📤 Saída - Venda</option>
                    <option value="SAIDA_AVARIA">📤 Saída - Avaria / Perda</option>
                  </optgroup>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="input-qtd-mov">Quantidade a Movimentar</label>
                <input
                  id="input-qtd-mov"
                  className="form-control"
                  type="number"
                  min="1"
                  placeholder="Ex: 5"
                  value={quantidadeMovimentacao}
                  onChange={(e) => setQuantidadeMovimentacao(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="input-motivo">Motivo / Observação (Opcional)</label>
                <input
                  id="input-motivo"
                  className="form-control"
                  type="text"
                  placeholder="Ex: Nota Fiscal 1234, Venda balcão, Produto danificado..."
                  value={motivoMovimentacao}
                  onChange={(e) => setMotivoMovimentacao(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={enviandoMovimentacao}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoMovimentacao}
                  className="btn btn-primary"
                >
                  {enviandoMovimentacao ? 'Salvando...' : 'Confirmar Movimentação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ajuste Rápido de Inventário (RF06) */}
      {produtoAjuste && (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-ajuste"
          >
            <div className="modal-header">
              <h3 id="titulo-modal-ajuste" className="panel-title">⚖️ Ajustar / Balanço de Inventário</h3>
            </div>

            <div className="modal-summary">
              <div><strong>Produto:</strong> {`${produtoAjuste.nome} (#${produtoAjuste.id})`}</div>
              <div><strong>Saldo atual no sistema:</strong> {`${produtoAjuste.quantidade} unidades`}</div>
            </div>

            <form onSubmit={handleConfirmarAjuste} className="modal-form">
              <div className="input-group">
                <label htmlFor="input-contagem-fisica">Quantidade física contada</label>
                <input
                  id="input-contagem-fisica"
                  className="form-control"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ex: 12"
                  value={contagemFisica}
                  onChange={(e) => setContagemFisica(e.target.value)}
                  aria-describedby="resumo-ajuste"
                  autoFocus
                  required
                />
              </div>

              <div id="resumo-ajuste" className="ajuste-resumo" aria-live="polite">
                {contagemFisica === '' ? (
                  <span>Informe a quantidade contada na prateleira.</span>
                ) : !contagemValida ? (
                  <span className="ajuste-resumo--erro">Informe um número inteiro igual ou maior que zero.</span>
                ) : diferencaAjuste === 0 ? (
                  <span>Contagem igual ao saldo atual: não há ajuste a fazer.</span>
                ) : diferencaAjuste < 0 ? (
                  <span className="ajuste-resumo--saida">{`Diferença de ${diferencaAjuste}: será registrada uma Saída - Avaria / Perda de ${Math.abs(diferencaAjuste)} unidade(s). Novo saldo: ${contagemFisicaNumero}.`}</span>
                ) : (
                  <span className="ajuste-resumo--entrada">{`Diferença de +${diferencaAjuste}: será registrada uma Entrada - Reposição de ${diferencaAjuste} unidade(s). Novo saldo: ${contagemFisicaNumero}.`}</span>
                )}
              </div>

              {erroAjuste && (
                <div className="ajuste-erro" role="alert">{erroAjuste}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={fecharModalAjuste}
                  disabled={enviandoAjuste}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoAjuste || !contagemValida || diferencaAjuste === 0}
                  className="btn btn-primary"
                >
                  {enviandoAjuste ? 'Salvando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
