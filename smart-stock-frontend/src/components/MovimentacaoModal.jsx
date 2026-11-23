import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { extrairMensagemErro } from '../utils/mensagemErro';

const API_MOVIMENTACOES_URL = '/api/movimentacoes';

function MovimentacaoModal({ produto, onFechar, onConcluido, mostrarToast }) {
  const [tipoMovimentacao, setTipoMovimentacao] = useState('ENTRADA_REPOSICAO');
  const [quantidadeMovimentacao, setQuantidadeMovimentacao] = useState('');
  const [motivoMovimentacao, setMotivoMovimentacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const primeiroCampoRef = useRef(null);

  useEffect(() => {
    primeiroCampoRef.current?.focus();
  }, []);

  useEffect(() => {
    const aoPressionarTecla = (evento) => {
      if (evento.key === 'Escape' && !enviando) onFechar();
    };
    document.addEventListener('keydown', aoPressionarTecla);
    return () => document.removeEventListener('keydown', aoPressionarTecla);
  }, [enviando, onFechar]);

  const aoClicarNoBackdrop = (evento) => {
    if (evento.target === evento.currentTarget && !enviando) onFechar();
  };

  // Confirmar e registrar movimentação de estoque
  const handleConfirmarMovimentacao = async (e) => {
    e.preventDefault();

    const qtd = parseInt(quantidadeMovimentacao);
    if (isNaN(qtd) || qtd <= 0) {
      mostrarToast('erro', 'Informe uma quantidade válida maior que zero.');
      return;
    }

    setEnviando(true);
    try {
      await api.post(API_MOVIMENTACOES_URL, {
        produtoId: produto.id,
        tipo: tipoMovimentacao,
        quantidade: qtd,
        motivo: motivoMovimentacao ? motivoMovimentacao.trim() : null
      });

      mostrarToast('sucesso', 'Movimentação registrada com sucesso!');
      onFechar();
      onConcluido();
    } catch (erro) {
      console.error('Erro ao registrar movimentação:', erro);
      mostrarToast('erro', extrairMensagemErro(erro, 'Falha ao registrar movimentação.'));
      setEnviando(false);
    }
  };

  return (
    <div className="cloud-modal-backdrop" onMouseDown={aoClicarNoBackdrop}>
      <div
        className="cloud-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-movimentacao"
      >
        <div className="modal-header">
          <h3 id="titulo-modal-movimentacao" className="panel-title">Movimentar Estoque</h3>
        </div>

        <div className="modal-summary">
          <div><strong>Produto:</strong> {produto.nome} (#{produto.id})</div>
          <div><strong>Estoque Atual:</strong> {produto.quantidade} unidades</div>
          <div><strong>Estoque Mínimo:</strong> {produto.estoqueMinimo ?? '-'} unidades</div>
        </div>

        <form onSubmit={handleConfirmarMovimentacao} className="modal-form">
          <div className="input-group">
            <label htmlFor="select-tipo">Tipo de Movimentação</label>
            <select
              id="select-tipo"
              ref={primeiroCampoRef}
              className="form-control"
              value={tipoMovimentacao}
              onChange={(e) => setTipoMovimentacao(e.target.value)}
              required
            >
              <optgroup label="Entradas (Soma ao Estoque)">
                <option value="ENTRADA_REPOSICAO">Entrada - Reposição de Estoque</option>
                <option value="ENTRADA_DEVOLUCAO">Entrada - Devolução de Cliente</option>
              </optgroup>
              <optgroup label="Saídas (Subtrai do Estoque)">
                <option value="SAIDA_VENDA">Saída - Venda</option>
                <option value="SAIDA_AVARIA">Saída - Avaria / Perda</option>
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
            <button type="button" onClick={onFechar} disabled={enviando} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={enviando} className="btn btn-primary">
              {enviando ? 'Salvando...' : 'Confirmar Movimentação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MovimentacaoModal;
