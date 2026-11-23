import { ChevronLeft, ChevronRight, History, House, Package, ShoppingCart } from 'lucide-react';

const ITENS_NAVEGACAO = [
  { id: 'inicio', rotulo: 'INÍCIO', Icone: House },
  { id: 'produtos', rotulo: 'PRODUTOS', Icone: Package },
  { id: 'historico', rotulo: 'HISTÓRICO', Icone: History },
  { id: 'caixa', rotulo: 'CAIXA', Icone: ShoppingCart }
];

function Sidebar({ paginaAtiva, onNavegar, recolhida, onAlternarRecolhida, mobileAberta, onFecharMobile }) {
  const classes = ['sidebar', recolhida ? 'sidebar--recolhida' : '', mobileAberta ? 'is-open' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {mobileAberta && <div className="sidebar-backdrop" onClick={onFecharMobile} aria-hidden="true" />}

      <aside id="menu-lateral" className={classes}>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {ITENS_NAVEGACAO.map(({ id, rotulo, Icone }) => (
            <button
              key={id}
              type="button"
              className={`sidebar-item ${paginaAtiva === id ? 'sidebar-item--ativo' : ''}`}
              onClick={() => onNavegar(id)}
              aria-current={paginaAtiva === id ? 'page' : undefined}
              title={rotulo}
            >
              <Icone size={20} aria-hidden="true" />
              <span className="sidebar-rotulo">{rotulo}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={onAlternarRecolhida}
            aria-label={recolhida ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-expanded={!recolhida}
            aria-controls="menu-lateral"
            title={recolhida ? 'Expandir menu' : 'Recolher menu'}
          >
            {recolhida ? <ChevronRight size={20} aria-hidden="true" /> : <ChevronLeft size={20} aria-hidden="true" />}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
