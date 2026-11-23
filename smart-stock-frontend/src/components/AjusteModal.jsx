import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { extrairMensagemErro } from '../utils/mensagemErro';

const API_MOVIMENTACOES_URL = '/api/movimentacoes';

function AjusteModal({ produto, onFechar, onConcluido, mostrarToast }) {
  const [contagemFisica, setContagemFisica] = useState('');
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

  // Contagem física válida: inteiro >= 0. Diferença = contagem - saldo atual
  const contagemFisicaNumero = contagemFisica === '' ? null : Number(contagemFisica);
  const contagemValida = Number.isInteger(contagemFisicaNumero) && contagemFisicaNumero >= 0;
  const diferencaAjuste = contagemValida ? contagemFisicaNumero - Number(produto.quantidade) : null;

  // Confirmar ajuste: uma única movimentação com a diferença absoluta
  const handleConfirmarAjuste = async (e) => {
    e.preventDefault();
    if (!contagemValida || diferencaAjuste === 0) return;

    setEnviando(true);
    try {
      await api.post(API_MOVIMENTACOES_URL, {
        produtoId: produto.id,
        tipo: diferencaAjuste < 0 ? 'SAIDA_AVARIA' : 'ENTRADA_REPOSICAO',
        quantidade: Math.abs(diferencaAjuste),
        motivo: 'Ajuste de inventário (balanço)'
      });
      mostrarToast('sucesso', 'Ajuste de inventário registrado com sucesso!');
      onFechar();
      onConcluido();
    } catch (erro) {
      console.error('Erro ao registrar ajuste de inventário:', erro);
      mostrarToast('erro', extrairMensagemErro(erro, 'Falha ao registrar o ajuste.'));
      setEnviando(false);
    }
  };

  return (
    <div className="cloud-modal-backdrop" onMouseDown={aoClicarNoBackdrop}>
      <div
        className="cloud-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-ajuste"
      >
        <div className="modal-header">
          <h3 id="titulo-modal-ajuste" className="panel-title">Ajuste de inventário (balanço)</h3>
        </div>

        <div className="modal-summary">
          <div><strong>Produto:</strong> {`${produto.nome} (#${produto.id})`}</div>
          <div><strong>Saldo atual no sistema:</strong> {`${produto.quantidade} unidades`}</div>
        </div>

        <form onSubmit={handleConfirmarAjuste} className="modal-form">
          <div className="input-group">
            <label htmlFor="input-contagem-fisica">Quantidade física contada</label>
            <input
              id="input-contagem-fisica"
              ref={primeiroCampoRef}
              className="form-control"
              type="number"
              min="0"
              step="1"
              placeholder="Ex: 12"
              value={contagemFisica}
              onChange={(e) => setContagemFisica(e.target.value)}
              aria-describedby="resumo-ajuste"
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

          <div className="modal-actions">
            <button type="button" onClick={onFechar} disabled={enviando} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || !contagemValida || diferencaAjuste === 0}
              className="btn btn-primary"
            >
              {enviando ? 'Salvando...' : 'Confirmar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AjusteModal;
