import { AlertTriangle, ArrowRight, CircleCheck, Package, PackageMinus, Wallet } from 'lucide-react';
import { isProdutoCritico, obterStatusEstoque } from '../utils/estoqueStatus';

const LIMITE_ATENCAO_RAPIDA = 10;

const formatadorBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

function InicioView({ produtos, movimentacoes, carregando, onAbrirMovimentacao, onNavegar }) {
  const listaProdutos = Array.isArray(produtos) ? produtos : [];
  const listaMovimentacoes = Array.isArray(movimentacoes) ? movimentacoes : [];

  const totalProdutos = listaProdutos.length;

  const valorTotalCentavos = listaProdutos.reduce((acumulado, produto) => {
    const precoCentavos = Math.round(Number(produto?.preco ?? 0) * 100);
    const quantidade = Number(produto?.quantidade ?? 0);
    return acumulado + precoCentavos * quantidade;
  }, 0);

  const produtosCriticos = listaProdutos.filter(isProdutoCritico);
  const totalEsgotados = produtosCriticos.filter((p) => Number(p.quantidade) <= 0).length;
  const totalEstoqueBaixo = produtosCriticos.length - totalEsgotados;

  const movimentacoesAvaria = listaMovimentacoes.filter(
    (m) => m?.tipoMovimentacao === 'SAIDA_AVARIA'
  );
  const unidadesAvaria = movimentacoesAvaria.reduce(
    (acumulado, m) => acumulado + Number(m?.quantidade ?? 0),
    0
  );

  const criticosOrdenados = [...produtosCriticos].sort((a, b) => {
    const aEsgotado = Number(a.quantidade) <= 0 ? 0 : 1;
    const bEsgotado = Number(b.quantidade) <= 0 ? 0 : 1;
    if (aEsgotado !== bEsgotado) return aEsgotado - bEsgotado;
    return Number(a.quantidade) - Number(b.quantidade);
  });

  const criticosExibidos = criticosOrdenados.slice(0, LIMITE_ATENCAO_RAPIDA);
  const excedenteCriticos = criticosOrdenados.length - criticosExibidos.length;

  return (
    <div className="inicio-container">
      <header className="inicio-header">
        <h2 className="inicio-titulo">Visão Geral do Estoque</h2>
        <p className="inicio-subtitulo">
          Acompanhamento consolidado de saldo, valor em estoque e itens que exigem reposição.
        </p>
      </header>

      {carregando ? (
        <section className="cloud-surface inicio-estado" aria-live="polite">
          <p className="inicio-estado-texto">Carregando indicadores do estoque...</p>
        </section>
      ) : (
        <>
          <section className="inicio-kpi-grid" aria-label="Indicadores principais">
            <article className="cloud-surface inicio-kpi-card">
              <div className="inicio-kpi-topo">
                <span className="inicio-kpi-label">Total de produtos</span>
                <Package size={20} className="inicio-kpi-icone" aria-hidden="true" />
              </div>
              <strong className="inicio-kpi-valor">{totalProdutos}</strong>
              <span className="inicio-kpi-subtexto">
                {totalProdutos === 1 ? 'item cadastrado' : 'itens cadastrados'}
              </span>
            </article>

            <article className="cloud-surface inicio-kpi-card">
              <div className="inicio-kpi-topo">
                <span className="inicio-kpi-label">Valor total em estoque</span>
                <Wallet size={20} className="inicio-kpi-icone" aria-hidden="true" />
              </div>
              <strong className="inicio-kpi-valor">
                {formatadorBRL.format(valorTotalCentavos / 100)}
              </strong>
              <span className="inicio-kpi-subtexto">soma de preço por saldo atual</span>
            </article>

            <article className="cloud-surface inicio-kpi-card">
              <div className="inicio-kpi-topo">
                <span className="inicio-kpi-label">Produtos críticos</span>
                <AlertTriangle size={20} className="inicio-kpi-icone inicio-kpi-icone--alerta" aria-hidden="true" />
              </div>
              <strong className="inicio-kpi-valor">{produtosCriticos.length}</strong>
              <span className="inicio-kpi-subtexto">
                {`${totalEsgotados} esgotados, ${totalEstoqueBaixo} com estoque baixo`}
              </span>
            </article>

            <article className="cloud-surface inicio-kpi-card">
              <div className="inicio-kpi-topo">
                <span className="inicio-kpi-label">Saídas por avaria/perda</span>
                <PackageMinus size={20} className="inicio-kpi-icone" aria-hidden="true" />
              </div>
              <strong className="inicio-kpi-valor">{unidadesAvaria}</strong>
              <span className="inicio-kpi-subtexto">
                {`${movimentacoesAvaria.length} ${movimentacoesAvaria.length === 1 ? 'registro' : 'registros'}`}
              </span>
            </article>
          </section>

          {totalProdutos === 0 ? (
            <section className="cloud-surface inicio-estado">
              <p className="inicio-estado-titulo">Nenhum produto cadastrado ainda.</p>
              <p className="inicio-estado-texto">
                Acesse a tela de Produtos para cadastrar os primeiros itens do seu estoque.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onNavegar('produtos')}
              >
                Ir para Produtos
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </section>
          ) : (
            <section className="cloud-surface inicio-secao" aria-labelledby="titulo-atencao-rapida">
              <div className="inicio-secao-header">
                <div>
                  <h3 id="titulo-atencao-rapida" className="inicio-secao-titulo">
                    Atenção rápida
                  </h3>
                  <p className="inicio-secao-subtitulo">
                    Produtos esgotados ou com saldo igual ou abaixo do mínimo recomendado.
                  </p>
                </div>
                {criticosOrdenados.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavegar('produtos')}
                  >
                    Ver todos em Produtos
                  </button>
                )}
              </div>

              {criticosOrdenados.length === 0 ? (
                <div className="inicio-sem-criticos">
                  <CircleCheck size={20} className="inicio-sem-criticos-icone" aria-hidden="true" />
                  <span>Nenhum produto em estado crítico no momento.</span>
                </div>
              ) : (
                <>
                  <div className="inicio-table-wrapper">
                    <table className="cloud-table">
                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th>Categoria</th>
                          <th>Saldo</th>
                          <th>Mínimo</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {criticosExibidos.map((produto) => {
                          const status = obterStatusEstoque(produto);
                          return (
                            <tr key={`inicio-critico-${produto.id}`}>
                              <td className="inicio-produto-nome">{produto.nome}</td>
                              <td>{produto.categoria}</td>
                              <td className="inicio-saldo-valor">{produto.quantidade}</td>
                              <td>{produto.estoqueMinimo}</td>
                              <td>
                                <span className={status.classeBadge}>{status.rotulo}</span>
                              </td>
                              <td>
                                <div className="inicio-acoes">
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => onAbrirMovimentacao(produto)}
                                  >
                                    Movimentar
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => onNavegar('produtos')}
                                  >
                                    Ver em Produtos
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {excedenteCriticos > 0 && (
                    <div className="inicio-rodape-excedente">
                      <span>
                        {`e mais ${excedenteCriticos} ${excedenteCriticos === 1 ? 'produto' : 'produtos'}`}
                      </span>
                      <button
                        type="button"
                        className="inicio-link-produtos"
                        onClick={() => onNavegar('produtos')}
                      >
                        Abrir em Produtos
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default InicioView;
