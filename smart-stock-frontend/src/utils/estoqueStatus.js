// Regra unica de status de estoque para reutilizacao entre views
export function obterStatusEstoque(produto) {
  const quantidade = Number(produto?.quantidade ?? 0);
  const estoqueMinimo = produto?.estoqueMinimo != null ? Number(produto.estoqueMinimo) : null;

  if (quantidade <= 0) {
    return {
      chave: 'esgotado',
      rotulo: 'Esgotado',
      classeBadge: 'cloud-badge cloud-badge--esgotado'
    };
  }

  if (estoqueMinimo != null && quantidade <= estoqueMinimo) {
    return {
      chave: 'baixo',
      rotulo: 'Estoque Baixo',
      classeBadge: 'cloud-badge cloud-badge--baixo'
    };
  }

  return {
    chave: 'normal',
    rotulo: 'Normal',
    classeBadge: 'cloud-badge cloud-badge--normal'
  };
}

export function isProdutoCritico(produto) {
  if (!produto || produto.estoqueMinimo == null) return false;
  return Number(produto.quantidade) <= Number(produto.estoqueMinimo);
}
