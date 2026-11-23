import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, FileDown, RotateCcw, Search, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const TIPOS_MOVIMENTACAO = {
  ENTRADA_REPOSICAO: { rotulo: 'Reposição', direcao: 'entrada' },
  ENTRADA_DEVOLUCAO: { rotulo: 'Devolução', direcao: 'entrada' },
  SAIDA_VENDA: { rotulo: 'Venda', direcao: 'saida' },
  SAIDA_AVARIA: { rotulo: 'Avaria / Perda', direcao: 'saida' }
};

const OPCOES_TIPO = Object.entries(TIPOS_MOVIMENTACAO).map(([valor, info]) => ({
  valor,
  ...info
}));

const formatadorDataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short'
});

function normalizarTexto(valor) {
  return String(valor ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatarDataHora(valor) {
  if (!valor) return '-';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  return formatadorDataHora.format(data);
}

function obterInfoTipo(tipoMovimentacao) {
  return (
    TIPOS_MOVIMENTACAO[tipoMovimentacao] ?? {
      rotulo: tipoMovimentacao || '-',
      direcao: 'saida'
    }
  );
}

function HistoricoView({ movimentacoes, carregando, mostrarToast }) {
  const [direcaoFiltro, setDirecaoFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [busca, setBusca] = useState('');

  const listaMovimentacoes = useMemo(
    () => (Array.isArray(movimentacoes) ? movimentacoes.filter(Boolean) : []),
    [movimentacoes]
  );

  const opcoesTipoDisponiveis = useMemo(() => {
    if (!direcaoFiltro) return OPCOES_TIPO;
    return OPCOES_TIPO.filter((item) => item.direcao === direcaoFiltro);
  }, [direcaoFiltro]);

  const movimentacoesFiltradas = useMemo(() => {
    const termoBusca = normalizarTexto(busca);

    return listaMovimentacoes.filter((mov) => {
      const info = obterInfoTipo(mov.tipoMovimentacao);
      const correspondeDirecao = !direcaoFiltro || info.direcao === direcaoFiltro;
      const correspondeTipo = !tipoFiltro || mov.tipoMovimentacao === tipoFiltro;
      const nomeProduto = normalizarTexto(mov.produto?.nome);
      const correspondeBusca = !termoBusca || nomeProduto.includes(termoBusca);

      return correspondeDirecao && correspondeTipo && correspondeBusca;
    });
  }, [listaMovimentacoes, direcaoFiltro, tipoFiltro, busca]);

  const temFiltroAtivo = Boolean(direcaoFiltro || tipoFiltro || busca.trim());

  const aoAlterarDirecao = (novaDirecao) => {
    setDirecaoFiltro(novaDirecao);
    if (tipoFiltro && novaDirecao) {
      const infoTipoAtual = TIPOS_MOVIMENTACAO[tipoFiltro];
      if (infoTipoAtual && infoTipoAtual.direcao !== novaDirecao) {
        setTipoFiltro('');
      }
    }
  };

  const limparFiltros = () => {
    setDirecaoFiltro('');
    setTipoFiltro('');
    setBusca('');
  };

  const exportarPdf = () => {
    if (movimentacoesFiltradas.length === 0) {
      mostrarToast?.('info', 'Não há movimentações filtradas para exportar.');
      return;
    }

    const agora = new Date();
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text('SMARTSTOCK - Relatório de Movimentações', 14, 16);

    doc.setFontSize(9.5);
    doc.text(`Emitido em: ${formatadorDataHora.format(agora)}`, 14, 23);

    const partesFiltro = [];
    if (direcaoFiltro) {
      partesFiltro.push(`Direção: ${direcaoFiltro === 'entrada' ? 'Entradas' : 'Saídas'}`);
    }
    if (tipoFiltro) {
      partesFiltro.push(`Tipo: ${obterInfoTipo(tipoFiltro).rotulo}`);
    }
    if (busca.trim()) {
      partesFiltro.push(`Produto: "${busca.trim()}"`);
    }

    let inicioTabelaY = 29;
    if (partesFiltro.length > 0) {
      doc.text(`Filtros ativos: ${partesFiltro.join(' | ')}`, 14, 29);
      inicioTabelaY = 35;
    }

    const linhas = movimentacoesFiltradas.map((mov) => {
      const info = obterInfoTipo(mov.tipoMovimentacao);
      const sinal = info.direcao === 'entrada' ? '+' : '-';
      const qtd = mov.quantidade != null ? `${sinal}${mov.quantidade}` : '-';
      const motivo = mov.motivo && String(mov.motivo).trim() ? String(mov.motivo).trim() : '-';

      return [
        formatarDataHora(mov.dataHora),
        mov.produto?.nome || '-',
        `${info.direcao === 'entrada' ? 'Entrada' : 'Saída'} - ${info.rotulo}`,
        qtd,
        motivo
      ];
    });

    autoTable(doc, {
      startY: inicioTabelaY,
      head: [['Data/Hora', 'Produto', 'Tipo', 'Quantidade', 'Motivo']],
      body: linhas,
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [31, 35, 38] }
    });

    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    doc.save(`smartstock-movimentacoes-${ano}-${mes}-${dia}.pdf`);

    mostrarToast?.('sucesso', 'Relatório PDF exportado com sucesso!');
  };

  return (
    <div className="historico-container">
      <header className="historico-header">
        <div>
          <h2 className="historico-titulo">Histórico de Movimentações</h2>
          <p className="historico-subtitulo">
            Auditoria completa de entradas, saídas, vendas no PDV e ajustes de inventário.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary historico-btn-pdf"
          onClick={exportarPdf}
          disabled={carregando || movimentacoesFiltradas.length === 0}
        >
          <FileDown size={18} aria-hidden="true" />
          Exportar PDF
        </button>
      </header>

      <section className="cloud-surface historico-filtros" aria-label="Filtros do histórico">
        <div className="historico-filtros-campos">
          <div className="historico-busca-wrapper">
            <Search size={16} className="historico-busca-icone" aria-hidden="true" />
            <input
              type="text"
              className="form-control historico-busca-input"
              placeholder="Buscar por nome do produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar movimentações por nome do produto"
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

          <div className="historico-filtro-select-grupo">
            <label htmlFor="filtro-direcao" className="historico-filtro-label">
              Direção
            </label>
            <select
              id="filtro-direcao"
              className="form-control"
              value={direcaoFiltro}
              onChange={(e) => aoAlterarDirecao(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
          </div>

          <div className="historico-filtro-select-grupo">
            <label htmlFor="filtro-tipo" className="historico-filtro-label">
              Tipo de movimentação
            </label>
            <select
              id="filtro-tipo"
              className="form-control"
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
            >
              <option value="">Todos</option>
              {opcoesTipoDisponiveis.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {`${opcao.direcao === 'entrada' ? 'Entrada' : 'Saída'} - ${opcao.rotulo}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="historico-filtros-meta">
          <span className="historico-contador">
            {`Exibindo ${movimentacoesFiltradas.length} de ${listaMovimentacoes.length} ${
              listaMovimentacoes.length === 1 ? 'registro' : 'registros'
            }`}
          </span>

          {temFiltroAtivo && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={limparFiltros}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      <section className="cloud-surface historico-tabela-card">
        {carregando ? (
          <div className="historico-estado" aria-live="polite">
            <p className="historico-estado-texto">Carregando movimentações...</p>
          </div>
        ) : listaMovimentacoes.length === 0 ? (
          <div className="historico-estado">
            <p className="historico-estado-titulo">Nenhuma movimentação registrada ainda.</p>
            <p className="historico-estado-texto">
              As entradas, saídas, vendas e ajustes aparecerão aqui automaticamente.
            </p>
          </div>
        ) : movimentacoesFiltradas.length === 0 ? (
          <div className="historico-estado">
            <p className="historico-estado-titulo">
              Nenhuma movimentação encontrada para os filtros ativos.
            </p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={limparFiltros}>
              <RotateCcw size={14} aria-hidden="true" />
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="historico-table-wrapper">
            <table className="cloud-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoesFiltradas.map((mov, idx) => {
                  const info = obterInfoTipo(mov.tipoMovimentacao);
                  const ehEntrada = info.direcao === 'entrada';
                  const sinal = ehEntrada ? '+' : '-';
                  const motivo =
                    mov.motivo && String(mov.motivo).trim()
                      ? String(mov.motivo).trim()
                      : '-';

                  return (
                    <tr key={mov.id != null ? `mov-${mov.id}` : `mov-idx-${idx}`}>
                      <td className="historico-data-cell">{formatarDataHora(mov.dataHora)}</td>
                      <td className="historico-produto-cell">{mov.produto?.nome || '-'}</td>
                      <td>
                        <span
                          className={`cloud-badge ${
                            ehEntrada ? 'cloud-badge--normal' : 'cloud-badge--baixo'
                          }`}
                        >
                          {ehEntrada ? (
                            <ArrowDownLeft size={14} aria-hidden="true" />
                          ) : (
                            <ArrowUpRight size={14} aria-hidden="true" />
                          )}
                          {info.rotulo}
                        </span>
                      </td>
                      <td
                        className={`historico-qtd-cell ${
                          ehEntrada ? 'historico-qtd--entrada' : 'historico-qtd--saida'
                        }`}
                      >
                        {mov.quantidade != null ? `${sinal}${mov.quantidade}` : '-'}
                      </td>
                      <td className="historico-motivo-cell">{motivo}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default HistoricoView;
