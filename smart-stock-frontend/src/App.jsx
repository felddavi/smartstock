import { useState, useEffect, useCallback, useRef } from 'react';
import api from './api';
import './App.css';
import PdvView from './views/PdvView';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/ToastContainer';
import MovimentacaoModal from './components/MovimentacaoModal';
import AjusteModal from './components/AjusteModal';
import InicioView from './views/InicioView';
import ProdutosView from './views/ProdutosView';
import HistoricoView from './views/HistoricoView';
import { extrairMensagemErro } from './utils/mensagemErro';

const API_PRODUTOS_URL = '/api/produtos';
const API_MOVIMENTACOES_URL = '/api/movimentacoes';
const MAX_TOASTS_VISIVEIS = 3;

function App() {
  // Estado global de dados
  const [produtos, setProdutos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Navegação por estado: 'inicio' | 'produtos' | 'historico' | 'caixa'
  const [paginaAtiva, setPaginaAtiva] = useState('produtos');
  const [sidebarRecolhida, setSidebarRecolhida] = useState(false);
  const [sidebarMobileAberta, setSidebarMobileAberta] = useState(false);

  // Modais de estoque (produto selecionado ou null)
  const [produtoMovimentacao, setProdutoMovimentacao] = useState(null);
  const [produtoAjuste, setProdutoAjuste] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const proximoToastId = useRef(0);

  const mostrarToast = useCallback((tipo, mensagem) => {
    proximoToastId.current += 1;
    const novoToast = { id: proximoToastId.current, tipo, mensagem: String(mensagem) };
    setToasts((anteriores) => [...anteriores, novoToast].slice(-MAX_TOASTS_VISIVEIS));
  }, []);

  const fecharToast = useCallback((id) => {
    setToasts((anteriores) => anteriores.filter((toast) => toast.id !== id));
  }, []);

  // Carrega produtos e movimentações em paralelo
  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [respostaProdutos, respostaMovimentacoes] = await Promise.all([
        api.get(API_PRODUTOS_URL),
        api.get(API_MOVIMENTACOES_URL)
      ]);
      setProdutos(Array.isArray(respostaProdutos.data) ? respostaProdutos.data : []);
      setMovimentacoes(Array.isArray(respostaMovimentacoes.data) ? respostaMovimentacoes.data : []);
    } catch (erroCarga) {
      console.error('Erro ao carregar dados:', erroCarga);
      const mensagem = extrairMensagemErro(erroCarga, 'Falha ao carregar os dados.');
      setErro(mensagem);
      mostrarToast('erro', mensagem);
    } finally {
      setCarregando(false);
    }
  }, [mostrarToast]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const navegarPara = (pagina) => {
    setPaginaAtiva(pagina);
    setSidebarMobileAberta(false);
  };

  const fecharModalMovimentacao = useCallback(() => setProdutoMovimentacao(null), []);
  const fecharModalAjuste = useCallback(() => setProdutoAjuste(null), []);

  return (
    <div className="cloud-shell">
      <Topbar
        menuAberto={sidebarMobileAberta}
        onAlternarMenu={() => setSidebarMobileAberta((aberta) => !aberta)}
      />

      <div className="cloud-body">
        <Sidebar
          paginaAtiva={paginaAtiva}
          onNavegar={navegarPara}
          recolhida={sidebarRecolhida}
          onAlternarRecolhida={() => setSidebarRecolhida((recolhida) => !recolhida)}
          mobileAberta={sidebarMobileAberta}
          onFecharMobile={() => setSidebarMobileAberta(false)}
        />

        <main className="app-main cloud-content">
          {erro && (
            <div className="alert-banner" role="alert">
              <div>
                <strong>Falha ao carregar:</strong> {erro}{' '}
                <button type="button" className="btn btn-secondary btn-sm" onClick={recarregar} disabled={carregando}>
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {paginaAtiva === 'inicio' && (
            <InicioView
              produtos={produtos}
              movimentacoes={movimentacoes}
              carregando={carregando}
              onAbrirMovimentacao={setProdutoMovimentacao}
              onNavegar={navegarPara}
            />
          )}

          {paginaAtiva === 'historico' && (
            <HistoricoView
              movimentacoes={movimentacoes}
              carregando={carregando}
              mostrarToast={mostrarToast}
            />
          )}

          {paginaAtiva === 'produtos' && (
            <ProdutosView
              produtos={produtos}
              carregando={carregando}
              onRecarregar={recarregar}
              onAbrirMovimentacao={setProdutoMovimentacao}
              onAbrirAjuste={setProdutoAjuste}
              mostrarToast={mostrarToast}
            />
          )}

          {paginaAtiva === 'caixa' && (
            <PdvView
              produtos={produtos}
              onVendaConcluida={recarregar}
              mostrarToast={mostrarToast}
            />
          )}
        </main>
      </div>

      {produtoMovimentacao && (
        <MovimentacaoModal
          produto={produtoMovimentacao}
          onFechar={fecharModalMovimentacao}
          onConcluido={recarregar}
          mostrarToast={mostrarToast}
        />
      )}

      {produtoAjuste && (
        <AjusteModal
          produto={produtoAjuste}
          onFechar={fecharModalAjuste}
          onConcluido={recarregar}
          mostrarToast={mostrarToast}
        />
      )}

      <ToastContainer toasts={toasts} onFechar={fecharToast} />
    </div>
  );
}

export default App;
