import { CircleUser, Menu } from 'lucide-react';

function Topbar({ menuAberto, onAlternarMenu }) {
  return (
    <header className="topbar">
      <span className="topbar-logo">SMARTSTOCK</span>

      <div className="topbar-actions">
        <div className="topbar-user">
          <CircleUser size={22} aria-hidden="true" />
          <span>Operador</span>
        </div>
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onAlternarMenu}
          aria-label="Abrir ou fechar menu de navegação"
          aria-expanded={menuAberto}
          aria-controls="menu-lateral"
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

export default Topbar;
