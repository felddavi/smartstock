import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [produtos, setProdutos] = useState([]);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');

  // Estados para o Modal de Movimentação de Estoque
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState('ENTRADA_REPOSICAO');
  const [quantidadeMovimentacao, setQuantidadeMovimentacao] = useState('');
  const [motivoMovimentacao, setMotivoMovimentacao] = useState('');
  const [enviandoMovimentacao, setEnviandoMovimentacao] = useState(false);

  const API_PRODUTOS_URL = 'http://localhost:8080/api/produtos';
  const API_MOVIMENTACOES_URL = 'http://localhost:8080/api/movimentacoes';

  // Função para carregar os produtos do Spring Boot
  const carregarProdutos = async () => {
    try {
      const resposta = await axios.get(API_PRODUTOS_URL);
      setProdutos(resposta.data);
    } catch (erro) {
      console.error("Erro ao carregar produtos:", erro);
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

  // Identifica produtos em situação de alerta (quantidade <= estoqueMinimo)
  const produtosEmAlerta = produtos.filter(
    (p) => p.estoqueMinimo != null && p.quantidade <= p.estoqueMinimo
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '980px', margin: '0 auto' }}>
      <h1>Smart Stock - Controle de Estoque</h1>

      {/* Alerta de Ruptura / Estoque Baixo no topo */}
      {produtosEmAlerta.length > 0 && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeeba',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <strong>Atenção:</strong> Há <strong>{produtosEmAlerta.length}</strong> produto(s) com estoque no limite ou abaixo do mínimo recomendado!
          </div>
        </div>
      )}

      {/* Formulário de Cadastro */}
      <form onSubmit={handleSubmit} style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Adicionar Novo Produto</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Nome do Produto"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
          <input
            type="text"
            placeholder="Categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Preço (R$)"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
          <input
            type="number"
            min="0"
            placeholder="Quantidade Inicial"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
          <input
            type="number"
            min="0"
            placeholder="Estoque Mínimo"
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
        </div>
        <button
          type="submit"
          style={{ background: '#28a745', color: '#fff', border: 'none', padding: '10px 15px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
        >
          Cadastrar Produto
        </button>
      </form>

      {/* Tabela de Produtos */}
      <h3>Produtos em Estoque</h3>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#ddd' }}>
            <th>ID</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Qtd</th>
            <th>Estoque Mínimo</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.length > 0 ? (
            produtos.map((p) => {
              const isZerado = p.quantidade <= 0;
              const isAbaixoDoMinimo = p.estoqueMinimo != null && p.quantidade <= p.estoqueMinimo;

              // Cor de fundo destacada caso esteja esgotado ou abaixo do mínimo
              const rowBg = isZerado
                ? '#ffebee'
                : isAbaixoDoMinimo
                  ? '#fff8e1'
                  : 'transparent';

              return (
                <tr key={p.id} style={{ backgroundColor: rowBg, transition: 'background-color 0.2s' }}>
                  <td>{p.id}</td>
                  <td><strong>{p.nome}</strong></td>
                  <td>{p.categoria}</td>
                  <td>R$ {p.preco != null ? Number(p.preco).toFixed(2) : '0.00'}</td>
                  <td>
                    <span style={{ fontWeight: isAbaixoDoMinimo ? 'bold' : 'normal', color: isAbaixoDoMinimo ? '#c62828' : 'inherit' }}>
                      {p.quantidade}
                    </span>
                  </td>
                  <td>{p.estoqueMinimo ?? '-'}</td>
                  <td>
                    {isZerado ? (
                      <span style={{
                        backgroundColor: '#ffcdd2',
                        color: '#b71c1c',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'inline-block'
                      }}>
                        ⛔ Esgotado
                      </span>
                    ) : isAbaixoDoMinimo ? (
                      <span style={{
                        backgroundColor: '#ffe082',
                        color: '#b26a00',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'inline-block'
                      }}>
                        ⚠️ Estoque Baixo
                      </span>
                    ) : (
                      <span style={{
                        backgroundColor: '#c8e6c9',
                        color: '#2e7d32',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'inline-block'
                      }}>
                        ✅ Normal
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => abrirModalMovimentacao(p)}
                      style={{
                        marginRight: '6px',
                        background: '#0d6efd',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}
                    >
                      📦 Movimentar
                    </button>
                    <button
                      onClick={() => deletarProduto(p.id)}
                      style={{
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center' }}>Nenhum produto cadastrado ainda.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Flutuante de Movimentação de Estoque */}
      {modalAberto && produtoSelecionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              📦 Movimentar Estoque
            </h3>

            <div style={{ marginBottom: '16px', background: '#f8f9fa', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>
              <div><strong>Produto:</strong> {produtoSelecionado.nome} (ID: {produtoSelecionado.id})</div>
              <div><strong>Estoque Atual:</strong> {produtoSelecionado.quantidade} unidades</div>
              <div><strong>Estoque Mínimo:</strong> {produtoSelecionado.estoqueMinimo ?? '-'} unidades</div>
            </div>

            <form onSubmit={handleConfirmarMovimentacao}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Tipo de Movimentação:
                </label>
                <select
                  value={tipoMovimentacao}
                  onChange={(e) => setTipoMovimentacao(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  required
                >
                  <optgroup label="Entradas (Soma ao Estoque)">
                    <option value="ENTRADA_REPOSICAO">📥 Entrada - Reposição de Estoque</option>
                    <option value="ENTRADA_DEVOLUCAO">📥 Entrada - Devolução de Cliente</option>
                  </optgroup>
                  <optgroup label="Saídas (Subtrai do Estoque)">
                    <option value="SAIDA_VENDA">📤 Saída - Venda</option>
                    <option value="SAIDA_AVARIA">📤 Saída - Avaria / Perda / Vencimento</option>
                  </optgroup>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Quantidade a Movimentar:
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 5"
                  value={quantidadeMovimentacao}
                  onChange={(e) => setQuantidadeMovimentacao(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Motivo / Observação (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nota Fiscal 1234, Venda balcão, Produto danificado..."
                  value={motivoMovimentacao}
                  onChange={(e) => setMotivoMovimentacao(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={enviandoMovimentacao}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoMovimentacao}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#0d6efd',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {enviandoMovimentacao ? 'Salvando...' : 'Confirmar Movimentação'}
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