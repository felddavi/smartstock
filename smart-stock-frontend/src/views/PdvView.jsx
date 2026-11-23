import { useState } from 'react';
import {
  CircleAlert,
  Minus,
  PackageX,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X
} from 'lucide-react';
import api from '../api';
import { extrairMensagemErro } from '../utils/mensagemErro';

const CENTAVOS_POR_REAL = 100;
const API_VENDAS_URL = '/api/vendas';

// Converte o preço para centavos inteiros e evita erros de ponto flutuante na soma
const precoEmCentavos = (preco) => Math.round(Number(preco ?? 0) * CENTAVOS_POR_REAL);

const formatarMoeda = (centavos) => `R$ ${(centavos / CENTAVOS_POR_REAL).toFixed(2)}`;

const normalizarTexto = (valor) =>
  String(valor ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * Balcão de Venda Rápida (PDV).
 * @param {Array} produtos lista carregada pelo App
 * @param {Function} onVendaConcluida callback chamado após a venda (recarrega produtos e movimentações)
 * @param {Function} mostrarToast callback de notificação global
 */
function PdvView({ produtos, onVendaConcluida, mostrarToast }) {
  const [buscaPdv, setBuscaPdv] = useState('');
  // Carrinho guarda só id e quantidade; nome, preço e saldo vêm sempre da lista atual de produtos
  const [carrinho, setCarrinho] = useState([]);
  const [enviandoVenda, setEnviandoVenda] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  const limparMensagens = () => {
    setMensagemErro('');
  };

  const listaProdutos = Array.isArray(produtos) ? produtos : [];
  const produtosPorId = new Map(listaProdutos.map((p) => [p.id, p]));

  const termo = normalizarTexto(buscaPdv);
  const produtosFiltrados = listaProdutos.filter(
    (p) =>
      !termo ||
      normalizarTexto(p.nome).includes(termo) ||
      normalizarTexto(p.categoria).includes(termo)
  );

  const quantidadeNoCarrinho = (produtoId) =>
    carrinho.find((item) => item.produtoId === produtoId)?.quantidade ?? 0;

  const adicionarProduto = (produto) => {
    limparMensagens();
    const saldo = Number(produto.quantidade) || 0;
    setCarrinho((atual) => {
      const existente = atual.find((item) => item.produtoId === produto.id);
      if (!existente) {
        return saldo > 0 ? [...atual, { produtoId: produto.id, quantidade: 1 }] : atual;
      }
      if (existente.quantidade >= saldo) return atual;
      return atual.map((item) =>
        item.produtoId === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
      );
    });
  };

  const decrementarProduto = (produtoId) => {
    limparMensagens();
    setCarrinho((atual) =>
      atual.map((item) =>
        item.produtoId === produtoId && item.quantidade > 1
          ? { ...item, quantidade: item.quantidade - 1 }
          : item
      )
    );
  };

  const removerProduto = (produtoId) => {
    limparMensagens();
    setCarrinho((atual) => atual.filter((item) => item.produtoId !== produtoId));
  };

  // Itens do carrinho combinados com os dados atuais do produto
  const itensCarrinho = carrinho
    .map((item) => {
      const produto = produtosPorId.get(item.produtoId);
      if (!produto) return null;
      const unitarioCentavos = precoEmCentavos(produto.preco);
      return {
        ...item,
        produto,
        saldo: Number(produto.quantidade) || 0,
        unitarioCentavos,
        subtotalCentavos: unitarioCentavos * item.quantidade
      };
    })
    .filter(Boolean);

  const totalCentavos = itensCarrinho.reduce((soma, item) => soma + item.subtotalCentavos, 0);
  const totalUnidades = itensCarrinho.reduce((soma, item) => soma + item.quantidade, 0);

  const handleFinalizarVenda = async () => {
    if (enviandoVenda || itensCarrinho.length === 0) return;

    setEnviandoVenda(true);
    setMensagemErro('');

    const payload = {
      itens: itensCarrinho.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade
      }))
    };

    try {
      const resposta = await api.post(API_VENDAS_URL, payload);
      const venda = resposta.data;
      const idVenda = venda?.id ? ` #${venda.id}` : '';
      setCarrinho([]);
      mostrarToast?.('sucesso', `Venda${idVenda} finalizada com sucesso!`);
      if (typeof onVendaConcluida === 'function') {
        await onVendaConcluida();
      }
    } catch (erro) {
      console.error('Erro ao finalizar venda:', erro);
      const textoErro = extrairMensagemErro(erro, 'Falha ao finalizar venda.');
      setMensagemErro(textoErro);
      mostrarToast?.('erro', textoErro);

      // Recarrega produtos para refletir saldos atualizados caso outro usuário tenha vendido
      if (typeof onVendaConcluida === 'function') {
        try {
          await onVendaConcluida();
        } catch (eRecarga) {
          console.error('Erro ao recarregar produtos após falha na venda:', eRecarga);
        }
      }
    } finally {
      setEnviandoVenda(false);
    }
  };

  return (
    <div className="pdv-container">
      <header className="pdv-header">
        <h2 className="pdv-titulo">Caixa / PDV</h2>
        <p className="pdv-subtitulo">
          Seleção rápida de itens, conferência de saldo em tempo real e venda atômica.
        </p>
      </header>

      <section className="pdv-layout" aria-label="Balcão de Venda Rápida">
        {/* Coluna esquerda: Catálogo Rápido */}
        <div className="cloud-surface pdv-coluna">
          <div className="panel-header">
            <h3 className="panel-title">
              <Search size={18} aria-hidden="true" />
              <span>Catálogo Rápido</span>
            </h3>
            <span className="panel-badge">
              {`${produtosFiltrados.length} ${produtosFiltrados.length === 1 ? 'produto' : 'produtos'}`}
            </span>
          </div>

          <label htmlFor="pdv-busca" className="pdv-sr-only">Buscar produto por nome ou categoria</label>
          <div className="pdv-busca-wrapper">
            <Search size={16} className="pdv-busca-icone" aria-hidden="true" />
            <input
              id="pdv-busca"
              type="text"
              className="form-control pdv-busca-input"
              placeholder="Buscar por nome ou categoria..."
              value={buscaPdv}
              onChange={(e) => setBuscaPdv(e.target.value)}
              autoFocus
            />
            {Boolean(buscaPdv) && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setBuscaPdv('')}
                aria-label="Limpar busca"
                title="Limpar busca"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <ul className="pdv-lista">
            {produtosFiltrados.length === 0 ? (
              <li key="pdv-catalogo-vazio" className="pdv-vazio">
                {listaProdutos.length === 0
                  ? 'Nenhum produto cadastrado. Cadastre produtos na tela Produtos.'
                  : 'Nenhum produto encontrado para essa busca.'}
              </li>
            ) : (
              produtosFiltrados.map((p) => {
                const saldo = Number(p.quantidade) || 0;
                const semEstoque = saldo <= 0;
                const noLimite = !semEstoque && quantidadeNoCarrinho(p.id) >= saldo;

                return (
                  <li key={`pdv-prod-${p.id}`} className={`pdv-produto ${semEstoque ? 'pdv-produto--sem-estoque' : ''}`}>
                    <div className="pdv-produto-info">
                      <span className="product-name">{p.nome}</span>
                      <span className="category-tag">{p.categoria}</span>
                    </div>
                    <div className="pdv-produto-meta">
                      <span className="pdv-preco">{formatarMoeda(precoEmCentavos(p.preco))}</span>
                      {semEstoque ? (
                        <span key="saldo-zerado" className="cloud-badge cloud-badge--esgotado">
                          <PackageX size={13} aria-hidden="true" />
                          <span>Sem estoque</span>
                        </span>
                      ) : (
                        <span key="saldo-ok" className="pdv-saldo">{`Saldo: ${saldo}`}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => adicionarProduto(p)}
                      disabled={enviandoVenda || semEstoque || noLimite}
                      aria-label={`Adicionar ${p.nome} ao carrinho`}
                      title={semEstoque ? 'Sem estoque' : noLimite ? 'Limite do saldo atingido' : undefined}
                    >
                      <Plus size={15} aria-hidden="true" />
                      <span>Adicionar</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Coluna direita: Carrinho / Comanda */}
        <div className="cloud-surface pdv-coluna">
          <div className="panel-header">
            <h3 className="panel-title">
              <ShoppingCart size={18} aria-hidden="true" />
              <span>Carrinho / Comanda</span>
            </h3>
            <span className="panel-badge">
              {`${totalUnidades} ${totalUnidades === 1 ? 'unidade' : 'unidades'}`}
            </span>
          </div>

          <ul className="pdv-lista">
            {itensCarrinho.length === 0 ? (
              <li key="pdv-carrinho-vazio" className="pdv-vazio">
                Carrinho vazio. Use "Adicionar" no catálogo para incluir produtos.
              </li>
            ) : (
              itensCarrinho.map((item) => (
                <li key={`pdv-item-${item.produtoId}`} className="pdv-item">
                  <div className="pdv-produto-info">
                    <span className="product-name">{item.produto.nome}</span>
                    <span className="pdv-saldo">{`${formatarMoeda(item.unitarioCentavos)} / un.`}</span>
                  </div>

                  <div className="pdv-qtd" role="group" aria-label={`Quantidade de ${item.produto.nome}`}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => decrementarProduto(item.produtoId)}
                      disabled={enviandoVenda || item.quantidade <= 1}
                      aria-label={`Diminuir quantidade de ${item.produto.nome}`}
                    >
                      <Minus size={14} aria-hidden="true" />
                    </button>
                    <span className="pdv-qtd-valor" aria-live="polite">{item.quantidade}</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => adicionarProduto(item.produto)}
                      disabled={enviandoVenda || item.quantidade >= item.saldo}
                      aria-label={`Aumentar quantidade de ${item.produto.nome}`}
                      title={item.quantidade >= item.saldo ? 'Limite do saldo atingido' : undefined}
                    >
                      <Plus size={14} aria-hidden="true" />
                    </button>
                  </div>

                  <span className="pdv-subtotal">{formatarMoeda(item.subtotalCentavos)}</span>

                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm"
                    onClick={() => removerProduto(item.produtoId)}
                    disabled={enviandoVenda}
                    aria-label={`Remover ${item.produto.nome} do carrinho`}
                    title="Remover item"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    <span>Remover</span>
                  </button>
                </li>
              ))
            )}
          </ul>

          <div className="pdv-total">
            <span>Total geral</span>
            <strong>{formatarMoeda(totalCentavos)}</strong>
          </div>

          {mensagemErro && (
            <div className="pdv-feedback pdv-feedback--erro" role="alert">
              <CircleAlert size={16} aria-hidden="true" />
              <span>{mensagemErro}</span>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary pdv-finalizar"
            onClick={handleFinalizarVenda}
            disabled={enviandoVenda || itensCarrinho.length === 0}
          >
            {enviandoVenda ? 'Finalizando...' : 'Finalizar Venda'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default PdvView;
